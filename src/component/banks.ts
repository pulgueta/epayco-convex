import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server.js";

/** Local cache of the PSE bank list (refreshed via `pseApi.getBanks`). */

export const listLocalBanks = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("banks").take(200);
  },
});

export const upsertBank = internalMutation({
  args: {
    bankCode: v.string(),
    bankName: v.string(),
    lastSyncedAt: v.number(),
  },
  returns: v.id("banks"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("banks")
      .withIndex("by_bankCode", (q) => q.eq("bankCode", args.bankCode))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        bankName: args.bankName,
        lastSyncedAt: args.lastSyncedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("banks", {
      bankCode: args.bankCode,
      bankName: args.bankName,
      lastSyncedAt: args.lastSyncedAt,
    });
  },
});
