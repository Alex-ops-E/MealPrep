import { Clock } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function PriceComparison() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Card className="p-12 bg-white text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-price-comparison-title">
            {t("priceComparison.title")}
          </h1>
          
          <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-lg" data-testid="text-price-comparison-message">
            {t("priceComparison.message")}
          </p>
          
          <Button
            onClick={() => setLocation("/")}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-go-to-generator"
          >
            {t("priceComparison.goToGenerator")}
          </Button>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
