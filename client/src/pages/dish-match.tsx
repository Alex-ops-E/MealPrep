import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Heart, X, Users, Share2, ChefHat, RefreshCw, Utensils, Star, Flame, Zap } from "lucide-react";
import Header from "@/components/header";

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
  descriptionAr: string;
  calories?: number;
}

type Phase = "landing" | "setup" | "creating" | "waiting" | "joining" | "swiping" | "matched" | "done";
type Category = "dishes" | "restaurants" | "both";

function generateUserId() {
  return "user_" + Math.random().toString(36).substring(2, 18);
}

const BG_EMOJIS = ["🍕","🍣","🍔","🌮","🍜","🥗","🍛","🥩","🍱","🧆","🥘","🍝","🌯","🍗","🥟"];

interface DishMatchProps {
  initialPhase?: Phase;
  initialSolo?: boolean;
}

export default function DishMatch({ initialPhase = "landing", initialSolo = false }: DishMatchProps) {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isRTL = language === "ar";

  const userId = useRef(generateUserId());
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [sessionId, setSessionId] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mySwipes, setMySwipes] = useState<Record<string, "left" | "right">>({});
  const [matches, setMatches] = useState<SwipeItem[]>([]);
  const [newMatch, setNewMatch] = useState<SwipeItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [guestJoined, setGuestJoined] = useState(false);
  const [category, setCategory] = useState<Category>("both");
  const [isSolo, setIsSolo] = useState(initialSolo);
  const [soloLikes, setSoloLikes] = useState<SwipeItem[]>([]);

  // Drag state
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const isDragging = useRef(false);
  const [dragDelta, setDragDelta] = useState(0);

  const lang = (en: string, ar: string) => language === "ar" ? ar : en;

  // Polling
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const pollSession = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/dish-match/sessions/${sid}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.guestJoined && !guestJoined) {
        setGuestJoined(true);
        setPhase("swiping");
        stopPoll();
      }
      if (data.matches && data.matches.length > 0) {
        const matchedItems = items.filter(item => data.matches.includes(item.id));
        setMatches(matchedItems);
        const prevMatchIds = new Set(matches.map(m => m.id));
        const newMatchItem = matchedItems.find(m => !prevMatchIds.has(m.id));
        if (newMatchItem) {
          setNewMatch(newMatchItem);
          stopPoll();
          setPhase("matched");
        }
      }
    } catch {}
  }, [guestJoined, items, matches]);

  useEffect(() => { return () => stopPoll(); }, []);

  useEffect(() => {
    if ((phase === "waiting" || phase === "swiping") && sessionId && !isSolo) {
      stopPoll();
      pollRef.current = setInterval(() => pollSession(sessionId), 2000);
    }
    return () => {};
  }, [phase, sessionId, pollSession, isSolo]);

  // Local SWIPE_ITEMS mirror (for solo mode without a server call)
  const LOCAL_ITEMS: SwipeItem[] = [
    { id: "1", type: "dish", name: "Margherita Pizza", nameAr: "بيتزا مارغريتا", emoji: "🍕", cuisine: "Italian", price: "AED 45", rating: 4.8, description: "Classic tomato, mozzarella & fresh basil", descriptionAr: "طماطم كلاسيكية وموزاريلا وريحان طازج", calories: 780 },
    { id: "2", type: "dish", name: "Salmon Sushi Platter", nameAr: "طبق سوشي السلمون", emoji: "🍣", cuisine: "Japanese", price: "AED 85", rating: 4.9, description: "Premium salmon rolls & nigiri", descriptionAr: "رولات نيغيري وسوشي سلمون فاخر", calories: 520 },
    { id: "3", type: "dish", name: "Smash Burger", nameAr: "سماش برجر", emoji: "🍔", cuisine: "American", price: "AED 55", rating: 4.7, description: "Double smash patty, cheese, caramelised onions", descriptionAr: "باتي مزدوج مع جبن وبصل مكرمل", calories: 950 },
    { id: "4", type: "dish", name: "Lamb Tacos", nameAr: "تاكو لحم الضأن", emoji: "🌮", cuisine: "Mexican", price: "AED 65", rating: 4.6, description: "Slow-braised lamb, pickled jalapeños, avocado", descriptionAr: "لحم ضأن مطهي ببطء مع فلفل حار مخلل وأفوكادو", calories: 640 },
    { id: "5", type: "dish", name: "Ramen Bowl", nameAr: "رامن", emoji: "🍜", cuisine: "Japanese", price: "AED 70", rating: 4.8, description: "Rich tonkotsu broth, chashu pork, soft egg", descriptionAr: "مرق تونكوتسو غني مع لحم خنزير وبيضة ناعمة", calories: 720 },
    { id: "6", type: "dish", name: "Mezze Platter", nameAr: "طبق مزة", emoji: "🧆", cuisine: "Levantine", price: "AED 60", rating: 4.7, description: "Hummus, falafel, tabbouleh & warm pita", descriptionAr: "حمص وفلافل وتبولة وخبز بيتا دافئ", calories: 580 },
    { id: "7", type: "dish", name: "Chicken Tikka Masala", nameAr: "دجاج تيكا ماسالا", emoji: "🍛", cuisine: "Indian", price: "AED 55", rating: 4.8, description: "Tender chicken in creamy tomato-spice sauce", descriptionAr: "دجاج طري في صلصة طماطم كريمية بالتوابل", calories: 680 },
    { id: "8", type: "dish", name: "Wagyu Steak", nameAr: "ستيك واغيو", emoji: "🥩", cuisine: "Japanese", price: "AED 220", rating: 5.0, description: "A5 wagyu, truffle butter, asparagus", descriptionAr: "واغيو A5 مع زبدة الكمأة والهليون", calories: 820 },
    { id: "9", type: "dish", name: "Bento Box", nameAr: "صندوق بينتو", emoji: "🍱", cuisine: "Japanese", price: "AED 75", rating: 4.6, description: "Rice, teriyaki, gyoza, edamame, miso", descriptionAr: "أرز وتيرياكي وغيوزا وإيدامامي وميسو", calories: 660 },
    { id: "10", type: "dish", name: "Spaghetti Carbonara", nameAr: "سباغيتي كاربونارا", emoji: "🍝", cuisine: "Italian", price: "AED 65", rating: 4.7, description: "Eggs, pecorino, guanciale, black pepper", descriptionAr: "بيض وبيكورينو ولحم خنزير وفلفل أسود", calories: 790 },
    { id: "11", type: "restaurant", name: "Nobu Dubai", nameAr: "نوبو دبي", emoji: "🏯", cuisine: "Japanese-Peruvian", price: "AED 400+", rating: 4.9, description: "World-famous fusion dining in Atlantis", descriptionAr: "مطعم عالمي الشهرة في فندق أتلانتس", calories: undefined },
    { id: "12", type: "restaurant", name: "Zuma Dubai", nameAr: "زوما دبي", emoji: "🌿", cuisine: "Japanese", price: "AED 350+", rating: 4.8, description: "Contemporary izakaya, DIFC skyline views", descriptionAr: "إيزاكايا عصرية مع إطلالات على مجمع DIFC", calories: undefined },
    { id: "13", type: "restaurant", name: "Nusr-Et (Salt Bae)", nameAr: "نوسرت", emoji: "🧂", cuisine: "Turkish Steakhouse", price: "AED 500+", rating: 4.6, description: "The iconic salt-sprinkle steakhouse experience", descriptionAr: "تجربة المطعم الأيقونية مع رش الملح", calories: undefined },
    { id: "14", type: "restaurant", name: "Pierchic", nameAr: "بيرشيك", emoji: "🌊", cuisine: "Seafood", price: "AED 450+", rating: 4.8, description: "Over-water seafood restaurant, Madinat views", descriptionAr: "مطعم مأكولات بحرية فوق الماء مع إطلالات مدينة جميرا", calories: undefined },
    { id: "15", type: "restaurant", name: "Ossiano", nameAr: "أوسيانو", emoji: "🐠", cuisine: "Fine Dining", price: "AED 600+", rating: 4.9, description: "Underwater dining beside the Ambassador Lagoon", descriptionAr: "تناول الطعام تحت الماء بجانب بحيرة السفير", calories: undefined },
  ];

  function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  const startSolo = async () => {
    const filtered = category === "dishes"
      ? LOCAL_ITEMS.filter(i => i.type === "dish")
      : category === "restaurants"
      ? LOCAL_ITEMS.filter(i => i.type === "restaurant")
      : LOCAL_ITEMS;
    setItems(shuffle(filtered));
    setCurrentIndex(0);
    setSoloLikes([]);
    setMySwipes({});
    setIsSolo(true);
    setPhase("swiping");
    // Record solo session in DB (fire and forget)
    try {
      await apiRequest("POST", "/api/dish-match/solo", { category });
    } catch {}
  };

  const startSession = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/dish-match/sessions", { userId: userId.current, category });
      const data = await res.json();
      setSessionId(data.id);
      setSessionCode(data.code);
      setItems(data.items);
      setCurrentIndex(0);
      setIsSolo(false);
      setPhase("waiting");
    } catch {
      toast({ title: lang("Error", "خطأ"), description: lang("Failed to create session", "فشل إنشاء الجلسة"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async () => {
    if (!joinCode.trim()) return;
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/dish-match/sessions/join", { code: joinCode.trim().toUpperCase(), userId: userId.current });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      setSessionId(data.id);
      setSessionCode(data.code);
      setItems(data.items);
      setCurrentIndex(0);
      setGuestJoined(true);
      setIsSolo(false);
      setPhase("swiping");
    } catch (e: any) {
      toast({ title: lang("Invalid Code", "رمز غير صالح"), description: e.message || lang("Session not found", "الجلسة غير موجودة"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const swipe = async (direction: "left" | "right") => {
    if (currentIndex >= items.length) return;
    const item = items[currentIndex];
    setMySwipes(prev => ({ ...prev, [item.id]: direction }));

    if (isSolo) {
      if (direction === "right") setSoloLikes(prev => [...prev, item]);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setDragDelta(0);
      if (nextIndex >= items.length) setPhase("done");
      return;
    }

    try {
      const res = await apiRequest("POST", `/api/dish-match/sessions/${sessionId}/swipe`, {
        userId: userId.current, itemId: item.id, direction
      });
      const data = await res.json();
      if (data.matches && data.matches.length > matches.length) {
        const matchedItems = items.filter(i => data.matches.includes(i.id));
        const prevMatchIds = new Set(matches.map(m => m.id));
        const newMatchItem = matchedItems.find(m => !prevMatchIds.has(m.id));
        setMatches(matchedItems);
        if (newMatchItem) { setNewMatch(newMatchItem); stopPoll(); setPhase("matched"); return; }
      }
    } catch {}

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setDragDelta(0);
    if (nextIndex >= items.length) setPhase("done");
  };

  const onDragStart = (clientX: number) => { isDragging.current = true; dragStartX.current = clientX; dragCurrentX.current = clientX; };
  const onDragMove = (clientX: number) => { if (!isDragging.current) return; dragCurrentX.current = clientX; setDragDelta(clientX - dragStartX.current); };
  const onDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = dragCurrentX.current - dragStartX.current;
    if (delta > 80) swipe("right");
    else if (delta < -80) swipe("left");
    else setDragDelta(0);
  };

  const shareCode = () => {
    const url = `${window.location.origin}/${language}/dish-match?join=${sessionCode}`;
    if (navigator.share) {
      navigator.share({ title: lang("Join my Dish Match!", "انضم لمطابقة الأطباق!"), url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: lang("Link copied!", "تم نسخ الرابط!"), description: lang("Share it with your partner", "شاركه مع شريكك") });
    }
  };

  const currentItem = items[currentIndex];
  const rotation = dragDelta * 0.08;
  const likeOpacity = Math.min(dragDelta / 80, 1);
  const nopeOpacity = Math.min(-dragDelta / 80, 1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get("join");
    if (joinParam) setJoinCode(joinParam);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-950 ${isRTL ? "rtl" : "ltr"}`}>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
          50%  { opacity: 0.22; }
          100% { transform: translateY(-120px) rotate(15deg); opacity: 0; }
        }
        @keyframes floatSway {
          0%,100% { transform: translateY(0px) translateX(0px) rotate(-5deg); }
          33%     { transform: translateY(-18px) translateX(8px) rotate(5deg); }
          66%     { transform: translateY(-8px) translateX(-6px) rotate(-3deg); }
        }
        .float-emoji { animation: floatSway var(--dur, 6s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
      `}</style>

      <Header />

      {/* ── Landing ───────────────────────────────────────────────────────── */}
      {phase === "landing" && (
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center overflow-hidden">

          {/* Gradient glow blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-orange-600/20 blur-[120px]" />
            <div className="absolute bottom-[-60px] left-1/4 w-[350px] h-[350px] rounded-full bg-pink-600/15 blur-[100px]" />
            <div className="absolute top-1/3 right-[-80px] w-[280px] h-[280px] rounded-full bg-amber-500/15 blur-[90px]" />
          </div>

          {/* Floating food emojis */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            {BG_EMOJIS.map((em, i) => (
              <span
                key={i}
                className="float-emoji absolute text-4xl"
                style={{
                  left: `${(i * 7 + 3) % 95}%`,
                  top: `${(i * 13 + 5) % 85}%`,
                  "--dur": `${5 + (i % 5)}s`,
                  "--delay": `${(i * 0.4) % 4}s`,
                } as any}
              >
                {em}
              </span>
            ))}
          </div>

          {/* Hero content */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-4xl mb-6 shadow-2xl shadow-orange-500/40">
              🍽️
            </div>

            <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                {lang("Dish Match", "مطابقة الأطباق")}
              </span>
            </h1>

            <p className="text-gray-400 mb-10 max-w-sm text-sm leading-relaxed">
              {lang(
                "Swipe on food you love. Find what you and your partner both crave.",
                "مرر على الطعام الذي تحبه. اكتشف ما تشتهيه أنت وشريكك معاً."
              )}
            </p>

            <div className="space-y-3 w-full max-w-xs">
              {/* Solo */}
              <button
                onClick={() => { setIsSolo(true); setPhase("setup"); }}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                data-testid="button-play-solo"
              >
                <Zap className="h-5 w-5" />
                {lang("Start Swipe", "ابدأ التمرير")}
              </button>

              {/* Invite a friend */}
              <button
                onClick={() => { setIsSolo(false); setPhase("setup"); }}
                className="w-full h-14 rounded-2xl bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-orange-500/50 text-white font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                data-testid="button-start-session"
              >
                <Users className="h-5 w-5 text-orange-400" />
                {lang("Invite a Friend", "ادعُ صديقاً")}
              </button>

              {/* Join */}
              <button
                onClick={() => setPhase("joining")}
                className="w-full h-12 rounded-2xl bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
                data-testid="button-join-session"
              >
                {lang("Join with Code", "انضم برمز")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Setup — choose category ───────────────────────────────────────── */}
      {phase === "setup" && (
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full bg-orange-600/15 blur-[100px]" />
          </div>

          <div className="relative z-10 w-full max-w-xs">
            <h2 className="text-2xl font-bold text-white mb-1">
              {lang("What are you deciding?", "ماذا تريد أن تختار؟")}
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              {isSolo
                ? lang("Pick a category and start swiping", "اختر فئة وابدأ التمرير")
                : lang("Both of you will swipe the same selection", "ستمرران على نفس الاختيارات")}
            </p>

            <div className="space-y-3 mb-8">
              {([
                { id: "dishes",      emoji: "🍽️", labelEn: "Dishes",       labelAr: "أطباق",       descEn: "Meals & individual dishes",      descAr: "وجبات وأطباق فردية" },
                { id: "restaurants", emoji: "🏪", labelEn: "Restaurants",  labelAr: "مطاعم",       descEn: "Places to dine at",              descAr: "أماكن لتناول الطعام" },
                { id: "both",        emoji: "🎲", labelEn: "Mix of Both",  labelAr: "كلاهما معاً", descEn: "Dishes and restaurants combined", descAr: "أطباق ومطاعم معاً" },
              ] as const).map(opt => {
                const selected = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setCategory(opt.id)}
                    className={`w-full flex items-center gap-4 rounded-2xl p-4 border-2 text-left transition-all ${selected ? "border-orange-500 bg-orange-500/10" : "border-gray-700 bg-gray-800/80 hover:border-gray-600"}`}
                    data-testid={`button-category-${opt.id}`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${selected ? "text-orange-400" : "text-white"}`}>
                        {language === "ar" ? opt.labelAr : opt.labelEn}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {language === "ar" ? opt.descAr : opt.descEn}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "border-orange-500 bg-orange-500" : "border-gray-600"}`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={isSolo ? startSolo : startSession}
              disabled={isLoading}
              className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-60"
              data-testid="button-confirm-setup"
            >
              {isLoading
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : isSolo
                  ? lang("Start Swipe", "ابدأ التمرير")
                  : lang("Create Session →", "إنشاء الجلسة →")}
            </button>

            <button onClick={() => setPhase("landing")} className="mt-6 text-gray-600 text-xs hover:text-gray-400">
              {lang("← Back", "← رجوع")}
            </button>
          </div>
        </div>
      )}

      {/* ── Waiting for guest ─────────────────────────────────────────────── */}
      {phase === "waiting" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          <div className="text-5xl mb-6">👋</div>
          <h2 className="text-2xl font-bold text-white mb-2">{lang("Share this code", "شارك هذا الرمز")}</h2>
          <p className="text-gray-400 mb-8 text-sm">{lang("Send it to your partner so they can join", "أرسله لشريكك لينضم إليك")}</p>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl px-8 py-6 mb-6 shadow-xl">
            <div className="text-5xl font-bold text-white tracking-[0.3em] font-mono" data-testid="text-session-code">{sessionCode}</div>
          </div>

          <Button onClick={shareCode} className="mb-8 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 px-6" data-testid="button-share-code">
            <Share2 className="h-4 w-4 mr-2" />
            {lang("Share Link", "شارك الرابط")}
          </Button>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {lang("Waiting for your partner to join...", "في انتظار انضمام شريكك...")}
          </div>

          <button onClick={() => setPhase("landing")} className="mt-8 text-gray-600 text-xs hover:text-gray-400">{lang("← Back", "← رجوع")}</button>
        </div>
      )}

      {/* ── Join with code ────────────────────────────────────────────────── */}
      {phase === "joining" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          <div className="text-5xl mb-6">🔑</div>
          <h2 className="text-2xl font-bold text-white mb-2">{lang("Enter the Code", "أدخل الرمز")}</h2>
          <p className="text-gray-400 mb-8 text-sm">{lang("Ask your partner for their 6-character code", "اطلب من شريكك الرمز المكوّن من 6 أحرف")}</p>

          <div className="w-full max-w-xs space-y-3">
            <Input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="h-14 text-center text-2xl font-mono tracking-[0.3em] bg-gray-800 border-gray-600 text-white placeholder:text-gray-600 rounded-xl"
              maxLength={6}
              data-testid="input-join-code"
            />
            <Button
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
              onClick={joinSession}
              disabled={isLoading || joinCode.length < 4}
              data-testid="button-join-confirm"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : lang("Join Session", "انضم للجلسة")}
            </Button>
          </div>

          <button onClick={() => setPhase("landing")} className="mt-8 text-gray-600 text-xs hover:text-gray-400">{lang("← Back", "← رجوع")}</button>
        </div>
      )}

      {/* ── Swiping ───────────────────────────────────────────────────────── */}
      {phase === "swiping" && currentItem && (
        <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 pt-4 pb-6 select-none">
          {/* Progress */}
          <div className="w-full max-w-sm mb-4">
            <div className="flex justify-between text-gray-500 text-xs mb-1">
              <span>{currentIndex} {lang("swiped", "تم")}</span>
              <span>{items.length - currentIndex} {lang("left", "متبقية")}</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all" style={{ width: `${(currentIndex / items.length) * 100}%` }} />
            </div>
          </div>

          {/* Card stack */}
          <div className="relative w-full max-w-sm flex-1 flex items-center justify-center">
            {items[currentIndex + 1] && (
              <div className="absolute inset-x-4 top-2 h-full rounded-3xl bg-gray-800 border border-gray-700 scale-95 opacity-40" />
            )}

            <div
              ref={cardRef}
              className="absolute inset-x-0 rounded-3xl bg-gray-800 border border-gray-700 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
              style={{ transform: `translateX(${dragDelta}px) rotate(${rotation}deg)`, transition: isDragging.current ? "none" : "transform 0.3s ease", touchAction: "none" }}
              onMouseDown={e => onDragStart(e.clientX)}
              onMouseMove={e => onDragMove(e.clientX)}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={e => onDragStart(e.touches[0].clientX)}
              onTouchMove={e => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
              data-testid="card-swipe"
            >
              {/* Like overlay */}
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10 pointer-events-none rounded-3xl" style={{ opacity: likeOpacity }}>
                <div className="border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-15deg]">
                  <span className="text-green-400 font-black text-2xl tracking-widest">LIKE</span>
                </div>
              </div>
              {/* Nope overlay */}
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-10 pointer-events-none rounded-3xl" style={{ opacity: nopeOpacity }}>
                <div className="border-4 border-red-400 rounded-xl px-4 py-2 rotate-[15deg]">
                  <span className="text-red-400 font-black text-2xl tracking-widest">NOPE</span>
                </div>
              </div>

              {/* Type badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentItem.type === "dish" ? "bg-orange-500/80 text-white" : "bg-purple-500/80 text-white"}`}>
                  {currentItem.type === "dish" ? lang("DISH", "طبق") : lang("RESTAURANT", "مطعم")}
                </span>
              </div>

              {/* Emoji hero */}
              <div className="flex items-center justify-center h-56 bg-gradient-to-b from-gray-700/60 to-gray-800">
                <span className="text-9xl drop-shadow-2xl">{currentItem.emoji}</span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-xl font-bold text-white" data-testid="text-card-name">
                    {language === "ar" ? currentItem.nameAr : currentItem.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-gray-700 px-2 py-0.5 rounded-lg flex-shrink-0">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-semibold">{currentItem.rating}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-3 leading-relaxed">{language === "ar" ? currentItem.descriptionAr : currentItem.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full">{currentItem.cuisine}</span>
                  <span className="text-[11px] bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full font-semibold">{currentItem.price}</span>
                  {currentItem.calories && (
                    <span className="text-[11px] bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Flame className="h-2.5 w-2.5" />{currentItem.calories}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-8 mt-6">
            <button onClick={() => swipe("left")} className="w-16 h-16 rounded-full bg-gray-800 border-2 border-red-500 flex items-center justify-center shadow-lg shadow-red-500/10 hover:bg-red-500/10 active:scale-90 transition-all" data-testid="button-nope">
              <X className="h-7 w-7 text-red-400" />
            </button>
            <div className="text-gray-600 text-xs text-center">{lang("swipe or tap", "مرر أو اضغط")}</div>
            <button onClick={() => swipe("right")} className="w-16 h-16 rounded-full bg-gray-800 border-2 border-green-500 flex items-center justify-center shadow-lg shadow-green-500/10 hover:bg-green-500/10 active:scale-90 transition-all" data-testid="button-like">
              <Heart className="h-7 w-7 text-green-400" />
            </button>
          </div>

          {/* Match count (multiplayer) */}
          {!isSolo && matches.length > 0 && (
            <button onClick={() => { setNewMatch(matches[matches.length - 1]); setPhase("matched"); }} className="mt-4 flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5" data-testid="button-view-matches">
              <Heart className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
              <span className="text-orange-400 text-xs font-semibold">{matches.length} {lang(matches.length > 1 ? "matches" : "match", "تطابق")} 🎉</span>
            </button>
          )}

          {/* Solo likes pill */}
          {isSolo && soloLikes.length > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5">
              <Heart className="h-3.5 w-3.5 text-green-400 fill-green-400" />
              <span className="text-green-400 text-xs font-semibold">{soloLikes.length} {lang("liked", "أعجبك")}</span>
            </div>
          )}

          {/* Partner/solo status */}
          <div className="mt-3 flex items-center gap-1.5 text-gray-600 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${isSolo ? "bg-orange-500" : "bg-green-500 animate-pulse"}`} />
            {isSolo ? lang("Solo mode", "وضع فردي") : lang("Partner is swiping too", "شريكك يمرر أيضاً")}
          </div>
        </div>
      )}

      {/* ── Match screen (multiplayer) ────────────────────────────────────── */}
      {phase === "matched" && newMatch && (
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-orange-600/20 blur-[100px]" />
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {["🎉","✨","🎊","💫","❤️","🍽️"].map((e, i) => (
              <div key={i} className="absolute text-2xl animate-bounce" style={{ left: `${10 + i * 15}%`, top: `${10 + (i % 3) * 20}%`, animationDelay: `${i * 0.2}s` }}>{e}</div>
            ))}
          </div>

          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce">{newMatch.emoji}</div>
            <div className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent text-3xl font-black mb-1">{lang("It's a Match!", "لقد تطابقتما!")}</div>
            <p className="text-gray-300 text-lg font-semibold mb-1">{language === "ar" ? newMatch.nameAr : newMatch.name}</p>
            <p className="text-gray-500 text-sm mb-2">{newMatch.cuisine} · {newMatch.price}</p>
            <p className="text-gray-400 text-xs mb-8 max-w-xs">{language === "ar" ? newMatch.descriptionAr : newMatch.description}</p>

            <div className="space-y-3 w-full max-w-xs">
              {newMatch.type === "dish" && (
                <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white rounded-xl font-semibold border-0" data-testid="button-order-match">
                  <Utensils className="h-4 w-4 mr-2" />{lang("Order Now", "اطلب الآن")}
                </Button>
              )}
              {newMatch.type === "restaurant" && (
                <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white rounded-xl font-semibold border-0" data-testid="button-view-restaurant">
                  <ChefHat className="h-4 w-4 mr-2" />{lang("View Restaurant", "عرض المطعم")}
                </Button>
              )}
              {currentIndex < items.length && (
                <Button variant="outline" className="w-full h-12 border-gray-700 text-white bg-gray-800 hover:bg-gray-700 rounded-xl" onClick={() => { setNewMatch(null); setPhase("swiping"); }} data-testid="button-keep-swiping">
                  {lang("Keep Swiping", "استمر في التمرير")}
                </Button>
              )}
            </div>

            {matches.length > 1 && (
              <div className="mt-6">
                <p className="text-gray-500 text-xs mb-3">{lang("All matches", "كل التطابقات")}</p>
                <div className="flex gap-3 justify-center">
                  {matches.map(m => (
                    <button key={m.id} onClick={() => setNewMatch(m)} className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl border-2 border-orange-500/40">{m.emoji}</div>
                      <span className="text-[10px] text-gray-500 max-w-[60px] truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Done ──────────────────────────────────────────────────────────── */}
      {phase === "done" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          {isSolo ? (
            <>
              <div className="text-5xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-white mb-1">{lang("Your Picks", "اختياراتك")}</h2>
              <p className="text-gray-400 text-sm mb-6">
                {soloLikes.length > 0
                  ? lang(`You liked ${soloLikes.length} item${soloLikes.length > 1 ? "s" : ""}`, `أعجبك ${soloLikes.length} عنصر`)
                  : lang("Nothing caught your eye — try again!", "لم يعجبك شيء — حاول مرة أخرى!")}
              </p>
              {soloLikes.length > 0 && (
                <div className="w-full max-w-sm space-y-2 mb-6">
                  {soloLikes.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-left">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{language === "ar" ? item.nameAr : item.name}</p>
                        <p className="text-gray-500 text-xs">{item.cuisine} · {item.price}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-400 text-xs">{item.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => { setPhase("landing"); setIsSolo(false); setSoloLikes([]); }} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white rounded-xl h-12 px-8 border-0">
                {lang("Play Again", "العب مجدداً")}
              </Button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-white mb-2">{lang("You're done!", "انتهيت!")}</h2>
              <p className="text-gray-400 text-sm mb-6">{lang("Waiting for your partner to finish swiping...", "في انتظار إنهاء شريكك...")}</p>
              {matches.length > 0 && (
                <Button onClick={() => { setNewMatch(matches[matches.length - 1]); setPhase("matched"); }} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 px-6">
                  {lang(`View ${matches.length} Match${matches.length > 1 ? "es" : ""}`, `عرض ${matches.length} تطابق`)}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
