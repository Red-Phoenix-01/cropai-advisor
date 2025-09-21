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
const cropContentTranslations: Record<
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
      irrigationAdvice: "महत्वपूर्ण चरणों में नियमित सिंचाई करें।",
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
      fertilizerAdvice: "செடிவளர்ச்சி கட்டத்தில் அதிக நைட்ரஜன் உரம்.",
      irrigationAdvice: "தவறாது பாசனம் செய்யவும்.",
    },
    "Pulses (Lentils)": {
      explanation: "பருப்புகள் தாங்களே நைட்ரஜன் நிலைநிறுத்தும்; நடுத்தர pH விரும்பும்.",
      fertilizerAdvice: "குறைந்த நைட்ரஜன்; பாஸ்பரஸ்/பொட்டாசில் கவனம்.",
      irrigationAdvice: "மலர்ச்சி மற்றும் கொட்டைகள் உருவாகும் போது லேசான பாசனம்.",
    },
    Soybean: {
      explanation: "சோயா நல்ல வடிகால் உள்ள மண்ணில் வளரும்.",
      fertilizerAdvice: "குறைந்த N, மிதமான P மற்றும் K.",
      irrigationAdvice: "மலர்ச்சி/பாட் நிரப்பு நேரத்தில் தண்ணீர் அவசியம்.",
    },
    Cotton: {
      explanation: "பருத்தி நாரிற்காக அதிக பொட்டாசும் போதிய நீரும் தேவை.",
      fertilizerAdvice: "போல் வளர்ச்சியில் K-பெருமளவு உரம்.",
      irrigationAdvice: "உயர் (700–1300மி.மீ) நீர் தேவை.",
    },
    Sugarcane: {
      explanation: "கரும்பு நீண்டகால பயிர்; அதிக நீர்/உட்டச்சத்து தேவை.",
      fertilizerAdvice: "சமநிலை NPK, இயற்கை உரம் சேர்க்கவும்.",
      irrigationAdvice: "வரிசை பாசனம் சீராக செய்யவும்.",
    },
    Potato: {
      explanation: "உருளைக்கிழங்கு குளிர்ந்த வானிலை மற்றும் வடிகால் மண்ணில் வளரும்.",
      fertilizerAdvice: "நட்டு நேரம் NPK, பின்னர் டாப் டிரசிங்.",
      irrigationAdvice: "கிழங்கு உருவாகும் போது ஈரப்பதம் வைத்திருங்கள்.",
    },
    Groundnut: {
      explanation: "வேர்க்கடலை மணல்வகை மண் மற்றும் சூடான நிலை விரும்பும்.",
      fertilizerAdvice: "ஜிப்சம், பொட்டாசு; நைட்ரஜன் குறைவு.",
      irrigationAdvice: "மலர்ச்சி/கொட்டை நிரப்பு நேரத்தில் ஈரப்பதம் நிலைநிறுத்தவும்.",
    },
  },
  bn: {
    Wheat: { explanation: "গম মাঝারি নাইট্রোজেন ও সমতুল্য pH এ ভালো বাড়ে।", fertilizerAdvice: "সামঞ্জস্যপূর্ণ NPK দিন, বপনের সময় DAP।", irrigationAdvice: "গুরুত্বপূর্ণ পর্যায়ে সেচ দিন।" },
    Rice: { explanation: "চাল নাইট্রোজেনসমৃদ্ধ ও জলে ভেজা অবস্থায় ভালো বাড়ে।", fertilizerAdvice: "জৈব সার ও 4:2:1 NPK ব্যবহার করুন।", irrigationAdvice: "মৌসুমজুড়ে ২–৫ সেমি জল রাখুন।" },
    Maize: { explanation: "ভুট্টায় ভালো ফসফরাস ও সমতুল্য pH দরকার।", fertilizerAdvice: "সবুজ বৃদ্ধিতে বেশি নাইট্রোজেন দিন।", irrigationAdvice: "নিয়মিত সেচ দিন।" },
    "Pulses (Lentils)": { explanation: "ডাল নিজে নাইট্রোজেন স্থির করে; নিরপেক্ষ pH পছন্দ।", fertilizerAdvice: "কম নাইট্রোজেন; পটাশ ও ফসফরাসে ফোকাস।", irrigationAdvice: "ফুল ও শুঁটি ভরার সময় হালকা সেচ।" },
    Soybean: { explanation: "সয়াবিন ভাল ড্রেনেজযুক্ত মাটিতে বাড়ে।", fertilizerAdvice: "কম N, মাঝারি P ও K।", irrigationAdvice: "ফুল ও শুঁটি ভরার সময় জল জরুরি।" },
    Cotton: { explanation: "সুতির জন্য উচ্চ পটাশ ও যথেষ্ট জল দরকার।", fertilizerAdvice: "বল গঠনে পটাশ সমৃদ্ধ সার দিন।", irrigationAdvice: "উচ্চ (700–1300মিমি) জলের প্রয়োজন।" },
    Sugarcane: { explanation: "আখ দীর্ঘমেয়াদি ফসল; বেশি জল ও পুষ্টি দরকার।", fertilizerAdvice: "সামঞ্জস্যপূর্ণ NPK, জৈব সার যোগ করুন।", irrigationAdvice: "নিয়মিত নালা সেচ বজায় রাখুন।" },
    Potato: { explanation: "আলু ঠান্ডা আবহাওয়া ও ভাল ড্রেনেজে ভালো।", fertilizerAdvice: "রোপণের সময় NPK, পরে টপ ড্রেসিং।", irrigationAdvice: "কন্দ গঠনে আর্দ্রতা বজায় রাখুন।" },
    Groundnut: { explanation: "চিনাবাদাম বেলে দোআঁশ ও গরম আবহাওয়া পছন্দ করে।", fertilizerAdvice: "জিপসাম ও পটাশ; নাইট্রোজেন সীমিত।", irrigationAdvice: "ফুল ও ফল ভরার সময় সমান আর্দ্রতা।" },
  },
  ur: {
    Wheat: { explanation: "گندم معتدل نائٹروجن اور متوازن pH میں اچھی بڑھتی ہے۔", fertilizerAdvice: "متوازن NPK دیں، بوائی پر DAP۔", irrigationAdvice: "اہم مراحل پر آبپاشی کریں۔" },
    Rice: { explanation: "چاول نائٹروجن سے بھرپور اور پانی والی حالت میں پھلتا ہے۔", fertilizerAdvice: "نامیاتی کھاد اور 4:2:1 NPK استعمال کریں۔", irrigationAdvice: "موسم بھر 2–5 سم پانی برقرار رکھیں۔" },
    Maize: { explanation: "مکئی کو اچھا فاسفورس اور متوازن pH درکار ہے۔", fertilizerAdvice: "سبز بڑھوتری میں زیادہ نائٹروجن دیں۔", irrigationAdvice: "باقاعدہ آبپاشی کریں۔" },
    "Pulses (Lentils)": { explanation: "دالیں خود نائٹروجن ٹھیک کرتی ہیں؛ معتدل pH پسند کرتی ہیں۔", fertilizerAdvice: "کم نائٹروجن؛ پوٹاش اور فاسفورس پر زور۔", irrigationAdvice: "پھول اور پھلی بننے پر ہلکی آبپاشی۔" },
    Soybean: { explanation: "سویا بین اچھی نکاسی والی مٹی میں اگتی ہے۔", fertilizerAdvice: "کم N، درمیانی P اور K۔", irrigationAdvice: "پھول اور پھلی کے دوران پانی ضروری۔" },
    Cotton: { explanation: "روئی کے لیے زیادہ پوٹاش اور مناسب پانی درکار ہے۔", fertilizerAdvice: "بول ڈیولپمنٹ میں پوٹاش سے بھرپور کھاد۔", irrigationAdvice: "زیادہ (700–1300mm) پانی درکار۔" },
    Sugarcane: { explanation: "گنا طویل دورانیہ کی فصل ہے؛ زیادہ پانی و غذائیت چاہیے۔", fertilizerAdvice: "متوازن NPK، نامیاتی کھاد شامل کریں۔", irrigationAdvice: "نالی آبپاشی باقاعدگی سے رکھیں۔" },
    Potato: { explanation: "آلو ٹھنڈے موسم اور اچھی نکاسی میں بہتر۔", fertilizerAdvice: "پودے لگاتے وقت NPK اور بعد میں ٹاپ ڈریسنگ۔", irrigationAdvice: "کلب بننے پر نمی برقرار رکھیں۔" },
    Groundnut: { explanation: "مونگ پھلی ریتلی دوامی مٹی اور گرم حالات پسند کرتی ہے۔", fertilizerAdvice: "جپسَم اور پوٹاش؛ نائٹروجن محدود رکھیں۔", irrigationAdvice: "پھول اور پوڈ فلنگ پر یکساں نمی۔" },
  },
  kn: {
    Wheat: { explanation: "ಗೋದಿ ಮಧ್ಯಮ ನೈಟ್ರೋಜನ್ ಮತ್ತು ಸಮ pH ನಲ್ಲಿ ಚೆನ್ನಾಗಿ ಬೆಳೆಯುತ್ತದೆ.", fertilizerAdvice: "ಸಮತೋಲನ NPK; ಬಿತ್ತನೆಗೆ DAP.", irrigationAdvice: "ಮುಖ್ಯ ಹಂತಗಳಲ್ಲಿ ನೀರಾವರಿ ಮಾಡಿ." },
    Rice: { explanation: "ಅಕ್ಕಿ ನೈಟ್ರೋಜನ್ ಸಮೃದ್ಧ, ನೀರು ಲಭ್ಯ ಪರಿಸರದಲ್ಲಿ ಚೆನ್ನಾಗಿ ಬೆಳೆಯುತ್ತದೆ.", fertilizerAdvice: "ಸಾವಯವ ಗೊಬ್ಬರ ಹಾಗೂ 4:2:1 NPK.", irrigationAdvice: "ಬೆಳೆಯಾದರಿಂದು 2–5ಸೆ.ಮೀ ನೀರು ಇರಲಿ." },
    Maize: { explanation: "ಜೋಳಕ್ಕೆ ಉತ್ತಮ ಫಾಸ್ಫರಸ್ ಮತ್ತು ಸಮ pH ಬೇಕು.", fertilizerAdvice: "ಊಟದ ಬೆಳವಣಿಗೆಯಲ್ಲಿ ಹೆಚ್ಚು N.", irrigationAdvice: "ನಿಯಮಿತ ನೀರಾವರಿ.", },
    "Pulses (Lentils)": { explanation: "ಬೇಳೆಗಳು ಸ್ವಯಂ ನೈಟ್ರೋಜನ್ ನಿಶ್ಚಲಗೊಳಿಸುತ್ತವೆ; ಸಮ pH ಇಷ್ಟ.", fertilizerAdvice: "ಕಡಿಮೆ N; P ಮತ್ತು K ಮೇಲೆ ಗಮನ.", irrigationAdvice: "ಹೂವು/ಕಾಯಿ ಭರ್ತಿಯಲ್ಲಿ ಸಣ್ಣ ಪಾಸಣೆ.", },
    Soybean: { explanation: "ಸೊಯಾಬಿನ್ ಉತ್ತಮ ನೀರುಕಸಿತ ಮಣ್ಣಿನಲ್ಲಿ ಬೆಳೆಯುತ್ತದೆ.", fertilizerAdvice: "ಕಡಿಮೆ N, ಮಧ್ಯಮ P, K.", irrigationAdvice: "ಹೂವು/ಪಾಡ್ ಸಮಯದಲ್ಲಿ ನೀರು ಅಗತ್ಯ.", },
    Cotton: { explanation: "ಹತ್ತಿಗೆ ಹೆಚ್ಚಿನ ಪೊಟಾಷ್ ಹಾಗೂ ನೀರಿನ ಅವಶ್ಯಕತೆ.", fertilizerAdvice: "ಬೋಲ್ ಬೆಳವಣಿಗೆಯಲ್ಲಿ K-ಸಮೃದ್ಧ ಗೊಬ್ಬರ.", irrigationAdvice: "ಹೆಚ್ಚಿನ (700–1300ಮಿಮೀ) ನೀರು ಬೇಕು.", },
    Sugarcane: { explanation: "ಕರಿಯುಂಬು ದೀರ್ಘಾವಧಿ ಬೆಳೆ; ಹೆಚ್ಚುವರಿ ನೀರು/ಪೋಷಕಗಳು ಬೇಕು.", fertilizerAdvice: "ಸಮತೋಲನ NPK, ಸಾವಯವ ಗೊಬ್ಬರ ಸೇರಿಸಿ.", irrigationAdvice: "ನಾಲೆ ನೀರಾವರಿ ನಿಯಮಿತವಾಗಿರಲಿ.", },
    Potato: { explanation: "ಆಲೂಗಡ್ಡೆ ತಂಪು ಹವಾಮಾನ ಮತ್ತು ನೀರುಕಸಿತ ಮಣ್ಣಿನಲ್ಲಿ ಉತ್ತಮ.", fertilizerAdvice: "ನೆಡುವಾಗ NPK, ಬಳಿಕ ಟಾಪ್ ಡ್ರೆಸಿಂಗ್.", irrigationAdvice: "ಕಂದ ನಿರ್ಮಾಣದಲ್ಲಿ ತೇವ ಇರಲಿ.", },
    Groundnut: { explanation: "ಕಡಲೆಕಾಯಿ ಮರಳು ಲೋಮ ಮತ್ತು ಬಿಸಿ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಚೆನ್ನಾಗಿದೆ.", fertilizerAdvice: "ಜಿಪ್ಸಂ, ಪೊಟಾಷ್; N ಮಿತಿ.", irrigationAdvice: "ಹೂ/ಕಾಯಿ ಭರ್ತಿ ವೇಳೆ ಸಮ ತೇವ.", },
  },
  te: {
    Wheat: { explanation: "గోధుమ మిత నైట్రోజన్, సమ pH లో బాగా పెరుగుతుంది.", fertilizerAdvice: "సమతుల్య NPK; విత్తన సమయంలో DAP.", irrigationAdvice: "ముఖ్య దశల్లో నీటిపారుదల ఇవ్వండి." },
    Rice: { explanation: "బియ్యం నైట్రోజన్ సమృద్ధిగా, నీరు లభ్యమైన పరిస్థితుల్లో పుష్టిగా పెరుగుతుంది.", fertilizerAdvice: "సేంద్రీయ ఎరువులు, 4:2:1 NPK.", irrigationAdvice: "పెరుగుదలంతా 2–5సెం.మీ నీరు ఉంచండి.", },
    Maize: { explanation: "మొక్కజొన్నకు మంచి ఫాస్ఫరస్, సమ pH అవసరం.", fertilizerAdvice: "వెజిటేటివ్ గ్రోత్‌లో అధిక నైట్రోజన్.", irrigationAdvice: "నియమిత పారుదల.", },
    "Pulses (Lentils)": { explanation: "పప్పులు స్వయం నైట్రోజన్ స్థిరీకరిస్తాయి; తటస్థ pH ఇష్టం.", fertilizerAdvice: "తక్కువ N; P, K పై దృష్టి.", irrigationAdvice: "పుష్పించేటప్పుడు/పాడ్ ఫిల్లింగ్‌లో తక్కువ నీరు.", },
    Soybean: { explanation: "సోయాబీన్ మంచి డ్రైనేజుతో ఉన్న మట్టిలో పెరుగుతుంది.", fertilizerAdvice: "తక్కువ N, మధ్య P, K.", irrigationAdvice: "పుష్పం/పాడ్ సమయంలో నీరు ఎంతో ముఖ్యం.", },
    Cotton: { explanation: "పత్తికి అధిక పొటాష్, సరిపడ నీరు అవసరం.", fertilizerAdvice: "బోల్ డెవలప్మెంట్‌లో K-రిచ్ ఎరువులు.", irrigationAdvice: "అధిక (700–1300మి.మీ) నీటి అవసరం.", },
    Sugarcane: { explanation: "చెరకు దీర్ఘకాల పంట; అధిక నీరు/పోషకాలు అవసరం.", fertilizerAdvice: "సమతుల్య NPK, సేంద్రీయ ఎరువు చేర్చండి.", irrigationAdvice: "ఫరో ఇరిగేషన్ పద్ధతిని కొనసాగించండి.", },
    Potato: { explanation: "బంగాళాదుంప చల్లని వాతావరణం, డ్రైనేజ్ ఉన్న మట్టి ఇష్టం.", fertilizerAdvice: "నాటే సమయంలో NPK, తర్వాత టాప్ డ్రెస్సింగ్.", irrigationAdvice: "ట్యూబర్ ఏర్పడే సమయంలో తేమ ఉంచండి.", },
    Groundnut: { explanation: "వేరుశెనగ ఇసుక లోయం, వేడి పరిస్థితుల్లో బాగుంటుంది.", fertilizerAdvice: "జిప్సం, పొటాష్; N పరిమితం.", irrigationAdvice: "పుష్పం/పాడ్ ఫిల్లింగ్‌లో సమాన తేమ.", },
  },
  ml:
    { Wheat: { explanation: "ഗോതമ്പ് മിതമായ നൈട്രജനും സമതുലിത pH യിലും നന്നായി വളരും.", fertilizerAdvice: "സമതുലിത NPK; വിതയ്ക്കുമ്പോൾ DAP.", irrigationAdvice: "പ്രധാന ഘട്ടങ്ങളിൽ ജലസേചനം ചെയ്യുക." },
      Rice: { explanation: "അരി നൈട്രജൻ സമൃദ്ധവും ജല ലാഭ്യതയുള്ള സാഹചര്യങ്ങളിലും വളരും.", fertilizerAdvice: "സൈവ വളവും 4:2:1 NPK ഉം ഉപയോഗിക്കുക.", irrigationAdvice: "വളർച്ച മുഴുവൻ 2–5 സെ.മീ വെള്ളം നിലനിർത്തുക.", },
      Maize: { explanation: "ചോളം മികച്ച ഫോസ്ഫറസും സമ pH യും ആവശ്യമാണ്.", fertilizerAdvice: "സസ്യവളർച്ചയിൽ ഉയർന്ന നൈട്രജൻ.", irrigationAdvice: "ക്രമമായ ജലസേചനം.", },
      "Pulses (Lentils)": { explanation: "പയർവർഗങ്ങൾ നൈട്രജൻ സ്വയം സ്ഥിരപ്പെടുത്തും; ന്യൂട്രൽ pH ഇഷ്ടം.", fertilizerAdvice: "കുറഞ്ഞ N; P, K ശ്രദ്ധിക്കുക.", irrigationAdvice: "പൂക്കൾ/കായ് നിറയ്ക്കൽ സമയത്ത് ലഘു ജലസേചനം.", },
      Soybean: { explanation: "സോയാബീൻ നല്ല ഡ്രെയിനേജ് ഉള്ള മണ്ണിൽ വളരും.", fertilizerAdvice: "കുറഞ്ഞ N, മിതമായ P, K.", irrigationAdvice: "പൂക്കളിലും കായ് നിറയ്ക്കലിലും ജലം നിർബന്ധം.", },
      Cotton: { explanation: "പത്തി നാരിന് ഉയർന്ന പൊട്ടാഷും മതിയായ വെള്ളവും വേണം.", fertilizerAdvice: "ബോൾ വികസനത്തിൽ K-സമൃദ്ധമായ വളം.", irrigationAdvice: "ഉയർന്ന (700–1300മിമീ) ജലാവശ്യകത.", },
      Sugarcane: { explanation: "കരിമ്പ് ദീർഘകാല വിള; കൂടുതലുള്ള ജല/പോഷക ആവശ്യം.", fertilizerAdvice: "സമതുലിത NPK, ജൈവവളം ചേർക്കുക.", irrigationAdvice: "കുഴിവയൽ ജലസേചനം തുടരുക.", },
      Potato: { explanation: "ഉരുളകിഴങ്ങ് തണുത്ത കാലാവസ്ഥയും ഡ്രെയിനേജ് ഉള്ള മണ്ണും ഇഷ്ടം.", fertilizerAdvice: "നട്ട് സമയത്ത് NPK, പിന്നീട് ടോപ് ഡ്രസ്സിംഗ്.", irrigationAdvice: "കന്ധങ്ങൾ രൂപപ്പെടുമ്പോൾ ഈർപ്പം കൈവശം വയ്ക്കുക.", },
      Groundnut: { explanation: "വേർകടല മണൽ-ലോം മണ്ണിലും ചൂടിലും മികച്ചത്.", fertilizerAdvice: "ജിപ്സം, പൊട്ടാഷ്; N നിയന്ത്രിക്കുക.", irrigationAdvice: "പൂ/പോഡ് നിറയ്ക്കലിൽ തുല്യ ഈർപ്പം.", },
    },
};

// Helper to translate a crop's text fields with fallback to originals
function translateCropContent(
  lang: keyof typeof cropNameTranslations,
  name: string,
  fields: { explanation: string; fertilizerAdvice: string; irrigationAdvice: string }
) {
  const m = cropContentTranslations[lang]?.[name];
  return {
    explanation: m?.explanation ?? fields.explanation,
    fertilizerAdvice: m?.fertilizerAdvice ?? fields.fertilizerAdvice,
    irrigationAdvice: m?.irrigationAdvice ?? fields.irrigationAdvice,
  };
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  type Language = "en" | "hi" | "ta" | "bn" | "ur" | "kn" | "te" | "ml";
  const [language, setLanguage] = useState<Language>("en");
  const [isListening, setIsListening] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasRequestedRecs, setHasRequestedRecs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
    soilMoisture: "",
    waterAvailability: "",
    location: "",
  });

  const [recommendations, setRecommendations] = useState(null as null | Array<{
    name: string;
    confidence: number;
    explanation: string;
    profitEstimate: number;
    waterUsage: string;
    fertilizerAdvice: string;
    irrigationAdvice: string;
  }>);
  type WeatherData = {
    temperature: number;
    humidity: number;
    rainfall: number;
    forecast: string;
    localTime?: string;
  };
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  const createRecommendation = useMutation(api.recommendations.createRecommendation);
  const userRecommendations = useQuery(api.recommendations.getRecommendations, {});
  // Fetch market prices for the sidebar (kept but we will render custom table)
  const marketPrices = useQuery(api.market.getMarketPrices, {});

  // Language translations (ensure const assertion)
  const translations = {
    en: {
      title: "KisanYatra: AI Crop Recommendation System",
      subtitle: "Get personalized crop recommendations based on your soil data",
      soilData: "Soil Data Input",
      nitrogen: "Nitrogen (N) - kg/ha",
      phosphorus: "Phosphorus (P) - kg/ha",
      potassium: "Potassium (K) - kg/ha",
      ph: "pH Level",
      soilMoisture: "Soil Moisture (%)",
      waterAvailability: "Water Availability (%)",
      location: "Location",
      getRecommendation: "Get Crop Recommendation",
      recommendations: "Recommended Crops",
      fertilizerAdvice: "Fertilizer Advice",
      irrigationAdvice: "Irrigation Advice",
      match: "match",
      marketPrices: "Market Prices",
      weather: "Weather Forecast",
      offline: "You are offline. Using cached data.",
      listening: "Listening...",
      speak: "Speak your input",
      connect: "Connect",
      chat: "Chat",
      contacts: "Contacts",
      enterMessage: "Type a message...",
      shareContact: "Share Contact",
      name: "Name",
      phone: "Phone",
      note: "Note (optional)",
      post: "Post",
      save: "Save",
      stateRoom: "State room",
    },
    hi: {
      title: "KisanYatra: एआई फसल सिफारिश प्रणाली",
      subtitle: "अपने मिट्टी के डेटा के आधार पर व्यक्तिगत फसल सिफारिशें प्राप्त करें",
      soilData: "मिट्टी डेटा इनपुट",
      nitrogen: "नाइट्रोजन (N) - किग्रा/हेक्टेयर",
      phosphorus: "फास्फोरस (P) - किग्रा/हेक्टेयर",
      potassium: "पोटेशियम (K) - किग्रा/हेक्टेयर",
      ph: "पीएच स्तर",
      soilMoisture: "मिट्टी की नमी (%)",
      waterAvailability: "पानी की उपलब्धता (%)",
      location: "स्थान",
      getRecommendation: "फसल सिफारिश प्राप्त करें",
      recommendations: "सुझाई गई फसलें",
      fertilizerAdvice: "उर्वरक सलाह",
      irrigationAdvice: "सिंचाई सलाह",
      match: "मेल",
      marketPrices: "बाजार मूल्य",
      weather: "मौसम पूर्वानुमान",
      offline: "आप ऑफ़लाइन हैं। कैश्ड डेटा का उपयोग कर रहे हैं।",
      listening: "सुन रहा है...",
      speak: "अपना इनपुट बोलें",
      connect: "कनेक्ट",
      chat: "चैट",
      contacts: "संपर्क",
      enterMessage: "संदेश लिखें...",
      shareContact: "संपर्क साझा करें",
      name: "Name",
      phone: "Phone",
      note: "Note (optional)",
      post: "Post",
      save: "Save",
      stateRoom: "State room",
    },
    ta: {
      title: "KisanYatra: ஏஐ பயிர் பரிந்துரை அமைப்பு",
      subtitle: "உங்கள் மண் தரவின் அடிப்படையில் தனிப்பயன் பரிந்துரைகள்",
      soilData: "மண் தரவு",
      nitrogen: "நைட்ரஜன் (N) - கி/ஹெ",
      phosphorus: "பாஸ்பரஸ் (P) - கி/ஹெ",
      potassium: "பொட்டாசியம் (K) - கி/ஹெ",
      ph: "pH நிலை",
      soilMoisture: "மண் ஈரப்பதம் (%)",
      waterAvailability: "தண்ணீர் கிடைக்கும் (%)",
      location: "இடம்",
      getRecommendation: "பரிந்துரை பெற",
      recommendations: "பரிந்துரைக்கப்பட்ட பயிர்கள்",
      fertilizerAdvice: "உர ஆலோசனை",
      irrigationAdvice: "நீர்ப்பாசன ஆலோசனை",
      match: "பொருந்தல்",
      marketPrices: "சந்தை விலை",
      weather: "வானிலை",
      offline: "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்.",
      listening: "கேட்கிறது...",
      speak: "உங்கள் உள்ளீட்டை பேசுங்கள்",
      connect: "இணை",
      chat: "அரட்டை",
      contacts: "தொடர்புகள்",
      enterMessage: "செய்தி எழுதவும்...",
      shareContact: "தொடர்பை பகிர்",
      name: "பெயர்",
      phone: "பேசி",
      note: "Note (optional)",
      post: "Post",
      save: "Save",
      stateRoom: "மாநில அறை",
    },
    bn: {
      title: "KisanYatra: এআই ফসল সুপারিশ ব্যবস্থা",
      subtitle: "মাটির ডেটার উপর ভিত্তি করে ব্যক্তিগত সুপারিশ",
      soilData: "মাটির তথ্য",
      nitrogen: "নাইট্রোজেন (N) - কেজি/হেঃ",
      phosphorus: "ফাস্ফরাস (P) - কেজি/হেঃ",
      potassium: "পটাশিয়াম (K) - কেজি/হেঃ",
      ph: "pH স্তর",
      soilMoisture: "মাটির আর্দ্রতা (%)",
      waterAvailability: "জলের প্রাপ্যতা (%)",
      location: "অবস্থান",
      getRecommendation: "ফসল সুপারিশ পান",
      recommendations: "প্রস্তাবিত ফসল",
      fertilizerAdvice: "সার পরামর্শ",
      irrigationAdvice: "সেচ পরামর্শ",
      match: "মিল",
      marketPrices: "বাজার মূল্য",
      weather: "আবহাওয়া",
      offline: "আপনি অফলাইন।",
      listening: "শুনছে...",
      speak: "আপনার ইনপুট বলুন",
      connect: "সংযুক্ত হোন",
      chat: "চ্যাট",
      contacts: "যোগাযোগ",
      enterMessage: "বার্তা লিখুন...",
      shareContact: "যোগাযোগ শেয়ার করুন",
      name: "নাম",
      phone: "ফোন",
      note: "নোট (ঐচ্ছিক)",
      post: "পোস্ট",
      save: "সংরক্ষণ",
      stateRoom: "রাজ্য কক্ষ",
    },
    ur: {
      title: "KisanYatra: اے آئی فصل کی سفارشات",
      subtitle: "آپ کی مٹی کے ڈیٹا پر مبنی ذاتی سفارشات",
      soilData: "مٹی کے ڈیٹا",
      nitrogen: "نائٹروجن (N) - کلو/ہیکٹر",
      phosphorus: "فاسفورس (P) - کلو/ہیکٹر",
      potassium: "پوٹاشیم (K) - کلو/ہیکٹر",
      ph: "pH سطح",
      soilMoisture: "مٹی کی نمی (%)",
      waterAvailability: "پانی کی دستیابی (%)",
      location: "مقام",
      getRecommendation: "فصل کی سفارش حاصل کریں",
      recommendations: "سفارش کردہ فصلیں",
      fertilizerAdvice: "کھاد مشورہ",
      irrigationAdvice: "آبپاشی مشورہ",
      match: "میچ",
      marketPrices: "بازار قیمتیں",
      weather: "موسم",
      offline: "آپ آف لائن ہیں۔",
      listening: "سن رہا ہے...",
      speak: "اپنا ان پٹ بولیں",
      connect: "رابطہ",
      chat: "چیٹ",
      contacts: "رابطے",
      enterMessage: "پیغام لکھیں...",
      shareContact: "رابطہ شیئر کریں",
      name: "نام",
      phone: "فون",
      note: "نوٹ (اختیاری)",
      post: "پوسٹ",
      save: "محفوظ کریں",
      stateRoom: "ریاست کمرہ",
    },
    kn: {
      title: "KisanYatra: ಎಐ ಬೆಳೆ ಶಿಫಾರಸು ವ್ಯವಸ್ಥೆ",
      subtitle: "ನಿಮ್ಮ ಮಣ್ಣಿನ ಡೇಟಾ ಆಧಾರಿತ ವೈಯಕ್ತಿಕ ಶಿಫಾರಸುಗಳು",
      soilData: "ಮಣ್ಣಿನ ಡೇಟಾ",
      nitrogen: "ನೈಟ್ರೋಜನ್ (N) - ಕೆಜಿ/ಹೆ",
      phosphorus: "ಫಾಸ್ಫರಸ್ (P) - ಕೆಜಿ/ಹೆ",
      potassium: "ಪೊಟಾಷಿಯಂ (K) - ಕೆಜಿ/ಹೆ",
      ph: "pH ಮಟ್ಟ",
      soilMoisture: "ಮಣ್ಣಿನ ತೇವಾಂಶ (%)",
      waterAvailability: "ನೀರು ಲಭ್ಯತೆ (%)",
      location: "ಸ್ಥಳ",
      getRecommendation: "ಬೆಳೆ ಶಿಫಾರಸು ಪಡೆಯಿರಿ",
      recommendations: "ಶಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆಗಳು",
      fertilizerAdvice: "ರಸಗೊಬ್ಬರ ಸಲಹೆ",
      irrigationAdvice: "ನೀರಾವರಿ ಸಲಹೆ",
      match: "ಹೊಂದಿಕೆ",
      marketPrices: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
      weather: "ಕಾಲಾವಸ್ಥ",
      offline: "ನೀವು ಆಫ್‌ಲೈನ್‌ ಇದ್ದೀರಿ.",
      listening: "ಕೆಳುತ್ತಿದೆ...",
      speak: "ನಿಮ್ಮ ಇನ್‌inpುಟ್ ಮಾತನಾಡಿ",
      connect: "ಕನೆಕ್ಟ್",
      chat: "ಚಾಟ್",
      contacts: "ಸಂಪರ್ಕಗಳು",
      enterMessage: "ಸಂದೇಶವನ್ನು ಬರೆಯಿರಿ...",
      shareContact: "ಸಂಪರ್ಕಾನ್ನಿ പങ്കಿಟುಕ",
      name: "ಹೆಸರು",
      phone: "ಫೋನ್",
      note: "ಗಮನಿಕ (ಐಚ್ಛಿಕಂ)",
      post: "Post",
      save: "ಉಳಿಸಿ",
      stateRoom: "ರಾಜ್ಯ ಕೊಠಡಿ",
    },
    te: {
      title: "KisanYatra: ఏఐ పంట సిఫార్సు వ్యవస్త",
      subtitle: "మీ నేల డేటా ఆధారంగా వ్యక్తిగత సిఫార్సులు",
      soilData: "నేల డేటా",
      nitrogen: "నైట్రోజన్ (N) - కేజీ/హె",
      phosphorus: "ఫాస్ఫరస్ (P) - కేజీ/హె",
      potassium: "పొటాషియం (K) - కేజీ/హె",
      ph: "pH స్థాయి",
      soilMoisture: "నేల తేమ (%)",
      waterAvailability: "నీటి లభ్యత (%)",
      location: "స్థానం",
      getRecommendation: "పంట సిఫార్సు పొందండి",
      recommendations: "సిఫారసు చేసిన పంటలు",
      fertilizerAdvice: "ఎరువు సలహా",
      irrigationAdvice: "పారుదల సలహా",
      match: "పొంతన",
      marketPrices: "మారుకట్టె బెలెగళు",
      weather: "వాతావరణం",
      offline: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు.",
      listening: "వింటోంది...",
      speak: "మీ ఇన్‌పుట్ మాట్లాడండి",
      connect: "కనెక్ట్",
      chat: "చాట్",
      contacts: "సంపర్కాలు",
      enterMessage: "సందేశం టైప్ చేయండి...",
      shareContact: "సంపర్కాన్ని పంచుకోండి",
      name: "పేరు",
      phone: "ఫోన్",
      note: "గమనిక (ఐచ్చికం)",
      post: "పోస్ట్",
      save: "సేవ్",
      stateRoom: "రాష్ట్ర గది",
    },
    ml: {
      title: "KisanYatra: എഐ വിള ശുപാർശ സംവിധാനം",
      subtitle: "നിങ്ങളുടെ മണ്ണ് ഡാറ്റയെ അടിസ്ഥാനമാക്കി വ്യക്തിഗത വിള ശുപാർശകൾ നേടുക",
      soilData: "മണ്ണ് ഡാറ്റ ഇൻപുട്ട്",
      nitrogen: "നൈട്രജൻ (N) - kg/ha",
      phosphorus: "ഫോസ്ഫറസ് (P) - kg/ha",
      potassium: "പൊട്ടാഷ്യം (K) - kg/ha",
      ph: "pH നില",
      soilMoisture: "മണ്ണിലെ ഈർപ്പം (%)",
      waterAvailability: "ജല ലഭ്യത (%)",
      location: "സ്ഥാനം",
      getRecommendation: "വിള ശുപാർശ ലഭിക്കുക",
      recommendations: "ശുപാർശ ചെയ്യുന്ന വിളകൾ",
      fertilizerAdvice: "വളം നിർദ്ദേശം",
      irrigationAdvice: "നനയ്ക്കൽ നിർദ്ദേശം",
      match: "പൊരുത്തം",
      marketPrices: "മാർക്കറ്റ് വിലകൾ",
      weather: "കാലാവസ്ഥ",
      offline: "നി́ങ്ങൾ ഓഫ്‌ലൈൻ ആണ്. കാഷെ ചെയ്ത ഡാറ്റ ഉപയോഗിക്കുന്നു.",
      listening: "കേൾക്കുന്നു...",
      speak: "നിങ്ങളുടെ ഇൻപുട്ട് സംസാരിക്കുക",
      connect: "കണക്റ്റ്",
      chat: "ചാറ്റ്",
      contacts: "സംപര്കഗളു",
      enterMessage: "സന്ദേശം ടൈപ്പ് ചെയ്യുക...",
      shareContact: "സംപര്കാന്നി പങ്കിടുക",
      name: "പേര്",
      phone: "ഫോണ്‍",
      note: "ഗമനിക (ഐച്ഛികം)",
      post: "പോസ്റ്റ്",
      save: "സേവ്",
      stateRoom: "സ്റ്റേറ്റ് റൂം",
    },
  } as const;

  const t = translations[language];

  // Removed local dark mode toggle; using global top-right toggle app-wide

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Enhance geolocation with permission handling, reverse geocoding (optional), and accurate weather
  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      // @ts-ignore
      if (navigator.permissions && navigator.permissions.query) {
        // @ts-ignore
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "denied") {
          toast.error("Location permission denied. Please allow location access in browser settings.");
          // Fallback to IP-based location when permission is denied
          try {
            const resp = await fetch("https://ipapi.co/json");
            if (resp.ok) {
              const j = await resp.json();
              const pretty = [j.city, j.region].filter(Boolean).join(", ");
              setFormData((prev) => ({ ...prev, location: pretty }));
              setWeatherData(deriveWeatherFromLocation(pretty));
              toast.success("Approximate location detected from IP.");
            } else {
              toast.message("Unable to fetch approximate location.");
            }
          } catch {
            // ignore
          }
          setIsLocating(false);
          return;
        }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            // Try reverse geocoding via Google if key exists
            let pretty = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
            try {
              if (key) {
                const resp = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`,
                );
                const gj = await resp.json();
                const comp = gj?.results?.[0]?.address_components as Array<any> | undefined;
                if (comp) {
                  const city = comp.find((c) => c.types.includes("locality"))?.long_name;
                  const state = comp.find((c) => c.types.includes("administrative_area_level_1"))?.long_name;
                  if (city || state) pretty = [city, state].filter(Boolean).join(", ");
                }
              }
            } catch {
              // silent fallback to coords string
            }

            setFormData((prev) => ({ ...prev, location: pretty }));

            try {
              const w = await fetchWeather(latitude, longitude);
              setWeatherData(w);
            } catch {
              setWeatherData(deriveWeatherFromLocation(pretty));
            }
            toast.success("Location detected successfully!");
            setIsLocating(false);
          },
          async () => {
            // On error: try IP-based approximate location
            try {
              const resp = await fetch("https://ipapi.co/json");
              if (resp.ok) {
                const j = await resp.json();
                const pretty = [j.city, j.region].filter(Boolean).join(", ");
                setFormData((prev) => ({ ...prev, location: pretty }));
                setWeatherData(deriveWeatherFromLocation(pretty));
                toast.success("Approximate location detected from IP.");
              } else {
                toast.error("Unable to get location automatically. Please enter location manually.");
              }
            } catch {
              toast.error("Unable to get location automatically. Please enter location manually.");
            }
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      } else {
        toast.error("Geolocation not supported by this browser.");
        // Fallback attempt via IP
        try {
          const resp = await fetch("https://ipapi.co/json");
          if (resp.ok) {
            const j = await resp.json();
            const pretty = [j.city, j.region].filter(Boolean).join(", ");
            setFormData((prev) => ({ ...prev, location: pretty }));
            setWeatherData(deriveWeatherFromLocation(pretty));
            toast.success("Approximate location detected from IP.");
          }
        } catch {
          // ignore
        }
        setIsLocating(false);
      }
    } catch {
      toast.error("Location access error. Please enter manually.");
      setIsLocating(false);
    }
  };

  // Speech recognition
  const startListening = () => {
    const w = window as unknown as {
      webkitSpeechRecognition?: any;
      SpeechRecognition?: any;
    };
    if ('webkitSpeechRecognition' in w || 'SpeechRecognition' in w) {
      const SpeechRecognition = w.webkitSpeechRecognition || w.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsListening(true);
        toast.info(t.listening);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript as string;
        // Simple parsing for demo - in production, use NLP
        if (transcript.toLowerCase().includes('nitrogen')) {
          const match = transcript.match(/\d+/);
          if (match) {
            setFormData(prev => ({ ...prev, nitrogen: match[0] }));
          }
        }
        toast.success(`Heard: ${transcript}`);
      };
      
      recognition.onerror = () => {
        toast.error("Speech recognition error");
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      toast.error("Speech recognition not supported");
    }
  };

  // Text to speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await createRecommendation({
        nitrogen: parseFloat(formData.nitrogen),
        phosphorus: parseFloat(formData.phosphorus),
        potassium: parseFloat(formData.potassium),
        ph: parseFloat(formData.ph),
        soilMoisture: parseFloat(formData.soilMoisture),
        waterAvailability: parseFloat(formData.waterAvailability),
        location: formData.location,
      });

      const recs = (result as any).recommendedCrops as typeof recommendations;
      setRecommendations(recs);
      setHasRequestedRecs(true);

      if (Array.isArray(recs) && recs.length === 0) {
        toast.message("No exact matches found. Showing best-fit suggestions.");
      } else {
        toast.success("Crop recommendations generated!");
      }

      // Derive weather based on the submitted location for variability
      if (formData.location) {
        setWeatherData(deriveWeatherFromLocation(formData.location));
      }
      
    } catch (error) {
      toast.error("Failed to generate recommendations");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the crop recommendation system.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300`}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 pr-56 md:pr-72">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">KisanYatra: AI Crop Recommendation System</h1>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
              {/* Add top-level Connect navigation button */}
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/connect")}
                className="hidden sm:inline-flex"
                disabled={isSubmitting || isLocating}
              >
                {t.connect}
              </Button>
              {/* Language Toggle */}
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
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
              
              {/* Dark mode toggle removed in favor of global toggle */}
            </div>
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
          {t.offline}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wheat className="h-5 w-5" />
                    {t.soilData}
                  </CardTitle>
                  <CardDescription>
                    Enter your soil parameters to get personalized crop recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nitrogen">{t.nitrogen}</Label>
                        <Input
                          id="nitrogen"
                          type="number"
                          placeholder="0-100"
                          value={formData.nitrogen}
                          onChange={(e) => setFormData(prev => ({ ...prev, nitrogen: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phosphorus">{t.phosphorus}</Label>
                        <Input
                          id="phosphorus"
                          type="number"
                          placeholder="0-100"
                          value={formData.phosphorus}
                          onChange={(e) => setFormData(prev => ({ ...prev, phosphorus: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="potassium">{t.potassium}</Label>
                        <Input
                          id="potassium"
                          type="number"
                          placeholder="0-100"
                          value={formData.potassium}
                          onChange={(e) => setFormData(prev => ({ ...prev, potassium: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ph">{t.ph}</Label>
                        <Input
                          id="ph"
                          type="number"
                          step="0.1"
                          placeholder="0-14"
                          value={formData.ph}
                          onChange={(e) => setFormData(prev => ({ ...prev, ph: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="soilMoisture">{t.soilMoisture}</Label>
                        <Input
                          id="soilMoisture"
                          type="number"
                          placeholder="0-100"
                          value={formData.soilMoisture}
                          onChange={(e) => setFormData(prev => ({ ...prev, soilMoisture: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="waterAvailability">{t.waterAvailability}</Label>
                        <Input
                          id="waterAvailability"
                          type="number"
                          placeholder="0-100"
                          value={formData.waterAvailability}
                          onChange={(e) => setFormData(prev => ({ ...prev, waterAvailability: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">{t.location}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="location"
                          placeholder="Enter location or use GPS"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          required
                          inputMode="text"
                        />
                        <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isLocating}>
                          {isLocating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          t.getRecommendation
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startListening}
                        disabled={isListening || isSubmitting || isLocating}
                        aria-busy={isListening}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <WeatherCard t={t} weatherData={weatherData} />
            </motion.div>

            {/* Market Prices (formatted table, last updated: Today) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <MarketPricesCard t={t as any} cropEmojis={cropEmojis} />
            </motion.div>
          </div>
        </div>

        {/* Recommendations Results */}
        {hasRequestedRecs && ((recommendations && recommendations.length > 0) || (userRecommendations && userRecommendations.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <RecommendationsList
              t={t as any}
              cropEmojis={cropEmojis}
              recommendations={recommendations}
              userRecommendations={userRecommendations}
              speakText={speakText}
              translateName={(name) => translateCropName(language, name)}
              translateFields={(name, fields) =>
                translateCropContent(language, name, fields)
              }
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-8"
        >
          {/* ConnectSection moved to dedicated page */}
        </motion.div>
      </div>
    </div>
  );
}