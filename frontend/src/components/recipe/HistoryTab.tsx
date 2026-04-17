import { useEffect, useState } from "react";
import { recipeApi, type RecipeHistory, type RecipeResponse } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Clock, Flame, ShoppingCart, Loader2, Sparkles } from "lucide-react";

export default function HistoryTab() {
  const [history, setHistory] = useState<RecipeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Details Modal State
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Meal Planner State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [mealPlanModalOpen, setMealPlanModalOpen] = useState(false);
  const [mealPlan, setMealPlan] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await recipeApi.getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (url: string) => {
    setModalOpen(true);
    setFetchingDetails(true);

    try {
      // Call the API! It will instantly hit the Postgres cache in main.py
      const data = await recipeApi.extractRecipe(url);
      setSelectedRecipe(data);
    } catch (error) {
      console.error("Failed to fetch recipe details", error);
      toast.error("Failed to load recipe details.");
    } finally {
      setFetchingDetails(false);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerateMealPlan = async () => {
    if (selectedIds.length < 2) return;
    
    setGeneratingPlan(true);
    setMealPlanModalOpen(true);
    setMealPlan(null);
    
    try {
      const data = await recipeApi.generateMealPlan(selectedIds);
      setMealPlan(data.shopping_list);
      toast.success("Meal plan generated successfully!");
    } catch (error) {
      if (error instanceof Error) {
         toast.error(error.message);
      } else {
         toast.error("Failed to generate meal plan.");
      }
      setMealPlanModalOpen(false); 
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>Saved Recipes</CardTitle>
          <CardDescription>View history or select multiple recipes to generate a unified shopping list.</CardDescription>
        </div>
        
        {/* Meal Planner Action Button */}
        <Button 
          onClick={handleGenerateMealPlan} 
          disabled={selectedIds.length < 2 || generatingPlan}
          className="bg-primary text-primary-foreground"
        >
          {generatingPlan ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Merging...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> AI Meal Planner ({selectedIds.length})</>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No recipes saved yet. Extract one to get started!</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Cuisine</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id} className={selectedIds.includes(item.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={() => toggleSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.cuisine}</TableCell>
                  <TableCell>
                    <Badge variant={item.difficulty === 'hard' ? 'destructive' : item.difficulty === 'medium' ? 'default' : 'secondary'}>
                      {item.difficulty.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openDetails(item.url)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Reusable Details Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recipe Details</DialogTitle>
            </DialogHeader>
            
            {fetchingDetails ? (
              <div className="space-y-4 pt-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : selectedRecipe ? (
              <div className="space-y-6 pt-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRecipe.title}</h2>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline"><Clock size={14} className="mr-1"/> {selectedRecipe.prep_time}</Badge>
                    <Badge variant="outline"><Flame size={14} className="mr-1"/> {selectedRecipe.cook_time}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 mb-3">
                      <ShoppingCart size={18} /> Ingredients
                    </h3>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="text-sm border-b border-zinc-100 pb-1">
                          <span className="font-medium mr-2">{ing.quantity} {ing.unit}</span>
                          {ing.item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg border-b pb-2 mb-3">Instructions</h3>
                      <ol className="space-y-3 list-decimal list-outside ml-4">
                        {selectedRecipe.instructions.map((step: string, idx: number) => (
                          <li key={idx} className="text-sm text-zinc-700">{step}</li>
                        ))}
                      </ol>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Meal Plan Modal */}
        <Dialog open={mealPlanModalOpen} onOpenChange={setMealPlanModalOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" /> AI Generated Shopping List
              </DialogTitle>
            </DialogHeader>
            
            {generatingPlan ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Intelligently merging ingredients...</p>
              </div>
            ) : mealPlan ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {Object.entries(mealPlan).map(([category, items], idx) => (
                  <Card key={idx} className="shadow-none border-zinc-200">
                    <CardHeader className="bg-zinc-50 pb-3 py-3">
                      <CardTitle className="text-md capitalize">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}