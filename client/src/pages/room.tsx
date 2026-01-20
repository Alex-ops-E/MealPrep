import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, LogOut, User, ShoppingCart, ChefHat, Tag, Loader2, Utensils } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Room() {
  const { language, t, isRTL } = useLanguage();
  const { user, isLoading, isAuthenticated, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("room.loading")}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.firstName || t("room.user")}
                    className="w-20 h-20 rounded-full border-4 border-emerald-500"
                    data-testid="img-user-avatar"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
                    <User className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl" data-testid="text-welcome-message">
                {t("room.welcome")}, {user.firstName || user.email || t("room.user")}!
              </CardTitle>
              <CardDescription data-testid="text-welcome-description">
                {t("room.welcomeSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Link href={`/${language}/meal-tracker`}>
                  <Button 
                    variant="outline" 
                    className="w-full h-24 flex flex-col gap-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                    data-testid="button-meal-tracker"
                  >
                    <Utensils className="h-6 w-6 text-emerald-600" />
                    <span className="text-emerald-700">{t("room.mealTracker")}</span>
                  </Button>
                </Link>
                <Link href={`/${language}/meal-planner`}>
                  <Button 
                    variant="outline" 
                    className="w-full h-24 flex flex-col gap-2"
                    data-testid="button-meal-planner"
                  >
                    <ChefHat className="h-6 w-6" />
                    <span>{t("room.mealPlanner")}</span>
                  </Button>
                </Link>
                <Link href={`/${language}/price-comparison`}>
                  <Button 
                    variant="outline" 
                    className="w-full h-24 flex flex-col gap-2"
                    data-testid="button-price-comparison"
                  >
                    <Tag className="h-6 w-6" />
                    <span>{t("room.priceComparison")}</span>
                  </Button>
                </Link>
                <Link href={`/${language}`}>
                  <Button 
                    variant="outline" 
                    className="w-full h-24 flex flex-col gap-2"
                    data-testid="button-recipe-generator"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    <span>{t("room.recipeGenerator")}</span>
                  </Button>
                </Link>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="w-full"
                  data-testid="button-logout"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <LogOut className="h-4 w-4 me-2" />
                  )}
                  {t("room.logout")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl" data-testid="text-login-title">
                {t("room.title")}
              </CardTitle>
              <CardDescription data-testid="text-login-description">
                {t("room.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a href="/api/login" className="block">
                <Button 
                  className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-login"
                >
                  <LogIn className="h-5 w-5 me-2" />
                  {t("room.loginButton")}
                </Button>
              </a>
              
              <p className="text-center text-sm text-gray-500" data-testid="text-register-hint">
                {t("room.registerHint")}
              </p>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-center text-gray-400" data-testid="text-auth-methods">
                  {t("room.authMethods")}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Link href={`/${language}`} className="mt-6">
            <Button variant="ghost" data-testid="button-back-home">
              {t("room.backToHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
