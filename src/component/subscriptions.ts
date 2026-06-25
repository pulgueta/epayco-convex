import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server.js";

/** Local persistence for subscriptions. */

export const getLocalSubscription = query({
  args: { epaycoSubscriptionId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_epaycoSubscriptionId", (q) =>
        q.eq("epaycoSubscriptionId", args.epaycoSubscriptionId),
      )
      .first();
  },
});

export const listLocalSubscriptionsByUser = query({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(100);
    return subs.filter((s) => s.status !== "cancelled");
  },
});

export const getActiveSubscription = query({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(100);
    return subs.find((s) => s.status === "active") ?? null;
  },
});

export const upsertSubscription = internalMutation({
  args: {
    userId: v.optional(v.string()),
    epaycoSubscriptionId: v.string(),
    epaycoCustomerId: v.optional(v.string()),
    epaycoPlanId: v.optional(v.string()),
    epaycoTokenId: v.optional(v.string()),
    status: v.string(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    lastSyncedAt: v.number(),
  },
  returns: v.id("subscriptions"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_epaycoSubscriptionId", (q) =>
        q.eq("epaycoSubscriptionId", args.epaycoSubscriptionId),
      )
      .first();

    if (existing) {
      if (existing.lastSyncedAt >= args.lastSyncedAt) return existing._id;

      const patch: Record<string, unknown> = {
        status: args.status,
        lastSyncedAt: args.lastSyncedAt,
      };
      if (args.currentPeriodStart !== undefined)
        patch.currentPeriodStart = args.currentPeriodStart;
      if (args.currentPeriodEnd !== undefined)
        patch.currentPeriodEnd = args.currentPeriodEnd;
      if (args.epaycoTokenId !== undefined)
        patch.epaycoTokenId = args.epaycoTokenId;

      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", {
      userId: args.userId ?? "",
      epaycoSubscriptionId: args.epaycoSubscriptionId,
      epaycoCustomerId: args.epaycoCustomerId ?? "",
      epaycoPlanId: args.epaycoPlanId ?? "",
      epaycoTokenId: args.epaycoTokenId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      lastSyncedAt: args.lastSyncedAt,
    });
  },
});
