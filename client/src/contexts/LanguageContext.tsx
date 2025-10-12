import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "id";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
    "waitlist.disclaimer": "By submitting, I agree that my data (email) may be processed and stored securely on Replit's servers located.",
    
    // Recipe Generator
    "recipe.generate": "Generate",
    "recipe.viewRecipe": "View Recipe",
    "recipe.shop": "Shop",
    "recipe.compare": "Compare",
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
    "recipe.continueToShop": "Continue to Shopping List",
    "recipe.shoppingListTitle": "Shopping List",
    "recipe.shoppingListDescription": "Here are the ingredients you'll need for this recipe",
    "recipe.acquired": "Acquired",
    "recipe.continueToPriceComparison": "Continue to Price Comparison",
    "recipe.priceComparisonTitle": "Price Comparison",
    "recipe.priceComparisonDescription": "Compare ingredient prices across different stores",
    "recipe.priceComparisonResults": "Price Comparison Results",
    "recipe.bestValue": "Best Value",
    "recipe.export": "Export",
    "recipe.share": "Share",
    "recipe.totalForItems": "Total for {count} items",
    "recipe.moreExpensive": "IDR {amount} more expensive",
    "recipe.shopAt": "Shop at {store}",
    "recipe.item": "ITEM",
    "recipe.quantity": "QUANTITY",
    "recipe.bestDeal": "BEST DEAL",
    "recipe.action": "ACTION",
    "recipe.search": "Search",
    "recipe.buyNow": "Buy Now",
    "recipe.store": "Store",
    "recipe.price": "Price",
    "recipe.size": "Size",
    "recipe.viewProduct": "View Product",
    "recipe.startOver": "Start Over",
    "recipe.shoppingList": "Shopping List",
    "recipe.backToRecipe": "Back to Recipe",
    "recipe.comparePrices": "Compare Prices",
    "recipe.createShoppingList": "Create Shopping List",
    
    // Price Comparison Page
    "priceComparison.title": "Price Comparison Feature",
    "priceComparison.message": "The standalone price comparison feature is currently being updated. In the meantime, you can still generate delicious recipes with our AI-powered recipe generator!",
    "priceComparison.goToGenerator": "Go to Recipe Generator",
    "priceComparison.bestValue": "Best Value",
    "priceComparison.ingredient": "Ingredient",
    "priceComparison.bestDeal": "Best Deal",
    "priceComparison.disclaimer": "Prices are approximate and may vary. Please check with stores for current pricing.",
    
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
    "waitlist.disclaimer": "Dengan mengirimkan, saya setuju bahwa data saya (email) dapat diproses dan disimpan dengan aman di server Replit yang berlokasi.",
    
    // Recipe Generator
    "recipe.generate": "Buat",
    "recipe.viewRecipe": "Lihat Resep",
    "recipe.shop": "Belanja",
    "recipe.compare": "Bandingkan",
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
    "recipe.continueToShop": "Lanjut ke Daftar Belanja",
    "recipe.shoppingListTitle": "Daftar Belanja",
    "recipe.shoppingListDescription": "Berikut adalah bahan-bahan yang Anda perlukan untuk resep ini",
    "recipe.acquired": "Sudah Dibeli",
    "recipe.continueToPriceComparison": "Lanjut ke Perbandingan Harga",
    "recipe.priceComparisonTitle": "Perbandingan Harga",
    "recipe.priceComparisonDescription": "Bandingkan harga bahan di berbagai toko",
    "recipe.priceComparisonResults": "Hasil Perbandingan Harga",
    "recipe.bestValue": "Nilai Terbaik",
    "recipe.export": "Ekspor",
    "recipe.share": "Bagikan",
    "recipe.totalForItems": "Total untuk {count} barang",
    "recipe.moreExpensive": "IDR {amount} lebih mahal",
    "recipe.shopAt": "Belanja di {store}",
    "recipe.item": "BARANG",
    "recipe.quantity": "JUMLAH",
    "recipe.bestDeal": "HARGA TERBAIK",
    "recipe.action": "AKSI",
    "recipe.search": "Cari",
    "recipe.buyNow": "Beli Sekarang",
    "recipe.store": "Toko",
    "recipe.price": "Harga",
    "recipe.size": "Ukuran",
    "recipe.viewProduct": "Lihat Produk",
    "recipe.startOver": "Mulai Lagi",
    "recipe.shoppingList": "Daftar Belanja",
    "recipe.backToRecipe": "Kembali ke Resep",
    "recipe.comparePrices": "Bandingkan Harga",
    "recipe.createShoppingList": "Buat Daftar Belanja",
    
    // Price Comparison Page
    "priceComparison.title": "Fitur Perbandingan Harga",
    "priceComparison.message": "Fitur perbandingan harga mandiri saat ini sedang diperbarui. Sementara itu, Anda masih dapat membuat resep lezat dengan generator resep bertenaga AI kami!",
    "priceComparison.goToGenerator": "Ke Generator Resep",
    "priceComparison.bestValue": "Nilai Terbaik",
    "priceComparison.ingredient": "Bahan",
    "priceComparison.bestDeal": "Harga Terbaik",
    "priceComparison.disclaimer": "Harga adalah perkiraan dan dapat bervariasi. Silakan periksa dengan toko untuk harga saat ini.",
    
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

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
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
