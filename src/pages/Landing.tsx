import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CloudRain, 
  Leaf, 
  Mic, 
  Smartphone, 
  TrendingUp, 
  Wheat,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Add: location detection state
  const [locating, setLocating] = useState(false);
  const [locationText, setLocationText] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  // Add: coordinates text to mirror "Latitude/Longitude" like the snippet
  const [coordsText, setCoordsText] = useState<string | null>(null);

  const cropEmojis: Record<string, string> = {
    Rice: "🌾",
    Wheat: "🌾",
    Maize: "🌽",
    Cotton: "🧵",
    Sugarcane: "🍬",
    Groundnut: "🥜",
  };
  const marketPricesData: Array<{ crop: string; price: number; change: number }> = [
    { crop: "Rice", price: 2150, change: +5.2 },
    { crop: "Wheat", price: 2050, change: -2.1 },
    { crop: "Maize", price: 1850, change: 0 },
    { crop: "Cotton", price: 5200, change: +8.5 },
    { crop: "Sugarcane", price: 3200, change: +4.5 },
    { crop: "Groundnut", price: 5809, change: +3.1 },
  ];

  const features = [
    {
      icon: <Leaf className="h-8 w-8 text-green-600" />,
      title: "AI-Powered Recommendations",
      description: "Get personalized crop suggestions based on your soil data and local conditions"
    },
    {
      icon: <CloudRain className="h-8 w-8 text-blue-600" />,
      title: "Weather Integration",
      description: "Real-time weather data and alerts to help you make informed decisions"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
      title: "Market Prices",
      description: "Stay updated with current mandi prices and market trends"
    },
    {
      icon: <Mic className="h-8 w-8 text-orange-600" />,
      title: "Voice Support",
      description: "Speak your inputs in Hindi or English with voice recognition"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-indigo-600" />,
      title: "Mobile First",
      description: "Works offline as a Progressive Web App on any device"
    },
    {
      icon: <Globe className="h-8 w-8 text-teal-600" />,
      title: "Multilingual",
      description: "Available in 8 languages: English, Hindi, Tamil, Bengali, Urdu, Kannada, Telugu, Malayalam"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Farmers Helped" },
    { number: "25+", label: "Crop Types" },
    { number: "95%", label: "Accuracy Rate" },
    { number: "24/7", label: "Support" }
  ];

  // Add: Reverse geocode using Google Maps Geocoding API
  async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const key = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!key) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY not set; skipping reverse geocoding.");
      return null;
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
      `${lat},${lng}`
    )}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to reach Google Geocoding API");
    const data = await res.json();
    if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    // Try to extract city (locality) and state (administrative_area_level_1)
    const components: Array<any> = data.results[0].address_components ?? [];
    let city: string | null = null;
    let state: string | null = null;

    for (const c of components) {
      const types: Array<string> = c.types ?? [];
      if (types.includes("locality")) city = c.long_name;
      if (types.includes("administrative_area_level_1")) state = c.long_name;
    }

    if (city && state) return `${city}, ${state}`;
    if (state) return state;
    return data.results[0].formatted_address ?? null;
  }

  // Add: Detect location handler
  async function detectLocation() {
    setLocating(true);
    setLocationError(null);
    // Clear previous coords before new attempt
    setCoordsText(null);
    try {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation not supported");
      }
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords;
              // Show raw coordinates similar to the provided snippet
              setCoordsText(`Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`);
              const pretty = await reverseGeocode(latitude, longitude);
              setLocationText(pretty ?? `Lat ${latitude.toFixed(3)}, Lng ${longitude.toFixed(3)}`);
              resolve();
            } catch (e) {
              console.warn(e);
              setLocationText(`Lat ${pos.coords.latitude.toFixed(3)}, Lng ${pos.coords.longitude.toFixed(3)}`);
              setCoordsText(`Latitude: ${pos.coords.latitude.toFixed(6)}, Longitude: ${pos.coords.longitude.toFixed(6)}`);
              resolve();
            }
          },
          (err) => {
            reject(new Error(err.message || "Unable to get location"));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    } catch (e: any) {
      setLocationError(e?.message ?? "Failed to detect location");
      setCoordsText(null);
    } finally {
      setLocating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Wheat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">KisanYatra</h1>
                <p className="text-xs text-muted-foreground">Smart Farming Solutions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-1 pr-32 md:pr-48">
              <Button 
                size="sm" 
                className="rounded-full"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              >
                {isAuthenticated ? "Free Trial" : "Start free Trial ->"}
              </Button>
              <Button
                size="sm"
                className="bg-green-700 hover:bg-green-800 text-white border-0 rounded-full"
                onClick={() => navigate("/auth")}
                aria-label="Sign in"
                title="Sign in"
              >
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Leaf className="h-4 w-4" />
              AI-Powered Agriculture
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Crop
              <br />
              Recommendations
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Maximize your harvest with AI-driven insights. Get personalized crop recommendations, 
              weather alerts, and market prices - all in your local language.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              >
                {isAuthenticated ? "Free Trial" : "Start free Trial ->"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-green-700 hover:bg-green-800 text-white border-0 rounded-full"
                onClick={() => navigate("/auth")}
                aria-label="Sign in"
                title="Sign in"
              >
                Sign in
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              {/* Use Google Maps API + Geolocation; show coordinates like the snippet */}
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={detectLocation}
                disabled={locating}
                aria-busy={locating}
                aria-label="Get My Location"
                title="Get My Location"
              >
                {locating ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                    Detecting...
                  </span>
                ) : (
                  "Get My Location"
                )}
              </Button>
            </div>

            {/* Location display / error with coordinates line */}
            {(locationText || locationError || coordsText) && (
              <div className="mt-4 flex justify-center">
                <div
                  className={`text-sm px-3 py-2 rounded-full ${
                    locationError
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {locationError
                    ? locationError
                    : [
                        locationText ? `Detected: ${locationText}` : null,
                        coordsText ? `(${coordsText})` : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                </div>
              </div>
            )}
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                      <Leaf className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Soil Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Nitrogen:</span>
                        <span className="font-medium">45 kg/ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span>pH Level:</span>
                        <span className="font-medium">6.8</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Moisture:</span>
                        <span className="font-medium">65%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                      <CloudRain className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">Weather</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span className="font-medium">28°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Humidity:</span>
                        <span className="font-medium">72%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rainfall:</span>
                        <span className="font-medium">15mm</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">Rice</div>
                      <div className="text-sm text-muted-foreground mb-2">85% Match</div>
                      <div className="text-xs">Profit: ₹45,000/ha</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>

          {/* Market Prices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Market Prices</h3>
                <span className="text-xs text-muted-foreground">Last updated: Today</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Crop</TableHead>
                    <TableHead className="w-1/3">Price</TableHead>
                    <TableHead className="w-1/3">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketPricesData.map((row) => {
                    const up = row.change > 0;
                    const down = row.change < 0;
                    const changeColor = up ? "text-green-600" : down ? "text-red-600" : "text-muted-foreground";
                    const arrow = up ? "↑" : down ? "↓" : "—";
                    return (
                      <TableRow key={row.crop}>
                        <TableCell className="flex items-center gap-2">
                          <span className="text-lg">{cropEmojis[row.crop] ?? "🌱"}</span>
                          <span className="text-sm font-medium">{row.crop}</span>
                        </TableCell>
                        <TableCell className="text-sm font-semibold">₹{row.price.toLocaleString()}</TableCell>
                        <TableCell className={`text-sm ${changeColor}`}>
                          {arrow} {Math.abs(row.change).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Everything You Need for
              <span className="text-green-600"> Smart Farming</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform combines AI, weather data, and market insights 
              to help you make the best farming decisions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers who are already using AI to increase their yields 
              and profits. Get started today - it's free!
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            >
              {isAuthenticated ? "Free Trial" : "Start Your Free Trial"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Wheat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">CropAI</h3>
                  <p className="text-sm text-gray-400">Smart Farming Solutions</p>
                </div>
              </div>
              <p className="text-gray-400">
                Empowering farmers with AI-driven insights for better crop decisions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Crop Recommendations</li>
                <li>Weather Alerts</li>
                <li>Market Prices</li>
                <li>Voice Support</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Training Videos</li>
                <li>Community</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Careers</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CropAI. All rights reserved. Built for Smart India Hackathon 2025.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}