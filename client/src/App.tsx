import { Switch, Route, Redirect } from "wouter";
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
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/ar" />
      </Route>
      
      <Route path="/:lang(en|ar)" component={Home} />
      <Route path="/:lang(en|ar)/onboarding" component={Onboarding} />
      <Route path="/:lang(en|ar)/meal-planner" component={MealPlanner} />
      <Route path="/:lang(en|ar)/recipe/:id" component={RecipeDetail} />
      <Route path="/:lang(en|ar)/price-comparison" component={PriceComparison} />
      
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
