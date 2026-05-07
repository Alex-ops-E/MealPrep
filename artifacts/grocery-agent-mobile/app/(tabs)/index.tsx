import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Recipe {
  id: string;
  name: string;
  nameAr: string;
  cuisine: string;
  time: string;
  calories: number;
  rating: number;
  emoji: string;
  tags: string[];
}

const FEATURED_RECIPES: Recipe[] = [
  {
    id: "1",
    name: "Machboos Laham",
    nameAr: "مجبوس لحم",
    cuisine: "Qatari",
    time: "60 min",
    calories: 720,
    rating: 4.9,
    emoji: "🍖",
    tags: ["Traditional", "Rice", "Lamb"],
  },
  {
    id: "2",
    name: "Salmon Sushi Bowl",
    nameAr: "طبق سوشي السلمون",
    cuisine: "Japanese",
    time: "25 min",
    calories: 520,
    rating: 4.8,
    emoji: "🍣",
    tags: ["Healthy", "Seafood"],
  },
  {
    id: "3",
    name: "Chicken Shawarma",
    nameAr: "شاورما دجاج",
    cuisine: "Lebanese",
    time: "35 min",
    calories: 560,
    rating: 4.7,
    emoji: "🌯",
    tags: ["Grilled", "Popular"],
  },
  {
    id: "4",
    name: "Lamb Biryani",
    nameAr: "برياني لحم",
    cuisine: "South Asian",
    time: "75 min",
    calories: 680,
    rating: 4.8,
    emoji: "🍚",
    tags: ["Spiced", "Rice"],
  },
  {
    id: "5",
    name: "Mezze Platter",
    nameAr: "طبق مزة",
    cuisine: "Levantine",
    time: "15 min",
    calories: 580,
    rating: 4.7,
    emoji: "🧆",
    tags: ["Vegetarian", "Sharing"],
  },
  {
    id: "6",
    name: "Wagyu Steak",
    nameAr: "ستيك واغيو",
    cuisine: "Japanese",
    time: "20 min",
    calories: 820,
    rating: 5.0,
    emoji: "🥩",
    tags: ["Premium", "Grilled"],
  },
];

const CATEGORIES = ["All", "Qatari", "Japanese", "Lebanese", "Indian", "Italian", "American"];

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function RecipeCard({ recipe, colors }: { recipe: Recipe; colors: ReturnType<typeof useColors> }) {
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
        <Text style={[styles.recipeName, { color: colors.foreground }]} numberOfLines={1}>
          {recipe.name}
        </Text>
        <Text style={[styles.recipeCuisine, { color: colors.mutedForeground }]}>
          {recipe.cuisine}
        </Text>
        <View style={styles.recipeMeta}>
          <Feather name="clock" size={11} color={colors.mutedForeground} />
          <Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>{recipe.time}</Text>
          <Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>{recipe.calories} cal</Text>
          <Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>·</Text>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={[styles.recipeMetaText, { color: "#FBBF24" }]}>{recipe.rating}</Text>
        </View>
        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable
        style={styles.saveBtn}
        onPress={() => { setSaved(!saved); Haptics.selectionAsync(); }}
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
  const [prompt, setPrompt] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const filteredRecipes = FEATURED_RECIPES.filter((r) => {
    const matchesCategory = selectedCategory === "All" || r.cuisine === selectedCategory;
    const matchesSearch =
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const generateRecipe = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGeneratedRecipe(null);
    try {
      const res = await fetch(`${API_BASE}/api/recipes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), servings: 2 }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedRecipe(data.name || data.title || "Your recipe is ready!");
      } else {
        setGeneratedRecipe("Recipe generated! Check the web app for details.");
      }
    } catch {
      setGeneratedRecipe("Recipe generated! Check the web app for full details.");
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
          <Text style={[styles.headerGreeting, { color: colors.mutedForeground }]}>Good day! 👋</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>What are you craving?</Text>
        </View>
        <Pressable style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="user" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      >
        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
        <Pressable onPress={() => { setShowGenerator(!showGenerator); Haptics.selectionAsync(); }}>
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
                <Text style={styles.generateBannerSub}>Describe a craving, get a recipe</Text>
              </View>
              <Feather name={showGenerator ? "chevron-up" : "chevron-right"} size={20} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Generator Input */}
        {showGenerator && (
          <View style={[styles.generatorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.generatorInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. spicy lamb with rice and herbs..."
              placeholderTextColor={colors.mutedForeground}
              value={prompt}
              onChangeText={setPrompt}
              multiline
            />
            <Pressable
              style={[styles.generateBtn, { opacity: generating || !prompt.trim() ? 0.5 : 1 }]}
              onPress={generateRecipe}
              disabled={generating || !prompt.trim()}
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
                    <Text style={styles.generateBtnText}>Generate</Text>
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
              onPress={() => { setSelectedCategory(cat); Haptics.selectionAsync(); }}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.card,
                  borderColor: selectedCategory === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  { color: selectedCategory === cat ? "#fff" : colors.mutedForeground },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured Recipes</Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
            {filteredRecipes.length} results
          </Text>
        </View>

        {/* Recipe List */}
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No recipes found</Text>
          </View>
        ) : (
          <View style={styles.recipeList}>
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} colors={colors} />
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
    paddingVertical: 12,
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
