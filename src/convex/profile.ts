import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    age: v.optional(v.number()),
    location: v.optional(v.string()),
    farmSize: v.optional(v.number()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.image !== undefined ? { image: args.image } : {}),
      ...(args.age !== undefined ? { age: args.age } : {}),
      ...(args.location !== undefined ? { location: args.location } : {}),
      ...(args.farmSize !== undefined ? { farmSize: args.farmSize } : {}),
      ...(args.language !== undefined ? { language: args.language } : {}),
    });
    return "ok";
  },
});
