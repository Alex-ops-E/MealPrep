import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { ComponentProps } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";

const LAST_UPDATED = "May 2026";
const CONTACT_EMAIL = "privacy@groceryagent.app";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface Section {
  icon: FeatherIconName;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
}

const SECTIONS: Section[] = [
  {
    icon: "info",
    title: "About This App",
    titleAr: "عن التطبيق",
    body: "Dish Match is a free, anonymous food-preference matching app. No account or sign-up is required to use any feature. We are committed to collecting the minimum amount of data necessary to provide the service.",
    bodyAr: "Dish Match هو تطبيق مجاني وغير شخصي لمطابقة تفضيلات الطعام. لا يلزم إنشاء حساب أو التسجيل لاستخدام أي ميزة. نحن ملتزمون بجمع الحد الأدنى من البيانات اللازمة لتقديم الخدمة.",
  },
  {
    icon: "database",
    title: "Data We Collect",
    titleAr: "البيانات التي نجمعها",
    body: "Swipe choices (left / right) per dish or restaurant, stored anonymously.\n\nSession codes: temporary 6-character codes for multiplayer sessions, auto-deleted within 24 hours.\n\nCategory preference: Dishes, Restaurants, or Both.\n\nSession source: mobile app or web app label.\n\nAggregate match statistics: anonymous counts used for popularity rankings only.",
    bodyAr: "خيارات التمرير (يمين / يسار) لكل طبق أو مطعم، تُحفظ بشكل مجهول.\n\nرموز الجلسة: رموز مؤقتة من 6 أحرف للجلسات متعددة اللاعبين، تُحذف تلقائياً خلال 24 ساعة.\n\nتفضيل الفئة: أطباق أو مطاعم أو كليهما.\n\nمصدر الجلسة: تطبيق الجوال أو تطبيق الويب.\n\nإحصائيات التطابق الإجمالية: أعداد مجهولة تُستخدم لتصنيفات الشعبية فقط.",
  },
  {
    icon: "shield-off",
    title: "Data We Do NOT Collect",
    titleAr: "البيانات التي لا نجمعها",
    body: "Name, email, phone number, or any personal identifier.\n\nDevice identifiers or advertising IDs.\n\nLocation data (GPS, IP geolocation, or Wi-Fi).\n\nCamera, microphone, or contacts access.\n\nPayment or financial information.\n\nPush notification tokens.",
    bodyAr: "الاسم أو البريد الإلكتروني أو رقم الهاتف أو أي معرّف شخصي.\n\nمعرفات الجهاز أو معرفات الإعلانات.\n\nبيانات الموقع (GPS أو تحديد الموقع عبر IP أو Wi-Fi).\n\nالوصول إلى الكاميرا أو الميكروفون أو جهات الاتصال.\n\nمعلومات الدفع أو المالية.\n\nرموز إشعارات الدفع.",
  },
  {
    icon: "clock",
    title: "Data Retention",
    titleAr: "الاحتفاظ بالبيانات",
    body: "Active session data is retained for 24 hours after the last activity, then permanently deleted.\n\nAggregate statistics are retained indefinitely but contain no personally identifiable information.",
    bodyAr: "يتم الاحتفاظ ببيانات الجلسة النشطة لمدة 24 ساعة بعد آخر نشاط، ثم تُحذف نهائياً.\n\nتُحفظ الإحصائيات الإجمالية إلى أجل غير مسمى لكنها لا تحتوي على أي معلومات تعريفية شخصية.",
  },
  {
    icon: "share-2",
    title: "Third-Party Services",
    titleAr: "خدمات الطرف الثالث",
    body: "We use OpenAI to generate recipe suggestions. Only your craving description (text) is sent to OpenAI — no user identifier is attached. OpenAI's own privacy policy governs that data.\n\nWe do not use advertising networks, analytics SDKs, or social login providers.",
    bodyAr: "نستخدم OpenAI لإنشاء اقتراحات الوصفات. يُرسَل وصف شهيتك (نص فقط) إلى OpenAI دون أي معرّف مستخدم. تحكم سياسة خصوصية OpenAI هذه البيانات.\n\nلا نستخدم أي شبكات إعلانية أو حزم تحليلات أو موفري تسجيل دخول اجتماعي.",
  },
  {
    icon: "lock",
    title: "Security",
    titleAr: "الأمان",
    body: "All communication between the app and our servers is encrypted via HTTPS/TLS. Session codes are randomly generated and expire quickly. Swipe data cannot be linked back to any individual.",
    bodyAr: "جميع الاتصالات مشفرة عبر HTTPS/TLS. يتم إنشاء رموز الجلسة بشكل عشوائي وتنتهي صلاحيتها بسرعة. لا يمكن ربط بيانات التمرير بأي فرد.",
  },
  {
    icon: "refresh-cw",
    title: "Changes to This Policy",
    titleAr: "التغييرات على هذه السياسة",
    body: "We may update these Terms from time to time. When we do, we will update the Last updated date above. Continued use after changes constitutes acceptance of the new terms.",
    bodyAr: "قد نقوم بتحديث هذه الشروط من وقت لآخر. سنحدّث تاريخ آخر تحديث أعلاه عند إجراء أي تغيير. الاستمرار في استخدام التطبيق يمثل قبول الشروط الجديدة.",
  },
  {
    icon: "mail",
    title: "Contact",
    titleAr: "التواصل",
    body: "For any privacy questions or data requests, contact us at:\n" + CONTACT_EMAIL,
    bodyAr: "لأي أسئلة تتعلق بالخصوصية أو طلبات البيانات، تواصل معنا على:\n" + CONTACT_EMAIL,
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, isRTL, fontFamily } = useLanguage();
  const topInset = Platform.OS === "web" ? 20 : insets.top;
  const bottomInset = Platform.OS === "web" ? 20 : insets.bottom;
  const isAr = language === "ar";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={isRTL ? "arrow-right" : "arrow-left"} size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: fontFamily("bold") }]}>
            {isAr ? "الشروط والخصوصية" : "Terms & Privacy"}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 32, gap: 10 }}
      >
        {/* Last updated badge */}
        <View style={[styles.updatedBadge, { backgroundColor: colors.muted }]}>
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.updatedText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {isAr ? "آخر تحديث: " + LAST_UPDATED : "Last updated: " + LAST_UPDATED}
          </Text>
        </View>

        {/* Intro banner */}
        <View style={[styles.introCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
          <Feather name="shield" size={18} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={[styles.introText, { color: colors.foreground, fontFamily: fontFamily(), textAlign: isRTL ? "right" : "left" }]}>
            {isAr
              ? "يقدّر Dish Match خصوصيتك. نجمع أقل قدر ممكن من البيانات ولا نبيع أو نشارك معلوماتك مع أطراف ثالثة لأغراض تسويقية."
              : "Dish Match values your privacy. We collect the minimum data possible and never sell or share your information with third parties for marketing purposes."}
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, i) => (
          <View key={i} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "18" }]}>
                <Feather name={section.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: fontFamily("bold"), textAlign: isRTL ? "right" : "left" }]}>
                {isAr ? section.titleAr : section.title}
              </Text>
            </View>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground, fontFamily: fontFamily(), textAlign: isRTL ? "right" : "left" }]}>
              {isAr ? section.bodyAr : section.body}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: fontFamily() }]}>
            {isAr
              ? "باستخدامك لتطبيق Dish Match فإنك توافق على هذه الشروط."
              : "By using Dish Match, you agree to these terms."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle:   { fontSize: 16 },
  updatedBadge:  { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  updatedText:   { fontSize: 12 },
  introCard:     { padding: 16, borderRadius: 16, borderWidth: 1 },
  introText:     { fontSize: 14, lineHeight: 21 },
  section:       { padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  sectionHeader: { alignItems: "center", gap: 10 },
  iconBox:       { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle:  { fontSize: 15, flex: 1 },
  sectionBody:   { fontSize: 13, lineHeight: 21 },
  footer:        { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20, alignItems: "center" },
  footerText:    { fontSize: 12, textAlign: "center" },
});
