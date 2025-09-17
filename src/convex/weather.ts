import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get weather alerts for a location
export const getWeatherAlerts = query({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("weatherAlerts")
      .withIndex("by_location", (q) => q.eq("location", args.location))
      .filter((q) => q.gt(q.field("validUntil"), now))
      .order("desc")
      .take(5);
  },
});

// Add weather alert
export const addWeatherAlert = mutation({
  args: {
    location: v.string(),
    alertType: v.string(),
    severity: v.string(),
    message: v.string(),
    validUntil: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("weatherAlerts", args);
  },
});
