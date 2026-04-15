import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from fastapi import HTTPException
from .schemas import RecipeExtractionBase, MealPlanResponse

# Initialize the Gemini model
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.2,  # Low temperature for more deterministic/factual output
    api_key=os.getenv("GEMINI_API_KEY"),
)

# Bind the LLMs to our Pydantic schemas
structured_llm = llm.with_structured_output(RecipeExtractionBase)
meal_plan_llm = llm.with_structured_output(MealPlanResponse)


def extract_recipe_data(text: str, url: str) -> RecipeExtractionBase:
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Extract a recipe from text. Return ONLY JSON.

    Rules:
    - Split ingredients into: quantity, unit, item
    - Difficulty: easy | medium | hard
    - If missing data → estimate or "N/A"
    - Keep output short and realistic

    Schema:
    {
    "title": "",
    "prep_time": "",
    "cook_time": "",
    "servings": "",
    "difficulty": "",
    "ingredients": [{"quantity": "", "unit": "", "item": ""}],
    "steps": [],
    "substitutions": [],
    "nutrition": {"calories": "", "protein": "", "carbs": "", "fat": ""},
    "shopping_list": {"produce": [], "dairy": [], "meat": [], "pantry": []},
    "related_recipes": []
    }
    """,
            ),
            ("human", "URL: {url}\nTEXT:\n{text}"),
        ]
    )
    chain = prompt | structured_llm

    try:
        result = chain.invoke({"text": text, "url": url})
        return result
    except Exception as e:
        print(f"LLM Processing Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process text with LLM. Please try another URL.",
        )


def generate_meal_plan_data(combined_ingredients_text: str) -> MealPlanResponse:
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Merge ingredient list. Return ONLY JSON.

        Rules:
        - Combine duplicates
        - Sum quantities
        - Normalize units if possible
        - Use simple names
        - Group by category

        Output:
        {
        "produce": [],
        "dairy": [],
        "meat": [],
        "pantry": []
        }
        """,
            ),
            ("human", "INGREDIENTS:\n{ingredients}"),
        ]
    )

    chain = prompt | meal_plan_llm

    try:
        result = chain.invoke({"ingredients": combined_ingredients_text})
        return result
    except Exception as e:
        print(f"Meal Plan LLM Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to generate meal plan with LLM."
        )
