import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectSection from "./ConnectSection";
import { useAuth } from "@/hooks/use-auth";
import { Leaf, Phone, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

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

  function inferStateLocal(location?: string | null): string {
    const loc = (location ?? "").toLowerCase();
    const pairs: Record<string, string> = {
      chennai: "tamil nadu", coimbatore: "tamil nadu", madurai: "tamil nadu",
      kolkata: "west bengal", howrah: "west bengal",
      lucknow: "uttar pradesh", kanpur: "uttar pradesh",
      patna: "bihar", bhopal: "madhya pradesh", indore: "madhya pradesh",
      ahmedabad: "gujarat", surat: "gujarat",
      bengaluru: "karnataka", bangalore: "karnataka", mysuru: "karnataka", mysore: "karnataka",
      hyderabad: "andhra pradesh", vijayawada: "andhra pradesh", visakhapatnam: "andhra pradesh",
      kochi: "kerala", thiruvananthapuram: "kerala", ernakulam: "kerala",
      amritsar: "punjab", ludhiana: "punjab", gurugram: "haryana", faridabad: "haryana",
      guwahati: "assam", ranchi: "jharkhand",
    };
    for (const [k, v] of Object.entries(pairs)) if (loc.includes(k)) return v;
    const states = ["tamil nadu","jharkhand","kerala","punjab","west bengal","uttar pradesh","gujarat","haryana","madhya pradesh","assam","andhra pradesh","karnataka","bihar","maharashtra","rajasthan"];
    for (const s of states) if (loc.includes(s)) return s;
    return "tamil nadu";
  }

  async function triggerBot(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const state = inferStateLocal(user?.location ?? "");
    await sendBotSuggestion({
      state,
      season,
      question,
    });
    setQuestion("");
    setBotOpen(false);
  }

  const sampleContacts = [
    { name: "Rajesh Kumar", state: "Punjab", note: "Wheat seeds supplier", phone: "98765 43210" },
    { name: "Priya Sharma", state: "Haryana", note: "Rice nursery", phone: "91234 56780" },
    { name: "Amit Patel", state: "Gujarat", note: "Cotton transport", phone: "99876 54321" },
    { name: "Sunita Devi", state: "Bihar", note: "Maize buyer", phone: "90909 10101" },
  ];

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
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")} className="mt-1 mr-28 md:mr-48">
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

        {/* Live Connect UI */}
        <ConnectSection
          languagePack={t}
          locationInput={""}
          userLocation={user?.location ?? ""}
        />
      </main>

      {/* Floating AI bot popout (bottom-right) - styled */}
      <div className="fixed bottom-5 right-5 z-50">
        {!botOpen ? (
          <button
            className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white flex items-center justify-center border border-white/20 hover:scale-105 transition"
            onClick={() => setBotOpen(true)}
            aria-label="Open AI Bot"
            title="AI Crop Bot"
          >
            ★
          </button>
        ) : (
          <div className="w-72 rounded-2xl border bg-background/80 backdrop-blur-md shadow-2xl p-0 overflow-hidden">
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
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => setBotOpen(false)}>Close</Button>
                  <Button size="sm" type="submit">Ask</Button>
                </div>
              </form>

              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Tips are informational; verify locally before applying.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}