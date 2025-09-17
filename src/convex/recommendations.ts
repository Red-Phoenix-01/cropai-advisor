import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

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

    // AI-based crop recommendation logic (simplified rule-based for now)
    const recommendedCrops = generateCropRecommendations(args);

    return await ctx.db.insert("recommendations", {
      userId: user._id,
      ...args,
      recommendedCrops,
    });
  },
});

// Helper function to generate crop recommendations
function generateCropRecommendations(soilData: {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  soilMoisture: number;
  waterAvailability: number;
}) {
  const crops = [];
  
  // Rice recommendation
  if (soilData.ph >= 5.5 && soilData.ph <= 7.0 && soilData.waterAvailability >= 70) {
    crops.push({
      name: "Rice",
      confidence: 0.85,
      explanation: "Ideal pH and high water availability make rice cultivation suitable",
      profitEstimate: 45000,
      waterUsage: "High (1500-2000mm)",
      fertilizerAdvice: "Apply 120kg N, 60kg P2O5, 40kg K2O per hectare",
      irrigationAdvice: "Maintain 2-5cm standing water during growing season",
    });
  }

  // Wheat recommendation
  if (soilData.ph >= 6.0 && soilData.ph <= 7.5 && soilData.nitrogen >= 40) {
    crops.push({
      name: "Wheat",
      confidence: 0.80,
      explanation: "Good nitrogen content and suitable pH for wheat cultivation",
      profitEstimate: 38000,
      waterUsage: "Medium (450-650mm)",
      fertilizerAdvice: "Apply 100kg N, 50kg P2O5, 30kg K2O per hectare",
      irrigationAdvice: "4-6 irrigations during crop cycle",
    });
  }

  // Maize recommendation
  if (soilData.ph >= 5.8 && soilData.ph <= 8.6 && soilData.phosphorus >= 25) {
    crops.push({
      name: "Maize",
      confidence: 0.75,
      explanation: "Adequate phosphorus and pH range suitable for maize",
      profitEstimate: 42000,
      waterUsage: "Medium (500-800mm)",
      fertilizerAdvice: "Apply 150kg N, 75kg P2O5, 50kg K2O per hectare",
      irrigationAdvice: "Critical irrigation at tasseling and grain filling stages",
    });
  }

  // Pulses recommendation
  if (soilData.ph >= 6.0 && soilData.ph <= 7.5 && soilData.potassium >= 30) {
    crops.push({
      name: "Pulses (Lentils)",
      confidence: 0.70,
      explanation: "Good potassium content and neutral pH favor pulse cultivation",
      profitEstimate: 35000,
      waterUsage: "Low (300-400mm)",
      fertilizerAdvice: "Apply 20kg N, 40kg P2O5, 20kg K2O per hectare",
      irrigationAdvice: "2-3 light irrigations, avoid waterlogging",
    });
  }

  // Sugarcane recommendation
  if (soilData.ph >= 6.5 && soilData.ph <= 7.5 && soilData.waterAvailability >= 80) {
    crops.push({
      name: "Sugarcane",
      confidence: 0.78,
      explanation: "High water availability and suitable pH for sugarcane",
      profitEstimate: 65000,
      waterUsage: "Very High (1800-2500mm)",
      fertilizerAdvice: "Apply 280kg N, 90kg P2O5, 90kg K2O per hectare",
      irrigationAdvice: "Regular irrigation every 7-10 days",
    });
  }

  // Sort by confidence and return top 5
  return crops.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
