import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Globe, Utensils, Menu, X, Camera } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Language = "en" | "ar";

interface HeaderProps {
  currentStep?: number;
}

export default function Header({ currentStep }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { language, t, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location === `/${language}${path}` || location === `/${language}${path}/`;
  };
  
  const handleLanguageChange = (newLang: Language) => {
    const currentPath = location.replace(/^\/(en|ar)/, '');
    setLocation(`/${newLang}${currentPath || ''}`);
  };

  const navItems = [
    { path: "", label: t("header.recipeGenerator"), testId: "link-recipe-generator" },
    { path: "/meal-planner", label: t("header.mealPlanner"), testId: "link-meal-planner" },
    { path: "/fridge-scan", label: language === "ar" ? "مسح الثلاجة" : "Fridge Scan", testId: "link-fridge-scan" },
    { path: "/dish-match", label: language === "ar" ? "مطابقة الأطباق" : "Dish Match", testId: "link-dish-match" },
  ];

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link href={`/${language}`}>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-lg">
                <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-base sm:text-xl font-bold text-gray-900 hidden xs:inline">{t("header.title")}</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} href={`/${language}${item.path}`}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={isActive(item.path) ? "bg-blue-600 hover:bg-blue-700" : ""}
                  data-testid={item.testId}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
            {isAuthenticated && (
              <Link href={`/${language}/meal-tracker`}>
                <Button
                  variant={isActive("/meal-tracker") ? "default" : "ghost"}
                  size="sm"
                  className={isActive("/meal-tracker") ? "bg-emerald-600 hover:bg-emerald-700" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}
                  data-testid="link-meal-tracker"
                >
                  <Utensils className="h-4 w-4 me-1" />
                  {t("header.mealTracker")}
                </Button>
              </Link>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 font-semibold" data-testid="button-language">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-xs">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleLanguageChange("en")}
                  className={language === "en" ? "bg-blue-50" : ""}
                  data-testid="language-english"
                >
                  🇺🇸 {t("language.english")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange("ar")}
                  className={language === "ar" ? "bg-blue-50" : ""}
                  data-testid="language-arabic"
                >
                  🇦🇪 {t("language.arabic")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex md:hidden items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2" data-testid="button-language-mobile">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-xs ms-1">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleLanguageChange("en")}
                  className={language === "en" ? "bg-blue-50" : ""}
                >
                  🇺🇸 {t("language.english")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange("ar")}
                  className={language === "ar" ? "bg-blue-50" : ""}
                >
                  🇦🇪 {t("language.arabic")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t py-2 space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} href={`/${language}${item.path}`}>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-start px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive(item.path) 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  data-testid={`${item.testId}-mobile`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
            {isAuthenticated && (
              <Link href={`/${language}/meal-tracker`}>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-start px-3 py-2.5 rounded-lg text-sm font-medium flex items-center ${
                    isActive("/meal-tracker") 
                      ? "bg-emerald-600 text-white" 
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                  data-testid="link-meal-tracker-mobile"
                >
                  <Utensils className="h-4 w-4 me-2" />
                  {t("header.mealTracker")}
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
