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

import Onboarding from "@/pages/onboarding";
import OnboardingFlow from "@/pages/onboarding-flow";
import OnboardingComparison from "@/pages/onboarding-comparison";
import OnboardingBasket from "@/pages/onboarding-basket";
import Room from "@/pages/room";
import MealTrackerPage from "@/pages/meal-tracker";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/ar" />
      </Route>
      
      <Route path="/:lang(en|ar)" component={Home} />
      <Route path="/:lang(en|ar)/onboarding" component={Onboarding} />
      <Route path="/:lang(en|ar)/onboarding-flow" component={OnboardingFlow} />
      <Route path="/:lang(en|ar)/onboarding-comparison" component={OnboardingComparison} />
      <Route path="/:lang(en|ar)/onboarding-basket">
        {(params: { lang: string }) => <Redirect to={`/${params.lang}/onboarding-basket/1`} />}
      </Route>
      <Route path="/:lang(en|ar)/onboarding-basket/:step" component={OnboardingBasket} />
      <Route path="/:lang(en|ar)/room" component={Room} />
      <Route path="/:lang(en|ar)/meal-tracker" component={MealTrackerPage} />
      <Route path="/:lang(en|ar)/meal-planner" component={MealPlanner} />
      <Route path="/:lang(en|ar)/recipe/:id" component={RecipeDetail} />

      
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
