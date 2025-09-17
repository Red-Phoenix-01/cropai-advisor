import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Simple city/state inference (mirror of recommendations.ts subset)
function inferState(location: string | undefined | null): string | null {
  if (!location) return null;
  const loc = location.toLowerCase();
  const cityStateMap: Record<string, string> = {
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
    // removed invalid duplicate key that caused a type error
  };
  for (const [city, state] of Object.entries(cityStateMap)) {
    if (loc.includes(city)) return state;
  }
  const states = [
    "tamil nadu","jharkhand","kerala","punjab","west bengal","uttar pradesh",
    "gujarat","haryana","madhya pradesh","assam","andhra pradesh","karnataka","bihar","maharashtra","rajasthan"
  ];
  for (const s of states) if (loc.includes(s)) return s;
  return null;
}

// List recent messages for a state
export const listRecentMessages = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connectMessages")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .order("desc")
      .take(30);
  },
});

// Send a message to a state room
export const sendMessage = mutation({
  args: { state: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (args.text.trim().length === 0) throw new Error("Empty message");

    const displayName =
      (user.name && user.name.trim()) ||
      (user.email && user.email.split("@")[0]) ||
      "Farmer";

    return await ctx.db.insert("connectMessages", {
      userId: user._id,
      state: args.state,
      text: args.text.trim(),
      userName: displayName,
    });
  },
});

// List shared contacts in a state
export const listContacts = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connectContacts")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .order("desc")
      .take(50);
  },
});

// Share contact info to a state directory
export const shareContact = mutation({
  args: {
    state: v.string(),
    name: v.string(),
    phone: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (args.phone.trim().length < 5) throw new Error("Invalid phone");
    return await ctx.db.insert("connectContacts", {
      userId: user._id,
      state: args.state,
      name: args.name.trim(),
      phone: args.phone.trim(),
      note: args.note?.trim(),
    });
  },
});

// Seed demo data for a given state for testing
export const seedConnectDemo = mutation({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const messages = [
      "Anyone selling quality paddy seedlings near me?",
      "We got light showers yesterday; good time to sow.",
      "Local mandi offering better rate for maize this week.",
    ];
    for (const m of messages) {
      await ctx.db.insert("connectMessages", {
        userId: user._id,
        state: args.state,
        text: m,
      });
    }
    const contacts = [
      { name: "Ravi", phone: "98765 43210", note: "Tractor service" },
      { name: "Meena", phone: "91234 56780", note: "Organic fertilizer" },
    ];
    for (const c of contacts) {
      await ctx.db.insert("connectContacts", {
        userId: user._id,
        state: args.state,
        ...c,
      });
    }
    return "Seeded connect data";
  },
});

// Add a simple season-based bot that posts into the chat
export const sendBotSuggestion = mutation({
  args: { state: v.string(), season: v.string() }, // season: "kharif" | "rabi" | "zaid"
  handler: async (ctx, args) => {
    const s = args.season.toLowerCase();
    const state = args.state.toLowerCase();

    // Very lightweight rules
    const seasonCrops: Record<string, string[]> = {
      kharif: ["Rice", "Maize", "Cotton", "Millets", "Soybean"],
      rabi: ["Wheat", "Pulses (Lentils)", "Potato", "Mustard"],
      zaid: ["Maize", "Vegetables", "Pulses (Lentils)"],
    };
    const picks = seasonCrops[s] ?? ["Rice", "Maize"];

    const why: Record<string, string> = {
      Rice: "High rainfall and standing water tolerance during monsoon.",
      Maize: "Adaptable crop with good returns across states.",
      "Pulses (Lentils)": "Low water need and nitrogen fixing improves soil.",
      Millets: "Drought tolerant and fits low water availability.",
      Soybean: "Nitrogen fixing legume; suited for well-drained soils.",
      Cotton: "Warm season crop thriving with adequate K and heat.",
      Wheat: "Prefers cool, dry Rabi with neutral pH soils.",
      Potato: "Cooler season tuber with high K demand.",
      Mustard: "Cool season oilseed that fits Rabi rotation.",
      Vegetables: "Short-duration crops suitable for Zaid window.",
    };

    const top = picks.slice(0, 2);
    const reason = top.map((c) => `${c}: ${why[c] ?? "Suitable for the season."}`).join(" | ");

    const message = `Season: ${args.season}. Suggested crops for ${state}: ${top.join(", ")}. Why this crop: ${reason}`;

    // Post as bot
    // Use a fixed userName to display in UI
    return await ctx.db.insert("connectMessages", {
      // Use a placeholder userId since schema requires it; reuse any authenticated user via a fake context isn't allowed,
      // so we insert with an authenticated user's id but mark userName as bot for display.
      // We still require auth to avoid abuse; the current user triggers the bot.
      userId: (await getCurrentUser(ctx))!._id,
      state: args.state,
      text: message,
      userName: "KisanYatra Bot",
    });
  },
});

// Helper to expose state inference for clients that send a free-text location
export const stateFromLocation = query({
  args: { location: v.string() },
  handler: async (ctx, args) => {
    return inferState(args.location) || "unknown";
  },
});