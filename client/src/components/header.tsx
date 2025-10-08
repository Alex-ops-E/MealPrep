import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

interface HeaderProps {
  onPriceComparisonClick?: () => void;
  currentStep?: number;
}

export default function Header({ onPriceComparisonClick, currentStep }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900">Grocery Agent</span>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link href="/">
              <Button
                variant={location === "/" && currentStep !== 4 ? "default" : "ghost"}
                className={location === "/" && currentStep !== 4 ? "bg-blue-600 hover:bg-blue-700" : ""}
                data-testid="link-recipe-generator"
              >
                Recipe Generator
              </Button>
            </Link>
            <Button
              variant={currentStep === 4 ? "default" : "ghost"}
              className={currentStep === 4 ? "bg-blue-600 hover:bg-blue-700" : ""}
              onClick={onPriceComparisonClick}
              data-testid="link-price-comparison"
            >
              Price Comparison
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
