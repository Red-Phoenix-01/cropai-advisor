import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Leaf, Volume2 } from "lucide-react";

type Rec = {
  name: string;
  confidence: number;
  explanation: string;
  profitEstimate: number;
  waterUsage: string;
  fertilizerAdvice: string;
  irrigationAdvice: string;
};

export default function RecommendationsList({
  t,
  cropEmojis,
  recommendations,
  userRecommendations,
  speakText,
  translateName,
}: {
  t: Record<string, string>;
  cropEmojis: Record<string, string>;
  recommendations: Array<Rec> | null;
  userRecommendations: Array<{ recommendedCrops: Array<Rec> }> | undefined;
  speakText: (text: string) => void;
  translateName?: (name: string) => string;
}) {
  const list: Array<Rec> =
    (recommendations as Array<Rec> | null) ??
    (userRecommendations?.[0]?.recommendedCrops as Array<Rec> | undefined) ??
    [];

  if (!list || list.length === 0) return null;

  // Localized labels with safe English fallbacks
  const fertilizerLabel = (t as any).fertilizerAdvice ?? "Fertilizer Advice";
  const irrigationLabel = (t as any).irrigationAdvice ?? "Irrigation Advice";
  const matchLabel = (t as any).match ?? "match";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            {t.recommendations}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => speakText("Here are your crop recommendations")}>
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((crop, index) => (
            <Card key={index} className="border-2 hover:border-green-400/60 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      <span className="mr-1">{cropEmojis[crop.name] ?? "🌱"}</span>
                      {translateName ? translateName(crop.name) : crop.name}
                    </CardTitle>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    {(crop.confidence * 100).toFixed(0)}% {matchLabel}
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
                    <span className="font-medium">{fertilizerLabel}</span>
                    <div className="text-muted-foreground">{crop.fertilizerAdvice}</div>
                  </div>
                  <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
                    <span className="font-medium">{irrigationLabel}</span>
                    <div className="text-muted-foreground">{crop.irrigationAdvice}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}