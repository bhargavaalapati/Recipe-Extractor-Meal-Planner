from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class Ingredient(BaseModel):
    quantity: str = Field(description="Amount, e.g., '4', '1/2', 'approx'")
    unit: str = Field(description="Unit of measurement, e.g., 'slices', 'tbsp', 'cups'")
    item: str = Field(description="The ingredient name, e.g., 'white bread'")


class NutritionEstimate(BaseModel):
    calories: int = Field(description="Total calories")
    protein: str = Field(description="Protein amount, e.g., '12g'")
    carbs: str = Field(description="Carbs amount, e.g., '30g'")
    fat: str = Field(description="Fat amount, e.g., '20g'")


class RecipeExtractionBase(BaseModel):
    url: str
    title: str
    cuisine: str
    prep_time: str
    cook_time: str
    total_time: str
    servings: int
    difficulty: str = Field(description="Must be 'easy', 'medium', or 'hard'")
    ingredients: List[Ingredient]
    instructions: List[str] = Field(description="Step-by-step instructions")
    nutrition_estimate: NutritionEstimate
    substitutions: List[str] = Field(description="Exactly 3 ingredient substitutions")
    shopping_list: Dict[str, List[str]] = Field(
        description="Grouped by category (e.g., 'dairy': ['butter'])"
    )
    related_recipes: List[str] = Field(description="Exactly 3 related recipes")


# Used for returning data to the frontend
class RecipeResponse(RecipeExtractionBase):
    id: int

    class Config:
        from_attributes = True


# Used for the History Tab table view
class RecipeHistory(BaseModel):
    id: int
    url: str
    title: str
    cuisine: str
    difficulty: str
    created_at: datetime

    class Config:
        from_attributes = True


class MealPlanRequest(BaseModel):
    recipe_ids: List[int]


class MealPlanResponse(BaseModel):
    shopping_list: Dict[str, List[str]] = Field(
        description="Merged ingredients grouped by logical categories (e.g., 'Produce': ['3 medium sweet potatoes', '2 avocados'], 'Dairy': ['1 cup milk'])"
    )
