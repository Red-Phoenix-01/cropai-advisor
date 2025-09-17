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

    const tips: Record<string, string> = {
      Rice: "Transplant healthy seedlings; maintain shallow water early 🌾",
      Maize: "Ensure good P at sowing; watch for fall armyworm 🌽",
      "Pulses (Lentils)": "Avoid waterlogging; inoculate seeds with Rhizobium 🫘",
      Millets: "Great drought tolerance; minimal irrigation needed 🌾",
      Soybean: "Well-drained soil; critical water at pod-fill 🫘",
      Cotton: "High K need during boll development 🧱",
      Wheat: "Irrigate at CRI and grain fill; avoid lodging 🌾",
      Potato: "High K; hill soil to cover tubers 🥔",
      Mustard: "Avoid late sowing to escape high temp at flowering 🌼",
      Vegetables: "Short-duration; plan staggered sowing 🥦",
    };

    const greeting = (() => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning 👋";
      if (hour < 18) return "Good afternoon 👋";
      return "Good evening 👋";
    })();

    const top = picks.slice(0, 2);
    const reasons = top.map((c) => `• ${c}: ${tips[c] ?? "Suitable for the season."}`).join("\n");

    const message =
      `${greeting} Farmer!\n` +
      `Season: ${args.season.toUpperCase()} • State: ${state}\n` +
      `Suggested crops: ${top.join(", ")}\n` +
      `Why these crops:\n${reasons}\n` +
      `Would you like tips for fertilizer schedule or irrigation planning next? 💬`;

    return await ctx.db.insert("connectMessages", {
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