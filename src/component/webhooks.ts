import { v } from "convex/values";
import {
	action,
	internalMutation,
	internalQuery,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { verifyWebhookSignature } from "./signature.js";
import { statusFromCodResponse } from "./status.js";
import { rateLimiter } from "./rateLimits.js";

export const processConfirmation = action({
	args: {
		custIdCliente: v.string(),
		pKey: v.string(),
		payload: v.any(),
	},
	handler: async (ctx, args) => {
		await rateLimiter.limit(ctx, "webhookProcessing", {
			key: "global",
			throws: true,
		});

		const {
			x_ref_payco,
			x_transaction_id,
			x_amount,
			x_currency_code,
			x_signature,
			x_response,
			x_response_reason_text,
			x_cod_response,
		} = args.payload;

		const refPayco = String(x_ref_payco);

		const existingEvent = await ctx.runQuery(
			internal.webhooks.getWebhookEvent,
			{ epaycoRef: refPayco },
		);

		if (existingEvent && existingEvent.status === "processed") {
			return { success: true, message: "Already processed" };
		}

		await ctx.runMutation(internal.webhooks.storeWebhookEvent, {
			epaycoRef: refPayco,
			epaycoTransactionId: x_transaction_id
				? String(x_transaction_id)
				: undefined,
			eventType: "confirmation",
			status: "pending",
			rawPayload: args.payload,
			lastSyncedAt: Date.now(),
		});

		const isValid = await verifyWebhookSignature(
			args.custIdCliente,
			args.pKey,
			String(x_ref_payco),
			String(x_transaction_id),
			String(x_amount),
			String(x_currency_code),
			x_signature,
		);

		if (!isValid) {
			await ctx.runMutation(internal.webhooks.markWebhookProcessed, {
				epaycoRef: refPayco,
				status: "failed",
				errorMessage: "Invalid signature",
			});
			return { success: false, message: "Invalid signature" };
		}

		const codResponse = String(x_cod_response);
		const status = statusFromCodResponse(codResponse);

		await ctx.runMutation(internal.transactions.updateTransactionStatus, {
			epaycoRef: refPayco,
			status,
			responseCode: codResponse,
			responseMessage: x_response_reason_text ?? x_response,
			rawResponse: args.payload,
		});

		await ctx.runMutation(internal.webhooks.markWebhookProcessed, {
			epaycoRef: refPayco,
			status: "processed",
		});

		return { success: true, status };
	},
});

export const storeWebhookEvent = internalMutation({
	args: {
		epaycoRef: v.string(),
		epaycoTransactionId: v.optional(v.string()),
		eventType: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("processed"),
			v.literal("failed"),
		),
		rawPayload: v.any(),
		lastSyncedAt: v.number(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("webhookEvents", {
			epaycoRef: args.epaycoRef,
			epaycoTransactionId: args.epaycoTransactionId,
			eventType: args.eventType,
			status: args.status,
			rawPayload: args.rawPayload,
			lastSyncedAt: args.lastSyncedAt,
		});
	},
});

export const markWebhookProcessed = internalMutation({
	args: {
		epaycoRef: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("processed"),
			v.literal("failed"),
		),
		errorMessage: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db
			.query("webhookEvents")
			.withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", args.epaycoRef))
			.order("desc")
			.first();

		if (event) {
			await ctx.db.patch(event._id, {
				status: args.status,
				processedAt: Date.now(),
				errorMessage: args.errorMessage,
				lastSyncedAt: Date.now(),
			});
		}
	},
});

export const getWebhookEvent = internalQuery({
	args: { epaycoRef: v.string() },
	returns: v.any(),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("webhookEvents")
			.withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", args.epaycoRef))
			.order("desc")
			.first();
	},
});
