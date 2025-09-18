import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function MarketPricesCard({
  t,
  cropEmojis,
}: {
  t: { marketPrices: string };
  cropEmojis: Record<string, string>;
}) {
  const data = [
    { crop: "Rice", price: 2150, change: +5.2 },
    { crop: "Wheat", price: 2050, change: -2.1 },
    { crop: "Maize", price: 1850, change: 0 },
    { crop: "Cotton", price: 5200, change: +8.5 },
    { crop: "Sugarcane", price: 3200, change: +4.5 },
    { crop: "Groundnut", price: 5809, change: +3.1 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t.marketPrices}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((row) => {
            const up = row.change > 0;
            const down = row.change < 0;
            return (
              <div key={row.crop} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cropEmojis[row.crop] ?? "🌱"}</span>
                  <span className="text-sm">{row.crop}</span>
                  <span className="text-xs text-muted-foreground">per quintal</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">₹{row.price.toLocaleString()}</div>
                  <div
                    className={`text-xs ${
                      up ? "text-green-600" : down ? "text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    {up ? "↑" : down ? "↓" : "—"} {Math.abs(row.change).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
          <div className="pt-2 text-center text-xs text-muted-foreground">Last updated: Today</div>
        </div>
      </CardContent>
    </Card>
  );
}
