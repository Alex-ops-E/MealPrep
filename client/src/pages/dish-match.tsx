import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Heart, X, Users, Share2, ChefHat, ArrowLeft, Star, Flame, RefreshCw, Utensils } from "lucide-react";
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

type Phase = "landing" | "creating" | "waiting" | "joining" | "swiping" | "matched" | "done";

function generateUserId() {
  return "user_" + Math.random().toString(36).substring(2, 18);
}

export default function DishMatch() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isRTL = language === "ar";

  const userId = useRef(generateUserId());
  const [phase, setPhase] = useState<Phase>("landing");
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

  useEffect(() => {
    return () => stopPoll();
  }, []);

  useEffect(() => {
    if ((phase === "waiting" || phase === "swiping") && sessionId) {
      stopPoll();
      pollRef.current = setInterval(() => pollSession(sessionId), 2000);
    }
    return () => {};
  }, [phase, sessionId, pollSession]);

  const startSession = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/dish-match/sessions", { userId: userId.current });
      const data = await res.json();
      setSessionId(data.id);
      setSessionCode(data.code);
      setItems(data.items);
      setCurrentIndex(0);
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      setSessionId(data.id);
      setSessionCode(data.code);
      setItems(data.items);
      setCurrentIndex(0);
      setGuestJoined(true);
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
        if (newMatchItem) {
          setNewMatch(newMatchItem);
          stopPoll();
          setPhase("matched");
          return;
        }
      }
    } catch {}

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setDragDelta(0);
    if (nextIndex >= items.length) {
      setPhase("done");
    }
  };

  // Drag handlers
  const onDragStart = (clientX: number) => {
    isDragging.current = true;
    dragStartX.current = clientX;
    dragCurrentX.current = clientX;
  };
  const onDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    dragCurrentX.current = clientX;
    setDragDelta(clientX - dragStartX.current);
  };
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

  // Auto-join from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get("join");
    if (joinParam) setJoinCode(joinParam);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-950 ${isRTL ? "rtl" : "ltr"}`}>
      <Header />

      {/* Landing */}
      {phase === "landing" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {lang("Dish Match", "مطابقة الأطباق")}
          </h1>
          <p className="text-gray-400 mb-10 max-w-sm text-sm leading-relaxed">
            {lang(
              "Swipe right on dishes you want. When you and your partner both love the same thing — it's a match!",
              "مرر يميناً على الأطباق التي تريدها. عندما تتطابق اختياراتك مع شريكك — تطابق!"
            )}
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <Button
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold rounded-xl"
              onClick={startSession}
              disabled={isLoading}
              data-testid="button-start-session"
            >
              <Users className="h-5 w-5 mr-2" />
              {lang("Start a Session", "ابدأ جلسة")}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-gray-700 text-white bg-gray-800 hover:bg-gray-700 text-base rounded-xl"
              onClick={() => setPhase("joining")}
              data-testid="button-join-session"
            >
              {lang("Join with Code", "انضم برمز")}
            </Button>
          </div>
        </div>
      )}

      {/* Waiting for guest */}
      {phase === "waiting" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          <div className="text-5xl mb-6">👋</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {lang("Share this code", "شارك هذا الرمز")}
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            {lang("Send it to your partner so they can join", "أرسله لشريكك لينضم إليك")}
          </p>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl px-8 py-6 mb-6">
            <div className="text-5xl font-bold text-white tracking-[0.3em] font-mono" data-testid="text-session-code">
              {sessionCode}
            </div>
          </div>

          <Button
            onClick={shareCode}
            className="mb-8 bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-11 px-6"
            data-testid="button-share-code"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {lang("Share Link", "شارك الرابط")}
          </Button>

          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {lang("Waiting for your partner to join...", "في انتظار انضمام شريكك...")}
          </div>

          <button onClick={() => setPhase("landing")} className="mt-8 text-gray-600 text-xs hover:text-gray-400">
            {lang("← Back", "← رجوع")}
          </button>
        </div>
      )}

      {/* Join with code */}
      {phase === "joining" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          <div className="text-5xl mb-6">🔑</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {lang("Enter the Code", "أدخل الرمز")}
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            {lang("Ask your partner for their 6-character code", "اطلب من شريكك الرمز المكوّن من 6 أحرف")}
          </p>

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

          <button onClick={() => setPhase("landing")} className="mt-8 text-gray-600 text-xs hover:text-gray-400">
            {lang("← Back", "← رجوع")}
          </button>
        </div>
      )}

      {/* Swiping */}
      {phase === "swiping" && currentItem && (
        <div className="flex flex-col items-center min-h-[calc(100vh-64px)] px-4 pt-4 pb-6 select-none">
          {/* Progress */}
          <div className="w-full max-w-sm mb-4">
            <div className="flex justify-between text-gray-500 text-xs mb-1">
              <span>{lang(`${currentIndex} swiped`, `${currentIndex} تم`)} </span>
              <span>{items.length - currentIndex} {lang("left", "متبقية")}</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all"
                style={{ width: `${(currentIndex / items.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Card stack */}
          <div className="relative w-full max-w-sm flex-1 flex items-center justify-center">
            {/* Next card (peek) */}
            {items[currentIndex + 1] && (
              <div className="absolute inset-x-4 top-2 h-full rounded-3xl bg-gray-800 border border-gray-700 scale-95 opacity-50" />
            )}

            {/* Main card */}
            <div
              ref={cardRef}
              className="absolute inset-x-0 rounded-3xl bg-gray-800 border border-gray-700 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${dragDelta}px) rotate(${rotation}deg)`,
                transition: isDragging.current ? "none" : "transform 0.3s ease",
                touchAction: "none"
              }}
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
              <div
                className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10 pointer-events-none rounded-3xl"
                style={{ opacity: likeOpacity }}
              >
                <div className="border-4 border-green-400 rounded-xl px-4 py-2 rotate-[-15deg]">
                  <span className="text-green-400 font-black text-2xl tracking-widest">LIKE</span>
                </div>
              </div>

              {/* Nope overlay */}
              <div
                className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-10 pointer-events-none rounded-3xl"
                style={{ opacity: nopeOpacity }}
              >
                <div className="border-4 border-red-400 rounded-xl px-4 py-2 rotate-[15deg]">
                  <span className="text-red-400 font-black text-2xl tracking-widest">NOPE</span>
                </div>
              </div>

              {/* Type badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentItem.type === "dish" ? "bg-orange-500/80 text-white" : "bg-purple-500/80 text-white"}`}>
                  {currentItem.type === "dish" ? (lang("DISH", "طبق")) : (lang("RESTAURANT", "مطعم"))}
                </span>
              </div>

              {/* Emoji */}
              <div className="flex items-center justify-center h-56 bg-gradient-to-b from-gray-700 to-gray-800">
                <span className="text-9xl drop-shadow-2xl">{currentItem.emoji}</span>
              </div>

              {/* Info */}
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

                <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                  {language === "ar" ? currentItem.descriptionAr : currentItem.description}
                </p>

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
          <div className="flex items-center gap-6 mt-6">
            <button
              onClick={() => swipe("left")}
              className="w-16 h-16 rounded-full bg-gray-800 border-2 border-red-500 flex items-center justify-center shadow-lg hover:bg-red-500/10 active:scale-90 transition-all"
              data-testid="button-nope"
            >
              <X className="h-7 w-7 text-red-400" />
            </button>

            <div className="text-gray-600 text-xs text-center">
              <div>{lang("swipe or tap", "مرر أو اضغط")}</div>
            </div>

            <button
              onClick={() => swipe("right")}
              className="w-16 h-16 rounded-full bg-gray-800 border-2 border-green-500 flex items-center justify-center shadow-lg hover:bg-green-500/10 active:scale-90 transition-all"
              data-testid="button-like"
            >
              <Heart className="h-7 w-7 text-green-400" />
            </button>
          </div>

          {/* Match count */}
          {matches.length > 0 && (
            <button
              onClick={() => { setNewMatch(matches[matches.length - 1]); setPhase("matched"); }}
              className="mt-4 flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5"
              data-testid="button-view-matches"
            >
              <Heart className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
              <span className="text-orange-400 text-xs font-semibold">
                {matches.length} {lang("match" + (matches.length > 1 ? "es" : ""), "تطابق")} 🎉
              </span>
            </button>
          )}

          {/* Partner status */}
          <div className="mt-3 flex items-center gap-1.5 text-gray-600 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {lang("Partner is swiping too", "شريكك يمرر أيضاً")}
          </div>
        </div>
      )}

      {/* Match screen */}
      {phase === "matched" && newMatch && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          {/* Confetti-like decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {["🎉","✨","🎊","💫","❤️","🍽️"].map((e, i) => (
              <div key={i} className="absolute text-2xl animate-bounce" style={{ left: `${10 + i * 15}%`, top: `${10 + (i % 3) * 20}%`, animationDelay: `${i * 0.2}s` }}>{e}</div>
            ))}
          </div>

          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce">{newMatch.emoji}</div>
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent text-3xl font-black mb-1">
              {lang("It's a Match!", "لقد تطابقتما!")}
            </div>
            <p className="text-gray-300 text-lg font-semibold mb-1">
              {language === "ar" ? newMatch.nameAr : newMatch.name}
            </p>
            <p className="text-gray-500 text-sm mb-2">{newMatch.cuisine} · {newMatch.price}</p>
            <p className="text-gray-400 text-xs mb-8 max-w-xs">
              {language === "ar" ? newMatch.descriptionAr : newMatch.description}
            </p>

            <div className="space-y-3 w-full max-w-xs">
              {newMatch.type === "dish" && (
                <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold" data-testid="button-order-match">
                  <Utensils className="h-4 w-4 mr-2" />
                  {lang("Order Now", "اطلب الآن")}
                </Button>
              )}
              {newMatch.type === "restaurant" && (
                <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold" data-testid="button-view-restaurant">
                  <ChefHat className="h-4 w-4 mr-2" />
                  {lang("View Restaurant", "عرض المطعم")}
                </Button>
              )}
              {currentIndex < items.length && (
                <Button
                  variant="outline"
                  className="w-full h-12 border-gray-700 text-white bg-gray-800 hover:bg-gray-700 rounded-xl"
                  onClick={() => { setNewMatch(null); setPhase("swiping"); }}
                  data-testid="button-keep-swiping"
                >
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
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl border-2 border-orange-500/40">
                        {m.emoji}
                      </div>
                      <span className="text-[10px] text-gray-500 max-w-[60px] truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All swiped — waiting */}
      {phase === "done" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {lang("You're done!", "انتهيت!")}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {lang("Waiting for your partner to finish swiping...", "في انتظار إنهاء شريكك...")}
          </p>
          {matches.length > 0 ? (
            <div className="space-y-3">
              <p className="text-orange-400 font-semibold">{matches.length} {lang("match" + (matches.length > 1 ? "es" : ""), "تطابق")} so far!</p>
              <Button onClick={() => { setNewMatch(matches[0]); setPhase("matched"); }} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                {lang("View Matches", "عرض التطابقات")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {lang("Checking for matches...", "جارٍ التحقق من التطابقات...")}
            </div>
          )}
          <button onClick={() => setPhase("landing")} className="mt-8 text-gray-600 text-xs hover:text-gray-400">
            {lang("Start a new session", "ابدأ جلسة جديدة")}
          </button>
        </div>
      )}
    </div>
  );
}
