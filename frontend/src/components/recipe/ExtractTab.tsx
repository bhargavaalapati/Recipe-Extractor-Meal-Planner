import { recipeApi, type RecipeResponse } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, ChefHat, Flame, ShoppingCart, Info, Loader2 } from "lucide-react";

// Define the props we are receiving from App.tsx
interface ExtractTabProps {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  recipe: RecipeResponse | null;
  setRecipe: (recipe: RecipeResponse | null) => void;
}

export default function ExtractTab({ url, setUrl, loading, setLoading, error, setError, recipe, setRecipe }: ExtractTabProps) {
  
  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");
    setRecipe(null);

    try {
      const data = await recipeApi.extractRecipe(url);
      setRecipe(data);
      toast.success("Recipe extracted successfully!");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Something went wrong while extracting the recipe.");
        toast.error("Something went wrong.");
      }
    } finally {
      // THIS WAS MISSING! It tells React to stop showing the skeletons
      setLoading(false); 
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Search Bar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Extract from URL</CardTitle>
          <CardDescription>Paste a recipe blog URL below to magically extract structured data.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExtract} className="flex gap-3">
            <Input
              type="url"
              placeholder="https://www.allrecipes.com/recipe/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={loading} className="min-w-40">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Extract Recipe
                </>
              )}
            </Button>
          </form>
          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        </CardContent>
      </Card>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {/* Updated height classes */}
          <Skeleton className="h-31.25 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-75 w-full rounded-xl" />
            <Skeleton className="h-75 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* Results Section */}
      {recipe && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl font-bold">{recipe.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <ChefHat size={16} /> {recipe.cuisine} Cuisine
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={recipe.difficulty === 'hard' ? 'destructive' : recipe.difficulty === 'medium' ? 'default' : 'secondary'}>
                    {recipe.difficulty.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="flex gap-1">
                    <Clock size={14} /> Prep: {recipe.prep_time}
                  </Badge>
                  <Badge variant="outline" className="flex gap-1">
                    <Flame size={14} /> Cook: {recipe.cook_time}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Ingredients & Nutrition */}
            <div className="space-y-6 md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingCart size={20} /> Ingredients
                  </CardTitle>
                  <CardDescription>Yields {recipe.servings} servings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex justify-between items-start border-b border-zinc-100 pb-2 last:border-0">
                        <span className="font-medium text-sm w-1/3">{ing.quantity} {ing.unit}</span>
                        <span className="text-sm text-right w-2/3">{ing.item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info size={18} /> Nutrition Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-zinc-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold">{recipe.nutrition_estimate.calories}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Calories</div>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-lg">
                    <div className="text-xl font-bold">{recipe.nutrition_estimate.protein}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Protein</div>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-lg">
                    <div className="text-xl font-bold">{recipe.nutrition_estimate.carbs}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Carbs</div>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-lg">
                    <div className="text-xl font-bold">{recipe.nutrition_estimate.fat}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Fat</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Instructions & Extras */}
            <div className="space-y-6 md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4 list-decimal list-outside ml-4">
                    {recipe.instructions.map((inst, idx) => (
                      <li key={idx} className="text-zinc-700 pl-2 leading-relaxed">
                        {inst}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">AI Substitutions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {recipe.substitutions.map((sub, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-primary">•</span> {sub}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">Pairs Well With</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {recipe.related_recipes.map((rel, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-primary">•</span> {rel}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}