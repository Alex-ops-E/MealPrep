import { Feather, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

// ── Types ────────────────────────────────────────────────────────────────────

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

type Phase =
  | "landing"    // mode picker
  | "category"   // choose dish/restaurant/both
  | "hosting"    // created session, waiting for guest
  | "swiping"    // active swipe (solo or multiplayer)
  | "matched"    // 🎉 new match found
  | "done";      // all cards swiped

type Mode = "solo" | "multiplayer";
type Category = "dishes" | "restaurants" | "both";

// ── Items ────────────────────────────────────────────────────────────────────

const QATAR_ITEMS: SwipeItem[] = [
  { id: "qa1",  type: "dish",       name: "Machboos",           nameAr: "مجبوس",              emoji: "🍖", cuisine: "Qatari",         price: "QAR 55",   rating: 4.9, description: "Slow-spiced basmati rice with tender lamb & dried limes",          calories: 720 },
  { id: "qa2",  type: "dish",       name: "Margoog",             nameAr: "مرقوق",              emoji: "🫕", cuisine: "Qatari",         price: "QAR 50",   rating: 4.8, description: "Traditional lamb & vegetable stew with thin bread",               calories: 610 },
  { id: "qa3",  type: "dish",       name: "Biryani",             nameAr: "برياني",             emoji: "🍚", cuisine: "South Asian",    price: "QAR 45",   rating: 4.8, description: "Fragrant saffron rice with spiced chicken & caramelised onions", calories: 680 },
  { id: "qa4",  type: "dish",       name: "Shawarma",            nameAr: "شاورما",             emoji: "🌯", cuisine: "Lebanese",       price: "QAR 20",   rating: 4.7, description: "Marinated chicken or lamb, garlic sauce, fresh pickles",          calories: 560 },
  { id: "qa5",  type: "dish",       name: "Salmon Sushi",        nameAr: "سوشي السلمون",       emoji: "🍣", cuisine: "Japanese",       price: "QAR 90",   rating: 4.9, description: "Premium salmon rolls & nigiri with Japanese wasabi",              calories: 520 },
  { id: "qa6",  type: "dish",       name: "Smash Burger",        nameAr: "سماش برجر",          emoji: "🍔", cuisine: "American",       price: "QAR 55",   rating: 4.7, description: "Double smash patty, cheddar, caramelised onions, special sauce", calories: 950 },
  { id: "qa7",  type: "dish",       name: "Mezze Platter",       nameAr: "طبق مزة",            emoji: "🧆", cuisine: "Levantine",      price: "QAR 60",   rating: 4.7, description: "Hummus, falafel, tabbouleh, fattoush & warm khubz",              calories: 580 },
  { id: "qa8",  type: "dish",       name: "Chicken Tikka",       nameAr: "دجاج تيكا ماسالا",  emoji: "🍛", cuisine: "Indian",         price: "QAR 55",   rating: 4.8, description: "Tender chicken in rich tomato-cream sauce, basmati rice",          calories: 680 },
  { id: "qa9",  type: "dish",       name: "Wagyu Steak",         nameAr: "ستيك واغيو",         emoji: "🥩", cuisine: "Japanese",       price: "QAR 220",  rating: 5.0, description: "A5 wagyu, truffle butter, roasted asparagus",                    calories: 820 },
  { id: "qa10", type: "dish",       name: "Beef Tacos",          nameAr: "تاكو اللحم",         emoji: "🌮", cuisine: "Mexican",        price: "QAR 65",   rating: 4.6, description: "Slow-braised beef, fresh salsa, guacamole & jalapeños",           calories: 640 },
  { id: "qa11", type: "restaurant", name: "Nobu Doha",           nameAr: "نوبو الدوحة",        emoji: "🏯", cuisine: "Japanese-Peruvian", price: "QAR 400+", rating: 4.9, description: "World-famous fusion dining at Four Seasons Doha" },
  { id: "qa12", type: "restaurant", name: "Zuma Doha",           nameAr: "زوما الدوحة",        emoji: "🌿", cuisine: "Japanese",       price: "QAR 350+", rating: 4.8, description: "Contemporary izakaya at QIPCO Tower, stunning city views" },
  { id: "qa13", type: "restaurant", name: "IDAM by Ducasse",     nameAr: "إيدام",              emoji: "🎨", cuisine: "French-Moroccan", price: "QAR 500+", rating: 4.8, description: "Fine dining inside the Museum of Islamic Art" },
  { id: "qa14", type: "restaurant", name: "Al Mourjan",          nameAr: "المرجان",            emoji: "🌊", cuisine: "Seafood",        price: "QAR 300+", rating: 4.7, description: "Breathtaking harbour views at Fairmont Doha" },
  { id: "qa15", type: "restaurant", name: "Coya Doha",           nameAr: "كويا الدوحة",        emoji: "🌺", cuisine: "Peruvian",       price: "QAR 400+", rating: 4.8, description: "Vibrant Peruvian dining at Four Seasons Doha" },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function filterByCategory(cat: Category): SwipeItem[] {
  return shuffle(
    cat === "dishes"      ? QATAR_ITEMS.filter((i) => i.type === "dish") :
    cat === "restaurants" ? QATAR_ITEMS.filter((i) => i.type === "restaurant") :
    QATAR_ITEMS
  );
}

function generateUserId(): string {
  return "mobile_" + Math.random().toString(36).substring(2, 14);
}

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

// ── Component ────────────────────────────────────────────────────────────────

export default function SwipeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, isRTL, fontFamily } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // State
  const [phase, setPhase]               = useState<Phase>("landing");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [category, setCategory]         = useState<Category>("both");
  const [items, setItems]               = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes]               = useState<SwipeItem[]>([]);
  const [matches, setMatches]           = useState<SwipeItem[]>([]);
  const [newMatch, setNewMatch]         = useState<SwipeItem | null>(null);
  const [copied, setCopied]             = useState(false);
  const [guestJoined, setGuestJoined]   = useState(false);

  // Multiplayer session refs
  const sessionId   = useRef<string>("");
  const sessionCode = useRef<string>("");
  const userId      = useRef<string>(generateUserId());
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animation ────────────────────────────────────────────────────────────

  const pan = useRef(new Animated.ValueXY()).current;
  const cardRotation = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-12deg", "0deg", "12deg"] });
  const likeOpacity  = pan.x.interpolate({ inputRange: [0, 80],   outputRange: [0, 1], extrapolate: "clamp" });
  const nopeOpacity  = pan.x.interpolate({ inputRange: [-80, 0],  outputRange: [1, 0], extrapolate: "clamp" });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if      (g.dx >  80) swipe("right");
        else if (g.dx < -80) swipe("left");
        else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  ).current;

  // ── Polling ────────────────────────────────────────────────────────────────

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const pollSession = useCallback(async () => {
    if (!sessionId.current) return;
    try {
      const res  = await fetch(`${API_BASE}/api/dish-match/sessions/${sessionId.current}`);
      if (!res.ok) return;
      const data = await res.json();

      // Guest has joined — move from hosting → swiping
      if (data.guestJoined && !guestJoined) {
        setGuestJoined(true);
        stopPoll();
        setPhase("swiping");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // New match found while swiping
      if (phase === "swiping" && data.matches && data.matches.length > matches.length) {
        const matchedItems = items.filter((item) => data.matches.includes(item.id));
        const prevIds = new Set(matches.map((m) => m.id));
        const fresh   = matchedItems.find((m) => !prevIds.has(m.id));
        setMatches(matchedItems);
        if (fresh) { setNewMatch(fresh); stopPoll(); setPhase("matched"); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      }
    } catch {}
  }, [guestJoined, phase, items, matches, stopPoll]);

  useEffect(() => {
    if ((phase === "hosting" || phase === "swiping") && mode === "multiplayer") {
      stopPoll();
      pollRef.current = setInterval(pollSession, 2500);
    }
    return () => {};
  }, [phase, mode, pollSession, stopPoll]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startSolo = () => {
    setMode("solo");
    setItems(filterByCategory(category));
    setCurrentIndex(0);
    setLikes([]);
    pan.setValue({ x: 0, y: 0 });
    setPhase("swiping");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Record solo session
    fetch(`${API_BASE}/api/dish-match/solo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, source: "mobile-swipe" }),
    }).catch(() => {});
  };

  const hostSession = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/dish-match/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.current, category, source: "mobile-host" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      sessionId.current   = data.id;
      sessionCode.current = data.code;
      setItems(data.items);
      setCurrentIndex(0);
      setLikes([]);
      setMatches([]);
      setGuestJoined(false);
      setMode("multiplayer");
      pan.setValue({ x: 0, y: 0 });
      setPhase("hosting");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const shareCode = async () => {
    const webUrl = `${API_BASE}/en/dish-match?join=${sessionCode.current}`;
    const message = `Join my Dish Match session!\nCode: ${sessionCode.current}\nOr open: ${webUrl}`;
    try {
      if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
        // On native, use share sheet
        await Sharing.shareAsync(webUrl, { dialogTitle: "Join my Dish Match!", mimeType: "text/plain" });
      } else {
        await Clipboard.setStringAsync(webUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      await Clipboard.setStringAsync(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    Haptics.selectionAsync();
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(sessionCode.current);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Haptics.selectionAsync();
  };

  const swipe = async (direction: "left" | "right") => {
    const item = items[currentIndex];
    if (!item) return;
    Haptics.selectionAsync();

    Animated.timing(pan, { toValue: { x: direction === "right" ? 500 : -500, y: 0 }, duration: 250, useNativeDriver: false }).start(async () => {
      pan.setValue({ x: 0, y: 0 });

      if (direction === "right") {
        setLikes((prev) => [...prev, item]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Post swipe to server for multiplayer
      if (mode === "multiplayer" && sessionId.current) {
        try {
          const res  = await fetch(`${API_BASE}/api/dish-match/sessions/${sessionId.current}/swipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId.current, itemId: item.id, direction }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.matches && data.matches.length > matches.length) {
              const matchedItems = items.filter((i) => data.matches.includes(i.id));
              const prevIds = new Set(matches.map((m) => m.id));
              const fresh   = matchedItems.find((m) => !prevIds.has(m.id));
              setMatches(matchedItems);
              if (fresh) { setNewMatch(fresh); stopPoll(); setPhase("matched"); return; }
            }
          }
        } catch {}
      }

      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (next >= items.length) setPhase("done");
    });
  };

  const restart = () => {
    stopPoll();
    setPhase("landing");
    setLikes([]);
    setMatches([]);
    setNewMatch(null);
    setCurrentIndex(0);
    sessionId.current   = "";
    sessionCode.current = "";
  };

  const continueAfterMatch = () => {
    setPhase("swiping");
    pollRef.current = setInterval(pollSession, 2500);
  };

  const currentItem = items[currentIndex];
  const shareUrl    = `${API_BASE}/en/dish-match?join=${sessionCode.current}`;

  // ── Landing ───────────────────────────────────────────────────────────────

  if (phase === "landing") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>Dish Match</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
                {language === "ar" ? "امسح لتجد ما تشتهيه" : "Swipe to find what you're craving"}
              </Text>
            </View>
            <Pressable
              onPress={() => { toggleTheme(); Haptics.selectionAsync(); }}
              style={[styles.themeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather
                name={resolvedTheme === "dark" ? "sun" : "moon"}
                size={18}
                color={resolvedTheme === "dark" ? "#FBBF24" : colors.primary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.landingContent}>
          <LinearGradient colors={[colors.gradientStart + "33", colors.gradientEnd + "22"]} style={styles.heroIcon}>
            <Text style={{ fontSize: 64 }}>🍽️</Text>
          </LinearGradient>

          <Text style={[styles.landingTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {language === "ar" ? "ماذا تشتهي؟" : "What do you feel like?"}
          </Text>
          <Text style={[styles.landingDesc, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {language === "ar"
              ? "مرر يميناً على ما تحبه، يساراً للتخطي."
              : "Swipe right on dishes you love, left to skip."}
          </Text>

          {/* Category Selection */}
          <View style={[styles.categoryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {(["dishes", "restaurants", "both"] as Category[]).map((cat) => (
              <Pressable
                key={cat}
                onPress={() => { setCategory(cat); Haptics.selectionAsync(); }}
                style={[styles.catBtn, { backgroundColor: category === cat ? colors.primary : colors.card, borderColor: category === cat ? colors.primary : colors.border }]}
              >
                <Text style={[styles.catBtnText, { color: category === cat ? "#fff" : colors.mutedForeground, fontFamily: fontFamily() }]}>
                  {cat === "dishes" ? (language === "ar" ? "أطباق" : "Dishes") :
                   cat === "restaurants" ? (language === "ar" ? "مطاعم" : "Restaurants") :
                   (language === "ar" ? "الكل" : "Both")}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Solo */}
          <Pressable onPress={() => setPhase("category")} style={styles.fullWidthBtn}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradientBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="zap" size={20} color="#fff" />
              <Text style={[styles.gradientBtnText, { fontFamily: fontFamily("bold") }]}>
                {language === "ar" ? "ابدأ التمرير" : "Start Swiping"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Invite a Friend */}
          <Pressable
            onPress={() => setPhase("category")}
            onPressIn={() => setMode("multiplayer")}
            style={[styles.inviteBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }]}>
              <View style={[styles.inviteIconBox, { backgroundColor: colors.gradientStart + "22" }]}>
                <Ionicons name="people" size={22} color={colors.gradientStart} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inviteBtnTitle, { color: colors.foreground, fontFamily: fontFamily("bold"), textAlign: isRTL ? "right" : "left" }]}>
                  {language === "ar" ? "ادعُ صديقاً" : "Invite a Friend"}
                </Text>
                <Text style={[styles.inviteBtnSub, { color: colors.mutedForeground, fontFamily: fontFamily(), textAlign: isRTL ? "right" : "left" }]}>
                  {language === "ar" ? "أنت تلعب على الموبايل، صديقك على الويب" : "You on mobile · Friend joins via web"}
                </Text>
              </View>
              <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={colors.mutedForeground} />
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Category picker ───────────────────────────────────────────────────────

  if (phase === "category") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Pressable onPress={() => setPhase("landing")} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
            <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>{language === "ar" ? "رجوع" : "Back"}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {mode === "multiplayer" ? (language === "ar" ? "العب مع صديق" : "Play with a Friend") : (language === "ar" ? "ابدأ التمرير" : "Start Swiping")}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {language === "ar" ? "اختر الفئة" : "Choose a category"}
          </Text>
        </View>

        <View style={styles.landingContent}>
          <LinearGradient colors={[colors.gradientStart + "33", colors.gradientEnd + "22"]} style={styles.heroIcon}>
            <Text style={{ fontSize: 64 }}>{mode === "multiplayer" ? "👥" : "⚡"}</Text>
          </LinearGradient>

          {mode === "multiplayer" && (
            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
                {language === "ar"
                  ? "ستحصل على رمز لمشاركته مع صديقك. هو/هي ينضم عبر الويب."
                  : "You'll get a code to share. Your friend joins on the web."}
              </Text>
            </View>
          )}

          <View style={[styles.categoryRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {(["dishes", "restaurants", "both"] as Category[]).map((cat) => (
              <Pressable
                key={cat}
                onPress={() => { setCategory(cat); Haptics.selectionAsync(); }}
                style={[styles.catBtn, { backgroundColor: category === cat ? colors.primary : colors.card, borderColor: category === cat ? colors.primary : colors.border }]}
              >
                <Text style={[styles.catBtnText, { color: category === cat ? "#fff" : colors.mutedForeground, fontFamily: fontFamily() }]}>
                  {cat === "dishes" ? (language === "ar" ? "أطباق" : "Dishes") :
                   cat === "restaurants" ? (language === "ar" ? "مطاعم" : "Restaurants") :
                   (language === "ar" ? "الكل" : "Both")}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.fullWidthBtn} onPress={mode === "multiplayer" ? hostSession : startSolo}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradientBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name={mode === "multiplayer" ? "users" : "zap"} size={20} color="#fff" />
              <Text style={[styles.gradientBtnText, { fontFamily: fontFamily("bold") }]}>
                {mode === "multiplayer"
                  ? (language === "ar" ? "إنشاء الجلسة" : "Create Session")
                  : (language === "ar" ? "ابدأ التمرير" : "Start Swiping")}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Hosting (waiting for guest) ───────────────────────────────────────────

  if (phase === "hosting") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {language === "ar" ? "في انتظار صديقك" : "Waiting for Friend"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {language === "ar" ? "شارك الرمز أدناه" : "Share the code below"}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: bottomInset + 90, gap: 20 }}>

          {/* Animated waiting indicator */}
          <View style={[styles.waitingHero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={[colors.gradientStart + "22", colors.gradientEnd + "11"]} style={styles.waitingIconBox}>
              <Text style={{ fontSize: 56 }}>👥</Text>
            </LinearGradient>
            <Text style={[styles.waitingTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
              {language === "ar" ? "الجلسة جاهزة!" : "Session Ready!"}
            </Text>
            <Text style={[styles.waitingDesc, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
              {language === "ar"
                ? "شارك الرمز مع صديقك. بمجرد انضمامه، يبدأ التمرير تلقائياً."
                : "Share the code with your friend. Once they join, swiping starts automatically."}
            </Text>
          </View>

          {/* Code display */}
          <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.codeLabel, { color: colors.mutedForeground, fontFamily: fontFamily("bold") }]}>
              {language === "ar" ? "رمز الجلسة" : "SESSION CODE"}
            </Text>
            <View style={[styles.codeRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {sessionCode.current.split("").map((ch, i) => (
                <View key={i} style={[styles.codeChar, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.codeCharText, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>{ch}</Text>
                </View>
              ))}
            </View>
            <Pressable
              style={[styles.copyBtn, { backgroundColor: copied ? colors.accent + "22" : colors.muted, flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={copyCode}
            >
              <Feather name={copied ? "check" : "copy"} size={15} color={copied ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.copyBtnText, { color: copied ? colors.accent : colors.mutedForeground, fontFamily: fontFamily() }]}>
                {copied ? (language === "ar" ? "تم النسخ!" : "Copied!") : (language === "ar" ? "نسخ الرمز" : "Copy Code")}
              </Text>
            </Pressable>
          </View>

          {/* How friend joins */}
          <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.stepsTitle, { color: colors.mutedForeground, fontFamily: fontFamily("bold"), textAlign: isRTL ? "right" : "left" }]}>
              {language === "ar" ? "كيف ينضم صديقك" : "How your friend joins"}
            </Text>
            {[
              { en: `Open the Grocery Agent web app`, ar: `يفتح تطبيق الويب` },
              { en: `Go to Dish Match → "Join with Code"`, ar: `يذهب إلى Dish Match ← "انضم برمز"` },
              { en: `Enter code: ${sessionCode.current}`, ar: `يدخل الرمز: ${sessionCode.current}` },
            ].map((step, i) => (
              <View key={i} style={[styles.stepRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepNumText, { fontFamily: fontFamily("bold") }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.foreground, fontFamily: fontFamily(), textAlign: isRTL ? "right" : "left" }]}>
                  {language === "ar" ? step.ar : step.en}
                </Text>
              </View>
            ))}
          </View>

          {/* Share button */}
          <Pressable style={styles.fullWidthBtn} onPress={shareCode}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradientBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="share-2" size={20} color="#fff" />
              <Text style={[styles.gradientBtnText, { fontFamily: fontFamily("bold") }]}>
                {language === "ar" ? "مشاركة رابط الانضمام" : "Share Join Link"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Web link preview */}
          <View style={[styles.linkPreview, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="globe" size={14} color={colors.mutedForeground} />
            <Text style={[styles.linkPreviewText, { color: colors.mutedForeground, fontFamily: fontFamily() }]} numberOfLines={1}>
              {shareUrl}
            </Text>
          </View>

          {/* Cancel */}
          <Pressable onPress={restart} style={[styles.cancelBtn, { borderColor: colors.border }]}>
            <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Match celebration ─────────────────────────────────────────────────────

  if (phase === "matched" && newMatch) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <LinearGradient colors={[colors.gradientStart + "33", colors.gradientEnd + "22"]} style={styles.matchHeroBox}>
            <Text style={{ fontSize: 72 }}>{newMatch.emoji}</Text>
          </LinearGradient>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
          <Text style={[styles.matchTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {language === "ar" ? "تطابق!" : "It's a Match!"}
          </Text>
          <Text style={[styles.matchName, { color: colors.primary, fontFamily: fontFamily("bold") }]}>{newMatch.name}</Text>
          <Text style={[styles.matchDetail, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {newMatch.cuisine} · {newMatch.price}
          </Text>
          <Text style={[styles.matchDesc, { color: colors.mutedForeground, fontFamily: fontFamily() }]} numberOfLines={2}>
            {newMatch.description}
          </Text>

          <View style={[styles.matchActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Pressable style={[styles.matchSecondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={continueAfterMatch}>
              <Text style={[{ color: colors.foreground, fontFamily: fontFamily("bold"), fontSize: 14 }]}>
                {language === "ar" ? "تابع التمرير" : "Keep Swiping"}
              </Text>
            </Pressable>
            <Pressable style={styles.matchPrimaryBtnWrap} onPress={restart}>
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.matchPrimaryBtn}>
                <Text style={[{ color: "#fff", fontFamily: fontFamily("bold"), fontSize: 14 }]}>
                  {language === "ar" ? "تمرير جديد" : "New Game"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  if (phase === "done") {
    const picks = mode === "multiplayer" ? matches : likes;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {mode === "multiplayer" ? (language === "ar" ? "التطابقات" : "Your Matches") : (language === "ar" ? "اختياراتك" : "Your Picks")}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {picks.length} {picks.length === 1 ? (language === "ar" ? "نتيجة" : "result") : (language === "ar" ? "نتائج" : "results")}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 90, gap: 12 }}>
          {picks.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="meh" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
                {language === "ar" ? "لا تطابقات هذه المرة" : "No picks this time"}
              </Text>
            </View>
          ) : (
            picks.map((item) => (
              <View key={item.id} style={[styles.matchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.matchEmoji, { backgroundColor: colors.muted }]}>
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.matchCardName, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>{item.name}</Text>
                  <Text style={[styles.matchCardNameAr, { color: colors.mutedForeground, fontFamily: "NotoSansArabic_400Regular" }]}>{item.nameAr}</Text>
                  <Text style={[styles.matchCardDetail, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
                    {item.cuisine} · {item.price}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="star" size={13} color="#FBBF24" />
                    <Text style={[{ color: "#FBBF24", fontSize: 12, fontFamily: fontFamily("bold") }]}>{item.rating}</Text>
                  </View>
                  {mode === "multiplayer" && (
                    <View style={[styles.matchBadge, { backgroundColor: colors.gradientStart + "22" }]}>
                      <Text style={[{ color: colors.gradientStart, fontSize: 10, fontFamily: fontFamily("bold") }]}>
                        {language === "ar" ? "تطابق!" : "Match!"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={[styles.restartBar, { paddingBottom: bottomInset + 60 }]}>
          <Pressable onPress={restart} style={styles.fullWidthBtn}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradientBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={[styles.gradientBtnText, { fontFamily: fontFamily("bold") }]}>
                {language === "ar" ? "تمرير جديد" : "Swipe Again"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Swiping ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.swipeHeader, { paddingTop: topInset + 12, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Pressable onPress={restart}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </Pressable>

        <View style={{ alignItems: "center" }}>
          <Text style={[styles.swipeProgress, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {currentIndex + 1} / {items.length}
          </Text>
          {mode === "multiplayer" && (
            <View style={[styles.multiplayerBadge, { backgroundColor: colors.gradientStart + "22" }]}>
              <Ionicons name="people" size={11} color={colors.gradientStart} />
              <Text style={[{ color: colors.gradientStart, fontSize: 10, fontFamily: fontFamily("bold") }]}>
                {language === "ar" ? "متعدد اللاعبين" : "Multiplayer"}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.likesBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="heart" size={14} color={colors.primary} />
          <Text style={[styles.likesCount, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {mode === "multiplayer" ? matches.length : likes.length}
          </Text>
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.cardArea}>
        {currentItem ? (
          <>
            {items[currentIndex + 1] && (
              <View style={[styles.card, styles.cardBehind, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardEmojiArea, { backgroundColor: colors.muted }]}>
                  <Text style={styles.cardEmoji}>{items[currentIndex + 1].emoji}</Text>
                </View>
              </View>
            )}

            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: cardRotation }] }]}
            >
              <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                <Text style={styles.likeStampText}>{language === "ar" ? "أحب" : "LIKE"}</Text>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
                <Text style={styles.nopeStampText}>{language === "ar" ? "لا" : "NOPE"}</Text>
              </Animated.View>

              <LinearGradient colors={[colors.gradientStart + "22", colors.gradientEnd + "11"]} style={styles.cardEmojiArea}>
                <Text style={styles.cardEmoji}>{currentItem.emoji}</Text>
                <View style={[styles.typeBadge, { backgroundColor: colors.card + "CC" }]}>
                  <Text style={[styles.typeText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
                    {currentItem.type === "restaurant"
                      ? (language === "ar" ? "مطعم" : "Restaurant")
                      : (language === "ar" ? "طبق" : "Dish")}
                  </Text>
                </View>
              </LinearGradient>

              <View style={styles.cardInfo}>
                <View style={[styles.cardNameRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[styles.cardName, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>{currentItem.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={[styles.ratingText, { color: "#FBBF24", fontFamily: fontFamily("bold") }]}>{currentItem.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.cardNameAr, { color: colors.mutedForeground, fontFamily: "NotoSansArabic_400Regular" }]}>
                  {currentItem.nameAr}
                </Text>
                <View style={[styles.cardMeta, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>{currentItem.cuisine}</Text>
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>·</Text>
                  <Text style={[styles.cardMetaText, { color: colors.primary, fontFamily: fontFamily() }]}>{currentItem.price}</Text>
                  {currentItem.calories && (
                    <>
                      <Text style={[styles.cardMetaText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>·</Text>
                      <Text style={[styles.cardMetaText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>{currentItem.calories} cal</Text>
                    </>
                  )}
                </View>
                <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: fontFamily() }]} numberOfLines={3}>
                  {currentItem.description}
                </Text>
              </View>
            </Animated.View>
          </>
        ) : null}
      </View>

      {/* Action buttons */}
      {currentItem && (
        <View style={[styles.actionRow, { paddingBottom: bottomInset + 60 }]}>
          <Pressable style={[styles.actionBtn, styles.nopeBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => swipe("left")}>
            <Feather name="x" size={28} color="#EF4444" />
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.likeBtn]} onPress={() => swipe("right")}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.likeGradient}>
              <Ionicons name="heart" size={28} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_WIDTH = 320;

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerTitle:      { fontSize: 26, marginBottom: 4 },
  headerSub:        { fontSize: 14 },
  themeToggle:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backText:         { fontSize: 14 },
  landingContent:   { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  heroIcon:         { width: 120, height: 120, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  landingTitle:     { fontSize: 24, textAlign: "center" },
  landingDesc:      { fontSize: 14, textAlign: "center", lineHeight: 20 },
  categoryRow:      { gap: 10 },
  catBtn:           { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  catBtnText:       { fontSize: 13 },
  fullWidthBtn:     { width: "100%", borderRadius: 16, overflow: "hidden" },
  gradientBtn:      { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  gradientBtnText:  { color: "#fff", fontSize: 17 },
  inviteBtn:        { width: "100%", padding: 16, borderRadius: 20, borderWidth: 1 },
  inviteIconBox:    { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  inviteBtnTitle:   { fontSize: 15 },
  inviteBtnSub:     { fontSize: 12, marginTop: 2 },
  infoBox:          { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, width: "100%" },
  infoText:         { flex: 1, fontSize: 13, lineHeight: 18 },

  // Hosting
  waitingHero:      { alignItems: "center", padding: 24, borderRadius: 20, borderWidth: 1, gap: 12 },
  waitingIconBox:   { width: 100, height: 100, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  waitingTitle:     { fontSize: 20, textAlign: "center" },
  waitingDesc:      { fontSize: 13, textAlign: "center", lineHeight: 19 },
  codeCard:         { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: "center", gap: 16 },
  codeLabel:        { fontSize: 11, letterSpacing: 2 },
  codeRow:          { gap: 8 },
  codeChar:         { width: 44, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  codeCharText:     { fontSize: 26, letterSpacing: 1 },
  copyBtn:          { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  copyBtnText:      { fontSize: 13 },
  stepsCard:        { padding: 20, borderRadius: 20, borderWidth: 1, gap: 14 },
  stepsTitle:       { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  stepRow:          { alignItems: "center", gap: 12 },
  stepNum:          { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepNumText:      { color: "#fff", fontSize: 12 },
  stepText:         { flex: 1, fontSize: 13, lineHeight: 18 },
  linkPreview:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  linkPreviewText:  { flex: 1, fontSize: 11 },
  cancelBtn:        { alignItems: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  cancelBtnText:    { fontSize: 14 },

  // Match celebration
  matchHeroBox:     { width: 140, height: 140, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  matchTitle:       { fontSize: 32, marginBottom: 4 },
  matchName:        { fontSize: 22, marginBottom: 4, textAlign: "center" },
  matchDetail:      { fontSize: 14, marginBottom: 8 },
  matchDesc:        { fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 24 },
  matchActions:     { gap: 12, width: "100%" },
  matchSecondaryBtn:{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  matchPrimaryBtnWrap: { flex: 1, borderRadius: 14, overflow: "hidden" },
  matchPrimaryBtn:  { alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  matchBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  // Done
  matchCard:        { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, gap: 14 },
  matchEmoji:       { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  matchCardName:    { fontSize: 15, marginBottom: 1 },
  matchCardNameAr:  { fontSize: 13, marginBottom: 2 },
  matchCardDetail:  { fontSize: 12 },
  emptyState:       { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText:        { fontSize: 15 },
  restartBar:       { paddingHorizontal: 20, paddingTop: 12 },

  // Swiping
  swipeHeader:      { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 12 },
  swipeProgress:    { fontSize: 14 },
  multiplayerBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  likesBadge:       { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  likesCount:       { fontSize: 14 },
  cardArea:         { flex: 1, alignItems: "center", justifyContent: "center" },
  card:             { position: "absolute", width: CARD_WIDTH, borderRadius: 24, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  cardBehind:       { transform: [{ scale: 0.95 }, { translateY: 10 }] },
  cardEmojiArea:    { height: 220, alignItems: "center", justifyContent: "center" },
  cardEmoji:        { fontSize: 90 },
  typeBadge:        { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeText:         { fontSize: 11 },
  stamp:            { position: "absolute", top: 30, zIndex: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 3 },
  likeStamp:        { right: 20, borderColor: "#22C55E", transform: [{ rotate: "15deg" }] },
  likeStampText:    { fontSize: 28, color: "#22C55E" },
  nopeStamp:        { left: 20, borderColor: "#EF4444", transform: [{ rotate: "-15deg" }] },
  nopeStampText:    { fontSize: 28, color: "#EF4444" },
  cardInfo:         { padding: 20, gap: 6 },
  cardNameRow:      { justifyContent: "space-between", alignItems: "center" },
  cardName:         { fontSize: 20, flex: 1 },
  ratingText:       { fontSize: 14 },
  cardNameAr:       { fontSize: 15 },
  cardMeta:         { alignItems: "center", gap: 6, flexWrap: "wrap" },
  cardMetaText:     { fontSize: 13 },
  cardDesc:         { fontSize: 13, lineHeight: 19 },
  actionRow:        { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24, paddingTop: 12 },
  actionBtn:        { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  nopeBtn:          { borderWidth: 2 },
  likeBtn:          { overflow: "hidden" },
  likeGradient:     { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
});
