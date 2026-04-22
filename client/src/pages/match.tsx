import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/header";
import { Zap, Users, KeyRound, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const BG_EMOJIS = ["🍕","🍣","🍔","🌮","🍜","🥗","🍛","🥩","🍱","🧆","🥘","🍝","🌯","🍗","🥟"];

const AVATARS = [
  { initials: "JL", color: "bg-purple-500" },
  { initials: "MK", color: "bg-pink-500" },
  { initials: "SR", color: "bg-emerald-500" },
  { initials: "TN", color: "bg-orange-500" },
];

export default function Match() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const isRTL = language === "ar";
  const [tab, setTab] = useState<"restaurant" | "dish">("restaurant");
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const lang = (en: string, ar: string) => language === "ar" ? ar : en;

  const FEATURES = {
    restaurant: [
      { emoji: "📍", titleEn: "Near you",      titleAr: "بالقرب منك",    descEn: "Only shows places open right now",      descAr: "يعرض الأماكن المفتوحة الآن فقط" },
      { emoji: "⭐", titleEn: "Rated & loved",  titleAr: "مُقيَّم ومحبوب", descEn: "Curated top picks, no duds",            descAr: "أفضل الاختيارات، بلا خيبات" },
      { emoji: "🤝", titleEn: "Mutual match",   titleAr: "تطابق مشترك",   descEn: "Only shows what you both swiped yes",   descAr: "يعرض ما وافقتما عليه معاً" },
    ],
    dish: [
      { emoji: "🌮", titleEn: "Any cuisine",    titleAr: "أي مطبخ",       descEn: "From sushi to tacos, 50+ categories",   descAr: "من السوشي إلى التاكو، 50+ فئة" },
      { emoji: "🥗", titleEn: "Diet-aware",     titleAr: "يراعي الحمية",   descEn: "Filters for vegan, gluten-free & more", descAr: "فلتر للنباتي، خالي الغلوتين وأكثر" },
      { emoji: "🛵", titleEn: "Order-ready",    titleAr: "جاهز للطلب",    descEn: "Links straight to delivery apps",       descAr: "يربطك مباشرة بتطبيقات التوصيل" },
    ],
  };

  const STEPS = {
    restaurant: [
      { step: "Step 1", stepAr: "الخطوة 1", titleEn: "Swipe places",      titleAr: "مرر على الأماكن",  descEn: "Yes or no on restaurants near you",     descAr: "نعم أو لا على المطاعم القريبة" },
      { step: "Step 2", stepAr: "الخطوة 2", titleEn: "Partner joins",     titleAr: "ينضم شريكك",       descEn: "Via link or shared code",               descAr: "عبر رابط أو رمز مشترك" },
      { step: "Step 3", stepAr: "الخطوة 3", titleEn: "See your match",    titleAr: "شاهد تطابقكما",    descEn: "Head there together tonight",           descAr: "اذهبا معاً الليلة" },
    ],
    dish: [
      { step: "Step 1", stepAr: "الخطوة 1", titleEn: "Swipe dishes",      titleAr: "مرر على الأطباق",  descEn: "Yes or no on dishes you want",          descAr: "نعم أو لا على الأطباق التي تريدها" },
      { step: "Step 2", stepAr: "الخطوة 2", titleEn: "Partner joins",     titleAr: "ينضم شريكك",       descEn: "Via link or shared code",               descAr: "عبر رابط أو رمز مشترك" },
      { step: "Step 3", stepAr: "الخطوة 3", titleEn: "See your match",    titleAr: "شاهد تطابقكما",    descEn: "Order the dish you both picked",        descAr: "اطلبا الطبق الذي اخترتماه معاً" },
    ],
  };

  const handleInvite = () => {
    navigate(`/${language}/dish-match`);
  };

  const handleJoinSubmit = () => {
    if (joinCode.trim()) {
      navigate(`/${language}/dish-match?join=${joinCode.trim()}`);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-950 ${isRTL ? "rtl" : "ltr"}`}>
      <style>{`
        @keyframes floatSway {
          0%,100% { transform: translateY(0px) translateX(0px) rotate(-5deg); }
          33%     { transform: translateY(-18px) translateX(8px) rotate(5deg); }
          66%     { transform: translateY(-8px) translateX(-6px) rotate(-3deg); }
        }
        .float-emoji-m { animation: floatSway var(--dur, 6s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        @keyframes pulseDot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.6; transform: scale(1.3); }
        }
        .pulse-dot { animation: pulseDot 1.8s ease-in-out infinite; }
      `}</style>

      <Header />

      <div className="relative overflow-hidden">

        {/* Gradient glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-orange-600/15 blur-[140px]" />
          <div className="absolute top-[40%] right-[-100px] w-[300px] h-[300px] rounded-full bg-pink-600/12 blur-[100px]" />
          <div className="absolute bottom-[10%] left-[-60px] w-[280px] h-[280px] rounded-full bg-amber-500/10 blur-[90px]" />
        </div>

        {/* Floating food emojis */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {BG_EMOJIS.map((em, i) => (
            <span
              key={i}
              className="float-emoji-m absolute text-3xl opacity-30"
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

        <div className="relative z-10 max-w-sm mx-auto px-5 pt-8 pb-16">

          {/* Live stats badge */}
          <div className="flex justify-center mb-7">
            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700/60 rounded-full px-4 py-1.5 text-xs text-gray-300 backdrop-blur-sm">
              <span className="pulse-dot w-2 h-2 rounded-full bg-green-400 shrink-0" />
              {lang("14,200 matches made this week", "١٤,٢٠٠ تطابق هذا الأسبوع")}
            </div>
          </div>

          {/* Hero icon */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-4xl shadow-2xl shadow-orange-500/40">
              🍽️
            </div>
          </div>

          {/* Dish Match logo text */}
          <p className="text-center mb-2">
            <span className="text-2xl font-black bg-gradient-to-r from-orange-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              {lang("Dish Match", "مطابقة الأطباق")}
            </span>
          </p>

          {/* Subtitle */}
          <p className="text-gray-400 text-sm text-center leading-relaxed mb-8 max-w-xs mx-auto">
            {lang(
              "Both swipe on your preference. Dish Match finds what you both crave — in under 2 minutes.",
              "كلاكما يمرر على تفضيلاته. يجد Dish Match ما تشتهيانه معاً — في أقل من دقيقتين."
            )}
          </p>

          {/* Tab switcher */}
          <div className="flex bg-gray-800/80 border border-gray-700/60 rounded-2xl p-1 mb-6">
            <button
              onClick={() => setTab("restaurant")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === "restaurant"
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              data-testid="tab-restaurant"
            >
              🏠 {lang("Restaurant", "مطعم")}
            </button>
            <button
              onClick={() => setTab("dish")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === "dish"
                  ? "bg-gray-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              data-testid="tab-dish"
            >
              🍜 {lang("Dish", "طبق")}
            </button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {FEATURES[tab].map((f, i) => (
              <div
                key={i}
                className="bg-gray-800/70 border border-gray-700/60 rounded-2xl p-3 flex flex-col items-center text-center gap-2 backdrop-blur-sm"
                data-testid={`feature-card-${i}`}
              >
                <span className="text-2xl">{f.emoji}</span>
                <p className="text-white text-xs font-bold leading-tight">
                  {lang(f.titleEn, f.titleAr)}
                </p>
                <p className="text-gray-500 text-[10px] leading-tight">
                  {lang(f.descEn, f.descAr)}
                </p>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <p className="text-gray-600 text-xs text-center mb-8">
            {lang("No account needed", "لا حاجة لحساب")} · {lang("Free to use", "مجاني تماماً")}
          </p>

          {/* CTA section */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-3xl p-5 mb-6 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white text-center mb-5 flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-orange-400" />
              {tab === "restaurant"
                ? lang("Find Our Restaurant", "ابحثا عن مطعمكما")
                : lang("Find Our Dish", "ابحثا عن طبقكما")}
            </h2>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleInvite}
                className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-gray-700/80 hover:bg-gray-700 border border-gray-600/60 hover:border-orange-500/40 transition-all group"
                data-testid="button-invite-friend"
              >
                <span className="text-xl">👥</span>
                <span className="text-white text-xs font-semibold group-hover:text-orange-300 transition-colors">
                  {lang("Invite a Friend", "ادعُ صديقاً")}
                </span>
              </button>
              <button
                onClick={() => setShowJoin(v => !v)}
                className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-gray-700/80 hover:bg-gray-700 border border-gray-600/60 hover:border-orange-500/40 transition-all group"
                data-testid="button-join-code"
              >
                <span className="text-xl">🔑</span>
                <span className="text-white text-xs font-semibold group-hover:text-orange-300 transition-colors">
                  {lang("Join with Code", "انضم برمز")}
                </span>
              </button>
            </div>

            {/* Join code input */}
            {showJoin && (
              <div className="flex gap-2 mt-1">
                <Input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={lang("Enter code…", "أدخل الرمز…")}
                  className="flex-1 h-10 bg-gray-900 border-gray-600 text-white text-sm rounded-xl placeholder:text-gray-600 focus:border-orange-500"
                  maxLength={6}
                  onKeyDown={e => e.key === "Enter" && handleJoinSubmit()}
                  data-testid="input-join-code"
                />
                <button
                  onClick={handleJoinSubmit}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold hover:from-orange-400 hover:to-pink-400 transition-all"
                  data-testid="button-join-submit"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="flex -space-x-2">
              {AVATARS.map((a, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${a.color} flex items-center justify-center text-white text-[10px] font-bold border-2 border-gray-950`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <span className="text-gray-400 text-xs">
              <span className="text-white font-semibold">4.9 ★</span>
              {" · "}{lang("Loved by couples in 40+ countries", "محبوب من أزواج في 40+ دولة")}
            </span>
          </div>

          {/* 3-step flow */}
          <div className="border-t border-gray-800 pt-6">
            <div className="grid grid-cols-3 gap-3">
              {STEPS[tab].map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <span className="text-2xl mb-2">{["📱","❤️","🎉"][i]}</span>
                  <p className="text-orange-400 text-[10px] font-bold mb-1">
                    {lang(s.step, s.stepAr)}
                  </p>
                  <p className="text-white text-xs font-bold leading-tight mb-1">
                    {lang(s.titleEn, s.titleAr)}
                  </p>
                  <p className="text-gray-500 text-[10px] leading-tight">
                    {lang(s.descEn, s.descAr)}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
