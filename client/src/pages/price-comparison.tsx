import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function PriceComparison() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentStep={1} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-12 bg-white text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Price Comparison Feature
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            The standalone price comparison feature is currently being updated. 
            In the meantime, you can still generate delicious recipes with our AI-powered recipe generator!
          </p>
          
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            data-testid="link-home"
          >
            Go to Recipe Generator
          </a>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
