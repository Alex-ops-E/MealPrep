import DishMatch from "./dish-match";

const QATAR_ITEMS = [
  // ── Dishes ──────────────────────────────────────────────────────────────
  {
    id: "qa1", type: "dish" as const,
    name: "Machboos", nameAr: "مجبوس",
    emoji: "🍖", cuisine: "Qatari", price: "QAR 55", rating: 4.9,
    description: "Slow-spiced basmati rice with tender lamb & dried limes",
    descriptionAr: "أرز بسمتي متبل بلحم الضأن والليمون المجفف",
    calories: 720,
  },
  {
    id: "qa2", type: "dish" as const,
    name: "Margoog", nameAr: "مرقوق",
    emoji: "🫕", cuisine: "Qatari", price: "QAR 50", rating: 4.8,
    description: "Traditional lamb & vegetable stew with thin bread",
    descriptionAr: "يخنة لحم وخضروات تقليدية مع رقاق الخبز",
    calories: 610,
  },
  {
    id: "qa3", type: "dish" as const,
    name: "Biryani", nameAr: "برياني",
    emoji: "🍚", cuisine: "South Asian", price: "QAR 45", rating: 4.8,
    description: "Fragrant saffron rice with spiced chicken & caramelised onions",
    descriptionAr: "أرز بالزعفران مع دجاج متبل وبصل مكرمل",
    calories: 680,
  },
  {
    id: "qa4", type: "dish" as const,
    name: "Shawarma", nameAr: "شاورما",
    emoji: "🌯", cuisine: "Lebanese", price: "QAR 20", rating: 4.7,
    description: "Marinated chicken or lamb, garlic sauce, fresh pickles",
    descriptionAr: "دجاج أو لحم متبل مع صلصة الثوم والمخلل",
    calories: 560,
  },
  {
    id: "qa5", type: "dish" as const,
    name: "Salmon Sushi Platter", nameAr: "طبق سوشي السلمون",
    emoji: "🍣", cuisine: "Japanese", price: "QAR 90", rating: 4.9,
    description: "Premium salmon rolls & nigiri, Japanese wasabi",
    descriptionAr: "رولات سلمون فاخرة ونيغيري مع واسابي ياباني",
    calories: 520,
  },
  {
    id: "qa6", type: "dish" as const,
    name: "Smash Burger", nameAr: "سماش برجر",
    emoji: "🍔", cuisine: "American", price: "QAR 55", rating: 4.7,
    description: "Double smash patty, cheddar, caramelised onions, special sauce",
    descriptionAr: "باتي مزدوج مع شيدر وبصل مكرمل وصلصة خاصة",
    calories: 950,
  },
  {
    id: "qa7", type: "dish" as const,
    name: "Mezze Platter", nameAr: "طبق مزة",
    emoji: "🧆", cuisine: "Levantine", price: "QAR 60", rating: 4.7,
    description: "Hummus, falafel, tabbouleh, fattoush & warm khubz",
    descriptionAr: "حمص وفلافل وتبولة وفتوش وخبز دافئ",
    calories: 580,
  },
  {
    id: "qa8", type: "dish" as const,
    name: "Chicken Tikka Masala", nameAr: "دجاج تيكا ماسالا",
    emoji: "🍛", cuisine: "Indian", price: "QAR 55", rating: 4.8,
    description: "Tender chicken in rich tomato-cream sauce, basmati rice",
    descriptionAr: "دجاج طري في صلصة الطماطم الكريمية مع أرز بسمتي",
    calories: 680,
  },
  {
    id: "qa9", type: "dish" as const,
    name: "Wagyu Steak", nameAr: "ستيك واغيو",
    emoji: "🥩", cuisine: "Japanese", price: "QAR 220", rating: 5.0,
    description: "A5 wagyu, truffle butter, roasted asparagus",
    descriptionAr: "واغيو A5 مع زبدة الكمأة والهليون المحمص",
    calories: 820,
  },
  {
    id: "qa10", type: "dish" as const,
    name: "Beef Tacos", nameAr: "تاكو اللحم",
    emoji: "🌮", cuisine: "Mexican", price: "QAR 65", rating: 4.6,
    description: "Slow-braised beef, fresh salsa, guacamole & jalapeños",
    descriptionAr: "لحم مطهي ببطء مع سالسا طازجة وجواكامولي",
    calories: 640,
  },
  // ── Restaurants ─────────────────────────────────────────────────────────
  {
    id: "qa11", type: "restaurant" as const,
    name: "Nobu Doha", nameAr: "نوبو الدوحة",
    emoji: "🏯", cuisine: "Japanese-Peruvian", price: "QAR 400+", rating: 4.9,
    description: "World-famous fusion dining at Four Seasons Doha",
    descriptionAr: "مطبخ عالمي الشهرة في فندق فور سيزونز الدوحة",
    calories: undefined,
  },
  {
    id: "qa12", type: "restaurant" as const,
    name: "Zuma Doha", nameAr: "زوما الدوحة",
    emoji: "🌿", cuisine: "Japanese", price: "QAR 350+", rating: 4.8,
    description: "Contemporary izakaya at QIPCO Tower, stunning city views",
    descriptionAr: "إيزاكايا عصرية في برج QIPCO مع إطلالات رائعة على المدينة",
    calories: undefined,
  },
  {
    id: "qa13", type: "restaurant" as const,
    name: "IDAM by Alain Ducasse", nameAr: "إيدام",
    emoji: "🎨", cuisine: "French-Moroccan", price: "QAR 500+", rating: 4.8,
    description: "Fine dining inside the Museum of Islamic Art",
    descriptionAr: "طعام فاخر داخل متحف الفن الإسلامي",
    calories: undefined,
  },
  {
    id: "qa14", type: "restaurant" as const,
    name: "Al Mourjan", nameAr: "المرجان",
    emoji: "🌊", cuisine: "Seafood", price: "QAR 300+", rating: 4.7,
    description: "Breathtaking harbour views at Fairmont Doha",
    descriptionAr: "إطلالات خلابة على الميناء في فندق فيرمونت الدوحة",
    calories: undefined,
  },
  {
    id: "qa15", type: "restaurant" as const,
    name: "Coya Doha", nameAr: "كويا الدوحة",
    emoji: "🌺", cuisine: "Peruvian", price: "QAR 400+", rating: 4.8,
    description: "Vibrant Peruvian dining at Four Seasons Doha",
    descriptionAr: "تجربة بيروفية حيوية في فور سيزونز الدوحة",
    calories: undefined,
  },
];

export default function MealSwipe() {
  return (
    <DishMatch
      source="meal-swipe"
      initialPhase="setup"
      initialSolo={true}
      customItems={QATAR_ITEMS}
    />
  );
}
