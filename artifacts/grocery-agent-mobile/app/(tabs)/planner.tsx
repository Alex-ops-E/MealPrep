import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"] as const;
type MealType = (typeof MEAL_TYPES)[number];

interface MealEntry {
  name: string;
  emoji: string;
  calories: number;
}

const SUGGESTED_MEALS: Record<MealType, MealEntry[]> = {
  Breakfast: [
    { name: "Shakshuka", emoji: "🍳", calories: 320 },
    { name: "Avocado Toast", emoji: "🥑", calories: 280 },
    { name: "Ful Medames", emoji: "🫘", calories: 300 },
    { name: "Date Oatmeal", emoji: "🌾", calories: 340 },
    { name: "Labneh Plate", emoji: "🧀", calories: 260 },
  ],
  Lunch: [
    { name: "Machboos", emoji: "🍖", calories: 720 },
    { name: "Chicken Shawarma", emoji: "🌯", calories: 560 },
    { name: "Mezze Platter", emoji: "🧆", calories: 580 },
    { name: "Biryani", emoji: "🍚", calories: 680 },
    { name: "Lamb Margoog", emoji: "🫕", calories: 610 },
  ],
  Dinner: [
    { name: "Grilled Salmon", emoji: "🐟", calories: 420 },
    { name: "Wagyu Steak", emoji: "🥩", calories: 820 },
    { name: "Sushi Platter", emoji: "🍣", calories: 520 },
    { name: "Tikka Masala", emoji: "🍛", calories: 680 },
    { name: "Beef Tacos", emoji: "🌮", calories: 640 },
  ],
};

type PlannerState = Record<number, Partial<Record<MealType, MealEntry>>>;

function getInitialPlan(): PlannerState {
  return {
    0: { Breakfast: SUGGESTED_MEALS.Breakfast[0], Lunch: SUGGESTED_MEALS.Lunch[0], Dinner: SUGGESTED_MEALS.Dinner[0] },
    1: { Lunch: SUGGESTED_MEALS.Lunch[1], Dinner: SUGGESTED_MEALS.Dinner[1] },
    2: { Breakfast: SUGGESTED_MEALS.Breakfast[1], Lunch: SUGGESTED_MEALS.Lunch[2] },
    3: { Lunch: SUGGESTED_MEALS.Lunch[3], Dinner: SUGGESTED_MEALS.Dinner[2] },
    4: { Breakfast: SUGGESTED_MEALS.Breakfast[2], Dinner: SUGGESTED_MEALS.Dinner[3] },
    5: { Lunch: SUGGESTED_MEALS.Lunch[4] },
    6: {},
  };
}

function totalCalories(plan: PlannerState): number {
  return Object.values(plan).reduce((sum, day) => {
    return sum + Object.values(day).reduce((ds, meal) => ds + (meal?.calories ?? 0), 0);
  }, 0);
}

export default function PlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedDay, setSelectedDay] = useState(0);
  const [plan, setPlan] = useState<PlannerState>(getInitialPlan());
  const [showSuggestions, setShowSuggestions] = useState<MealType | null>(null);

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1; // Mon=0 ... Sun=6

  const dayMeals = plan[selectedDay] ?? {};
  const weekCalories = totalCalories(plan);

  const addMeal = (mealType: MealType, meal: MealEntry) => {
    setPlan((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [mealType]: meal },
    }));
    setShowSuggestions(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeMeal = (mealType: MealType) => {
    setPlan((prev) => {
      const day = { ...prev[selectedDay] };
      delete day[mealType];
      return { ...prev, [selectedDay]: day };
    });
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Meal Planner</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Plan your week, eat well
          </Text>
        </View>
        <View style={[styles.calorieBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="zap" size={14} color={colors.primary} />
          <Text style={[styles.calorieText, { color: colors.foreground }]}>
            {weekCalories.toLocaleString()} cal/wk
          </Text>
        </View>
      </View>

      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.daySelector, { paddingBottom: 12 }]}
      >
        {DAYS.map((day, i) => {
          const isSelected = selectedDay === i;
          const isToday = i === todayIndex;
          const hasMeals = Object.keys(plan[i] ?? {}).length > 0;
          return (
            <Pressable
              key={day}
              onPress={() => { setSelectedDay(i); setShowSuggestions(null); Haptics.selectionAsync(); }}
              style={{ alignItems: "center", gap: 6 }}
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
                  <Text style={[styles.dayText, { color: isToday ? colors.primary : colors.mutedForeground }]}>
                    {day}
                  </Text>
                </View>
              )}
              {hasMeals && (
                <View style={[styles.dot, { backgroundColor: isSelected ? colors.primary : colors.mutedForeground }]} />
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset + 90, gap: 12 }}
      >
        {MEAL_TYPES.map((mealType) => {
          const meal = dayMeals[mealType];
          return (
            <View key={mealType}>
              <View style={[styles.mealSlot, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Meal type label */}
                <View style={styles.mealTypeRow}>
                  <Text style={[styles.mealTypeLabel, { color: colors.mutedForeground }]}>
                    {mealType}
                  </Text>
                  {meal && (
                    <Text style={[styles.mealCalText, { color: colors.mutedForeground }]}>
                      {meal.calories} cal
                    </Text>
                  )}
                </View>

                {meal ? (
                  <View style={styles.mealContent}>
                    <View style={[styles.mealEmojiBox, { backgroundColor: colors.muted }]}>
                      <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                    </View>
                    <Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text>
                    <Pressable onPress={() => removeMeal(mealType)} style={styles.removeBtn}>
                      <Feather name="minus-circle" size={20} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.addMealBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowSuggestions(showSuggestions === mealType ? null : mealType);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Feather name="plus" size={18} color={colors.primary} />
                    <Text style={[styles.addMealText, { color: colors.primary }]}>Add {mealType}</Text>
                  </Pressable>
                )}
              </View>

              {/* Suggestions dropdown */}
              {showSuggestions === mealType && (
                <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.suggestionsTitle, { color: colors.mutedForeground }]}>
                    Quick picks
                  </Text>
                  {SUGGESTED_MEALS[mealType].map((suggestion) => (
                    <Pressable
                      key={suggestion.name}
                      style={[styles.suggestionRow, { borderColor: colors.border }]}
                      onPress={() => addMeal(mealType, suggestion)}
                    >
                      <View style={[styles.suggestionEmoji, { backgroundColor: colors.muted }]}>
                        <Text style={styles.suggestionEmojiText}>{suggestion.emoji}</Text>
                      </View>
                      <Text style={[styles.suggestionName, { color: colors.foreground }]}>
                        {suggestion.name}
                      </Text>
                      <Text style={[styles.suggestionCal, { color: colors.mutedForeground }]}>
                        {suggestion.calories} cal
                      </Text>
                      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Weekly Summary */}
        <View style={[styles.summaryCard, { borderColor: colors.border }]}>
          <LinearGradient
            colors={[colors.gradientStart + "22", colors.gradientEnd + "11"]}
            style={styles.summaryGradient}
          >
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Weekly Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statBlock}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {weekCalories.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total cal</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {Math.round(weekCalories / 7)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Daily avg</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statBlock}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {Object.values(plan).reduce((s, d) => s + Object.keys(d).length, 0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Meals planned</Text>
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
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  calorieText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  daySelector: { paddingHorizontal: 20, gap: 10, alignItems: "flex-start" },
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
  mealSlot: { borderRadius: 16, borderWidth: 1, padding: 16 },
  mealTypeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  mealTypeLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  mealCalText: { fontSize: 11, fontFamily: "Inter_400Regular" },
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
  summaryTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 16, textAlign: "center" },
  summaryStats: { flexDirection: "row", alignItems: "center" },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  statDivider: { width: 1, height: 40 },
});
