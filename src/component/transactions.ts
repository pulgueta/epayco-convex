import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server.js";
import { paymentMethodValidator } from "./validators.js";

export const getLocalTransaction = query({
  args: { epaycoRef: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", args.epaycoRef))
      .first();
  },
});

export const listLocalTransactions = query({
  args: {
    userId: v.string(),
    status: v.optional(v.string()),
    paymentMethod: v.optional(paymentMethodValidator),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let q;
    if (args.status) {
      q = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!),
        );
    } else {
      q = ctx.db
        .query("transactions")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));
    }

    if (args.paymentMethod) {
      q = q.filter((q) =>
        q.eq(q.field("paymentMethod"), args.paymentMethod),
      );
    }

    return await q.order("desc").take(args.limit ?? 100);
  },
});

export const upsertTransaction = internalMutation({
  args: {
    userId: v.string(),
    epaycoRef: v.string(),
    epaycoTransactionId: v.optional(v.string()),
    paymentMethod: paymentMethodValidator,
    status: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    customerEmail: v.optional(v.string()),
    bankName: v.optional(v.string()),
    cashProvider: v.optional(v.string()),
    responseCode: v.optional(v.string()),
    responseMessage: v.optional(v.string()),
    franchise: v.optional(v.string()),
    splitPayment: v.optional(v.boolean()),
    splitReceivers: v.optional(
      v.array(
        v.object({
          id: v.string(),
          total: v.number(),
          iva: v.number(),
          base_iva: v.number(),
          fee: v.optional(v.number()),
        }),
      ),
    ),
    rawResponse: v.optional(v.any()),
    lastSyncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", args.epaycoRef))
      .first();

    if (existing) {
      if (existing.lastSyncedAt >= args.lastSyncedAt) return existing._id;

      await ctx.db.patch(existing._id, {
        status: args.status,
        responseCode: args.responseCode,
        responseMessage: args.responseMessage,
        rawResponse: args.rawResponse,
        lastSyncedAt: args.lastSyncedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("transactions", {
      userId: args.userId,
      epaycoRef: args.epaycoRef,
      epaycoTransactionId: args.epaycoTransactionId,
      paymentMethod: args.paymentMethod,
      status: args.status,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      customerEmail: args.customerEmail,
      bankName: args.bankName,
      cashProvider: args.cashProvider,
      responseCode: args.responseCode,
      responseMessage: args.responseMessage,
      franchise: args.franchise,
      splitPayment: args.splitPayment,
      splitReceivers: args.splitReceivers,
      rawResponse: args.rawResponse,
      lastSyncedAt: args.lastSyncedAt,
    });
  },
});

export const updateTransactionStatus = internalMutation({
  args: {
    epaycoRef: v.string(),
    status: v.string(),
    responseCode: v.optional(v.string()),
    responseMessage: v.optional(v.string()),
    rawResponse: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", args.epaycoRef))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        responseCode: args.responseCode,
        responseMessage: args.responseMessage,
        rawResponse: args.rawResponse,
        lastSyncedAt: Date.now(),
      });
    }
  },
});
