import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper, ExternalLink, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";

export default function NewsPage() {
  const newsItems: Array<{
    title: string;
    date: string;
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
        url:
          "https://pib.gov.in/Allrel.aspx?Ministry=Department%20of%20Agriculture%20and%20Farmers%20Welfare",
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

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 pr-56 md:pr-72 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Farmer News & Schemes</h1>
              <p className="text-sm text-muted-foreground">Curated updates for Indian farmers</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/connect")}
            className="mt-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Connect
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-emerald-600" />
              Latest Govt Schemes & Agricultural Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[70vh]">
              <div className="divide-y">
                {newsItems.map((item, idx) => (
                  <div key={idx} className="p-4 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold">{item.title}</div>
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.summary}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                      <a
                        href={item.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                      >
                        Source: {item.source.name}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
