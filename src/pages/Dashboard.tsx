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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      marketPrices: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
      weather: "ಕಾಲಾವಸ್ಥ",
      offline: "ನೀವು ಆಫ್‌ಲೈನ್‌ ಇದ್ದೀರಿ.",
      listening: "ಕೆಳುತ್ತಿದೆ...",
      speak: "ನಿಮ್ಮ ಇನ್‌inpುಟ್ ಮಾತನಾಡಿ",
      connect: "ಕನೆಕ್ಟ್",
      chat: "ಚಾಟ್",
      contacts: "ಸಂಪರ್ಕಗಳು",
      enterMessage: "ಸಂದೇಶವನ್ನು ಬರೆಯಿರಿ...",
      shareContact: "ಸಂಪರ್ಕಾನ್ನಿ പങ്കിടുക",
      name: "ಹೆಸರು",
      phone: "ಫೋನ್",
      note: "ಗಮನಿಕ (ಐಚ್ಛಿಕಂ)",
      post: "പോസ്റ്റ്",
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
      location: "స్�ానం",
      getRecommendation: "పంట సిఫార్సు పొందండి",
      recommendations: "సిఫారసు చేసిన పంటలు",
      marketPrices: "మారుకಟ్టె బెలెగళు",
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
          () => {
            toast.error("Unable to get location automatically. Please enter location manually.");
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      } else {
        toast.error("Geolocation not supported by this browser.");
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