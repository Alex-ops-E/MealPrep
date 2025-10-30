import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopping } from "@/contexts/ShoppingContext";
import { ChefHat, Clock, Users, ArrowLeft, ShoppingCart, Lightbulb } from "lucide-react";
import type { RecipeWithDetails, Ingredient } from "@shared/schema";

export default function RecipeDetail() {
  const { t } = useLanguage();
  const [, params] = useRoute("/recipe/:id");
  const [, setLocation] = useLocation();
  const { setShoppingList } = useShopping();
  const recipeId = params?.id;
  
  const { data: recipe, isLoading } = useQuery<RecipeWithDetails>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId
  });
  
  const handleShopForIngredients = () => {
    if (!recipe) return;
    
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    
    const shoppingItems = ingredients.map((ing, index) => ({
      id: `${recipe.id}-${index}`,
      ingredientName: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      acquired: false
    }));
    
    setShoppingList(shoppingItems);
    setLocation("/price-comparison");
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h2>
          <Link href="/meal-planner">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Meal Planner
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/meal-planner">
            <Button variant="ghost" className="gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              {t("recipe.backToRecipe")}
            </Button>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <ChefHat className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-recipe-title">
                {recipe.title}
              </h1>
            </div>
            
            {recipe.summary && (
              <p className="text-purple-100 text-lg mb-4" data-testid="text-recipe-summary">
                {recipe.summary}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm">
              {recipe.servings && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings} {recipe.servings === 1 ? t("recipe.person") : t("recipe.people")}</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.cookTime}</span>
                </div>
              )}
              {recipe.prepTime && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span>Prep: {recipe.prepTime}</span>
                </div>
              )}
              {recipe.difficulty && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {recipe.difficulty}
                </Badge>
              )}
            </div>
            
            {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {recipe.dietaryTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    {t("recipe.ingredients")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3" data-testid="list-ingredients">
                    {(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ingredient: Ingredient, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>
                          <span className="font-semibold">{ingredient.quantity} {ingredient.unit}</span>{" "}
                          {ingredient.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-purple-600" />
                    {t("recipe.instructions")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4" data-testid="list-instructions">
                    {recipe.steps?.map((step, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
            
            {recipe.chefsTips && (
              <Card className="mt-8 bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Lightbulb className="h-5 w-5" />
                    Chef's Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-900" data-testid="text-chefs-tips">{recipe.chefsTips}</p>
                </CardContent>
              </Card>
            )}
            
            <div className="mt-8 flex gap-4">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={handleShopForIngredients}
                data-testid="button-shop-ingredients"
              >
                <ShoppingCart className="h-5 w-5" />
                {t("recipe.createShoppingList")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
