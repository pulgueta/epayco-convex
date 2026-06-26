import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { epaycoCredentialsValidator, planInfoValidator } from "./validators.js";
import { getEpaycoClient, unwrap } from "./epaycoClient.js";

/** Create a recurring plan. */
export const createPlan = action({
  args: {
    credentials: epaycoCredentialsValidator,
    planInfo: planInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const p = args.planInfo;
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.plans.create({
        id_plan: p.idPlan,
        name: p.name,
        description: p.description,
        amount: p.amount,
        currency: p.currency,
        interval: p.interval,
        interval_count: p.intervalCount,
        trial_days: p.trialDays,
        ...(p.iva !== undefined ? { iva: p.iva } : {}),
        ...(p.ico !== undefined ? { ico: p.ico } : {}),
      }),
    );

    await ctx.runMutation(internal.plans.upsertPlan, {
      epaycoPlanId: p.idPlan,
      name: p.name,
      description: p.description,
      amount: p.amount,
      currency: p.currency,
      interval: p.interval,
      intervalCount: p.intervalCount,
      trialDays: p.trialDays,
      status: "active",
      lastSyncedAt: Date.now(),
    });

    return result;
  },
});

export const getPlan = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoPlanId: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.plans.get(args.epaycoPlanId));
  },
});

export const listPlans = action({
  args: { credentials: epaycoCredentialsValidator },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.plans.list());
  },
});

export const updatePlan = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoPlanId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    intervalCount: v.optional(v.number()),
    trialDays: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.plans.update(args.epaycoPlanId, {
        ...(args.name ? { name: args.name } : {}),
        ...(args.description ? { description: args.description } : {}),
        ...(args.amount !== undefined ? { amount: args.amount } : {}),
        ...(args.currency ? { currency: args.currency } : {}),
        ...(args.interval ? { interval: args.interval } : {}),
        ...(args.intervalCount !== undefined
          ? { interval_count: args.intervalCount }
          : {}),
        ...(args.trialDays !== undefined ? { trial_days: args.trialDays } : {}),
      }),
    );

    await ctx.runMutation(internal.plans.upsertPlan, {
      epaycoPlanId: args.epaycoPlanId,
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.description !== undefined ? { description: args.description } : {}),
      ...(args.amount !== undefined ? { amount: args.amount } : {}),
      ...(args.currency !== undefined ? { currency: args.currency } : {}),
      ...(args.interval !== undefined ? { interval: args.interval } : {}),
      ...(args.intervalCount !== undefined
        ? { intervalCount: args.intervalCount }
        : {}),
      ...(args.trialDays !== undefined ? { trialDays: args.trialDays } : {}),
      lastSyncedAt: Date.now(),
    });

    return result;
  },
});

export const deletePlan = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoPlanId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(await epayco.plans.delete(args.epaycoPlanId));

    await ctx.runMutation(internal.plans.upsertPlan, {
      epaycoPlanId: args.epaycoPlanId,
      status: "deleted",
      lastSyncedAt: Date.now(),
    });

    return result;
  },
});
