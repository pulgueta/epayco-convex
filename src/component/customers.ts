import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server.js";

/**
 * Local persistence for ePayco customers. The outbound SDK calls live in
 * `customersApi.ts` (Node runtime); these queries/mutations run in the fast
 * V8 runtime and are the source of truth for the host app's reactive reads.
 */

export const getLocalCustomer = query({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getLocalCustomerByEpaycoId = query({
  args: { epaycoCustomerId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_epaycoCustomerId", (q) =>
        q.eq("epaycoCustomerId", args.epaycoCustomerId),
      )
      .first();
  },
});

export const listLocalCustomers = query({
  args: { limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.query("customers").take(args.limit ?? 100);
  },
});

export const upsertCustomer = internalMutation({
  args: {
    userId: v.string(),
    epaycoCustomerId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    docType: v.optional(v.string()),
    docNumber: v.optional(v.string()),
    defaultCard: v.optional(v.string()),
    lastSyncedAt: v.number(),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_epaycoCustomerId", (q) =>
        q.eq("epaycoCustomerId", args.epaycoCustomerId),
      )
      .first();

    if (existing) {
      if (existing.lastSyncedAt >= args.lastSyncedAt) return existing._id;

      await ctx.db.patch(existing._id, {
        ...(args.name !== undefined ? { name: args.name } : {}),
        ...(args.email !== undefined ? { email: args.email } : {}),
        ...(args.phone !== undefined ? { phone: args.phone } : {}),
        ...(args.docType !== undefined ? { docType: args.docType } : {}),
        ...(args.docNumber !== undefined ? { docNumber: args.docNumber } : {}),
        ...(args.defaultCard !== undefined
          ? { defaultCard: args.defaultCard }
          : {}),
        lastSyncedAt: args.lastSyncedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("customers", {
      userId: args.userId,
      epaycoCustomerId: args.epaycoCustomerId,
      name: args.name ?? "",
      email: args.email ?? "",
      phone: args.phone,
      docType: args.docType,
      docNumber: args.docNumber,
      defaultCard: args.defaultCard,
      lastSyncedAt: args.lastSyncedAt,
    });
  },
});

export const setDefaultCard = internalMutation({
  args: {
    epaycoCustomerId: v.string(),
    defaultCard: v.string(),
    lastSyncedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_epaycoCustomerId", (q) =>
        q.eq("epaycoCustomerId", args.epaycoCustomerId),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        defaultCard: args.defaultCard,
        lastSyncedAt: args.lastSyncedAt,
      });
    }
    return null;
  },
});
