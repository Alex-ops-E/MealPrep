import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "id";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "header.title": "Grocery Agent",
    "header.recipeGenerator": "Recipe Generator",
    "header.priceComparison": "Price Comparison",
    
    // Waitlist
    "waitlist.comingSoon": "Coming Soon",
    "waitlist.title": "Mobile app is launching soon!",
    "waitlist.joinCount": "Join {count}+ people on the waitlist",
    "waitlist.beFirst": "Be the first to get early access",
    "waitlist.feature.priceAlerts": "Price Alerts",
    "waitlist.feature.smartCart": "Smart Cart",
    "waitlist.feature.pantrySync": "Pantry Sync",
    "waitlist.feature.mealPlanner": "Meal Planner",
    "waitlist.feature.photoScan": "Photo Scan and Cook",
    "waitlist.namePlaceholder": "Your name (optional)",
    "waitlist.emailPlaceholder": "Your email address",
    "waitlist.button": "Get Early Access",
    "waitlist.buttonJoining": "Joining...",
    "waitlist.successTitle": "Success!",
    "waitlist.successMessage": "You've been added to the waitlist. We'll notify you when the mobile app launches!",
    "waitlist.errorTitle": "Error",
    "waitlist.errorMessage": "Failed to join waitlist. Please try again.",
    
    // Recipe Generator
    "recipe.generate": "Generate",
    "recipe.viewRecipe": "View Recipe",
    "recipe.whatToCook": "What would you like to cook?",
    "recipe.craving": "Describe your craving",
    "recipe.cravingPlaceholder": "e.g., a healthy 30-minute chicken meal for dinner",
    "recipe.cravingError": "Please describe what you'd like to cook",
    "recipe.quickStarts": "Quick starts",
    "recipe.healthyQuick": "Healthy & Quick",
    "recipe.healthyQuickCraving": "a healthy 30-minute meal",
    "recipe.comfortFood": "Comfort Food",
    "recipe.comfortFoodCraving": "comfort food that's hearty and satisfying",
    "recipe.dateNight": "Date Night",
    "recipe.dateNightCraving": "an impressive romantic dinner",
    "recipe.familyDinner": "Family Dinner",
    "recipe.familyDinnerCraving": "a family-friendly dinner everyone will enjoy",
    "recipe.servings": "Servings",
    "recipe.person": "person",
    "recipe.people": "people",
    "recipe.cuisineStyle": "Cuisine Style",
    "recipe.any": "Any",
    "recipe.italian": "Italian",
    "recipe.mexican": "Mexican",
    "recipe.asian": "Asian",
    "recipe.mediterranean": "Mediterranean",
    "recipe.american": "American",
    "recipe.french": "French",
    "recipe.indian": "Indian",
    "recipe.cookingTime": "Cooking Time",
    "recipe.15min": "15 minutes",
    "recipe.30min": "30 minutes",
    "recipe.45min": "45 minutes",
    "recipe.1hour": "1 hour",
    "recipe.2hours": "2+ hours",
    "recipe.dietaryRestrictions": "Dietary Restrictions",
    "recipe.vegetarian": "Vegetarian",
    "recipe.vegan": "Vegan",
    "recipe.glutenFree": "Gluten-Free",
    "recipe.dairyFree": "Dairy-Free",
    "recipe.keto": "Keto",
    "recipe.generateButton": "Generate Recipe with AI",
    "recipe.generating": "Generating...",
    "recipe.ingredients": "Ingredients",
    "recipe.instructions": "Instructions",
    "recipe.generateAnother": "Generate Another Recipe",
    "recipe.generatedTitle": "Recipe generated!",
    "recipe.generatedMessage": "Your recipe is ready to view",
    "recipe.failedTitle": "Generation failed",
    
    // Footer
    "footer.rights": "All rights reserved.",
    
    // Language
    "language.english": "English",
    "language.indonesian": "Indonesian",
  },
  id: {
    // Header
    "header.title": "Agen Belanja",
    "header.recipeGenerator": "Generator Resep",
    "header.priceComparison": "Perbandingan Harga",
    
    // Waitlist
    "waitlist.comingSoon": "Segera Hadir",
    "waitlist.title": "Aplikasi mobile segera diluncurkan!",
    "waitlist.joinCount": "Bergabung dengan {count}+ orang di daftar tunggu",
    "waitlist.beFirst": "Jadilah yang pertama mendapatkan akses awal",
    "waitlist.feature.priceAlerts": "Peringatan Harga",
    "waitlist.feature.smartCart": "Keranjang Pintar",
    "waitlist.feature.pantrySync": "Sinkronisasi Pantry",
    "waitlist.feature.mealPlanner": "Perencana Makan",
    "waitlist.feature.photoScan": "Pindai Foto dan Masak",
    "waitlist.namePlaceholder": "Nama Anda (opsional)",
    "waitlist.emailPlaceholder": "Alamat email Anda",
    "waitlist.button": "Dapatkan Akses Awal",
    "waitlist.buttonJoining": "Bergabung...",
    "waitlist.successTitle": "Berhasil!",
    "waitlist.successMessage": "Anda telah ditambahkan ke daftar tunggu. Kami akan memberi tahu Anda saat aplikasi mobile diluncurkan!",
    "waitlist.errorTitle": "Kesalahan",
    "waitlist.errorMessage": "Gagal bergabung dengan daftar tunggu. Silakan coba lagi.",
    
    // Recipe Generator
    "recipe.generate": "Buat",
    "recipe.viewRecipe": "Lihat Resep",
    "recipe.whatToCook": "Apa yang ingin Anda masak?",
    "recipe.craving": "Jelaskan keinginan Anda",
    "recipe.cravingPlaceholder": "mis., hidangan ayam sehat 30 menit untuk makan malam",
    "recipe.cravingError": "Silakan jelaskan apa yang ingin Anda masak",
    "recipe.quickStarts": "Mulai cepat",
    "recipe.healthyQuick": "Sehat & Cepat",
    "recipe.healthyQuickCraving": "makanan sehat 30 menit",
    "recipe.comfortFood": "Makanan Nyaman",
    "recipe.comfortFoodCraving": "makanan nyaman yang mengenyangkan dan memuaskan",
    "recipe.dateNight": "Malam Kencan",
    "recipe.dateNightCraving": "makan malam romantis yang mengesankan",
    "recipe.familyDinner": "Makan Malam Keluarga",
    "recipe.familyDinnerCraving": "makan malam ramah keluarga yang disukai semua orang",
    "recipe.servings": "Porsi",
    "recipe.person": "orang",
    "recipe.people": "orang",
    "recipe.cuisineStyle": "Gaya Masakan",
    "recipe.any": "Apa Saja",
    "recipe.italian": "Italia",
    "recipe.mexican": "Meksiko",
    "recipe.asian": "Asia",
    "recipe.mediterranean": "Mediterania",
    "recipe.american": "Amerika",
    "recipe.french": "Prancis",
    "recipe.indian": "India",
    "recipe.cookingTime": "Waktu Memasak",
    "recipe.15min": "15 menit",
    "recipe.30min": "30 menit",
    "recipe.45min": "45 menit",
    "recipe.1hour": "1 jam",
    "recipe.2hours": "2+ jam",
    "recipe.dietaryRestrictions": "Pembatasan Diet",
    "recipe.vegetarian": "Vegetarian",
    "recipe.vegan": "Vegan",
    "recipe.glutenFree": "Bebas Gluten",
    "recipe.dairyFree": "Bebas Susu",
    "recipe.keto": "Keto",
    "recipe.generateButton": "Buat Resep dengan AI",
    "recipe.generating": "Membuat...",
    "recipe.ingredients": "Bahan-bahan",
    "recipe.instructions": "Instruksi",
    "recipe.generateAnother": "Buat Resep Lain",
    "recipe.generatedTitle": "Resep berhasil dibuat!",
    "recipe.generatedMessage": "Resep Anda siap dilihat",
    "recipe.failedTitle": "Pembuatan gagal",
    
    // Footer
    "footer.rights": "Hak cipta dilindungi.",
    
    // Language
    "language.english": "English",
    "language.indonesian": "Bahasa Indonesia",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    const translation = translations[language][key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
