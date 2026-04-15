from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from . import models, schemas
from .database import engine, get_db, Base
from .scraper import scrape_recipe_page
from .llm import extract_recipe_data, generate_meal_plan_data

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="My Recipe Extractor")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/extract", response_model=schemas.RecipeResponse)
@limiter.limit("5/minute")
def extract_recipe(request: Request, request_data: dict, db: Session = Depends(get_db)):
    url = request_data.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    # 1. Check if we already processed this URL
    existing_recipe = db.query(models.Recipe).filter(models.Recipe.url == url).first()
    if existing_recipe:
        # Reconstruct the response from the stored JSONB data
        response_data = existing_recipe.full_data
        response_data["id"] = existing_recipe.id
        return response_data

    # 2. Scrape the text
    raw_text = scrape_recipe_page(url)

    # 3. Process with LLM
    structured_data = extract_recipe_data(raw_text, url)

    # 4. Save to Database
    data_dict = structured_data.model_dump()

    db_recipe = models.Recipe(
        url=data_dict["url"],
        title=data_dict["title"],
        cuisine=data_dict["cuisine"],
        difficulty=data_dict["difficulty"],
        full_data=data_dict,
    )

    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)

    # 5. Return the result
    response_data = data_dict
    response_data["id"] = db_recipe.id
    return response_data


@app.get("/api/recipes", response_model=List[schemas.RecipeHistory])
def get_recipe_history(db: Session = Depends(get_db)):
    recipes = db.query(models.Recipe).order_by(models.Recipe.created_at.desc()).all()
    return recipes


@app.post("/api/meal-planner", response_model=schemas.MealPlanResponse)
@limiter.limit("5/minute")
def create_meal_plan(
    request: Request,
    request_data: schemas.MealPlanRequest,
    db: Session = Depends(get_db),
):
    # 1. Fetch all selected recipes from the database
    recipes = (
        db.query(models.Recipe)
        .filter(models.Recipe.id.in_(request_data.recipe_ids))
        .all()
    )

    if not recipes:
        raise HTTPException(
            status_code=404, detail="No recipes found for the provided IDs."
        )

    # 2. Extract and format all ingredients into a single text block for the LLM
    combined_text = ""
    for recipe in recipes:
        combined_text += f"\n--- Recipe: {recipe.title} ---\n"
        # Get ingredients from the JSONB full_data column
        ingredients = recipe.full_data.get("ingredients", [])
        for ing in ingredients:
            combined_text += f"- {ing.get('quantity', '')} {ing.get('unit', '')} {ing.get('item', '')}\n"

    # 3. Process with LLM to merge and categorize
    structured_plan = generate_meal_plan_data(combined_text)

    return structured_plan
