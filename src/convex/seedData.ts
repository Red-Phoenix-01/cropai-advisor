import { mutation } from "./_generated/server";

export const seedMarketData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existing = await ctx.db.query("marketPrices").first();
    if (existing) return "Data already exists";

    const marketData = [
      { crop: "Rice", price: 2100, unit: "per quintal", market: "Delhi Mandi", date: "2024-01-15", trend: "up" },
      { crop: "Wheat", price: 2250, unit: "per quintal", market: "Punjab Mandi", date: "2024-01-15", trend: "stable" },
      { crop: "Maize", price: 1850, unit: "per quintal", market: "UP Mandi", date: "2024-01-15", trend: "down" },
      { crop: "Pulses (Lentils)", price: 6500, unit: "per quintal", market: "Rajasthan Mandi", date: "2024-01-15", trend: "up" },
      { crop: "Sugarcane", price: 350, unit: "per quintal", market: "Maharashtra Mandi", date: "2024-01-15", trend: "stable" },
      { crop: "Cotton", price: 5800, unit: "per quintal", market: "Gujarat Mandi", date: "2024-01-15", trend: "up" },
      { crop: "Soybean", price: 4200, unit: "per quintal", market: "MP Mandi", date: "2024-01-15", trend: "stable" },
      { crop: "Groundnut", price: 5500, unit: "per quintal", market: "Andhra Mandi", date: "2024-01-15", trend: "down" },
    ];

    for (const data of marketData) {
      await ctx.db.insert("marketPrices", data);
    }

    // Add some weather alerts
    const weatherAlerts = [
      {
        location: "Punjab",
        alertType: "drought",
        severity: "medium",
        message: "Low rainfall expected in the next 15 days. Consider water conservation.",
        validUntil: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
      },
      {
        location: "Maharashtra",
        alertType: "flood",
        severity: "high",
        message: "Heavy rainfall warning. Ensure proper drainage in fields.",
        validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      },
    ];

    for (const alert of weatherAlerts) {
      await ctx.db.insert("weatherAlerts", alert);
    }

    return "Market data and weather alerts seeded successfully";
  },
});
