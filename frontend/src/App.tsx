import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, History } from "lucide-react";
import ExtractTab from "./components/recipe/ExtractTab";
import HistoryTab from "./components/recipe/HistoryTab";
import { type RecipeResponse } from "@/services/api";
import { Toaster } from "@/components/ui/sonner";

function App() {
  // Lifted State: This keeps the data alive even when tabs switch
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);

  return (
    <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Recipe-Extractor&Generator</h1>
            <p className="text-sm text-muted-foreground">Extract, structure, and plan meals using AI.</p>
          </div>
        </div>

        <Tabs defaultValue="extract" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-100">
            <TabsTrigger value="extract" className="flex items-center gap-2">
              <UtensilsCrossed size={16} />
              Extract Recipe
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History size={16} />
              Saved Recipes
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="extract">
              {/* Pass the state down as props */}
              <ExtractTab 
                url={url} setUrl={setUrl}
                loading={loading} setLoading={setLoading}
                error={error} setError={setError}
                recipe={recipe} setRecipe={setRecipe}
              />
            </TabsContent>
            
            <TabsContent value="history">
              <HistoryTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;