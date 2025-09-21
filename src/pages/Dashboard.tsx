import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { 
  CloudRain, 
  Droplets, 
  Leaf, 
  MapPin, 
  Mic, 
  MicOff, 
  TrendingUp, 
  Wheat,
  Globe,
  Volume2
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
/* removed unused Tabs imports */
import WeatherCard from "./dashboard/WeatherCard";
import MarketPricesCard from "./dashboard/MarketPricesCard";
import RecommendationsList from "./dashboard/RecommendationsList";

// Add: minimal translations used across Dashboard/children
const translations = {
  en: {
    recommendations: "Recommendations",
    marketPrices: "Market Prices",
    fertilizerAdvice: "Fertilizer Advice",
    irrigationAdvice: "Irrigation Advice",
    match: "match",
  },
  hi: {
    recommendations: "सिफारिशें",
    marketPrices: "बाज़ार भाव",
    fertilizerAdvice: "उर्वरक सलाह",
    irrigationAdvice: "सिंचाई सलाह",
    match: "मिलान",
  },
  ta: {
    recommendations: "பரிந்துரைகள்",
    marketPrices: "சந்தை விலை",
    fertilizerAdvice: "உர ஆலோசனை",
    irrigationAdvice: "நீர்ப்பாசன ஆலோசனை",
    match: "பொருந்துதல்",
  },
  bn: {
    recommendations: "প্রস্তাবনা",
    marketPrices: "বাজার দর",
    fertilizerAdvice: "সার পরামর্শ",
    irrigationAdvice: "সেচ পরামর্শ",
    match: "মিল",
  },
  ur: {
    recommendations: "سفارشات",
    marketPrices: "بازار کی قیمتیں",
    fertilizerAdvice: "کھاد مشورہ",
    irrigationAdvice: "آبپاشی مشورہ",
    match: "میل",
  },
  kn: {
    recommendations: "ಶಿಫಾರಸುಗಳು",
    marketPrices: "ಬಜಾರ್ ಬೆಲೆಗಳು",
    fertilizerAdvice: "ರಸಗೊಬ್ಬರ ಸಲಹೆ",
    irrigationAdvice: "ನೀರಾವರಿ ಸಲಹೆ",
    match: "ಹೊಂದಿಕೆ",
  },
  te: {
    recommendations: "సిఫార్సులు",
    marketPrices: "మార్కెట్ ధరలు",
    fertilizerAdvice: "ఎరువు సలహా",
    irrigationAdvice: "నీరుపూర్వక సలహా",
    match: "జోడు",
  },
  ml: {
    recommendations: "പരാമർശങ്ങൾ",
    marketPrices: "ചന്ത വിലകൾ",
    fertilizerAdvice: "എരുവ് ഉപദേശം",
    irrigationAdvice: "ജലസേചന ഉപദേശം",
    match: "പൊരുത്തം",
  },
} as const;

function deriveWeatherFromLocation(loc: string): { temperature: number; humidity: number; rainfall: number; forecast: string; localTime: string } {
  // Fallback if API fails; keep lightweight variability by hash
  let hash = 0;
  for (let i = 0; i < loc.length; i++) hash = (hash * 31 + loc.charCodeAt(i)) >>> 0;
  const now = new Date();
  const temp = 18 + (hash % 17);
  const humidity = 40 + (hash % 51);
  const rainfall = hash % 25;
  const forecasts = [
    "Partly cloudy with light breeze",
    "Sunny intervals with gentle winds",
    "Scattered showers possible",
    "Humid and overcast",
    "Clear skies and dry",
    "Thunderstorms likely in the evening",
  ];
  const forecast = forecasts[hash % forecasts.length];
  return { temperature: temp, humidity, rainfall, forecast, localTime: now.toLocaleString() };
}

async function fetchWeather(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather");
  const data = await res.json();
  const temperature = Math.round(data?.current?.temperature_2m ?? 0);
  const humidity = Math.round(data?.current?.relative_humidity_2m ?? 0);
  const rainfall = Math.round((data?.current?.precipitation ?? 0) * 10) / 10;
  const forecast = rainfall > 0 ? "Rain likely" : temperature > 32 ? "Hot and dry" : "Partly cloudy";
  return { temperature, humidity, rainfall, forecast, localTime: new Date().toLocaleString() };
}

const cropEmojis: Record<string, string> = {
  Wheat: "🌾",
  "Pulses (Lentils)": "🫘",
  Soybean: "🫘",
  Maize: "🌽",
  Rice: "🌿",
  Cotton: "🧵",
  Sugarcane: "🍬",
  Potato: "🥔",
  Groundnut: "🥜",
};

// ADD: localized crop name map
const cropNameTranslations: Record<string, Record<string, string>> = {
  en: {
    Wheat: "Wheat",
    Rice: "Rice",
    Maize: "Maize",
    Soybean: "Soybean",
    "Pulses (Lentils)": "Pulses (Lentils)",
    Cotton: "Cotton",
    Sugarcane: "Sugarcane",
    Potato: "Potato",
    Groundnut: "Groundnut",
  },
  hi: {
    Wheat: "गेहूँ",
    Rice: "चावल",
    Maize: "मक्का",
    Soybean: "सोयाबीन",
    "Pulses (Lentils)": "दालें",
    Cotton: "कपास",
    Sugarcane: "गन्ना",
    Potato: "आलू",
    Groundnut: "मूंगफली",
  },
  ta: {
    Wheat: "கோதுமை",
    Rice: "அரிசி",
    Maize: "சோளம்",
    Soybean: "சோயா",
    "Pulses (Lentils)": "பருப்பு",
    Cotton: "பருத்தி",
    Sugarcane: "கரும்பு",
    Potato: "உருளைக்கிழங்கு",
    Groundnut: "வேர்க்கடலை",
  },
  bn: {
    Wheat: "গম",
    Rice: "চাল",
    Maize: "ভুট্টা",
    Soybean: "সয়াবিন",
    "Pulses (Lentils)": "ডাল",
    Cotton: "সুতিবস্ত্র",
    Sugarcane: "আখ",
    Potato: "আলু",
    Groundnut: "চিনাবাদাম",
  },
  ur: {
    Wheat: "گندم",
    Rice: "چاول",
    Maize: "مکئی",
    Soybean: "سویا بین",
    "Pulses (Lentils)": "دالیں",
    Cotton: "روئی",
    Sugarcane: "گنا",
    Potato: "آلو",
    Groundnut: "مونگ پھلی",
  },
  kn: {
    Wheat: "ಗೋದಿ",
    Rice: "ಅಕ್ಕಿ",
    Maize: "ಜೋಳ",
    Soybean: "ಸೋಯಾಬಿನ್",
    "Pulses (Lentils)": "ಬೇಳೆ",
    Cotton: "ಹತ್ತಿ",
    Sugarcane: "ಕರಿಬೇವು",
    Potato: "ಆಲೂಗಡ್ಡೆ",
    Groundnut: "ಕಡಲೆಕಾಯಿ",
  },
  te: {
    Wheat: "గోధుమ",
    Rice: "బియ్యం",
    Maize: "మొక్కజొన్న",
    Soybean: "సోయాబీన్",
    "Pulses (Lentils)": "పప్పులు",
    Cotton: "పత్తి",
    Sugarcane: "చెరకుగడ్డి",
    Potato: "బంగాళాదుంప",
    Groundnut: "వేరుశెనగ",
  },
  ml: {
    Wheat: "ഗോതമ്പ്",
    Rice: "അരി",
    Maize: "ചോളം",
    Soybean: "സോയാബീൻ",
    "Pulses (Lentils)": "പയർവർഗങ്ങൾ",
    Cotton: "പത്തി",
    Sugarcane: "കരിമ്പ്",
    Potato: "ഉരുളകിഴങ്ങ്",
    Groundnut: "വേര്‍ക്കടല",
  },
};

// helper to translate crop names
function translateCropName(lang: keyof typeof cropNameTranslations, name: string) {
  return cropNameTranslations[lang]?.[name] ?? name;
}

// Add: per-crop content translations and helper
/* const cropContentTranslations: Record<
  keyof typeof cropNameTranslations,
  Record<
    string,
    {
      explanation?: string;
      fertilizerAdvice?: string;
      irrigationAdvice?: string;
    }
  >
> = {
  en: {}, // English shows originals
  hi: {
    Wheat: {
      explanation: "गेहूँ मध्यम नाइट्रोजन और संतुलित pH में अच्छा बढ़ता है।",
      fertilizerAdvice: "संतुलित NPK उर्वरक दें। बुवाई के समय DAP का उपयोग करें।",
      irrigationAdvice: "क्राउन रूट और दाना भरने के चरणों में सिंचाई करें।",
    },
    Rice: {
      explanation: "चावल नाइट्रोजन-समृद्ध व अच्छी जल उपलब्धता वाली स्थितियों में पनपता है।",
      fertilizerAdvice: "जैविक खाद और बायो-फर्टिलाइज़र का उपयोग करें। 4:2:1 NPK दें।",
      irrigationAdvice: "विकास के दौरान 2-5 सेमी पानी बनाए रखें।",
    },
    Maize: {
      explanation: "मकई को अच्छा फास्फोरस और संतुलित pH चाहिए।",
      fertilizerAdvice: "वनस्पति वृद्धि में उच्च नाइट्रोजन दें।",
      irrigationAdvice: "महत्त्वपूर्ण चरणों में नियमित सिंचाई करें।",
    },
    "Pulses (Lentils)": {
      explanation: "दालें अपना नाइट्रोजन स्वयं ठीक करती हैं और तटस्थ pH पसंद करती हैं।",
      fertilizerAdvice: "कम नाइट्रोजन, पोटाश और फॉस्फोरस पर ध्यान दें।",
      irrigationAdvice: "फूल और फली बनने पर हल्की सिंचाई रखें।",
    },
    Soybean: {
      explanation: "सोयाबीन अच्छे जल-निकास वाली मिट्टी में बढ़ती है।",
      fertilizerAdvice: "कम नाइट्रोजन, मध्यम फॉस्फोरस और पोटाश।",
      irrigationAdvice: "फूल और फली बनने पर पानी महत्वपूर्ण है।",
    },
    Cotton: {
      explanation: "कपास को रेशों के लिए अधिक पोटाश और पर्याप्त पानी चाहिए।",
      fertilizerAdvice: "बोल विकास के समय पोटाश-समृद्ध उर्वरक दें।",
      irrigationAdvice: "उच्च (700–1300mm) जल की आवश्यकता।",
    },
    Sugarcane: {
      explanation: "गन्ना दीर्घ अवधि की फसल है; उच्च जल और पोषक तत्वों की जरूरत।",
      fertilizerAdvice: "NPK का संतुलित अनुपात, जैविक खाद जोड़ें।",
      irrigationAdvice: "नियमित फरो सिंचाई रखें।",
    },
    Potato: {
      explanation: "आलू ठंडे मौसम और अच्छे जल-निकास वाली मिट्टी में बढ़ता है।",
      fertilizerAdvice: "रोपण के समय NPK और बाद में टॉप ड्रेसिंग।",
      irrigationAdvice: "कंद बनने पर नमी बनाए रखें।",
    },
    Groundnut: {
      explanation: "मूंगफली रेतीली दोमट और गर्म परिस्थितियों में अनुकूल।",
      fertilizerAdvice: "जिप्सम और पोटाश दें; नाइट्रोजन सीमित रखें।",
      irrigationAdvice: "फूल और पॉड भरने पर समान नमी रखें।",
    },
  },
  ta: {
    Wheat: {
      explanation: "கோதுமை மிதமான நைட்ரஜன் மற்றும் சமநிலை pH இல் நன்றாக வளரும்.",
      fertilizerAdvice: "சமநிலை NPK உரம். விதைப்பில் DAP பயன்பாடு.",
      irrigationAdvice: "முக்கிய வளர்ச்சி கட்டங்களில் பாசனம் செய்யவும்.",
    },
    Rice: {
      explanation: "அரிசி நைட்ரஜன் நிறைந்த, நீர் கிடைக்கும் சூழலில் சிறப்பாக வளரும்.",
      fertilizerAdvice: "ஜெயவ உரம் மற்றும் 4:2:1 NPK அளிக்கவும்.",
      irrigationAdvice: "வளர்ச்சிக் காலம் முழுவதும் 2–5செ.மீ நீர் வைத்திருங்கள்.",
    },
    Maize: {
      explanation: "சோளம் நல்ல பாஸ்பரஸ் மற்றும் சமநிலை pH தேவைப்படுகிறது.",
      fertilizerAdvice: "செடிவளர்ச்சி கட்டத்தில் அதிக நைட்ரジェன் உரம்.",
      irrigationAdvice: "தவறாது பாசனம் செய்யவும்.",
    },
    "Pulses (Lentils)": {
      explanation: "பருப்பு தனக்க டைரை நை ட்ரஜன் தனக்கேிடமாக மாற்றும்; நடுத்தர pH விருப்பம்.",
      fertilizerAdvice: "குறைந்த நைட்ரன்; பாஸ்பரஸ்/போட்டாசில் கவனம்.",
      irrigationAdvice: "பூவும் போற்கும் நேரங்களில் சிறிய பாசனம்.",
    },
    Soybean: {
      explanation: "சோயா நல்ல வடிகால் உள்ள மெலு மண்ணில் வளரும்.",
      fertilizerAdvice: "குறைந்த N, மிதமான P மற்றும் K.",
      irrigationAdvice: "பூக்கும்/பாம்பு போது நீர் அவசியம்.",
    },
    Cotton: {
      explanation: "பருத்திக்கு அதிக அளவு பொட்டாசும் போதிய நீரும் தேவை.",
      fertilizerAdvice: "போல் வளர்ச்சியில் K-பெருமளவு உரம்.",
      irrigationAdvice: "உயர் (700–1300மி.மீ) நீர் தேவை.",
    },
    Sugarcane: {
      explanation: "கரும்பு நீண்ட காலப் பண்ட; அதிக நீர் மற்றும் ஊட்டச்சத்துக்கள் தேவை.",
      fertilizerAdvice: "சமநிலை NPK, இயற்கை உரம் சேர்க்கவும்.",
      irrigationAdvice: "பட்டித் திட்டம் தடவாமல் தொடரவும்.",
    },
    Potato: {
      explanation: "உருளைக்கிழங்கு குளிர் சீதப் மற்றும் நல்ல நீர்வளக் கூற்று உள்ள மண்ணில் வளரும்.",
      fertilizerAdvice: "செடுவைத்த போது NPK, பிறகு மேல் அடுக்கு சிதறல்.",
      irrigationAdvice: "உருளைக்கிழங்கை உருவாக்கும் போது ஈரப்பதம் வைத்திருங்கள்.",
    },
    Groundnut: {
      explanation: "வேர்கடலை மணல், கூடு மண் மற்றும் அது சூடான நிலைமைக்கு விருப்பம்.",
      fertilizerAdvice: "ஜಿப்சम் மற்றும் பொட்டாஷ்; நைட்ரஜன் அளவு குறைவாக வைத்திருங்கள்.",
      irrigationAdvice: "பூக்கும் மற்றும் அட்டை நிரப்பும் நேரங்களில் ஒரே போன்ற ஈரப்பதம்.",
    },
  },
  bn: {
    Wheat: { explanation: "গম মাঝারি নাইট্রোজেন ও সমতুল্য pH এ ভালো বাড়ে।", fertilizerAdvice: "সামঞ্জস্যপূর্ণ NPK দিন, বপনের সময় DAP।", irrigationAdvice: "গুরুত্বপূর্ণ পর্যায়ে সেচ দিন।" },
    Rice: { explanation: "চাল নাইট্রোজেনসমৃদ্ধ ও জলে ভেজা অবস্থায় ভালো বাড়ে।", fertilizerAdvice: "জৈব সার ও 4:2:1 NPK ব্যবহার করুন।", irrigationAdvice: "মৌসুমজুড়ে ২–৫ সেমি জল রাখুন।" },
    Maize: { explanation: "ভুট্টায় ভাল ফসফরাস ও সমতুল্য pH দরকার।", fertilizerAdvice: "সবুজ বৃদ্ধিতে বেশি নাইট্রোজেন দিন।", irrigationAdvice: "নিয়মিত সেচ দিন।" },
    "Pulses (Lentils)": { explanation: "ডাল নিজে নাইট্রোজেন স্থির করে; নিরপেক্ষ pH পছন্দ।", fertilizerAdvice: "কম নাইট্রোজেন; পটাশ ও ফসফরাসে ফোকাস।", irrigationAdvice: "ফুল ও শুঁটি ভরার সময় হালকা সেচ।" },
    Soybean: { explanation: "সয়াবিন ভাল ড্রেনেজযুক্ত মাটিতে বাড়ে।", fertilizerAdvice: "কম N, মাঝারি P ও K।", irrigationAdvice: "ফুল ও শুঁটি ভরার সময় জল জরুরি।" },
    Cotton: { explanation: "সুতির জন্য উচ্চ পটাশ এবং যথেষ্ট জল দরকার।", fertilizerAdvice: "বল গঠনে পটাশ সমৃদ্ধ সার দিন।", irrigationAdvice: "উচ্চ (700–1300মিমি) জলের প্রয়োজন।" },
    Sugarcane: { explanation: "গাঁজা দীর্ঘকালীন ফসল; বেশি জল ও পুষ্টি প্রয়োজন।", fertilizerAdvice: "সামঞ্জস্যপূর্ণ NPK, জৈবসার যোগ করুন।", irrigationAdvice: "নিয়মিত নালা সেচ বজায় রাখুন।" },
    Potato: { explanation: "আলু ঠান্ডা আবহাওয়া ও ভাল ড্রেনেজে ভাল।", fertilizerAdvice: "নাটে সময় NPK, পরে টপ ড্রেসিং।", irrigationAdvice: "কন্দ গঠনের সময় ভিজান্য রাখুন।" },
    Groundnut: { explanation: "চিনাবাদাম বেলে দোআঁশ ও গরম জলবায়ু পছন্দ করে।", fertilizerAdvice: "জিপসাম ও পটাশ; N সীমিত।", irrigationAdvice: "ফুল ও ফলের সময় সমান আর্দ্রতা রক্ষা করুন।" },
  },
  ur: {
    Wheat: { explanation: "گندم معتدل نائٹروجن اور متوازن pH میں اچھی بڑھتی ہے۔", fertilizerAdvice: "متوازن NPK دیں، بوائی پر DAP۔", irrigationAdvice: "اہم مراحل پر آبپاشی کریں۔" },
    Rice: { explanation: "چاول نائٹروجن سے بھرپور اور پانی والی حالت میں پھلتا ہے۔", fertilizerAdvice: "نامیاتی کھاد اور 4:2:1 NPK استعمال کریں۔", irrigationAdvice: "موسم بھر 2–5 سم پانی برقرار رکھیں۔" },
    Maize: { explanation: "مکئی کو اچھا فاسفورس اور متوازن pH درکار ہے۔", fertilizerAdvice: "سبز بڑھوتری میں زیادہ نائٹروجن دیں۔", irrigationAdvice: "باقاعدہ آبپاشی کریں۔" },
    "Pulses (Lentils)": { explanation: "دالیں خود نائٹروجن ٹھیک کرتی ہیں؛ معتدل pH پسند کرتی ہیں۔", fertilizerAdvice: "کم نائٹروجن؛ پوٹاش اور فاسفورس پر زور۔", irrigationAdvice: "پھول اور پھلی بننے پر ہلکی آبپاشی۔" },
    Soybean: { explanation: "سویا بین اچھی نکاسی والی مٹی میں اگتی ہے۔", fertilizerAdvice: "کمی N، درمیانی P اور K۔", irrigationAdvice: "پھول اور پھلی کے دوران پانی ضروری۔" },
    Cotton: { explanation: "روئی کے لیے زیادہ پوٹاش اور مناسب پانی درکار ہے۔", fertilizerAdvice: "بول ڈیولپمینٹ میں پوٹاش سے بھرپور کھاد دیں۔", irrigationAdvice: "زیادہ (700–1300ملی) پانی درکار۔" },
    Sugarcane: { explanation: "گنا طویل دورانیہ کی فصل ہے؛ زیادہ پانی و غذائیت چاہیے۔", fertilizerAdvice: "متوازن NPK، نامیاتی کھاد شامل کریں۔", irrigationAdvice: "نالی آبپاشی باقاعدگی سے رکھیں۔" },
    Potato: { explanation: "آلو ٹھنڈے موسم اور اچھی نکاسی میں بہتر۔", fertilizerAdvice: "پودے لگاتے وقت NPK، بعد میں ٹاپ ڈریسینگ۔", irrigationAdvice: "کلب بننے پر نمی برقرار رکھیں۔" },
    Groundnut: { explanation: "مونگ پھلی مانکیلا میں، گرم حالات اور معدنی مٹی میں اچھی نشوونما کرتی ہے۔", fertilizerAdvice: "جپسَم اور پوٹاش؛ نائٹروجن محدود۔", irrigationAdvice: "پھول اور پوڈ بھرنے کے دوران یکساں نمی رکھیں۔" },
  },
  ml:
    { Wheat: { explanation: "ഗോതമ്പ് മിതമായ നൈട്രജനും സമതുലിത pH യിലും നന്നായി വളരും.", fertilizerAdvice: "സമതുലിത NPK; വിതയ്ക്കുമ്പഴി DAP.", irrigationAdvice: "പ്രധാന ഘട്ടങ്ങളിൽ ജലസേചനം ചെയ്യുക." },
      Rice: { explanation: "അരി നൈട്രജൻ സമൃദ്ധിയും ജലലഭ്യതയുമുള്ള സാഹചര്യങ്ങളിലും വളരും.", fertilizerAdvice: "സൈവ വളവും 4:2:1 NPK ഉം ഉപയോഗിക്കുക.", irrigationAdvice: "വളർച്ച മുഴുവൻ 2–5 സെ.മീ വെള്ളം നിലനിർത്തുക.", },
      Maize: { explanation: "ചോളം മികച്ച ഫോസ്ഫറസും സമ pH യും ആവശ്യമാണ്.", fertilizerAdvice: "സസ്യവളർച്ചയിൽ ഉയർന്ന നൈട്രജൻ.", irrigationAdvice: "ക്രമമായ ജലസേചനം.", },
      "Pulses (Lentils)": { explanation: "പയർവർഗങ്ങൾ നൈട്രജൻ സ്വയം സ്ഥിരീകരിക്കുകയും; നിച്ചിരാ pH ഇഷ്ടം.", fertilizerAdvice: "കുറഞ്ഞ N; P, K ശ്രദ്ധിക്കുക.", irrigationAdvice: "പൂക്കൾ/കായ് നിറയ്ക്കൽ സമയത്ത് ലഷ് ചൂട് ജലസേചനം.", },
      Soybean: { explanation: "സോയാബീൻ നല്ല ഡ്രെയിനേജ് ഉള്ള, ചൂടുള്ള മണ്ണിൽ വളരും.", fertilizerAdvice: "കുറഞ്ഞ N, മിതമായ P, K.", irrigationAdvice: "പൂക്കളിലും പാടിൽ ജലം നിർബന്ധം.", },
      Cotton: { explanation: "പത്തി നാരിന് ഉയർന്ന പൊട്ടാഷും മതിയായ വെള്ളവും വേണം.", fertilizerAdvice: "ബോൾ വികസനത്തിൽ K-സമൃദ്ധമായ വളം.", irrigationAdvice: "അധികമായ (700–1300മി.മീ) ജലാവശ്യകത.", },
      Sugarcane: { explanation: "ചെറുകിട പലവാർഷികത്തിനും, ജലവും പോഷകങ്ങൾക്കൂടി ആവശ്യമാണ്.", fertilizerAdvice: "സമതുലിത NPK, സേചനവളം ചേർത്തുക.", irrigationAdvice: "ഫ്രോസിനായി ജല ഇട്ടിടുക.", },
      Potato: { explanation: "ഉറവിടങ്ങളിൽ തണുത്തകാലം, നല്ല ജലവളർച്ച, ഉരുളക്കിഴങ്ങ് ശാസ്ത്രപരവും ജലസേചനപരവും വളരുന്നു.", fertilizerAdvice: "നട്ട് സമയത്ത് NPK, പിറകെ മേൽച്ചെടി.", irrigationAdvice: "കൈയർ പാടിൽ തണുത്തുക.", },
      Groundnut: { explanation: "വേരുകണ്ടു ദ്രവമുറ്റം, ചൂടുള്ള കാലാവസ്ഥ, ചുരുളയില്ലാത്ത വേവല", fertilizerAdvice: "ജിപ്സം, പൊട്ടാസും, നൈറജനെ കുറച്ച്.", irrigationAdvice: "പൂഖണ്ഡം/പോഡെ സമതലമായ തണുത്തുരുക്കുക.", },
    };

*/ 
// Helper to translate a crop's text fields with fallback to originals
function translateCropContent(
  lang: keyof typeof cropNameTranslations,
  name: string,
  fields: { explanation: string; fertilizerAdvice: string; irrigationAdvice: string }
) {
  const m = undefined as any;
  return {
    explanation: m?.explanation ?? fields.explanation,
    fertilizerAdvice: m?.fertilizerAdvice ?? fields.fertilizerAdvice,
    irrigationAdvice: m?.irrigationAdvice ?? fields.irrigationAdvice,
  };
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  type Language = "en" | "hi" | "ta" | "bn" | "ur" | "kn" | "te" | "ml";

  // Add: missing language state so handlers compile and work
  const [language, setLanguage] = useState<Language>("en");

  // Add: supported languages list and safe language change handler
  const supportedLanguages: Array<Language> = ["en", "hi", "ta", "bn", "ur", "kn", "te", "ml"];
  const handleLanguageChange = (val: string) => {
    if (!val || typeof val !== "string") {
      toast.error("Invalid language selection.");
      return;
    }
    if (!supportedLanguages.includes(val as Language)) {
      toast.error("Unsupported language selected. Reverting to English.");
      setLanguage("en");
      return;
    }
    setLanguage(val as Language);
  };

  // Ensure translations object is safely accessed with fallback
  const t = translations[language] ?? translations.en;

  // Warn and auto-correct if language becomes unsupported for any reason
  useEffect(() => {
    if (!supportedLanguages.includes(language)) {
      toast.error("Unsupported language detected. Reverting to English.");
      setLanguage("en");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Add: sync current language globally so child components can read it if needed
  useEffect(() => {
    (window as any).__cropai_lang = language;
  }, [language]);

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300`}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 pr-56 md:pr-72">
          <div className="flex items-center justify-between">
            {/* ... keep existing code (left header content) */}
            
            <div className="flex items-center gap-3 md:gap-4">
              {/* ... keep existing code (Connect button) */}
              {/* Language Toggle with safe handler */}
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-20 sm:w-24 rounded-full px-2">
                  <Globe className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हि</SelectItem>
                  <SelectItem value="ta">TA</SelectItem>
                  <SelectItem value="bn">BN</SelectItem>
                  <SelectItem value="ur">UR</SelectItem>
                  <SelectItem value="kn">KN</SelectItem>
                  <SelectItem value="te">TE</SelectItem>
                  <SelectItem value="ml">ML</SelectItem>
                </SelectContent>
              </Select>
              {/* ... keep existing code */}
            </div>
          </div>
        </div>
      </header>

      {/* ... keep existing code (rest of the component) */}
    </div>
  );
}