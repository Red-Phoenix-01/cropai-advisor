import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Moon, 
  Sun, 
  TrendingUp, 
  Wheat,
  Globe,
  Volume2,
  DollarSign
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  type Language = "en" | "hi";
  const [language, setLanguage] = useState<Language>("en");
  const [isListening, setIsListening] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
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
  };
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  const createRecommendation = useMutation(api.recommendations.createRecommendation);
  const userRecommendations = useQuery(api.recommendations.getRecommendations, {});
  const marketPrices = useQuery(api.market.getMarketPrices, {});

  // Language translations (ensure const assertion)
  const translations = {
    en: {
      title: "AI Crop Recommendation System",
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
    },
    hi: {
      title: "एआई फसल सिफारिश प्रणाली",
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
    }
  } as const;

  const t = translations[language];

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

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

  // Get user location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          }));
          toast.success("Location detected successfully!");
        },
        (error) => {
          toast.error("Unable to get location. Please enter manually.");
        }
      );
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

      if (Array.isArray(recs) && recs.length === 0) {
        toast.message("No exact matches found. Showing best-fit suggestions.");
      } else {
        toast.success("Crop recommendations generated!");
      }

      // Fetch weather data (mock for demo)
      const mockWeather: WeatherData = {
        temperature: 28,
        humidity: 65,
        rainfall: 12,
        forecast: "Partly cloudy with chance of rain"
      };
      setWeatherData(mockWeather);
      
    } catch (error) {
      toast.error("Failed to generate recommendations");
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="w-20">
                  <Globe className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="hi">हि</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
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
                        />
                        <Button type="button" variant="outline" onClick={getCurrentLocation}>
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {t.getRecommendation}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startListening}
                        disabled={isListening}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CloudRain className="h-5 w-5" />
                    {t.weather}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weatherData ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span>{weatherData.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Humidity:</span>
                        <span>{weatherData.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rainfall:</span>
                        <span>{weatherData.rainfall}mm</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{weatherData.forecast}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Enter location to get weather data</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Market Prices */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t.marketPrices}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketPrices?.slice(0, 5).map((price, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{price.crop}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">₹{price.price}</div>
                          <div className="text-xs text-muted-foreground">{price.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Recommendations Results */}
        {((recommendations && recommendations.length > 0) || (userRecommendations && userRecommendations.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5" />
                    {t.recommendations}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => speakText("Here are your crop recommendations")}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(recommendations ?? userRecommendations?.[0]?.recommendedCrops ?? []).map((crop, index) => (
                    <Card key={index} className="border-2 hover:border-green-400/60 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{crop.name}</CardTitle>
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                            {(crop.confidence * 100).toFixed(0)}% match
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{crop.explanation}</p>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">₹{crop.profitEstimate.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets className="h-4 w-4 text-blue-600" />
                            <span>{crop.waterUsage}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm">
                            <span className="font-medium">Fertilizer Advice</span>
                            <div className="text-muted-foreground">{crop.fertilizerAdvice}</div>
                          </div>
                          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
                            <span className="font-medium">Irrigation Advice</span>
                            <div className="text-muted-foreground">{crop.irrigationAdvice}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}