import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Upload, 
  Loader2, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Trash2,
  ArrowLeft,
  Plus
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { MealLog } from "@shared/schema";

export default function MealTracker() {
  const { language, t, isRTL } = useLanguage();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [analyzedNutrition, setAnalyzedNutrition] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  
  const [manualForm, setManualForm] = useState({
    name: "",
    mealType: "lunch" as "breakfast" | "lunch" | "dinner" | "snack",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation(`/${language}/room`);
    }
  }, [authLoading, isAuthenticated, language, setLocation]);

  const { data: mealLogs = [], isLoading: logsLoading } = useQuery<MealLog[]>({
    queryKey: ["/api/meal-logs", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/meal-logs?date=${selectedDate}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meal logs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/meal-logs/analyze", { image: imageData });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalyzedNutrition(data);
      toast({
        title: t("mealTracker.analyzed"),
        description: `${data.name} - ${data.calories} ${t("mealTracker.cal")}`,
      });
    },
    onError: (error) => {
      toast({
        title: t("mealTracker.analyzeError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (mealData: any) => {
      const res = await apiRequest("POST", "/api/meal-logs", mealData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-logs", selectedDate] });
      toast({
        title: t("mealTracker.saved"),
        description: t("mealTracker.savedDescription"),
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t("mealTracker.saveError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/meal-logs/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-logs", selectedDate] });
      toast({
        title: t("mealTracker.deleted"),
        description: t("mealTracker.deletedDescription"),
      });
    },
  });

  const resetForm = () => {
    setPreviewImage(null);
    setAnalyzedNutrition(null);
    setManualForm({
      name: "",
      mealType: "lunch",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      analyzeMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!analyzedNutrition) return;
    
    saveMutation.mutate({
      name: analyzedNutrition.name,
      mealType: "lunch",
      calories: analyzedNutrition.calories,
      protein: analyzedNutrition.protein,
      carbs: analyzedNutrition.carbs,
      fat: analyzedNutrition.fat,
      photoUrl: previewImage,
      inputType: "photo",
      logDate: selectedDate,
    });
  };

  const handleSaveManual = () => {
    if (!manualForm.name || !manualForm.calories) {
      toast({
        title: t("mealTracker.validationError"),
        description: t("mealTracker.fillRequired"),
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      name: manualForm.name,
      mealType: manualForm.mealType,
      calories: parseInt(manualForm.calories) || 0,
      protein: parseInt(manualForm.protein) || 0,
      carbs: parseInt(manualForm.carbs) || 0,
      fat: parseInt(manualForm.fat) || 0,
      inputType: "manual",
      logDate: selectedDate,
    });
  };

  const totals = mealLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/${language}/room`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
            {t("mealTracker.title")}
          </h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle data-testid="text-add-meal-title">{t("mealTracker.addMeal")}</CardTitle>
                <CardDescription>{t("mealTracker.addMealDescription")}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-gray-500" />
                <Switch
                  checked={isManualMode}
                  onCheckedChange={setIsManualMode}
                  data-testid="switch-input-mode"
                />
                <span className="text-sm text-gray-500">{t("mealTracker.manual")}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isManualMode ? (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-photo"
                >
                  {previewImage ? (
                    <div className="space-y-4">
                      <img 
                        src={previewImage} 
                        alt="Food preview" 
                        className="max-h-48 mx-auto rounded-lg"
                        data-testid="img-preview"
                      />
                      {analyzeMutation.isPending && (
                        <div className="flex items-center justify-center gap-2 text-emerald-600">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{t("mealTracker.analyzing")}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-gray-600">{t("mealTracker.uploadPhoto")}</p>
                      <p className="text-sm text-gray-400">{t("mealTracker.uploadHint")}</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-photo"
                />

                {analyzedNutrition && (
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-lg mb-3" data-testid="text-analyzed-name">
                        {analyzedNutrition.name}
                      </h3>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                          <p className="text-xl font-bold" data-testid="text-analyzed-calories">{analyzedNutrition.calories}</p>
                          <p className="text-xs text-gray-500">{t("mealTracker.cal")}</p>
                        </div>
                        <div>
                          <Beef className="h-5 w-5 mx-auto text-red-500 mb-1" />
                          <p className="text-xl font-bold" data-testid="text-analyzed-protein">{analyzedNutrition.protein}g</p>
                          <p className="text-xs text-gray-500">{t("mealTracker.protein")}</p>
                        </div>
                        <div>
                          <Wheat className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                          <p className="text-xl font-bold" data-testid="text-analyzed-carbs">{analyzedNutrition.carbs}g</p>
                          <p className="text-xs text-gray-500">{t("mealTracker.carbs")}</p>
                        </div>
                        <div>
                          <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                          <p className="text-xl font-bold" data-testid="text-analyzed-fat">{analyzedNutrition.fat}g</p>
                          <p className="text-xs text-gray-500">{t("mealTracker.fat")}</p>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSavePhoto}
                        disabled={saveMutation.isPending}
                        data-testid="button-save-photo"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin me-2" />
                        ) : (
                          <Plus className="h-4 w-4 me-2" />
                        )}
                        {t("mealTracker.save")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">{t("mealTracker.foodName")}</Label>
                    <Input
                      id="name"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      placeholder={t("mealTracker.foodNamePlaceholder")}
                      data-testid="input-food-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mealType">{t("mealTracker.mealType")}</Label>
                    <Select
                      value={manualForm.mealType}
                      onValueChange={(value) => setManualForm({ ...manualForm, mealType: value as any })}
                    >
                      <SelectTrigger data-testid="select-meal-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">{t("mealTracker.breakfast")}</SelectItem>
                        <SelectItem value="lunch">{t("mealTracker.lunch")}</SelectItem>
                        <SelectItem value="dinner">{t("mealTracker.dinner")}</SelectItem>
                        <SelectItem value="snack">{t("mealTracker.snack")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="calories">{t("mealTracker.calories")}</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={manualForm.calories}
                        onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })}
                        placeholder="0"
                        data-testid="input-calories"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein">{t("mealTracker.proteinG")}</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={manualForm.protein}
                        onChange={(e) => setManualForm({ ...manualForm, protein: e.target.value })}
                        placeholder="0"
                        data-testid="input-protein"
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs">{t("mealTracker.carbsG")}</Label>
                      <Input
                        id="carbs"
                        type="number"
                        value={manualForm.carbs}
                        onChange={(e) => setManualForm({ ...manualForm, carbs: e.target.value })}
                        placeholder="0"
                        data-testid="input-carbs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat">{t("mealTracker.fatG")}</Label>
                      <Input
                        id="fat"
                        type="number"
                        value={manualForm.fat}
                        onChange={(e) => setManualForm({ ...manualForm, fat: e.target.value })}
                        placeholder="0"
                        data-testid="input-fat"
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveManual}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-manual"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Plus className="h-4 w-4 me-2" />
                  )}
                  {t("mealTracker.save")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t("mealTracker.dailyTotal")}</h3>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto bg-white/20 border-white/30 text-white"
                data-testid="input-date"
              />
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <Flame className="h-6 w-6 mx-auto mb-1 opacity-80" />
                <p className="text-2xl font-bold" data-testid="text-total-calories">{totals.calories}</p>
                <p className="text-xs opacity-80">{t("mealTracker.cal")}</p>
              </div>
              <div>
                <Beef className="h-6 w-6 mx-auto mb-1 opacity-80" />
                <p className="text-2xl font-bold" data-testid="text-total-protein">{totals.protein}g</p>
                <p className="text-xs opacity-80">{t("mealTracker.protein")}</p>
              </div>
              <div>
                <Wheat className="h-6 w-6 mx-auto mb-1 opacity-80" />
                <p className="text-2xl font-bold" data-testid="text-total-carbs">{totals.carbs}g</p>
                <p className="text-xs opacity-80">{t("mealTracker.carbs")}</p>
              </div>
              <div>
                <Droplets className="h-6 w-6 mx-auto mb-1 opacity-80" />
                <p className="text-2xl font-bold" data-testid="text-total-fat">{totals.fat}g</p>
                <p className="text-xs opacity-80">{t("mealTracker.fat")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">{t("mealTracker.todaysMeals")}</h3>
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : mealLogs.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="py-8 text-center text-gray-500">
                {t("mealTracker.noMeals")}
              </CardContent>
            </Card>
          ) : (
            mealLogs.map((log) => (
              <Card key={log.id} className="overflow-hidden" data-testid={`card-meal-${log.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {log.photoUrl && (
                        <img 
                          src={log.photoUrl} 
                          alt={log.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{log.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{log.mealType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{log.calories} {t("mealTracker.cal")}</p>
                        <p className="text-xs text-gray-500">
                          P: {log.protein}g | C: {log.carbs}g | F: {log.fat}g
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(log.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${log.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
