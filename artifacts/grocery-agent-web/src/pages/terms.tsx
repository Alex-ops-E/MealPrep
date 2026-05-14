import { Shield, Info, Database, ShieldOff, Clock, Share2, Lock, RefreshCw, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

const LAST_UPDATED = "May 2026";
const CONTACT_EMAIL = "privacy@groceryagent.app";

interface Section {
  icon: React.ReactNode;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
}

const SECTIONS: Section[] = [
  {
    icon: <Info className="w-4 h-4" />,
    title: "About This App",
    titleAr: "عن التطبيق",
    body: "Dish Match is a free, anonymous food-preference matching app. No account or sign-up is required to use any feature. We are committed to collecting the minimum amount of data necessary to provide the service.",
    bodyAr: "Dish Match هو تطبيق مجاني وغير شخصي لمطابقة تفضيلات الطعام. لا يلزم إنشاء حساب أو التسجيل لاستخدام أي ميزة. نحن ملتزمون بجمع الحد الأدنى من البيانات اللازمة لتقديم الخدمة.",
  },
  {
    icon: <Database className="w-4 h-4" />,
    title: "Data We Collect",
    titleAr: "البيانات التي نجمعها",
    body: "Swipe choices (left / right) per dish or restaurant, stored anonymously without any link to your identity.\n\nSession codes: temporary 6-character codes generated when you host a multiplayer session. They expire and are deleted automatically within 24 hours.\n\nCategory preference: whether you chose Dishes, Restaurants, or Both for a given session.\n\nSession source: a label indicating whether the session was started from the mobile app or the web app.\n\nAggregate match statistics: anonymous counts of mutual matches used to show popularity rankings.",
    bodyAr: "خيارات التمرير (يمين / يسار) لكل طبق أو مطعم، تُحفظ بشكل مجهول دون أي ارتباط بهويتك.\n\nرموز الجلسة: رموز مؤقتة من 6 أحرف تُنشأ عند استضافة جلسة متعددة اللاعبين، تنتهي صلاحيتها وتُحذف تلقائياً خلال 24 ساعة.\n\nتفضيل الفئة: أطباق أو مطاعم أو كليهما.\n\nمصدر الجلسة: تطبيق الجوال أو تطبيق الويب.\n\nإحصائيات التطابق الإجمالية: أعداد مجهولة تُستخدم لتصنيفات الشعبية فقط.",
  },
  {
    icon: <ShieldOff className="w-4 h-4" />,
    title: "Data We Do NOT Collect",
    titleAr: "البيانات التي لا نجمعها",
    body: "Name, email address, phone number, or any personal identifier.\n\nDevice identifiers or advertising IDs.\n\nLocation data (GPS, IP geolocation, or Wi-Fi).\n\nCamera, microphone, or contacts access.\n\nPayment or financial information.\n\nPush notification tokens.",
    bodyAr: "الاسم أو البريد الإلكتروني أو رقم الهاتف أو أي معرّف شخصي.\n\nمعرفات الجهاز أو معرفات الإعلانات.\n\nبيانات الموقع (GPS أو تحديد الموقع عبر IP أو Wi-Fi).\n\nالوصول إلى الكاميرا أو الميكروفون أو جهات الاتصال.\n\nمعلومات الدفع أو المالية.\n\nرموز إشعارات الدفع.",
  },
  {
    icon: <Clock className="w-4 h-4" />,
    title: "Data Retention",
    titleAr: "الاحتفاظ بالبيانات",
    body: "Active session data is retained for 24 hours after the last activity, then permanently deleted.\n\nAggregate statistics are retained indefinitely but contain no personally identifiable information.",
    bodyAr: "يتم الاحتفاظ ببيانات الجلسة النشطة لمدة 24 ساعة بعد آخر نشاط، ثم تُحذف نهائياً.\n\nتُحفظ الإحصائيات الإجمالية إلى أجل غير مسمى لكنها لا تحتوي على أي معلومات تعريفية شخصية.",
  },
  {
    icon: <Share2 className="w-4 h-4" />,
    title: "Third-Party Services",
    titleAr: "خدمات الطرف الثالث",
    body: "We use OpenAI to generate recipe suggestions. Only your craving description (text) is sent to OpenAI — no user identifier is attached. OpenAI's own privacy policy governs that data.\n\nWe do not use advertising networks, analytics SDKs, or social login providers.",
    bodyAr: "نستخدم OpenAI لإنشاء اقتراحات الوصفات. يُرسَل وصف شهيتك (نص فقط) إلى OpenAI دون أي معرّف مستخدم. تحكم سياسة خصوصية OpenAI هذه البيانات.\n\nلا نستخدم أي شبكات إعلانية أو حزم تحليلات أو موفري تسجيل دخول اجتماعي.",
  },
  {
    icon: <Lock className="w-4 h-4" />,
    title: "Security",
    titleAr: "الأمان",
    body: "All communication between the app and our servers is encrypted via HTTPS/TLS. Session codes are randomly generated and expire quickly. Swipe data cannot be linked back to any individual.",
    bodyAr: "جميع الاتصالات مشفرة عبر HTTPS/TLS. يتم إنشاء رموز الجلسة بشكل عشوائي وتنتهي صلاحيتها بسرعة. لا يمكن ربط بيانات التمرير بأي فرد.",
  },
  {
    icon: <RefreshCw className="w-4 h-4" />,
    title: "Changes to This Policy",
    titleAr: "التغييرات على هذه السياسة",
    body: "We may update these Terms from time to time. When we do, we will update the Last updated date above. Continued use after changes constitutes acceptance of the new terms.",
    bodyAr: "قد نقوم بتحديث هذه الشروط من وقت لآخر. سنحدّث تاريخ آخر تحديث أعلاه عند إجراء أي تغيير. الاستمرار في استخدام التطبيق يمثل قبول الشروط الجديدة.",
  },
  {
    icon: <Mail className="w-4 h-4" />,
    title: "Contact",
    titleAr: "التواصل",
    body: "For any privacy questions or data requests, contact us at:\n" + CONTACT_EMAIL,
    bodyAr: "لأي أسئلة تتعلق بالخصوصية أو طلبات البيانات، تواصل معنا على:\n" + CONTACT_EMAIL,
  },
];

export default function TermsPage() {
  const { language, isRTL, t } = useLanguage();
  const [, setLocation] = useLocation();
  const isAr = language === "ar";

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setLocation(`/${language}/dish-match`)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? "رجوع" : "Back"}
          </button>
          <span className="text-muted-foreground">·</span>
          <span className="font-semibold text-sm">
            {isAr ? "الشروط والخصوصية" : "Terms & Privacy"}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Title block */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold">
              {isAr ? "الشروط والخصوصية" : "Terms of Use & Privacy"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAr ? "آخر تحديث: " + LAST_UPDATED : "Last updated: " + LAST_UPDATED}
          </p>
        </div>

        {/* Intro banner */}
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <p className="text-sm leading-relaxed text-foreground">
            {isAr
              ? "يقدّر Dish Match خصوصيتك. نجمع أقل قدر ممكن من البيانات ولا نبيع أو نشارك معلوماتك مع أطراف ثالثة لأغراض تسويقية."
              : "Dish Match values your privacy. We collect the minimum data possible and never sell or share your information with third parties for marketing purposes."}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                  {section.icon}
                </div>
                <h2 className="font-semibold text-base">
                  {isAr ? section.titleAr : section.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {isAr ? section.bodyAr : section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4 pb-8 border-t">
          {isAr
            ? "باستخدامك لتطبيق Dish Match فإنك توافق على هذه الشروط."
            : "By using Dish Match, you agree to these terms."}
        </p>
      </main>
    </div>
  );
}
