import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ShoppingProvider } from "@/contexts/ShoppingContext";
import Home from "@/pages/home";
import MealPlanner from "@/pages/meal-planner";
import RecipeDetail from "@/pages/recipe-detail";
import PriceComparison from "@/pages/price-comparison";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/meal-planner" component={MealPlanner} />
      <Route path="/recipe/:id" component={RecipeDetail} />
      <Route path="/price-comparison" component={PriceComparison} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ShoppingProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ShoppingProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
