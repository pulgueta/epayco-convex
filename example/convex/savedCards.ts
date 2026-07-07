import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const listForUser = internalQuery({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("savedCards")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(100);
    return cards.filter((card) => card.isActive);
  },
});

export const getForUser = internalQuery({
  args: { userId: v.id("users"), savedCardId: v.id("savedCards") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.savedCardId);
    if (!card || card.userId !== args.userId || !card.isActive) return null;
    return card;
  },
});

export const upsert = internalMutation({
  args: {
    userId: v.id("users"),
    epaycoTokenId: v.string(),
    epaycoCustomerId: v.string(),
    mask: v.string(),
    franchise: v.string(),
  },
  returns: v.id("savedCards"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedCards")
      .withIndex("by_epaycoTokenId", (q) =>
        q.eq("epaycoTokenId", args.epaycoTokenId),
      )
      .first();

    const patch = {
      userId: args.userId,
      epaycoCustomerId: args.epaycoCustomerId,
      mask: args.mask,
      franchise: args.franchise,
      isActive: true,
      lastSyncedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("savedCards", {
      ...patch,
      epaycoTokenId: args.epaycoTokenId,
    });
  },
});
