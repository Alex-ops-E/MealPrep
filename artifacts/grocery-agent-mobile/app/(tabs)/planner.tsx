import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useColors } from "@/hooks/useColors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
type MealType = (typeof MEAL_TYPES)[number];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const CUISINE_EMOJIS: Record<string, string> = {
  qatari: "🍖", japanese: "🍣", lebanese: "🌯", indian: "🍛",
  italian: "🍕", american: "🍔", emirati: "🐟", thai: "🍜",
  "south asian": "🍚", levantine: "🧆", arabic: "🍗", default: "🍽️",
};

function getEmoji(name?: string): string {
  if (!name) return CUISINE_EMOJIS.default;
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CUISINE_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return CUISINE_EMOJIS.default;
}

// Quick local fallback suggestions for each meal type
const QUICK_PICKS: Record<MealType, Array<{ name: string; emoji: string; calories: number }>> = {
  breakfast: [
    { name: "Shakshuka", emoji: "🍳", calories: 320 },
    { name: "Avocado Toast", emoji: "🥑", calories: 280 },
    { name: "Ful Medames", emoji: "🫘", calories: 300 },
    { name: "Date Oatmeal", emoji: "🌾", calories: 340 },
    { name: "Labneh & Khubz", emoji: "🧀", calories: 260 },
  ],
  lunch: [
    { name: "Machboos", emoji: "🍖", calories: 720 },
    { name: "Chicken Shawarma", emoji: "🌯", calories: 560 },
    { name: "Mezze Platter", emoji: "🧆", calories: 580 },
    { name: "Biryani", emoji: "🍚", calories: 680 },
    { name: "Lamb Margoog", emoji: "🫕", calories: 610 },
  ],
  dinner: [
    { name: "Grilled Salmon", emoji: "🐟", calories: 420 },
    { name: "Wagyu Steak", emoji: "🥩", calories: 820 },
    { name: "Sushi Platter", emoji: "🍣", calories: 520 },
    { name: "Tikka Masala", emoji: "🍛", calories: 680 },
    { name: "Beef Tacos", emoji: "🌮", calories: 640 },
  ],
};

function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  // Shift so Monday is 0
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
    monday,
  };
}

function getDayKey(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayIndex);
  return d.toISOString().split("T")[0];
}

interface Meal {
  id: string;
  name: string;
  type: MealType;
  dayKey: string;
  recipeId?: string | null;
}

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export default function PlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const qc = useQueryClient();

  const [selectedDay, setSelectedDay] = useState(0);
  const [showPicks, setShowPicks] = useState<MealType | null>(null);
  const [generating, setGenerating] = useState<MealType | null>(null);

  const { monday, startDate, endDate } = useMemo(() => getWeekRange(), []);
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const { data: meals = [], isLoading } = useQuery<Meal[]>({
    queryKey: ["meals-week", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/meals/week?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/meals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meals-week"] });
      Haptics.selectionAsync();
    },
  });

  const dayKey = getDayKey(monday, selectedDay);
  const dayMeals = meals.filter((m) => m.dayKey === dayKey);

  const totalCal = meals.reduce((sum) => sum + 0, 0); // Backend meals don't store calories directly
  const totalMeals = meals.length;

  const aiGenerate = async (mealType: MealType) => {
    setGenerating(mealType);
    try {
      const prompts: Record<MealType, string> = {
        breakfast: "A healthy Middle Eastern breakfast",
        lunch: "A satisfying Qatari or South Asian lunch",
        dinner: "A premium restaurant-quality dinner",
      };
      const res = await fetch(`${API_BASE}/api/meals/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompts[mealType],
          type: mealType,
          dayKey,
          servings: 2,
        }),
      });
      if (res.ok) {
        await qc.invalidateQueries({ queryKey: ["meals-week"] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    setGenerating(null);
  };

  const addQuickPick = async (mealType: MealType, pick: { name: string; emoji: string; calories: number }) => {
    // Quick picks are added locally via the generate endpoint with the dish name as prompt
    setShowPicks(null);
    setGenerating(mealType);
    try {
      const res = await fetch(`${API_BASE}/api/meals/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: pick.name,
          type: mealType,
          dayKey,
          servings: 2,
        }),
      });
      if (res.ok) {
        await qc.invalidateQueries({ queryKey: ["meals-week"] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
    setGenerating(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Meal Planner</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Week of {startDate}
          </Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={14} color={colors.primary} />
          <Text style={[styles.statBadgeText, { color: colors.foreground }]}>
            {totalMeals} meals
          </Text>
        </View>
      </View>

      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.daySelector]}
      >
        {DAYS.map((day, i) => {
          const isSelected = selectedDay === i;
          const isToday = i === todayIndex;
          const dk = getDayKey(monday, i);
          const hasMeals = meals.some((m) => m.dayKey === dk);
          return (
            <Pressable
              key={day}
              onPress={() => {
                setSelectedDay(i);
                setShowPicks(null);
                Haptics.selectionAsync();
              }}
              style={{ alignItems: "center", gap: 5 }}
            >
              {isSelected ? (
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.dayBtn, styles.dayBtnActive]}
                >
                  <Text style={[styles.dayText, { color: "#fff" }]}>{day}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.dayBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: isToday ? colors.primary : colors.border,
                      borderWidth: isToday ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isToday ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              )}
              {hasMeals && (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.mutedForeground,
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Day label */}
      <View style={styles.dayLabel}>
        <Text style={[styles.dayLabelText, { color: colors.foreground }]}>
          {FULL_DAYS[selectedDay]}
          {selectedDay === todayIndex ? " (Today)" : ""}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: bottomInset + 90,
          gap: 12,
        }}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading meal plan...
            </Text>
          </View>
        ) : (
          MEAL_TYPES.map((mealType) => {
            const meal = dayMeals.find((m) => m.type === mealType);
            const isGenThisSlot = generating === mealType;
            return (
              <View key={mealType}>
                <View
                  style={[
                    styles.mealSlot,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.mealTypeRow}>
                    <Text
                      style={[styles.mealTypeLabel, { color: colors.mutedForeground }]}
                    >
                      {MEAL_LABELS[mealType]}
                    </Text>
                    {!meal && !isGenThisSlot && (
                      <Pressable
                        onPress={() => aiGenerate(mealType)}
                        style={styles.aiChip}
                      >
                        <LinearGradient
                          colors={[colors.gradientStart, colors.gradientEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.aiChipGradient}
                        >
                          <Feather name="zap" size={11} color="#fff" />
                          <Text style={styles.aiChipText}>AI Pick</Text>
                        </LinearGradient>
                      </Pressable>
                    )}
                  </View>

                  {isGenThisSlot ? (
                    <View style={styles.genLoadingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.genLoadingText, { color: colors.mutedForeground }]}>
                        Generating meal...
                      </Text>
                    </View>
                  ) : meal ? (
                    <View style={styles.mealContent}>
                      <View
                        style={[styles.mealEmojiBox, { backgroundColor: colors.muted }]}
                      >
                        <Text style={styles.mealEmoji}>{getEmoji(meal.name)}</Text>
                      </View>
                      <Text style={[styles.mealName, { color: colors.foreground }]}>
                        {meal.name}
                      </Text>
                      <Pressable
                        onPress={() => deleteMutation.mutate(meal.id)}
                        style={styles.removeBtn}
                      >
                        {deleteMutation.isPending ? (
                          <ActivityIndicator size="small" color={colors.mutedForeground} />
                        ) : (
                          <Feather name="minus-circle" size={20} color={colors.mutedForeground} />
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={[styles.addMealBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        setShowPicks(showPicks === mealType ? null : mealType);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Feather name="plus" size={18} color={colors.primary} />
                      <Text style={[styles.addMealText, { color: colors.primary }]}>
                        Add {MEAL_LABELS[mealType]}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Quick picks dropdown */}
                {showPicks === mealType && (
                  <View
                    style={[
                      styles.suggestions,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[styles.suggestionsTitle, { color: colors.mutedForeground }]}
                    >
                      Quick picks
                    </Text>
                    {QUICK_PICKS[mealType].map((pick) => (
                      <Pressable
                        key={pick.name}
                        style={[
                          styles.suggestionRow,
                          { borderColor: colors.border },
                        ]}
                        onPress={() => addQuickPick(mealType, pick)}
                      >
                        <View
                          style={[
                            styles.suggestionEmoji,
                            { backgroundColor: colors.muted },
                          ]}
                        >
                          <Text style={styles.suggestionEmojiText}>{pick.emoji}</Text>
                        </View>
                        <Text
                          style={[styles.suggestionName, { color: colors.foreground }]}
                        >
                          {pick.name}
                        </Text>
                        <Text
                          style={[styles.suggestionCal, { color: colors.mutedForeground }]}
                        >
                          ~{pick.calories} cal
                        </Text>
                        <Ionicons
                          name="add-circle-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Weekly Summary */}
        <View style={[styles.summaryCard, { borderColor: colors.border }]}>
          <LinearGradient
            colors={[colors.gradientStart + "22", colors.gradientEnd + "11"]}
            style={styles.summaryGradient}
          >
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              Weekly Summary
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.statBlock}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {totalMeals}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Meals planned
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {DAYS.filter((_, i) => meals.some((m) => m.dayKey === getDayKey(monday, i))).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Days covered
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {7 - DAYS.filter((_, i) => meals.some((m) => m.dayKey === getDayKey(monday, i))).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Days to plan
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
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
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  daySelector: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: "flex-start",
    paddingBottom: 12,
  },
  dayBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dayBtnActive: { borderWidth: 0 },
  dayText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dayLabel: { paddingHorizontal: 20, marginBottom: 12 },
  dayLabelText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  loadingState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  mealSlot: { borderRadius: 16, borderWidth: 1, padding: 16 },
  mealTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mealTypeLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  aiChip: { borderRadius: 10, overflow: "hidden" },
  aiChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiChipText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  genLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  genLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  mealContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  mealEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mealEmoji: { fontSize: 24 },
  mealName: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  removeBtn: { padding: 4 },
  addMealBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addMealText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  suggestions: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  suggestionEmoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionEmojiText: { fontSize: 20 },
  suggestionName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  suggestionCal: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  summaryGradient: { padding: 20 },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryStats: { flexDirection: "row", alignItems: "center" },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  statDivider: { width: 1, height: 40 },
});
