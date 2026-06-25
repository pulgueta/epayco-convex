import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  epaycoCredentialsValidator,
  subscriptionInfoValidator,
} from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { rateLimiter } from "./rateLimits.js";

/** Create a subscription (enroll a customer in a plan). */
export const createSubscription = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    subscriptionInfo: subscriptionInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "createSubscription", {
      key: args.userId,
      throws: true,
    });

    const s = args.subscriptionInfo;
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.subscriptions.create({
        id_plan: s.idPlan,
        customer: s.customer,
        token_card: s.tokenCard,
        doc_type: s.docType,
        doc_number: s.docNumber,
        ...(s.urlConfirmation ? { url_confirmation: s.urlConfirmation } : {}),
        ...(s.methodConfirmation
          ? { method_confirmation: s.methodConfirmation }
          : {}),
      }),
    );

    const data = dataOf(result);
    const subscriptionId =
      pick(data, ["id", "id_subscription", "subscription"]) ??
      pick(result, ["id", "id_subscription"]);

    if (subscriptionId) {
      await ctx.runMutation(internal.subscriptions.upsertSubscription, {
        userId: args.userId,
        epaycoSubscriptionId: subscriptionId,
        epaycoCustomerId: s.customer,
        epaycoPlanId: s.idPlan,
        epaycoTokenId: s.tokenCard,
        status: pick(data, ["status"]) ?? "active",
        lastSyncedAt: Date.now(),
      });
    }

    return result;
  },
});

export const getSubscription = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoSubscriptionId: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.subscriptions.get(args.epaycoSubscriptionId));
  },
});

export const listSubscriptions = action({
  args: { credentials: epaycoCredentialsValidator },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.subscriptions.list());
  },
});

export const cancelSubscription = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoSubscriptionId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.subscriptions.cancel(args.epaycoSubscriptionId),
    );

    await ctx.runMutation(internal.subscriptions.upsertSubscription, {
      epaycoSubscriptionId: args.epaycoSubscriptionId,
      status: "cancelled",
      lastSyncedAt: Date.now(),
    });

    return result;
  },
});

/** Immediately charge a subscription's plan (one-off recurring payment). */
export const chargeSubscription = action({
  args: {
    credentials: epaycoCredentialsValidator,
    idPlan: v.string(),
    customer: v.string(),
    tokenCard: v.string(),
    docType: v.string(),
    docNumber: v.string(),
    ip: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(
      await epayco.subscriptions.charge({
        id_plan: args.idPlan,
        customer: args.customer,
        token_card: args.tokenCard,
        doc_type: args.docType,
        doc_number: args.docNumber,
        ...(args.ip ? { ip: args.ip } : {}),
      }),
    );
  },
});
