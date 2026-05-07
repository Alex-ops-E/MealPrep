import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  I18nManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/contexts/LanguageContext";

/** API shape returned by GET /api/recipes */
interface ApiRecipe {
  id: string;
  title: string;
  cuisine?: string | null;
  cookingTime?: string | null;
  calories?: number | null;
  servings?: number | null;
}

/** View model with derived display fields */
interface RecipeViewModel {
  id: string;
  title: string;
  cuisine: string;
  cookingTime: string;
  calories: number | null;
  emoji: string;
  tags: string[];
}

// Fallback when API returns empty / unavailable
const FALLBACK_RECIPES: RecipeViewModel[] = [
  { id: "f1", title: "Machboos Laham", cuisine: "Qatari", cookingTime: "60 min", calories: 720, emoji: "🍖", tags: ["Traditional", "Rice"] },
  { id: "f2", title: "Salmon Sushi Bowl", cuisine: "Japanese", cookingTime: "25 min", calories: 520, emoji: "🍣", tags: ["Healthy", "Seafood"] },
  { id: "f3", title: "Chicken Shawarma", cuisine: "Lebanese", cookingTime: "35 min", calories: 560, emoji: "🌯", tags: ["Grilled"] },
  { id: "f4", title: "Lamb Biryani", cuisine: "South Asian", cookingTime: "75 min", calories: 680, emoji: "🍚", tags: ["Spiced", "Rice"] },
  { id: "f5", title: "Mezze Platter", cuisine: "Levantine", cookingTime: "15 min", calories: 580, emoji: "🧆", tags: ["Vegetarian"] },
  { id: "f6", title: "Wagyu Steak", cuisine: "Japanese", cookingTime: "20 min", calories: 820, emoji: "🥩", tags: ["Premium"] },
];

const CUISINE_EMOJI_MAP: [string, string][] = [
  ["qatari", "🍖"], ["japanese", "🍣"], ["lebanese", "🌯"], ["indian", "🍛"],
  ["italian", "🍕"], ["american", "🍔"], ["emirati", "🐟"], ["thai", "🍜"],
  ["south asian", "🍚"], ["levantine", "🧆"], ["arabic", "🍗"],
];

function cuisineToEmoji(cuisine?: string | null): string {
  if (!cuisine) return "🍽️";
  const lower = cuisine.toLowerCase();
  for (const [key, emoji] of CUISINE_EMOJI_MAP) {
    if (lower.includes(key)) return emoji;
  }
  return "🍽️";
}

function toRecipeViewModel(r: ApiRecipe): RecipeViewModel {
  return {
    id: r.id,
    title: r.title,
    cuisine: r.cuisine ?? "",
    cookingTime: r.cookingTime ?? "",
    calories: r.calories ?? null,
    emoji: cuisineToEmoji(r.cuisine),
    tags: r.cuisine ? [r.cuisine] : [],
  };
}

const CATEGORIES = ["All", "Qatari", "Japanese", "Lebanese", "Indian", "Italian", "American"];
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function RecipeCard({
  recipe,
  colors,
  fontFamily,
}: {
  recipe: RecipeViewModel;
  colors: ReturnType<typeof useColors>;
  fontFamily: ReturnType<typeof useLanguage>["fontFamily"];
}) {
  const [saved, setSaved] = useState(false);

  return (
    <Pressable
      style={[styles.recipeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => Haptics.selectionAsync()}
    >
      <View style={[styles.recipeEmoji, { backgroundColor: colors.muted }]}>
        <Text style={styles.recipeEmojiText}>{recipe.emoji}</Text>
      </View>
      <View style={styles.recipeInfo}>
        <Text style={[styles.recipeName, { color: colors.foreground, fontFamily: fontFamily("bold") }]} numberOfLines={1}>
          {recipe.title}
        </Text>
        {recipe.cuisine !== "" && (
          <Text style={[styles.recipeCuisine, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {recipe.cuisine}
          </Text>
        )}
        <View style={styles.recipeMeta}>
          {recipe.cookingTime !== "" && (
            <>
              <Feather name="clock" size={11} color={colors.mutedForeground} />
              <Text style={[styles.recipeMetaText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
                {recipe.cookingTime}
              </Text>
              {recipe.calories != null && (
                <Text style={[styles.recipeMetaText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>·</Text>
              )}
            </>
          )}
          {recipe.calories != null && (
            <Text style={[styles.recipeMetaText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
              {recipe.calories} cal
            </Text>
          )}
        </View>
        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable
        style={styles.saveBtn}
        onPress={() => {
          setSaved(!saved);
          Haptics.selectionAsync();
        }}
      >
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={20}
          color={saved ? colors.primary : colors.mutedForeground}
        />
      </Pressable>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, isRTL, toggleLanguage, t, fontFamily } = useLanguage();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [generating, setGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState<string | null>(null);
  const [craving, setCraving] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: apiRecipes, isLoading: recipesLoading, refetch } = useQuery<ApiRecipe[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/recipes`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
    retry: 1,
  });

  const viewModels: RecipeViewModel[] =
    apiRecipes && apiRecipes.length > 0
      ? apiRecipes.map(toRecipeViewModel)
      : FALLBACK_RECIPES;

  const filteredRecipes = viewModels.filter((r) => {
    const matchCat =
      selectedCategory === "All" ||
      r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchSearch =
      search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const generateRecipe = async () => {
    if (!craving.trim()) return;
    setGenerating(true);
    setGeneratedTitle(null);
    try {
      const res = await fetch(`${API_BASE}/api/recipes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ craving: craving.trim(), servings: 2 }),
      });
      if (res.ok) {
        const data: ApiRecipe = await res.json();
        setGeneratedTitle(data.title);
        await refetch();
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        setGeneratedTitle(err.message ?? "Recipe saved — pull to refresh.");
      }
    } catch {
      setGeneratedTitle("Could not connect to server.");
    } finally {
      setGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const textDir = isRTL ? "right" : "left";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View>
          <Text style={[styles.headerGreeting, { color: colors.mutedForeground, fontFamily: fontFamily(), textAlign: textDir }]}>
            {t("goodDay")}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: fontFamily("bold"), textAlign: textDir }]}>
            {t("whatCraving")}
          </Text>
        </View>
        {/* Language Toggle */}
        <Pressable
          style={[styles.langBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { toggleLanguage(); Haptics.selectionAsync(); }}
        >
          <Text style={[styles.langBtnText, { color: colors.primary, fontFamily: fontFamily("bold") }]}>
            {language === "en" ? "عربي" : "EN"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      >
        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: fontFamily(), textAlign: textDir }]}
            placeholder={t("searchRecipes")}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search !== "" && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* AI Generate Banner */}
        <Pressable onPress={() => { setShowGenerator(!showGenerator); Haptics.selectionAsync(); }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBanner}
          >
            <View style={[styles.generateBannerContent, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="zap" size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.generateBannerTitle, { fontFamily: fontFamily("bold"), textAlign: textDir }]}>{t("aiRecipeGen")}</Text>
                <Text style={[styles.generateBannerSub, { fontFamily: fontFamily(), textAlign: textDir }]}>{t("aiRecipeGenSub")}</Text>
              </View>
              <Feather name={showGenerator ? "chevron-up" : "chevron-right"} size={20} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Generator Input */}
        {showGenerator && (
          <View style={[styles.generatorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.generatorInput, { color: colors.foreground, borderColor: colors.border, fontFamily: fontFamily(), textAlign: textDir }]}
              placeholder={language === "ar" ? "مثال: لحم ضأن حار مع أرز وأعشاب..." : "e.g. spicy lamb with rice and herbs..."}
              placeholderTextColor={colors.mutedForeground}
              value={craving}
              onChangeText={setCraving}
              multiline
            />
            <Pressable
              style={{ opacity: generating || !craving.trim() ? 0.5 : 1, borderRadius: 12, overflow: "hidden" }}
              onPress={generateRecipe}
              disabled={generating || !craving.trim()}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.generateBtnGradient, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="zap" size={16} color="#fff" />
                    <Text style={[styles.generateBtnText, { fontFamily: fontFamily("bold") }]}>{t("generateRecipe")}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
            {generatedTitle != null && (
              <View style={[styles.generatedResult, { backgroundColor: colors.muted, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={[styles.generatedResultText, { color: colors.foreground, fontFamily: fontFamily() }]}>
                  {generatedTitle}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => { setSelectedCategory(cat); Haptics.selectionAsync(); }}
              style={[styles.categoryPill, {
                backgroundColor: selectedCategory === cat ? colors.primary : colors.card,
                borderColor: selectedCategory === cat ? colors.primary : colors.border,
              }]}
            >
              <Text style={[styles.categoryPillText, { color: selectedCategory === cat ? "#fff" : colors.mutedForeground, fontFamily: fontFamily() }]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Section Header */}
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {apiRecipes && apiRecipes.length > 0 ? t("yourRecipes") : t("featuredRecipes")}
          </Text>
          {recipesLoading ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Text style={[styles.sectionCount, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
              {filteredRecipes.length} {t("results")}
            </Text>
          )}
        </View>

        {/* Recipe List */}
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
              {t("noRecipesFound")}
            </Text>
          </View>
        ) : (
          <View style={styles.recipeList}>
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} colors={colors} fontFamily={fontFamily} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerGreeting: { fontSize: 13, marginBottom: 2 },
  headerTitle: { fontSize: 22 },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  langBtnText: { fontSize: 13 },
  searchRow: {
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  generateBanner: { marginHorizontal: 20, borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  generateBannerContent: { alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
  generateBannerTitle: { color: "#fff", fontSize: 15, marginBottom: 2 },
  generateBannerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  generatorBox: { marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, gap: 12 },
  generatorInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 70, textAlignVertical: "top" },
  generateBtnGradient: { alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  generateBtnText: { color: "#fff", fontSize: 15 },
  generatedResult: { alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  generatedResultText: { flex: 1, fontSize: 13 },
  categoriesContainer: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  categoryPillText: { fontSize: 13 },
  sectionHeader: { justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontSize: 18 },
  sectionCount: { fontSize: 13 },
  recipeList: { paddingHorizontal: 20, gap: 12 },
  recipeCard: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderRadius: 16, borderWidth: 1, gap: 14 },
  recipeEmoji: { width: 60, height: 60, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  recipeEmojiText: { fontSize: 30 },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 15, marginBottom: 2 },
  recipeCuisine: { fontSize: 12, marginBottom: 6 },
  recipeMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8, flexWrap: "wrap" },
  recipeMetaText: { fontSize: 11 },
  recipeTags: { flexDirection: "row", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10 },
  saveBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
