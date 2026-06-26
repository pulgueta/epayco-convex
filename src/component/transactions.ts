import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server.js";
import { paymentMethodValidator } from "./validators.js";
import { statusFromCodResponse } from "./status.js";

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

    const insertedId = await ctx.db.insert("transactions", {
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

    // Reconcile a confirmation that arrived BEFORE this row existed: an async
    // PSE/cash/Daviplata webhook can race ahead of (or be independent of) local
    // persistence, in which case `webhooks.processConfirmation` verified it and
    // parked the event as `pending`. Apply it now so the status is never lost.
    await drainPendingConfirmation(ctx, args.epaycoRef, insertedId);

    return insertedId;
  },
});

/**
 * If a verified-but-unapplied confirmation event is waiting for `epaycoRef`,
 * apply its outcome to the (now-existing) transaction row and mark the event
 * processed. Deterministic, so no cron/scheduler is needed; it runs whenever a
 * transaction is first inserted. Safe no-op when nothing is waiting.
 */
async function drainPendingConfirmation(
  ctx: { db: import("./_generated/server.js").MutationCtx["db"] },
  epaycoRef: string,
  transactionId: import("./_generated/dataModel.js").Id<"transactions">,
): Promise<void> {
  const event = await ctx.db
    .query("webhookEvents")
    .withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", epaycoRef))
    .order("desc")
    .first();
  if (!event || event.status !== "pending") return;

  const payload = (event.rawPayload ?? {}) as Record<string, unknown>;
  const cod = payload.x_cod_response;
  if (cod === undefined || cod === null) return;

  const reason = payload.x_response_reason_text ?? payload.x_response;
  await ctx.db.patch(transactionId, {
    status: statusFromCodResponse(String(cod)),
    responseCode: String(cod),
    responseMessage:
      reason === undefined || reason === null ? undefined : String(reason),
    rawResponse: payload,
    lastSyncedAt: Date.now(),
  });
  await ctx.db.patch(event._id, {
    status: "processed",
    processedAt: Date.now(),
    lastSyncedAt: Date.now(),
  });
}

/**
 * Patch the status of an existing transaction. Returns `true` when a row was
 * found and updated, `false` when no local row exists yet — so callers (e.g. the
 * webhook handler) can detect a confirmation that arrived before local
 * persistence instead of silently dropping it.
 */
export const updateTransactionStatus = internalMutation({
  args: {
    epaycoRef: v.string(),
    status: v.string(),
    responseCode: v.optional(v.string()),
    responseMessage: v.optional(v.string()),
    rawResponse: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", args.epaycoRef))
      .first();

    if (!existing) return false;

    await ctx.db.patch(existing._id, {
      status: args.status,
      responseCode: args.responseCode,
      responseMessage: args.responseMessage,
      rawResponse: args.rawResponse,
      lastSyncedAt: Date.now(),
    });
    return true;
  },
});
