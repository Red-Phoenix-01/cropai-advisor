import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      location: v.optional(v.string()), // farmer location
      farmSize: v.optional(v.number()), // farm size in acres
      language: v.optional(v.string()), // preferred language
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Crop recommendations table
    recommendations: defineTable({
      userId: v.id("users"),
      nitrogen: v.number(),
      phosphorus: v.number(),
      potassium: v.number(),
      ph: v.number(),
      soilMoisture: v.number(),
      waterAvailability: v.number(),
      location: v.string(),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      recommendedCrops: v.array(v.object({
        name: v.string(),
        confidence: v.number(),
        explanation: v.string(),
        profitEstimate: v.number(),
        waterUsage: v.string(),
        fertilizerAdvice: v.string(),
        irrigationAdvice: v.string(),
      })),
      weatherData: v.optional(v.object({
        temperature: v.number(),
        humidity: v.number(),
        rainfall: v.number(),
        forecast: v.string(),
      })),
    }).index("by_user", ["userId"]),

    // Market prices table
    marketPrices: defineTable({
      crop: v.string(),
      price: v.number(),
      unit: v.string(),
      market: v.string(),
      date: v.string(),
      trend: v.string(), // "up", "down", "stable"
    }).index("by_crop", ["crop"]),

    // Weather alerts table
    weatherAlerts: defineTable({
      location: v.string(),
      alertType: v.string(), // "drought", "flood", "frost", etc.
      severity: v.string(), // "low", "medium", "high"
      message: v.string(),
      validUntil: v.number(),
    }).index("by_location", ["location"]),

    // Add connect tables for state-based farmer chat and contacts
    connectMessages: defineTable({
      userId: v.id("users"),
      state: v.string(),
      text: v.string(),
      // Add optional cached user name to display in chat
      userName: v.optional(v.string()),
    }).index("by_state", ["state"]).index("by_user", ["userId"]),

    connectContacts: defineTable({
      userId: v.id("users"),
      state: v.string(),
      name: v.string(),
      phone: v.string(),
      note: v.optional(v.string()),
    }).index("by_state", ["state"]).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;