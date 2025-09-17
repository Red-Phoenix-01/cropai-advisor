import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get market prices for crops
export const getMarketPrices = query({
  args: { crop: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.crop && args.crop.length > 0) {
      // Ensure crop is narrowed to string inside the callback
      const crop = args.crop;
      return await ctx.db
        .query("marketPrices")
        .withIndex("by_crop", (q) => q.eq("crop", crop))
        .order("desc")
        .take(10);
    }
    
    return await ctx.db.query("marketPrices").order("desc").take(20);
  },
});

// Add market price data
export const addMarketPrice = mutation({
  args: {
    crop: v.string(),
    price: v.number(),
    unit: v.string(),
    market: v.string(),
    date: v.string(),
    trend: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("marketPrices", args);
  },
});

// Initialize market data
export const initializeMarketData = mutation({
  args: {},
  handler: async (ctx) => {
    const marketData = [
      { crop: "Rice", price: 2100, unit: "per quintal", market: "Delhi Mandi", date: "2024-01-15", trend: "up" },
      { crop: "Wheat", price: 2250, unit: "per quintal", market: "Punjab Mandi", date: "2024-01-15", trend: "stable" },
      { crop: "Maize", price: 1850, unit: "per quintal", market: "UP Mandi", date: "2024-01-15", trend: "down" },
      { crop: "Pulses (Lentils)", price: 6500, unit: "per quintal", market: "Rajasthan Mandi", date: "2024-01-15", trend: "up" },
      { crop: "Sugarcane", price: 350, unit: "per quintal", market: "Maharashtra Mandi", date: "2024-01-15", trend: "stable" },
    ];

    for (const data of marketData) {
      await ctx.db.insert("marketPrices", data);
    }
  },
});