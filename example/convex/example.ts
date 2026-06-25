import { getAuthUserId } from "@convex-dev/auth/server";
import type { Auth } from "convex/server";
import { v } from "convex/values";
import { EPayco, exposeApi } from "@pulgueta/epayco-convex";
import { components } from "./_generated/api.js";
import { action, query } from "./_generated/server.js";

const epayco = new EPayco(components.epaycoConvex, {
	testMode: true,
	publicKey: process.env.EPAYCO_PUBLIC_KEY,
	privateKey: process.env.EPAYCO_PRIVATE_KEY,
});

async function requireAuth(ctx: { auth: Auth }) {
	const userId = await getAuthUserId(ctx);
	if (!userId) throw new Error("Unauthorized");
	return userId;
}

// --- Token ---

export const tokenizeCard = action({
	args: {
		cardNumber: v.string(),
		expYear: v.string(),
		expMonth: v.string(),
		cvc: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuth(ctx);
		return await epayco.createToken(ctx, { userId, tokenInfo: args });
	},
});

// --- Customer ---

export const createCustomer = action({
	args: {
		tokenCard: v.string(),
		name: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),
		docType: v.optional(v.string()),
		docNumber: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuth(ctx);
		return await epayco.createCustomer(ctx, {
			userId,
			customerInfo: {
				tokenCard: args.tokenCard,
				name: args.name,
				lastName: args.lastName,
				email: args.email,
				cellPhone: args.phone,
				docType: args.docType,
				docNumber: args.docNumber,
			},
		});
	},
});

// --- Credit-card charge ---

export const chargeCreditCard = action({
	args: {
		tokenCard: v.string(),
		customerId: v.string(),
		docType: v.string(),
		docNumber: v.string(),
		name: v.string(),
		lastName: v.string(),
		email: v.string(),
		bill: v.string(),
		description: v.string(),
		value: v.number(),
		tax: v.number(),
		taxBase: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuth(ctx);
		return await epayco.chargeCreditCard(ctx, { userId, chargeInfo: args });
	},
});

// --- Cash payment ---

export const createCashPayment = action({
	args: {
		provider: v.union(
			v.literal("efecty"),
			v.literal("baloto"),
			v.literal("gana"),
			v.literal("redservi"),
			v.literal("puntored"),
			v.literal("sured"),
		),
		docType: v.string(),
		docNumber: v.string(),
		name: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.string(),
		bill: v.string(),
		description: v.string(),
		value: v.number(),
		tax: v.number(),
		taxBase: v.number(),
		endDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuth(ctx);
		const { provider, phone, ...rest } = args;
		return await epayco.createCashPayment(ctx, {
			userId,
			provider,
			cashInfo: { ...rest, cellPhone: phone },
		});
	},
});

// --- PSE ---

export const refreshBanks = action({
	args: {},
	handler: async (ctx) => {
		await requireAuth(ctx);
		return await epayco.getBanks(ctx);
	},
});

export const listBanks = query({
	args: {},
	handler: async (ctx) => {
		return await epayco.listLocalBanks(ctx);
	},
});

export const createPse = action({
	args: {
		bank: v.string(),
		typePerson: v.union(v.literal("0"), v.literal("1")),
		docType: v.string(),
		docNumber: v.string(),
		name: v.string(),
		lastName: v.string(),
		email: v.string(),
		cellPhone: v.string(),
		bill: v.string(),
		description: v.string(),
		value: v.number(),
		tax: v.number(),
		taxBase: v.number(),
		urlResponse: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuth(ctx);
		return await epayco.createPseTransaction(ctx, { userId, pseInfo: args });
	},
});

// --- Plans ---

export const createPlan = action({
	args: {
		idPlan: v.string(),
		name: v.string(),
		description: v.string(),
		amount: v.number(),
		currency: v.string(),
		interval: v.string(),
		intervalCount: v.number(),
		trialDays: v.number(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		return await epayco.createPlan(ctx, { planInfo: args });
	},
});

export const listPlans = query({
	args: {},
	handler: async (ctx) => {
		return await epayco.listLocalPlans(ctx);
	},
});

// --- Subscriptions ---

export const subscribe = action({
	args: {
		idPlan: v.string(),
		customer: v.string(),
		tokenCard: v.string(),
		docType: v.string(),
		docNumber: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuth(ctx);
		return await epayco.createSubscription(ctx, {
			userId,
			subscriptionInfo: args,
		});
	},
});

export const cancelSubscription = action({
	args: { epaycoSubscriptionId: v.string() },
	handler: async (ctx, args) => {
		await requireAuth(ctx);
		return await epayco.cancelSubscription(ctx, args);
	},
});

// --- Reactive reads ---

export const getLocalCustomer = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		return await epayco.getLocalCustomer(ctx, { userId });
	},
});

export const getLocalTokens = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];
		return await epayco.getLocalTokens(ctx, { userId });
	},
});

export const listTransactions = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];
		return await epayco.listTransactions(ctx, { userId });
	},
});

export const getActiveSubscription = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		return await epayco.getActiveSubscription(ctx, { userId });
	},
});

export const listSubscriptions = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];
		return await epayco.listSubscriptions(ctx, { userId });
	},
});

// Direct, auth-gated re-exports of the component's reactive queries.
export const {
	listTransactions: listTx,
	getTransaction,
	getCustomer,
	listSubscriptions: listSubs,
	getActiveSubscription: activeSub,
} = exposeApi(components.epaycoConvex, {
	auth: async (ctx, _operation) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		return userId;
	},
});
