import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

type LangPack = {
  connect: string;
  chat: string;
  contacts: string;
  enterMessage: string;
  shareContact: string;
  name: string;
  phone: string;
  note: string;
  post: string;
  save: string;
  stateRoom: string;
};

function inferStateClient(location: string | undefined | null): string | null {
  if (!location) return null;
  const loc = location.toLowerCase();
  const map: Record<string, string> = {
    chennai: "tamil nadu",
    coimbatore: "tamil nadu",
    madurai: "tamil nadu",
    kolkata: "west bengal",
    howrah: "west bengal",
    lucknow: "uttar pradesh",
    kanpur: "uttar pradesh",
    patna: "bihar",
    bhopal: "madhya pradesh",
    indore: "madhya pradesh",
    ahmedabad: "gujarat",
    surat: "gujarat",
    bengaluru: "karnataka",
    bangalore: "karnataka",
    mysuru: "karnataka",
    mysore: "karnataka",
    hyderabad: "andhra pradesh",
    vijayawada: "andhra pradesh",
    visakhapatnam: "andhra pradesh",
    kochi: "kerala",
    thiruvananthapuram: "kerala",
    ernakulam: "kerala",
    amritsar: "punjab",
    ludhiana: "punjab",
    gurugram: "haryana",
    faridabad: "haryana",
    guwahati: "assam",
    ranchi: "jharkhand",
  };
  for (const [city, state] of Object.entries(map)) if (loc.includes(city)) return state;
  const states = [
    "tamil nadu","jharkhand","kerala","punjab","west bengal","uttar pradesh",
    "gujarat","haryana","madhya pradesh","assam","andhra pradesh","karnataka","bihar","maharashtra","rajasthan"
  ];
  for (const s of states) if (loc.includes(s)) return s;
  return null;
}

export default function ConnectSection(props: {
  languagePack: LangPack;
  locationInput: string;
  userLocation: string;
}) {
  const { languagePack: t, locationInput, userLocation } = props;

  const state = useMemo(() => {
    return (
      inferStateClient(locationInput) ||
      inferStateClient(userLocation) ||
      "tamil nadu"
    );
  }, [locationInput, userLocation]);

  const messages = useQuery(api.connect.listRecentMessages, { state });
  const contacts = useQuery(api.connect.listContacts, { state });
  const sendMessage = useMutation(api.connect.sendMessage);
  const shareContact = useMutation(api.connect.shareContact);
  const sendBotSuggestion = useMutation(api.connect.sendBotSuggestion);
  const deleteMessages = useMutation(api.connect.deleteMessages);

  const [message, setMessage] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", note: "" });
  const [season, setSeason] = useState<"kharif" | "rabi" | "zaid">("kharif");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [question, setQuestion] = useState<string>(""); // addition
  const [isAsking, setIsAsking] = useState<boolean>(false); // addition

  async function onSend() {
    try {
      await sendMessage({ state, text: message });
      setMessage("");
    } catch (e) {
      toast.error("Failed to send");
    }
  }
  async function onShare() {
    try {
      await shareContact({
        state,
        name: contact.name,
        phone: contact.phone,
        note: contact.note || undefined,
      });
      setContact({ name: "", phone: "", note: "" });
      toast.success("Saved");
    } catch {
      toast.error("Failed");
    }
  }

  async function askBot() {
    try {
      setIsAsking(true);
      await sendBotSuggestion({
        state,
        season,
        question: question.trim() ? question.trim() : undefined,
      });
      setQuestion("");
      toast.success("Asked the AI bot. Check the chat!");
    } catch {
      toast.error("Bot unavailable");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t.connect}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{t.stateRoom}: {state}</span>
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
              Clear Chat
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chat">{t.chat}</TabsTrigger>
            <TabsTrigger value="contacts">{t.contacts}</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-3">
            <div className="max-h-64 overflow-y-auto rounded-md border p-3 space-y-3">
              {(messages ?? []).map((m) => (
                <div key={m._id} className="text-sm">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    {m.userName ?? "Farmer"}
                    {" • "}
                    {new Date(m._creationTime).toLocaleTimeString()}
                  </div>
                  <div>{m.text}</div>
                </div>
              ))}
              {messages && messages.length === 0 && (
                <div className="text-sm text-muted-foreground">No messages yet.</div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={t.enterMessage}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={onSend}>{t.post}</Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={season} onValueChange={(v) => setSeason(v as typeof season)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kharif">Kharif</SelectItem>
                  <SelectItem value="rabi">Rabi</SelectItem>
                  <SelectItem value="zaid">Zaid</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Ask anything (e.g., best crops for sandy soil?)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isAsking}
              />
              <Button variant="outline" onClick={askBot} disabled={isAsking}>
                {isAsking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asking...
                  </>
                ) : (
                  "Ask AI Bot"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <div className="max-h-64 overflow-y-auto rounded-md border p-3 space-y-3">
              {(contacts ?? []).map((c) => (
                <div key={c._id} className="text-sm">
                  <div className="font-medium">{c.name} — {c.phone}</div>
                  {c.note && <div className="text-muted-foreground">{c.note}</div>}
                </div>
              ))}
              {contacts && contacts.length === 0 && (
                <div className="text-sm text-muted-foreground">No contacts yet.</div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>{t.name}</Label>
                <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              </div>
              <div>
                <Label>{t.phone}</Label>
                <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              </div>
              <div>
                <Label>{t.note}</Label>
                <Input value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onShare}>{t.save}</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all messages?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove all chat messages in the {state} room. This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteMessages({ state });
                } finally {
                  setConfirmOpen(false);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}