import { ConvexError, v } from "convex/values";
import type { ActionCtx } from "./_generated/server";
import { action, query } from "./_generated/server";
import { epayco, requireUser } from "./epayco";
import {
	billingValidator,
	cardValidator,
	resolveCardAndCustomer,
} from "./cards";

/**
 * Recurring "Coffee Club" plans. Tiers are defined statically here and created
 * on ePayco on demand (`ensurePlans`), so the pricing page renders instantly
 * from `listPlanTiers` and never depends on a prior seeding step.
 */

export type PlanTier = {
	id: string;
	name: string;
	tagline: string;
	amountCop: number;
	interval: "month";
	intervalCount: number;
	trialDays: number;
	bags: number;
	perks: string[];
	featured: boolean;
};

export const PLAN_TIERS: PlanTier[] = [
	{
		id: "coffee-club-catador",
		name: "Catador",
		tagline: "One bag a month, always fresh.",
		amountCop: 45000,
		interval: "month",
		intervalCount: 1,
		trialDays: 0,
		bags: 1,
		perks: [
			"1 × 340 g bag every month",
			"Rotating single origins",
			"Free standard shipping",
			"Pause or cancel anytime",
		],
		featured: false,
	},
	{
		id: "coffee-club-barista",
		name: "Barista",
		tagline: "Two bags a month for the daily ritual.",
		amountCop: 85000,
		interval: "month",
		intervalCount: 1,
		trialDays: 7,
		bags: 2,
		perks: [
			"2 × 340 g bags every month",
			"Early access to micro-lots",
			"Free express shipping",
			"7-day free trial",
		],
		featured: true,
	},
	{
		id: "coffee-club-maestro",
		name: "Maestro",
		tagline: "Three bags plus perks for the obsessed.",
		amountCop: 120000,
		interval: "month",
		intervalCount: 1,
		trialDays: 0,
		bags: 3,
		perks: [
			"3 × 340 g bags every month",
			"10% off all brew gear",
			"Quarterly limited reserve",
			"Priority roasting & support",
		],
		featured: false,
	},
];

const TIERS_BY_ID = new Map(PLAN_TIERS.map((tier) => [tier.id, tier]));

export const listPlanTiers = query({
	args: {},
	returns: v.any(),
	handler: async () => PLAN_TIERS,
});

/** Best-effort: make sure a plan exists on ePayco before subscribing to it. */
async function ensurePlan(ctx: ActionCtx, tier: PlanTier): Promise<void> {
	const existing = await epayco.getLocalPlan(ctx, { epaycoPlanId: tier.id });
	if (existing) return;
	try {
		await epayco.createPlan(ctx, {
			planInfo: {
				idPlan: tier.id,
				name: `Coffee Club — ${tier.name}`,
				description: tier.tagline,
				amount: tier.amountCop,
				currency: "COP",
				interval: tier.interval,
				intervalCount: tier.intervalCount,
				trialDays: tier.trialDays,
			},
		});
	} catch {
		// The plan may already exist on ePayco from a previous run — that's fine,
		// the subscription below references it by id regardless.
	}
}

/** Create every Coffee Club plan on ePayco (idempotent). */
export const ensurePlans = action({
	args: {},
	returns: v.any(),
	handler: async (ctx) => {
		await requireUser(ctx);
		for (const tier of PLAN_TIERS) await ensurePlan(ctx, tier);
		return { ensured: PLAN_TIERS.length };
	},
});

export const subscribe = action({
	args: {
		planId: v.string(),
		billing: billingValidator,
		card: v.optional(cardValidator),
		savedTokenId: v.optional(v.string()),
	},
	returns: v.any(),
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const tier = TIERS_BY_ID.get(args.planId);
		if (!tier) throw new ConvexError({ message: "Unknown plan." });

		await ensurePlan(ctx, tier);
		const { tokenCard, customerId } = await resolveCardAndCustomer(
			ctx,
			userId,
			args.billing,
			{ card: args.card, savedTokenId: args.savedTokenId },
		);

		const result = await epayco.createSubscription(ctx, {
			userId,
			subscriptionInfo: {
				idPlan: tier.id,
				customer: customerId,
				tokenCard,
				docType: args.billing.docType,
				docNumber: args.billing.docNumber,
			},
		});

		const data =
			result && typeof result === "object" && "data" in result
				? (result.data as Record<string, unknown>)
				: {};
		const subscriptionId = data.id ?? data.id_subscription ?? null;
		return { subscriptionId: subscriptionId ? String(subscriptionId) : null };
	},
});

export const cancelSubscription = action({
	args: { epaycoSubscriptionId: v.string() },
	returns: v.any(),
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);

		// Ownership check: only let a user cancel a subscription that is theirs.
		// listSubscriptions is scoped to `userId`, so it's the trusted source —
		// never cancel an arbitrary client-supplied id.
		const own = await epayco.listSubscriptions(ctx, { userId });
		const owns = own.some(
			(s: { epaycoSubscriptionId: string }) =>
				s.epaycoSubscriptionId === args.epaycoSubscriptionId,
		);
		if (!owns) {
			throw new ConvexError({ message: "Subscription not found." });
		}

		return await epayco.cancelSubscription(ctx, {
			epaycoSubscriptionId: args.epaycoSubscriptionId,
		});
	},
});
