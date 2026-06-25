import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server.js";

/** Local persistence for recurring plans. */

export const getLocalPlan = query({
  args: { epaycoPlanId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_epaycoPlanId", (q) =>
        q.eq("epaycoPlanId", args.epaycoPlanId),
      )
      .first();
  },
});

export const listLocalPlans = query({
  args: { status: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("plans")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(args.limit ?? 100);
    }
    return await ctx.db.query("plans").take(args.limit ?? 100);
  },
});

export const upsertPlan = internalMutation({
  args: {
    epaycoPlanId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    intervalCount: v.optional(v.number()),
    trialDays: v.optional(v.number()),
    status: v.optional(v.string()),
    lastSyncedAt: v.number(),
  },
  returns: v.id("plans"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("plans")
      .withIndex("by_epaycoPlanId", (q) =>
        q.eq("epaycoPlanId", args.epaycoPlanId),
      )
      .first();

    if (existing) {
      if (existing.lastSyncedAt >= args.lastSyncedAt) return existing._id;

      const patch: Record<string, unknown> = { lastSyncedAt: args.lastSyncedAt };
      if (args.name !== undefined) patch.name = args.name;
      if (args.description !== undefined) patch.description = args.description;
      if (args.amount !== undefined) patch.amount = args.amount;
      if (args.currency !== undefined) patch.currency = args.currency;
      if (args.interval !== undefined) patch.interval = args.interval;
      if (args.intervalCount !== undefined)
        patch.intervalCount = args.intervalCount;
      if (args.trialDays !== undefined) patch.trialDays = args.trialDays;
      if (args.status !== undefined) patch.status = args.status;

      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("plans", {
      epaycoPlanId: args.epaycoPlanId,
      name: args.name ?? "",
      description: args.description ?? "",
      amount: args.amount ?? 0,
      currency: args.currency ?? "COP",
      interval: args.interval ?? "month",
      intervalCount: args.intervalCount ?? 1,
      trialDays: args.trialDays ?? 0,
      status: args.status ?? "active",
      lastSyncedAt: args.lastSyncedAt,
    });
  },
});
