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
      .order("desc")
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
      .order("desc")
      .take(100);
    return subs.find((s) => s.status === "active") ?? null;
  },
});

/**
 * Patch the status of an existing subscription only. Unlike `upsertSubscription`
 * this never inserts, so cancelling a subscription that was never persisted
 * locally (e.g. created out-of-band) can't create an orphan row with empty
 * identity fields. Returns whether a row was found and updated.
 */
export const updateSubscriptionStatus = internalMutation({
  args: {
    epaycoSubscriptionId: v.string(),
    status: v.string(),
    lastSyncedAt: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_epaycoSubscriptionId", (q) =>
        q.eq("epaycoSubscriptionId", args.epaycoSubscriptionId),
      )
      .first();

    if (!existing) return false;
    if (existing.lastSyncedAt >= args.lastSyncedAt) return true;

    await ctx.db.patch(existing._id, {
      status: args.status,
      lastSyncedAt: args.lastSyncedAt,
    });
    return true;
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
