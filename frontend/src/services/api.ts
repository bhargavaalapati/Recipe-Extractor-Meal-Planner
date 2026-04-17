const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface RecipeResponse {
  id: number;
  url: string;
  title: string;
  cuisine: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  servings: number;
  difficulty: string;
  ingredients: { quantity: string; unit: string; item: string }[];
  instructions: string[];
  nutrition_estimate: { calories: number; protein: string; carbs: string; fat: string };
  substitutions: string[];
  shopping_list: Record<string, string[]>;
  related_recipes: string[];
}

export interface MealPlanResponse {
  shopping_list: Record<string, string[]>;
}

export interface RecipeHistory {
  id: number;
  url: string;
  title: string;
  cuisine: string;
  difficulty: string;
  created_at: string;
  full_data: RecipeResponse;
}

export const recipeApi = {
  extractRecipe: async (url: string): Promise<RecipeResponse> => {
    const response = await fetch(`${API_BASE_URL}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded! Please wait 60 seconds before trying again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to complete request');
    }

    return response.json();
  },
  
  getHistory: async (): Promise<RecipeHistory[]> => {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recipe history');
    }

    return response.json();
  },
  generateMealPlan: async (recipeIds: number[]): Promise<MealPlanResponse> => {
    const response = await fetch(`${API_BASE_URL}/meal-planner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipe_ids: recipeIds }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded! Please wait 60 seconds before trying again.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to complete request');
    }

    return response.json();
  }
};

