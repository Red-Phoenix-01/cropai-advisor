import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectSection from "./ConnectSection";
import { useAuth } from "@/hooks/use-auth";
import { Phone, AlertTriangle, Newspaper, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Language = "en" | "hi" | "ta" | "bn" | "ur" | "kn" | "te" | "ml";

// Minimal language pack for Connect page (keys required by ConnectSection)
const packs: Record<Language, {
  connect: string; chat: string; contacts: string; enterMessage: string; shareContact: string;
  name: string; phone: string; note: string; post: string; save: string; stateRoom: string;
}> = {
  en: { connect: "Connect", chat: "Chat", contacts: "Contacts", enterMessage: "Type a message...", shareContact: "Share Contact", name: "Name", phone: "Phone", note: "Note (optional)", post: "Post", save: "Save", stateRoom: "State room" },
  hi: { connect: "कनेक्ट", chat: "चैट", contacts: "संपर्क", enterMessage: "संदेश लिखें...", shareContact: "संपर्क साझा करें", name: "नाम", phone: "फोन", note: "नोट (वैकल्पिक)", post: "पोस्ट", save: "सहेजें", stateRoom: "राज्य कक्ष" },
  ta: { connect: "இணை", chat: "அரட்டை", contacts: "தொடர்புகள்", enterMessage: "செய்தி எழுதவும்...", shareContact: "தொடர்பை பகிர்", name: "பெயர்", phone: "பேசி", note: "குறிப்பு (விருப்பம்)", post: "போஸ்ட்", save: "சேமி", stateRoom: "மாநில அறை" },
  bn: { connect: "সংযুক্ত হোন", chat: "চ্যাট", contacts: "যোগাযোগ", enterMessage: "বার্তা লিখুন...", shareContact: "যোগাযোগ শেয়ার করুন", name: "নাম", phone: "ফোন", note: "নোট (ঐচ্ছিক)", post: "পোস্ট", save: "সংরক্ষণ", stateRoom: "রাজ্য কক্ষ" },
  ur: { connect: "رابطہ", chat: "چیٹ", contacts: "رابطے", enterMessage: "پیغام لکھیں...", shareContact: "رابطہ شیئر کریں", name: "نام", phone: "فون", note: "نوٹ (اختیاری)", post: "پوسٹ", save: "محفوظ کریں", stateRoom: "ریاست کمرہ" },
  kn: { connect: "ಕನೆಕ್ಟ್", chat: "ಚಾಟ್", contacts: "ಸಂಪರ್ಕಗಳು", enterMessage: "ಸಂದೇಶವನ್ನು ಬರೆಯಿರಿ...", shareContact: "ಸಂಪರ್ಕ ಹಂಚಿಕೊಳ್ಳಿ", name: "ಹೆಸರು", phone: "ಫೋನ್", note: "ಸೂಚನೆ (ಐಚ್ಛಿಕ)", post: "ಪೋಸ್ಟ್", save: "ಉಳಿಸಿ", stateRoom: "ರಾಜ್ಯ ಕೊಠಡಿ" },
  te: { connect: "కనెక్ట్", chat: "చాట్", contacts: "సంపర్కాలు", enterMessage: "సందేశం టైప్ చేయండి...", shareContact: "సంపర్కాన్ని పంచుకోండి", name: "పేరు", phone: "ఫోన్", note: "గమనిక (ఐచ్చికం)", post: "పోస్ట్", save: "సేవ్", stateRoom: "రాష్ట్ర గది" },
  ml: { connect: "കണക്റ്റ്", chat: "ചാറ്റ്", contacts: "കോണ്ടാക്ട്സ്", enterMessage: "സന്ദേശം ടൈപ്പ് ചെയ്യുക...", shareContact: "കോണ്ടാക്ട് പങ്കിടുക", name: "പേര്", phone: "ഫോണ്‍", note: "കുറിപ്പ് (ഐച്ഛികം)", post: "പോസ്റ്റ്", save: "സേവ്", stateRoom: "സ്റ്റേറ്റ് റൂം" },
};

export default function ConnectPage() {
  const { user } = useAuth();
  const [lang] = useState<Language>("en");
  const t = useMemo(() => packs[lang], [lang]);

  // Floating AI bot popout
  const sendBotSuggestion = useMutation(api.connect.sendBotSuggestion);
  const [season, setSeason] = useState<"kharif" | "rabi" | "zaid">("kharif");
  const [botOpen, setBotOpen] = useState(false);
  const [question, setQuestion] = useState<string>("");
  const [isAsking, setIsAsking] = useState(false);

  // Add: curated gov schemes/news feed items (Sep–Oct 2025), easy to maintain
  const newsItems: Array<{
    title: string;
    date: string; // ISO-like string for display
    summary: string;
    source: { name: string; url: string };
    tags: Array<string>;
  }> = [
    {
      title: "PM-Kisan Samman Nidhi — ₹6,000/year Direct Income Support",
      date: "2025-09-05",
      summary:
        "Small and marginal farmers continue receiving ₹2,000 per instalment (3 per year) directly to bank accounts via DBT. Ensure eKYC and land records are updated to avoid delays.",
      source: { name: "pmkisan.gov.in", url: "https://pmkisan.gov.in/" },
      tags: ["Income Support", "DBT", "Financial Inclusion"],
    },
    {
      title: "Pradhan Mantri Fasal Bima Yojana (PMFBY) — Crop Insurance",
      date: "2025-09-10",
      summary:
        "Insurance cover against natural calamities, pests, and diseases with subsidized premiums. Claim settlement timelines tightened; use the mobile app to report losses within 72 hours.",
      source: { name: "pmfby.gov.in", url: "https://pmfby.gov.in/" },
      tags: ["Insurance", "Risk Management", "PMFBY"],
    },
    {
      title: "Kisan Credit Card (KCC) — Affordable Credit up to ₹3 lakh",
      date: "2025-09-12",
      summary:
        "Short-term credit for crops, animal husbandry, and fisheries at concessional rates. Simplified processing via banks; link with RuPay card for easy withdrawals.",
      source: { name: "RBI — KCC", url: "https://www.rbi.org.in/" },
      tags: ["Credit", "Low Interest", "Financial Inclusion"],
    },
    {
      title: "Modified Interest Subvention Scheme — 2025–26",
      date: "2025-09-18",
      summary:
        "Interest subsidy continues for eligible crop loans in FY 2025–26, effectively reducing borrowing costs for timely repayment farmers.",
      source: {
        name: "MoF Press",
        url: "https://pib.gov.in/PressReleaseIframePage.aspx",
      },
      tags: ["Interest Subsidy", "Crop Loans"],
    },
    {
      title: "Rashtriya Krishi Vikas Yojana (RKVY) — Grants & Subsidies",
      date: "2025-09-20",
      summary:
        "State-driven agricultural development for irrigation, mechanization, horticulture, and value chains. Check state portals for open components and beneficiary guidelines.",
      source: { name: "rkvy.nic.in", url: "https://rkvy.nic.in/" },
      tags: ["Subsidy", "Infrastructure", "Mechanization"],
    },
    {
      title:
        "Viksit Krishi Sankalp Abhiyan — Scientific Advisory Village Visits",
      date: "2025-10-20",
      summary:
        "Launched Oct 2025: coordinated expert visits to villages for on-field advisories, improved practices, and yield optimization. Contact local KVKs for schedules.",
      source: {
        name: "ICAR/KVK",
        url: "https://icar.org.in/krishi-vigyan-kendra",
      },
      tags: ["Advisory", "Extension", "Yield"],
    },
    {
      title:
        "2025–26 Foodgrain Target: 362.5 Million Tonnes — Record Harvests",
      date: "2025-09-25",
      summary:
        "Government targets record outputs in rice, wheat, maize, groundnut, and soybean through better inputs, MSP support, and tech adoption.",
      source: {
        name: "PIB Agriculture",
        url: "https://pib.gov.in/Allrel.aspx?Ministry=Department%20of%20Agriculture%20and%20Farmers%20Welfare",
      },
      tags: ["Production", "MSP", "Cereals & Oilseeds"],
    },
    {
      title: "Market Access & Digital Trade — e-NAM Updates",
      date: "2025-09-28",
      summary:
        "More mandis integrated with e-NAM; farmers can view prices, trade, and get quality assaying support. Helps better price discovery for crops.",
      source: { name: "e-NAM", url: "https://enam.gov.in/web/" },
      tags: ["Markets", "Digital", "Price Discovery"],
    },
    {
      title: "Tech Adoption — Drones, Soil Health, Precision Inputs",
      date: "2025-09-30",
      summary:
        "Drone service subsidies and custom hiring centers expanded in states; soil health testing and precision recommendations encouraged for input savings.",
      source: {
        name: "DA&FW",
        url: "https://agricoop.gov.in/en",
      },
      tags: ["Technology", "Drones", "Soil Health"],
    },
    {
      title: "Insurance Benefits & Quick Claims — Mobile Reporting",
      date: "2025-09-22",
      summary:
        "Use PMFBY app to report localized damage with geo-tagged photos within 72 hours for faster claim processing.",
      source: { name: "PMFBY App", url: "https://pmfby.gov.in/" },
      tags: ["Insurance", "Claims", "Mobile"],
    },
  ];

  const sampleContacts = [
    { name: "Rajesh Kumar", state: "Punjab", note: "Wheat seeds supplier", phone: "98765 43210" },
    { name: "Priya Sharma", state: "Haryana", note: "Rice nursery", phone: "91234 56780" },
    { name: "Amit Patel", state: "Gujarat", note: "Cotton transport", phone: "99876 54321" },
    { name: "Sunita Devi", state: "Bihar", note: "Maize buyer", phone: "90909 10101" },
  ];

  // Infer a state name from a free-form location string (fallback to Tamil Nadu)
  const inferStateLocal = (loc: string): string => {
    const L = (loc || "").toLowerCase();
    if (L.includes("tamil")) return "tamil nadu";
    if (L.includes("haryana")) return "haryana";
    if (L.includes("punjab")) return "punjab";
    if (L.includes("gujarat")) return "gujarat";
    if (L.includes("bihar")) return "bihar";
    if (L.includes("karnataka")) return "karnataka";
    if (L.includes("maharashtra")) return "maharashtra";
    if (L.includes("uttar pradesh") || L.includes("up")) return "uttar pradesh";
    return "tamil nadu";
  };

  // Submit handler for the AI bot popout
  async function triggerBot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isAsking) return;
    try {
      setIsAsking(true);
      const state = inferStateLocal(user?.location ?? "");
      await sendBotSuggestion({
        state,
        season,
        question: question.trim() || undefined,
      });
      toast.success("Asked the AI bot. Check the chat!");
      setQuestion("");
      setBotOpen(false);
    } catch {
      toast.error("Failed to ask the AI bot. Please try again.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 pr-56 md:pr-72 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Update: Use provided leaf logo from attachment */}
            <img
              src={"https://harmless-tapir-303.convex.cloud/api/storage/bedc2a1d-6891-4933-a882-24f03abde4cf"}
              alt="Connect"
              className="h-7 w-7 rounded"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Connect</h1>
              <p className="text-sm text-muted-foreground">Chat with nearby farmers and share contacts</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")} className="mt-1 mr-32 md:mr-56">
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Sample contacts showcase (like the provided screenshot's list style) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Sample Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sampleContacts.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.state} • {c.note}</div>
                </div>
                <div className="text-sm">{c.phone}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* News Feed: Govt schemes & updates (scrollable) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-emerald-600" />
              Farmer News & Schemes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <p className="text-sm text-muted-foreground">
                Browse the latest govt schemes, policies, and market updates curated for farmers.
              </p>
              <Button onClick={() => (window.location.href = "/news")}>
                Open News
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Connect UI */}
        <ConnectSection
          languagePack={t}
          locationInput={""}
          userLocation={user?.location ?? ""}
        />
      </main>

      {/* Floating AI bot popout (bottom-right) - styled */}
      <div className="fixed bottom-5 right-5 z-50">
        <AnimatePresence>
          {!botOpen ? (
            <motion.button
              key="launcher"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.18 }}
              className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 transition"
              onClick={() => setBotOpen(true)}
              aria-label="Open AI Bot"
              title="AI Crop Bot"
            >
              ★
            </motion.button>
          ) : (
            <motion.div
              key="popout"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-[90vw] max-w-sm sm:w-80 rounded-2xl border bg-background/80 backdrop-blur-md shadow-2xl p-0 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="AI Crop Bot"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3">
                <div className="text-sm font-semibold">AI Crop Bot</div>
                <div className="text-[11px] opacity-90">Ask seasonal crop questions or farming tips.</div>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Season</label>
                  <select
                    className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    value={season}
                    onChange={(e) => setSeason(e.target.value as typeof season)}
                    disabled={isAsking}
                  >
                    <option value="kharif">Kharif</option>
                    <option value="rabi">Rabi</option>
                    <option value="zaid">Zaid</option>
                  </select>
                </div>

                <form onSubmit={triggerBot} className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Ask anything</label>
                    <input
                      className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                      placeholder="e.g., Best crops for sandy soil?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      disabled={isAsking}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setBotOpen(false)}
                      disabled={isAsking}
                    >
                      Close
                    </Button>
                    <Button size="sm" type="submit" disabled={isAsking}>
                      {isAsking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Asking...
                        </>
                      ) : (
                        "Ask"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Tips are informational; verify locally before applying.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}