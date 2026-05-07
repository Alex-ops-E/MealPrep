import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

interface Recipe {
  id: string;
  title: string;
  cuisine?: string;
  cookingTime?: string;
  calories?: number;
  servings?: number;
  description?: string;
  createdAt?: string;
}

// Fallback featured recipes if API returns empty or fails
const FALLBACK_RECIPES = [
  { id: "f1", title: "Machboos Laham", cuisine: "Qatari", cookingTime: "60 min", calories: 720, emoji: "🍖", tags: ["Traditional", "Rice", "Lamb"] },
  { id: "f2", title: "Salmon Sushi Bowl", cuisine: "Japanese", cookingTime: "25 min", calories: 520, emoji: "🍣", tags: ["Healthy", "Seafood"] },
  { id: "f3", title: "Chicken Shawarma", cuisine: "Lebanese", cookingTime: "35 min", calories: 560, emoji: "🌯", tags: ["Grilled", "Popular"] },
  { id: "f4", title: "Lamb Biryani", cuisine: "South Asian", cookingTime: "75 min", calories: 680, emoji: "🍚", tags: ["Spiced", "Rice"] },
  { id: "f5", title: "Mezze Platter", cuisine: "Levantine", cookingTime: "15 min", calories: 580, emoji: "🧆", tags: ["Vegetarian", "Sharing"] },
  { id: "f6", title: "Wagyu Steak", cuisine: "Japanese", cookingTime: "20 min", calories: 820, emoji: "🥩", tags: ["Premium", "Grilled"] },
];

const CUISINE_EMOJIS: Record<string, string> = {
  Qatari: "🍖", Japanese: "🍣", Lebanese: "🌯", Indian: "🍛",
  Italian: "🍕", American: "🍔", Emirati: "🐟", Thai: "🍜",
  "South Asian": "🍚", Levantine: "🧆", default: "🍽️",
};

const CATEGORIES = ["All", "Qatari", "Japanese", "Lebanese", "Indian", "Italian", "American"];

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function getEmoji(cuisine?: string): string {
  if (!cuisine) return CUISINE_EMOJIS.default;
  for (const [key, emoji] of Object.entries(CUISINE_EMOJIS)) {
    if (cuisine.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return CUISINE_EMOJIS.default;
}

function RecipeCard({
  recipe,
  emoji,
  tags,
  colors,
}: {
  recipe: Recipe;
  emoji: string;
  tags?: string[];
  colors: ReturnType<typeof useColors>;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <Pressable
      style={[styles.recipeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => Haptics.selectionAsync()}
    >
      <View style={[styles.recipeEmoji, { backgroundColor: colors.muted }]}>
        <Text style={styles.recipeEmojiText}>{emoji}</Text>
      </View>
      <View style={styles.recipeInfo}>
        <Text style={[styles.recipeName, { color: colors.foreground }]} numberOfLines={1}>
          {recipe.title}
        </Text>
        {recipe.cuisine && (
          <Text style={[styles.recipeCuisine, { color: colors.mutedForeground }]}>
            {recipe.cuisine}
          </Text>
        )}
        <View style={styles.recipeMeta}>
          {recipe.cookingTime && (
            <>
              <Feather name="clock" size={11} color={colors.mutedForeground} />
              <Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>
                {recipe.cookingTime}
              </Text>
              <Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>·</Text>
            </>
          )}
          {recipe.calories && (
            <Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>
              {recipe.calories} cal
            </Text>
          )}
        </View>
        {tags && (
          <View style={styles.recipeTags}>
            {tags.slice(0, 2).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [generating, setGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<string | null>(null);
  const [craving, setCraving] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  // Fetch real recipes from backend
  const { data: apiRecipes, isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/recipes`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
    retry: 1,
  });

  // Use API recipes if available, otherwise fallback
  const baseRecipes =
    apiRecipes && apiRecipes.length > 0
      ? apiRecipes.map((r) => ({
          ...r,
          emoji: getEmoji(r.cuisine),
          cookingTime: r.cookingTime ?? undefined,
          tags: r.cuisine ? [r.cuisine] : [],
        }))
      : FALLBACK_RECIPES;

  const filteredRecipes = baseRecipes.filter((r) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (r.cuisine ?? "").toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.cuisine ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const generateRecipe = async () => {
    if (!craving.trim()) return;
    setGenerating(true);
    setGeneratedRecipe(null);
    try {
      const res = await fetch(`${API_BASE}/api/recipes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ craving: craving.trim(), servings: 2 }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedRecipe(data.title ?? data.name ?? "Recipe generated!");
        // Refetch recipes to show the new one
      } else {
        const err = await res.json().catch(() => ({}));
        setGeneratedRecipe(err.message ?? "Recipe generated! Pull to refresh to see it.");
      }
    } catch {
      setGeneratedRecipe("Could not connect to server. Check your connection.");
    } finally {
      setGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View>
          <Text style={[styles.headerGreeting, { color: colors.mutedForeground }]}>
            Good day!
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            What are you craving?
          </Text>
        </View>
        <Pressable
          style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="user" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      >
        {/* Search */}
        <View
          style={[
            styles.searchRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search recipes..."
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
        <Pressable
          onPress={() => {
            setShowGenerator(!showGenerator);
            Haptics.selectionAsync();
          }}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBanner}
          >
            <View style={styles.generateBannerContent}>
              <Feather name="zap" size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.generateBannerTitle}>AI Recipe Generator</Text>
                <Text style={styles.generateBannerSub}>
                  Describe a craving, get a personalised recipe
                </Text>
              </View>
              <Feather
                name={showGenerator ? "chevron-up" : "chevron-right"}
                size={20}
                color="#fff"
              />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Generator Input */}
        {showGenerator && (
          <View
            style={[
              styles.generatorBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[
                styles.generatorInput,
                { color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="e.g. spicy lamb with rice and herbs..."
              placeholderTextColor={colors.mutedForeground}
              value={craving}
              onChangeText={setCraving}
              multiline
            />
            <Pressable
              style={[
                styles.generateBtn,
                { opacity: generating || !craving.trim() ? 0.5 : 1 },
              ]}
              onPress={generateRecipe}
              disabled={generating || !craving.trim()}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtnGradient}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="zap" size={16} color="#fff" />
                    <Text style={styles.generateBtnText}>Generate Recipe</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
            {generatedRecipe && (
              <View style={[styles.generatedResult, { backgroundColor: colors.muted }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={[styles.generatedResultText, { color: colors.foreground }]}>
                  {generatedRecipe}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                setSelectedCategory(cat);
                Haptics.selectionAsync();
              }}
              style={[
                styles.categoryPill,
                {
                  backgroundColor:
                    selectedCategory === cat ? colors.primary : colors.card,
                  borderColor:
                    selectedCategory === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  {
                    color:
                      selectedCategory === cat ? "#fff" : colors.mutedForeground,
                  },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {apiRecipes && apiRecipes.length > 0 ? "Your Recipes" : "Featured Recipes"}
          </Text>
          {recipesLoading ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
              {filteredRecipes.length} results
            </Text>
          )}
        </View>

        {/* Recipe List */}
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No recipes found
            </Text>
          </View>
        ) : (
          <View style={styles.recipeList}>
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                emoji={(recipe as any).emoji ?? getEmoji(recipe.cuisine)}
                tags={(recipe as any).tags}
                colors={colors}
              />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerGreeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  generateBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  generateBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  generateBannerTitle: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginBottom: 2,
  },
  generateBannerSub: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  generatorBox: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  generatorInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 70,
    textAlignVertical: "top",
  },
  generateBtn: { borderRadius: 12, overflow: "hidden" },
  generateBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  generateBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  generatedResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  generatedResultText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  categoriesContainer: { paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  recipeList: { paddingHorizontal: 20, gap: 12 },
  recipeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  recipeEmoji: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeEmojiText: { fontSize: 30 },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  recipeCuisine: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  recipeMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  recipeTags: { flexDirection: "row", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  saveBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
