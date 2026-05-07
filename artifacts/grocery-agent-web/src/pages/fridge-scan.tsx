import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Camera, Upload, RefreshCw, ChefHat, CheckCircle, ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/header";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { RecipeWithDetails } from "@shared/schema";

interface FridgeScanResponse {
  ingredients: string[];
  recipe: RecipeWithDetails;
}

export default function FridgeScan() {
  const { language, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<FridgeScanResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const t = (en: string, ar: string) => language === "ar" ? ar : en;

  const scanMutation = useMutation({
    mutationFn: async (image: string) => {
      const res = await apiRequest("POST", "/api/fridge-scan", { image });
      return res.json() as Promise<FridgeScanResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
    }
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageData(dataUrl);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleScan = () => {
    if (imageData) {
      scanMutation.mutate(imageData);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageData(null);
    setResult(null);
    scanMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleViewRecipe = () => {
    if (result?.recipe?.id) {
      setLocation(`/${language}/recipe/${result.recipe.id}`);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : "ltr"}`}>
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
            <Camera className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" data-testid="text-fridge-scan-title">
            {t("Fridge Scan", "مسح الثلاجة")}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {t(
              "Take a photo of your fridge or ingredients — we'll recognize what you have and suggest a recipe",
              "التقط صورة لثلاجتك أو مكوناتك — سنتعرف على ما لديك ونقترح وصفة"
            )}
          </p>
        </div>

        {!imagePreview ? (
          <Card className="p-8 border-2 border-dashed border-gray-200 bg-white text-center">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 gap-2 text-base"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid="button-take-photo"
                >
                  <Camera className="h-5 w-5" />
                  {t("Take Photo", "التقط صورة")}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-base"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-photo"
                >
                  <Upload className="h-5 w-5" />
                  {t("Upload Image", "رفع صورة")}
                </Button>
              </div>

              <p className="text-xs text-gray-400">
                {t("Supports JPG, PNG, WEBP · Max 10MB", "يدعم JPG و PNG و WEBP · الحد الأقصى 10MB")}
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                {[
                  { icon: "📸", en: "Snap your fridge", ar: "صوّر ثلاجتك" },
                  { icon: "🔍", en: "AI detects ingredients", ar: "الذكاء يتعرف على المكونات" },
                  { icon: "🍳", en: "Get a recipe", ar: "احصل على وصفة" },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl mb-1">{step.icon}</div>
                    <p className="text-xs text-gray-500">{language === "ar" ? step.ar : step.en}</p>
                  </div>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-file-upload"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-camera"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="overflow-hidden bg-white">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt={t("Uploaded fridge image", "صورة الثلاجة المرفوعة")}
                  className="w-full max-h-80 object-cover"
                  data-testid="img-fridge-preview"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  data-testid="button-remove-image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!result && (
                <div className="p-4 flex gap-3">
                  <Button
                    onClick={handleScan}
                    disabled={scanMutation.isPending}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 gap-2"
                    data-testid="button-scan"
                  >
                    {scanMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {t("Analyzing...", "جاري التحليل...")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {t("Scan & Get Recipe", "تحليل واقتراح وصفة")}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset} data-testid="button-retake">
                    {t("Retake", "إعادة")}
                  </Button>
                </div>
              )}
            </Card>

            {scanMutation.isPending && (
              <Card className="p-6 bg-white text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-orange-600 animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {t("Scanning your ingredients...", "جاري تحليل مكوناتك...")}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t("This may take a few seconds", "قد يستغرق ذلك بضع ثوانٍ")}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {scanMutation.isError && (
              <Card className="p-4 bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm font-medium">
                  {t("Could not detect ingredients. Try a clearer photo.", "تعذّر التعرف على المكونات. جرّب صورة أوضح.")}
                </p>
              </Card>
            )}

            {result && (
              <div className="space-y-4" data-testid="section-results">
                <Card className="p-5 bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h2 className="font-semibold text-gray-900">
                      {t("Detected Ingredients", "المكونات المكتشفة")} ({result.ingredients.length})
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.ingredients.map((ing, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-green-50 text-green-700 border border-green-200 text-sm py-1 px-3"
                        data-testid={`badge-ingredient-${i}`}
                      >
                        {ing}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 bg-white">
                  <div className="flex items-center gap-2 mb-4">
                    <ChefHat className="h-5 w-5 text-orange-600" />
                    <h2 className="font-semibold text-gray-900">
                      {t("Suggested Recipe", "الوصفة المقترحة")}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900" data-testid="text-recipe-title">
                        {result.recipe.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{result.recipe.summary}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {result.recipe.cookTime && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          ⏱ {result.recipe.cookTime}
                        </span>
                      )}
                      {result.recipe.servings && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          👥 {result.recipe.servings} {t("servings", "حصص")}
                        </span>
                      )}
                      {result.recipe.cuisine && (
                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                          🍽 {result.recipe.cuisine}
                        </span>
                      )}
                    </div>

                    {result.recipe.ingredients && result.recipe.ingredients.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {t("Ingredients", "المكونات")}
                        </p>
                        <ul className="space-y-1">
                          {(result.recipe.ingredients as any[]).slice(0, 5).map((ing: any, i: number) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-orange-400 mt-0.5">•</span>
                              {ing.quantity} {ing.unit} {ing.name}
                            </li>
                          ))}
                          {(result.recipe.ingredients as any[]).length > 5 && (
                            <li className="text-sm text-gray-400 italic">
                              +{(result.recipe.ingredients as any[]).length - 5} {t("more", "أكثر")}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                    <Button
                      onClick={handleViewRecipe}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 gap-2"
                      data-testid="button-view-full-recipe"
                    >
                      {t("View Full Recipe", "عرض الوصفة كاملة")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handleReset} data-testid="button-scan-again">
                      {t("Scan Again", "مسح مرة أخرى")}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
