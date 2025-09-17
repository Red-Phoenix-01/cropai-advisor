import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Add state market price dataset (per your provided data)
const stateMarketPrices: Record<string, Record<string, number>> = {
  "tamil nadu": { Rice: 2200, Maize: 1750, Pulses: 4800, Millets: 2400, Potato: 1100 },
  "jharkhand": { Rice: 2200, Maize: 1800, Pulses: 5000, Millets: 2500, Potato: 1200 },
  "kerala": { Rice: 2300, Maize: 1700, Pulses: 4700, Millets: 2300, Potato: 1000 },
  "punjab": { Rice: 2100, Maize: 1900, Pulses: 5300, Millets: 2600, Potato: 1250 },
  "west bengal": { Rice: 2150, Maize: 1850, Pulses: 5100, Millets: 2500, Potato: 1150 },
  "uttar pradesh": { Rice: 2050, Maize: 1800, Pulses: 4950, Millets: 2450, Potato: 1175 },
  "gujarat": { Rice: 2250, Maize: 1750, Pulses: 4850, Millets: 2400, Potato: 1100 },
  "haryana": { Rice: 2100, Maize: 1850, Pulses: 5100, Millets: 2600, Potato: 1200 },
  "madhya pradesh": { Rice: 2100, Maize: 1800, Pulses: 5000, Millets: 2550, Potato: 1150 },
  "assam": { Rice: 2200, Maize: 1650, Pulses: 4700, Millets: 2300, Potato: 1050 },
  "andhra pradesh": { Rice: 2150, Maize: 1750, Pulses: 4900, Millets: 2450, Potato: 1100 },
  "karnataka": { Rice: 2150, Maize: 1700, Pulses: 4800, Millets: 2400, Potato: 1100 },
};

// Helper: infer state from free-text location
function inferState(location: string): string | null {
  const loc = location.toLowerCase();

  // Add simple city-to-state hints for better matching (e.g., "Chennai" -> "tamil nadu")
  const cityStateMap: Record<string, string> = {
    "chennai": "tamil nadu",
    "coimbatore": "tamil nadu",
    "madurai": "tamil nadu",
    "kolkata": "west bengal",
    "howrah": "west bengal",
    "lucknow": "uttar pradesh",
    "kanpur": "uttar pradesh",
    "patna": "bihar",
    "bhopal": "madhya pradesh",
    "indore": "madhya pradesh",
    "ahmedabad": "gujarat",
    "surat": "gujarat",
    "bengaluru": "karnataka",
    "bangalore": "karnataka",
    "mysuru": "karnataka",
    "mysore": "karnataka",
    "hyderabad": "andhra pradesh",
    "vijayawada": "andhra pradesh",
    "visakhapatnam": "andhra pradesh",
    "kochi": "kerala",
    "thiruvananthapuram": "kerala",
    "ernakulam": "kerala",
    "amritsar": "punjab",
    "ludhiana": "punjab",
    "gurugram": "haryana",
    "faridabad": "haryana",
    "guwahati": "assam",
    "ranchi": "jharkhand",
  };

  for (const [city, state] of Object.entries(cityStateMap)) {
    if (loc.includes(city)) return state;
  }

  for (const s of Object.keys(stateMarketPrices)) {
    if (loc.includes(s)) return s;
  }
  return null;
}

// Get crop recommendations for a user
export const getRecommendations = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const userId = args.userId || user?._id;
    if (!userId) return [];
    return await ctx.db
      .query("recommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});

// Create a new crop recommendation
export const createRecommendation = mutation({
  args: {
    nitrogen: v.number(),
    phosphorus: v.number(),
    potassium: v.number(),
    ph: v.number(),
    soilMoisture: v.number(),
    waterAvailability: v.number(),
    location: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("User not authenticated");

    const state = inferState(args.location);
    const prices = state ? stateMarketPrices[state] : null;

    const recommendedCrops = generateCropRecommendations(args, prices || undefined);

    // Insert and then return the full created document (not just the id)
    const id = await ctx.db.insert("recommendations", {
      userId: user._id,
      ...args,
      recommendedCrops,
    });

    const created = await ctx.db.get(id);
    if (!created) throw new Error("Failed to load created recommendation");
    return created;
  },
});

// Enhanced rule-based generator using optional state prices
function generateCropRecommendations(
  soilData: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    ph: number;
    soilMoisture: number;
    waterAvailability: number;
    location?: string;
  },
  statePrices?: Record<string, number>,
) {
  type CropRec = {
    name: string;
    confidence: number;
    explanation: string;
    profitEstimate: number;
    waterUsage: string;
    fertilizerAdvice: string;
    irrigationAdvice: string;
  };
  const crops: Array<CropRec> = [];

  // Utility to apply state price (quintal) to profitEstimate baseline
  const withPrice = (name: string, fallback: number) => {
    const p = statePrices?.[name];
    // rough conversion: price per qtl * 20 qtls/ha as a simple baseline
    return p ? Math.round(p * 20) : fallback;
  };

  // Rice
  if (soilData.ph >= 5.5 && soilData.ph <= 7.0 && soilData.waterAvailability >= 70 && soilData.soilMoisture >= 30) {
    crops.push({
      name: "Rice",
      confidence: 0.85,
      explanation: "Ideal pH with high water availability and adequate moisture supports rice.",
      profitEstimate: withPrice("Rice", 45000),
      waterUsage: "High (1500-2000mm)",
      fertilizerAdvice: "Apply 120kg N, 60kg P2O5, 40kg K2O per hectare",
      irrigationAdvice: "Maintain 2-5cm standing water during growing season",
    });
  }

  // Wheat
  if (soilData.ph >= 6.0 && soilData.ph <= 7.5 && soilData.nitrogen >= 40) {
    crops.push({
      name: "Wheat",
      confidence: 0.8,
      explanation: "Good nitrogen and suitable pH range favor wheat.",
      profitEstimate: 38000, // keep as baseline (not in provided price list)
      waterUsage: "Medium (450-650mm)",
      fertilizerAdvice: "Apply 100kg N, 50kg P2O5, 30kg K2O per hectare",
      irrigationAdvice: "4-6 irrigations during crop cycle",
    });
  }

  // Maize
  if (soilData.ph >= 5.8 && soilData.ph <= 8.6 && soilData.phosphorus >= 20) {
    crops.push({
      name: "Maize",
      confidence: 0.75,
      explanation: "Adequate phosphorus and broad pH suitability for maize.",
      profitEstimate: withPrice("Maize", 42000),
      waterUsage: "Medium (500-800mm)",
      fertilizerAdvice: "Apply 150kg N, 75kg P2O5, 50kg K2O per hectare",
      irrigationAdvice: "Irrigate at tasseling and grain filling stages",
    });
  }

  // Pulses (Lentils)
  if (soilData.ph >= 6.0 && soilData.ph <= 7.5 && soilData.potassium >= 30) {
    crops.push({
      name: "Pulses (Lentils)",
      confidence: 0.7,
      explanation: "Neutral pH and good potassium favor pulses.",
      profitEstimate: withPrice("Pulses", 35000),
      waterUsage: "Low (300-400mm)",
      fertilizerAdvice: "Apply 20kg N, 40kg P2O5, 20kg K2O per hectare",
      irrigationAdvice: "2-3 light irrigations; avoid waterlogging",
    });
  }

  // Millets (dryland-friendly)
  if (soilData.waterAvailability <= 50 || soilData.soilMoisture <= 35) {
    crops.push({
      name: "Millets",
      confidence: 0.68,
      explanation: "Lower water availability suits hardy millets.",
      profitEstimate: withPrice("Millets", 30000),
      waterUsage: "Low (250-350mm)",
      fertilizerAdvice: "Low to moderate N; balanced P and K",
      irrigationAdvice: "Minimal irrigation; rainfed suitable",
    });
  }

  // Potato (cooler, fertile soils; flexible rule)
  if (soilData.ph >= 5.2 && soilData.ph <= 7.5 && soilData.potassium >= 150) {
    crops.push({
      name: "Potato",
      confidence: 0.62,
      explanation: "Good potassium and suitable pH support tuber growth.",
      profitEstimate: withPrice("Potato", 32000),
      waterUsage: "Medium (500-700mm)",
      fertilizerAdvice: "Balanced NPK; emphasize K for tuber development",
      irrigationAdvice: "Maintain moist soil; critical at tuber initiation",
    });
  }

  // Soybean (legume, well-drained)
  if (soilData.ph >= 6.0 && soilData.ph <= 7.5 && soilData.soilMoisture >= 30) {
    crops.push({
      name: "Soybean",
      confidence: 0.57,
      explanation: "Nitrogen-fixing legume that thrives in well-drained soils.",
      profitEstimate: 48000,
      waterUsage: "Medium (450-700mm)",
      fertilizerAdvice: "Low N; moderate P and K; consider Rhizobium inoculation",
      irrigationAdvice: "Critical irrigation during flowering and pod filling",
    });
  }

  // Cotton (high K, warm and moderate water)
  if (soilData.potassium >= 180 && soilData.waterAvailability >= 50 && soilData.ph >= 6.0 && soilData.ph <= 8.0) {
    crops.push({
      name: "Cotton",
      confidence: 0.47,
      explanation: "High potassium and adequate water availability support cotton.",
      profitEstimate: 65000,
      waterUsage: "High (700-1300mm)",
      fertilizerAdvice: "Focus on potassium-rich fertilizers during boll development",
      irrigationAdvice: "Irrigate during flowering and boll formation",
    });
  }

  // Sugarcane (very high water)
  if (soilData.ph >= 6.5 && soilData.ph <= 7.5 && soilData.waterAvailability >= 80) {
    crops.push({
      name: "Sugarcane",
      confidence: 0.78,
      explanation: "Very high water availability and suitable pH for sugarcane.",
      profitEstimate: 65000,
      waterUsage: "Very High (1800-2500mm)",
      fertilizerAdvice: "Apply 280kg N, 90kg P2O5, 90kg K2O per hectare",
      irrigationAdvice: "Regular irrigation every 7-10 days",
    });
  }

  // If no crops matched strictly, provide a best-fit fallback list so users always see recommendations.
  if (crops.length === 0) {
    const ph = soilData.ph;
    const n = soilData.nitrogen;
    const p = soilData.phosphorus;
    const k = soilData.potassium;
    const moisture = soilData.soilMoisture;
    const water = soilData.waterAvailability;

    const score = (within: boolean, weight: number) => (within ? weight : weight * 0.4);

    // Lightweight heuristic confidences
    const wheatConf =
      (score(ph >= 6.0 && ph <= 7.5, 0.35) +
        score(n >= 35, 0.35) +
        score(moisture >= 25, 0.3));

    const pulsesConf =
      (score(ph >= 6.0 && ph <= 7.5, 0.4) +
        score(k >= 120, 0.3) +
        score(water >= 25, 0.3));

    const soybeanConf =
      (score(ph >= 6.0 && ph <= 7.5, 0.4) +
        score(moisture >= 30, 0.3) +
        score(water >= 35, 0.3));

    const maizeConf =
      (score(ph >= 5.8 && ph <= 8.6, 0.4) +
        score(p >= 15, 0.3) +
        score(water >= 30, 0.3));

    const riceConf =
      (score(ph >= 5.5 && ph <= 7.0, 0.35) +
        score(water >= 60, 0.4) +
        score(moisture >= 30, 0.25));

    const cottonConf =
      (score(k >= 150, 0.4) +
        score(water >= 45, 0.3) +
        score(ph >= 6.0 && ph <= 8.0, 0.3));

    const clamp = (x: number) => Math.max(0.35, Math.min(0.82, x));

    const fallback: Array<CropRec> = [
      {
        name: "Wheat",
        confidence: clamp(wheatConf),
        explanation: "Wheat grows well in moderate nitrogen conditions with balanced pH levels.",
        profitEstimate: 38000,
        waterUsage: "Medium (450-650mm)",
        fertilizerAdvice: "Apply balanced NPK fertilizer. Use DAP during sowing.",
        irrigationAdvice: "Water at crown root initiation and grain filling stages",
      },
      {
        name: "Pulses (Lentils)",
        confidence: clamp(pulsesConf),
        explanation: "Pulses fix their own nitrogen and prefer neutral pH with adequate potassium.",
        profitEstimate: withPrice("Pulses", 42000),
        waterUsage: "Low (300-400mm)",
        fertilizerAdvice: "Minimal nitrogen, focus on phosphorus and potassium.",
        irrigationAdvice: "Water during pod filling stage, avoid waterlogging.",
      },
      {
        name: "Soybean",
        confidence: clamp(soybeanConf),
        explanation: "Soybean is a nitrogen-fixing legume that thrives in well-drained soils.",
        profitEstimate: 48000,
        waterUsage: "Medium (450-700mm)",
        fertilizerAdvice: "Low nitrogen, moderate phosphorus and potassium.",
        irrigationAdvice: "Critical water need during flowering and pod filling.",
      },
      {
        name: "Maize",
        confidence: clamp(maizeConf),
        explanation: "Maize requires good phosphorus and balanced pH.",
        profitEstimate: withPrice("Maize", 35000),
        waterUsage: "Medium (500-800mm)",
        fertilizerAdvice: "Use high-nitrogen fertilizers during vegetative growth.",
        irrigationAdvice: "Regular irrigation during silking and grain filling stages.",
      },
      {
        name: "Rice",
        confidence: clamp(riceConf),
        explanation: "Rice thrives in nitrogen-rich, well-watered conditions with moderate soil moisture.",
        profitEstimate: withPrice("Rice", 45000),
        waterUsage: "High (1500-2000mm)",
        fertilizerAdvice: "Use organic compost and bio-fertilizers. Apply NPK in 4:2:1 ratio.",
        irrigationAdvice: "Maintain 2-5cm water level throughout growing season.",
      },
      {
        name: "Cotton",
        confidence: clamp(cottonConf),
        explanation: "Cotton needs high potassium for fiber development and adequate water.",
        profitEstimate: 65000,
        waterUsage: "High (700-1300mm)",
        fertilizerAdvice: "Focus on potassium-rich fertilizers during boll development.",
        irrigationAdvice: "Irrigate during flowering and boll formation.",
      },
    ];

    for (const c of fallback) crops.push(c);
  }

  return crops.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}