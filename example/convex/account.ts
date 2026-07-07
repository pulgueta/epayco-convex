import { getAuthUserId } from "@convex-dev/auth/server";
import { exposeApi } from "@pulgueta/epayco-convex";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { epayco } from "./epayco";

/**
 * Reactive reads for the account area. This file demonstrates *both* ways the
 * component lets a host expose its data:
 *
 *  1. `exposeApi` — ready-made, auth-gated queries you re-export directly. The
 *     scope is always the identity resolved by `auth`, never a client argument.
 *  2. Hand-written queries (e.g. `getLocalTokens`) when you want extra control
 *     or to join in your own app data.
 */

export const {
	getCustomer,
	getTransaction,
	listTransactions,
	listSubscriptions,
	getActiveSubscription,
} = exposeApi(components.epayco, {
	auth: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("You must be signed in to do that.");
		return userId;
	},
});

/** The signed-in user's profile, used to pre-fill checkout. */
export const getMe = query({
	args: {},
	returns: v.any(),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		const user = await ctx.db.get(userId);
		if (!user) return null;
		return { email: user.email ?? null, name: user.name ?? null };
	},
});

/** Saved cards (tokens) for the signed-in user. */
export const getLocalTokens = query({
	args: {},
	returns: v.any(),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];
		return await epayco.getLocalTokens(ctx, { userId });
	},
});
