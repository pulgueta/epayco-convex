import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server.js";

/**
 * Local persistence for tokenized cards. Card data itself is never stored —
 * only the ePayco token id, masked PAN, and franchise.
 */

export const getLocalTokens = query({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("tokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(100);
    return tokens.filter((t) => t.isActive);
  },
});

export const upsertToken = internalMutation({
  args: {
    userId: v.string(),
    epaycoTokenId: v.string(),
    epaycoCustomerId: v.string(),
    mask: v.string(),
    franchise: v.string(),
    isActive: v.boolean(),
    lastSyncedAt: v.number(),
  },
  returns: v.id("tokens"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokens")
      .withIndex("by_epaycoTokenId", (q) =>
        q.eq("epaycoTokenId", args.epaycoTokenId),
      )
      .first();

    if (existing) {
      if (existing.lastSyncedAt >= args.lastSyncedAt) return existing._id;

      const patch: Record<string, unknown> = {
        mask: args.mask,
        franchise: args.franchise,
        isActive: args.isActive,
        lastSyncedAt: args.lastSyncedAt,
      };
      // Only link/relink the customer when a non-empty id is provided, so a
      // later card-only sync can't wipe an existing customer association.
      if (args.epaycoCustomerId !== "") {
        patch.epaycoCustomerId = args.epaycoCustomerId;
      }
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("tokens", {
      userId: args.userId,
      epaycoTokenId: args.epaycoTokenId,
      epaycoCustomerId: args.epaycoCustomerId,
      mask: args.mask,
      franchise: args.franchise,
      isActive: args.isActive,
      lastSyncedAt: args.lastSyncedAt,
    });
  },
});

export const revokeToken = internalMutation({
  args: { epaycoTokenId: v.string(), lastSyncedAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokens")
      .withIndex("by_epaycoTokenId", (q) =>
        q.eq("epaycoTokenId", args.epaycoTokenId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: false,
        lastSyncedAt: args.lastSyncedAt,
      });
    }
    return null;
  },
});
