import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface SwipeItem {
  id: string;
  type: "dish" | "restaurant";
  name: string;
  nameAr: string;
  emoji: string;
  cuisine: string;
  price: string;
  rating: number;
  description: string;
  calories?: number;
}

const QATAR_ITEMS: SwipeItem[] = [
  {
    id: "qa1", type: "dish",
    name: "Machboos", nameAr: "مجبوس",
    emoji: "🍖", cuisine: "Qatari", price: "QAR 55", rating: 4.9,
    description: "Slow-spiced basmati rice with tender lamb & dried limes",
    calories: 720,
  },
  {
    id: "qa2", type: "dish",
    name: "Margoog", nameAr: "مرقوق",
    emoji: "🫕", cuisine: "Qatari", price: "QAR 50", rating: 4.8,
    description: "Traditional lamb & vegetable stew with thin bread",
    calories: 610,
  },
  {
    id: "qa3", type: "dish",
    name: "Biryani", nameAr: "برياني",
    emoji: "🍚", cuisine: "South Asian", price: "QAR 45", rating: 4.8,
    description: "Fragrant saffron rice with spiced chicken & caramelised onions",
    calories: 680,
  },
  {
    id: "qa4", type: "dish",
    name: "Shawarma", nameAr: "شاورما",
    emoji: "🌯", cuisine: "Lebanese", price: "QAR 20", rating: 4.7,
    description: "Marinated chicken or lamb, garlic sauce, fresh pickles",
    calories: 560,
  },
  {
    id: "qa5", type: "dish",
    name: "Salmon Sushi Platter", nameAr: "طبق سوشي السلمون",
    emoji: "🍣", cuisine: "Japanese", price: "QAR 90", rating: 4.9,
    description: "Premium salmon rolls & nigiri, Japanese wasabi",
    calories: 520,
  },
  {
    id: "qa6", type: "dish",
    name: "Smash Burger", nameAr: "سماش برجر",
    emoji: "🍔", cuisine: "American", price: "QAR 55", rating: 4.7,
    description: "Double smash patty, cheddar, caramelised onions, special sauce",
    calories: 950,
  },
  {
    id: "qa7", type: "dish",
    name: "Mezze Platter", nameAr: "طبق مزة",
    emoji: "🧆", cuisine: "Levantine", price: "QAR 60", rating: 4.7,
    description: "Hummus, falafel, tabbouleh, fattoush & warm khubz",
    calories: 580,
  },
  {
    id: "qa8", type: "dish",
    name: "Chicken Tikka Masala", nameAr: "دجاج تيكا ماسالا",
    emoji: "🍛", cuisine: "Indian", price: "QAR 55", rating: 4.8,
    description: "Tender chicken in rich tomato-cream sauce, basmati rice",
    calories: 680,
  },
  {
    id: "qa9", type: "dish",
    name: "Wagyu Steak", nameAr: "ستيك واغيو",
    emoji: "🥩", cuisine: "Japanese", price: "QAR 220", rating: 5.0,
    description: "A5 wagyu, truffle butter, roasted asparagus",
    calories: 820,
  },
  {
    id: "qa10", type: "dish",
    name: "Beef Tacos", nameAr: "تاكو اللحم",
    emoji: "🌮", cuisine: "Mexican", price: "QAR 65", rating: 4.6,
    description: "Slow-braised beef, fresh salsa, guacamole & jalapeños",
    calories: 640,
  },
  {
    id: "qa11", type: "restaurant",
    name: "Nobu Doha", nameAr: "نوبو الدوحة",
    emoji: "🏯", cuisine: "Japanese-Peruvian", price: "QAR 400+", rating: 4.9,
    description: "World-famous fusion dining at Four Seasons Doha",
  },
  {
    id: "qa12", type: "restaurant",
    name: "Zuma Doha", nameAr: "زوما الدوحة",
    emoji: "🌿", cuisine: "Japanese", price: "QAR 350+", rating: 4.8,
    description: "Contemporary izakaya at QIPCO Tower, stunning city views",
  },
  {
    id: "qa13", type: "restaurant",
    name: "IDAM by Alain Ducasse", nameAr: "إيدام",
    emoji: "🎨", cuisine: "French-Moroccan", price: "QAR 500+", rating: 4.8,
    description: "Fine dining inside the Museum of Islamic Art",
  },
  {
    id: "qa14", type: "restaurant",
    name: "Al Mourjan", nameAr: "المرجان",
    emoji: "🌊", cuisine: "Seafood", price: "QAR 300+", rating: 4.7,
    description: "Breathtaking harbour views at Fairmont Doha",
  },
  {
    id: "qa15", type: "restaurant",
    name: "Coya Doha", nameAr: "كويا الدوحة",
    emoji: "🌺", cuisine: "Peruvian", price: "QAR 400+", rating: 4.8,
    description: "Vibrant Peruvian dining at Four Seasons Doha",
  },
];

type Phase = "landing" | "swiping" | "done";
type Category = "dishes" | "restaurants" | "both";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export default function SwipeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [phase, setPhase] = useState<Phase>("landing");
  const [category, setCategory] = useState<Category>("both");
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState<SwipeItem[]>([]);

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const cardRotation = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const likeOpacity = pan.x.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: "clamp" });
  const nopeOpacity = pan.x.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: "clamp" });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80) {
          swipe("right");
        } else if (g.dx < -80) {
          swipe("left");
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const swipe = (direction: "left" | "right") => {
    const item = items[currentIndex];
    if (!item) return;

    Haptics.selectionAsync();
    Animated.timing(pan, {
      toValue: { x: direction === "right" ? 500 : -500, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      if (direction === "right") {
        setLikes((prev) => [...prev, item]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (next >= items.length) {
        setPhase("done");
        recordSession();
      }
    });
  };

  const recordSession = async () => {
    try {
      await fetch(`${API_BASE}/api/dish-match/solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, source: "mobile-swipe" }),
      });
    } catch {}
  };

  const startSwiping = () => {
    const pool = category === "dishes"
      ? QATAR_ITEMS.filter((i) => i.type === "dish")
      : category === "restaurants"
      ? QATAR_ITEMS.filter((i) => i.type === "restaurant")
      : QATAR_ITEMS;
    setItems(shuffle(pool));
    setCurrentIndex(0);
    setLikes([]);
    pan.setValue({ x: 0, y: 0 });
    setPhase("swiping");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const restart = () => {
    setPhase("landing");
    setLikes([]);
    setCurrentIndex(0);
  };

  const currentItem = items[currentIndex];

  // Landing Phase
  if (phase === "landing") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dish Match</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Swipe to find what you're craving
          </Text>
        </View>

        <View style={styles.landingContent}>
          <LinearGradient
            colors={[colors.gradientStart + "33", colors.gradientEnd + "22"]}
            style={styles.heroIcon}
          >
            <Text style={{ fontSize: 64 }}>🍽️</Text>
          </LinearGradient>

          <Text style={[styles.landingTitle, { color: colors.foreground }]}>
            What do you feel like?
          </Text>
          <Text style={[styles.landingDesc, { color: colors.mutedForeground }]}>
            Swipe right on dishes you love, left to skip. Find your perfect meal in Doha.
          </Text>

          {/* Category Selection */}
          <View style={styles.categoryRow}>
            {(["dishes", "restaurants", "both"] as Category[]).map((cat) => (
              <Pressable
                key={cat}
                onPress={() => { setCategory(cat); Haptics.selectionAsync(); }}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: category === cat ? colors.primary : colors.card,
                    borderColor: category === cat ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catBtnText,
                    { color: category === cat ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {cat === "both" ? "Both" : cat === "dishes" ? "Dishes" : "Restaurants"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={startSwiping} style={styles.startBtn}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtnGradient}
            >
              <Feather name="zap" size={20} color="#fff" />
              <Text style={styles.startBtnText}>Start Swiping</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // Done Phase
  if (phase === "done") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Your Picks</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {likes.length} {likes.length === 1 ? "match" : "matches"}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 90, gap: 12 }}
        >
          {likes.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="meh" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No picks this time
              </Text>
            </View>
          ) : (
            likes.map((item) => (
              <View key={item.id} style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.matchEmoji, { backgroundColor: colors.muted }]}>
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.matchName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.matchDetail, { color: colors.mutedForeground }]}>
                    {item.cuisine} · {item.price}
                  </Text>
                  <Text style={[styles.matchDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={[styles.matchRating, { color: "#FBBF24" }]}>{item.rating}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={[styles.restartBar, { paddingBottom: bottomInset + 60 }]}>
          <Pressable onPress={restart} style={styles.restartBtn}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.restartBtnGradient}
            >
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.restartBtnText}>Swipe Again</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // Swiping Phase
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.swipeHeader, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={restart}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[styles.swipeProgress, { color: colors.mutedForeground }]}>
          {currentIndex + 1} / {items.length}
        </Text>
        <View style={[styles.likesBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="heart" size={14} color={colors.primary} />
          <Text style={[styles.likesCount, { color: colors.foreground }]}>{likes.length}</Text>
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardArea}>
        {currentItem ? (
          <>
            {/* Next card (peeking) */}
            {items[currentIndex + 1] && (
              <View
                style={[
                  styles.card,
                  styles.cardBehind,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.cardEmojiArea, { backgroundColor: colors.muted }]}>
                  <Text style={styles.cardEmoji}>{items[currentIndex + 1].emoji}</Text>
                </View>
              </View>
            )}

            {/* Active card */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { rotate: cardRotation },
                  ],
                },
              ]}
            >
              {/* LIKE stamp */}
              <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                <Text style={styles.likeStampText}>LIKE</Text>
              </Animated.View>
              {/* NOPE stamp */}
              <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
                <Text style={styles.nopeStampText}>NOPE</Text>
              </Animated.View>

              {/* Emoji */}
              <LinearGradient
                colors={[colors.gradientStart + "22", colors.gradientEnd + "11"]}
                style={styles.cardEmojiArea}
              >
                <Text style={styles.cardEmoji}>{currentItem.emoji}</Text>
                <View style={[styles.typeBadge, { backgroundColor: colors.card + "CC" }]}>
                  <Text style={[styles.typeText, { color: colors.mutedForeground }]}>
                    {currentItem.type === "restaurant" ? "Restaurant" : "Dish"}
                  </Text>
                </View>
              </LinearGradient>

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={styles.cardNameRow}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>
                    {currentItem.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={[styles.ratingText, { color: "#FBBF24" }]}>{currentItem.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.cardNameAr, { color: colors.mutedForeground }]}>
                  {currentItem.nameAr}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
                    {currentItem.cuisine}
                  </Text>
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>·</Text>
                  <Text style={[styles.cardMetaText, { color: colors.primary }]}>
                    {currentItem.price}
                  </Text>
                  {currentItem.calories && (
                    <>
                      <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>·</Text>
                      <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
                        {currentItem.calories} cal
                      </Text>
                    </>
                  )}
                </View>
                <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
                  {currentItem.description}
                </Text>
              </View>
            </Animated.View>
          </>
        ) : null}
      </View>

      {/* Action Buttons */}
      {currentItem && (
        <View style={[styles.actionRow, { paddingBottom: bottomInset + 60 }]}>
          <Pressable
            style={[styles.actionBtn, styles.nopeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => swipe("left")}
          >
            <Feather name="x" size={28} color="#EF4444" />
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.likeBtn]} onPress={() => swipe("right")}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.likeGradient}
            >
              <Ionicons name="heart" size={28} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const CARD_WIDTH = 320;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  landingContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  landingTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  landingDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  categoryRow: { flexDirection: "row", gap: 10 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  catBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  startBtn: { width: "100%", borderRadius: 16, overflow: "hidden" },
  startBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  startBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  swipeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  swipeProgress: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  likesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  likesCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBehind: { transform: [{ scale: 0.95 }, { translateY: 10 }] },
  cardEmojiArea: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 90 },
  typeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  stamp: {
    position: "absolute",
    top: 30,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeStamp: {
    right: 20,
    borderColor: "#22C55E",
    transform: [{ rotate: "15deg" }],
  },
  likeStampText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#22C55E" },
  nopeStamp: {
    left: 20,
    borderColor: "#EF4444",
    transform: [{ rotate: "-15deg" }],
  },
  nopeStampText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#EF4444" },
  cardInfo: { padding: 20, gap: 6 },
  cardNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: 20, fontFamily: "Inter_700Bold", flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cardNameAr: { fontSize: 15, fontFamily: "Inter_400Regular" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cardMetaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingTop: 12,
  },
  actionBtn: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  nopeBtn: { borderWidth: 2 },
  likeBtn: { width: 72, height: 72, borderRadius: 36, overflow: "hidden" },
  likeGradient: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  // Done phase
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  matchEmoji: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  matchName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
  matchDetail: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  matchDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  matchRating: { fontSize: 13, fontFamily: "Inter_700Bold" },
  restartBar: { paddingHorizontal: 24 },
  restartBtn: { borderRadius: 16, overflow: "hidden" },
  restartBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  restartBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
