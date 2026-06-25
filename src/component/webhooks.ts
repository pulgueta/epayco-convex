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

		// Throttle per ref_payco so abuse on one reference can't starve legitimate
		// confirmations for every other transaction.
		await rateLimiter.limit(ctx, "webhookProcessing", {
			key: refPayco,
			throws: true,
		});

		// Idempotency: a fully processed confirmation is a no-op (this is a read,
		// nothing is persisted yet).
		const existingEvent = await ctx.runQuery(
			internal.webhooks.getWebhookEvent,
			{ epaycoRef: refPayco },
		);

		if (existingEvent && existingEvent.status === "processed") {
			return { success: true, message: "Already processed" };
		}

		// Verify the signature BEFORE persisting anything, so an unauthenticated
		// caller can never write an arbitrary payload into the table.
		const isValid = await verifyWebhookSignature(
			args.custIdCliente,
			args.pKey,
			refPayco,
			String(x_transaction_id),
			String(x_amount),
			String(x_currency_code),
			x_signature,
		);

		if (!isValid) {
			await ctx.runMutation(internal.webhooks.storeWebhookEvent, {
				epaycoRef: refPayco,
				epaycoTransactionId: x_transaction_id
					? String(x_transaction_id)
					: undefined,
				eventType: "confirmation",
				status: "failed",
				errorMessage: "Invalid signature",
				rawPayload: { x_ref_payco: refPayco },
				lastSyncedAt: Date.now(),
			});
			return { success: false, message: "Invalid signature" };
		}

		// Persist the verified event idempotently (insert-or-patch keyed by ref),
		// so concurrent retries collapse into a single row.
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

		const codResponse = String(x_cod_response);
		const status = statusFromCodResponse(codResponse);

		const reasonText = x_response_reason_text ?? x_response;
		const responseMessage =
			reasonText === undefined || reasonText === null
				? undefined
				: String(reasonText);

		const updated = await ctx.runMutation(
			internal.transactions.updateTransactionStatus,
			{
				epaycoRef: refPayco,
				status,
				responseCode: codResponse,
				responseMessage,
				rawResponse: args.payload,
			},
		);

		if (!updated) {
			// The confirmation arrived before the local transaction row exists (an
			// async PSE/cash/Daviplata webhook racing ahead of persistence). Park
			// the verified event as "pending" with its payload; when the
			// transaction row is later inserted, `transactions.upsertTransaction`
			// drains and applies it, so the status is never lost.
			await ctx.runMutation(internal.webhooks.markWebhookProcessed, {
				epaycoRef: refPayco,
				status: "pending",
				errorMessage:
					"Transaction not yet persisted; will reconcile on insert",
			});
			return { success: true, status, transactionUpdated: false };
		}

		await ctx.runMutation(internal.webhooks.markWebhookProcessed, {
			epaycoRef: refPayco,
			status: "processed",
		});

		return { success: true, status };
	},
});

/**
 * Idempotent insert-or-patch keyed by `epaycoRef`. Collapsing to one row per
 * reference means concurrent retries (Convex serializes conflicting mutations
 * and retries, so this is effectively atomic) can't accumulate duplicate event
 * rows. A row already marked `processed` is never regressed.
 */
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
		errorMessage: v.optional(v.string()),
		lastSyncedAt: v.number(),
	},
	returns: v.id("webhookEvents"),
	handler: async (ctx, args) => {
		// Select the newest row for this ref, matching getWebhookEvent and
		// markWebhookProcessed so all three operate on the same document even if
		// legacy duplicates exist.
		const existing = await ctx.db
			.query("webhookEvents")
			.withIndex("by_epaycoRef", (q) => q.eq("epaycoRef", args.epaycoRef))
			.order("desc")
			.first();

		if (existing) {
			if (existing.status !== "processed") {
				await ctx.db.patch(existing._id, {
					epaycoTransactionId:
						args.epaycoTransactionId ?? existing.epaycoTransactionId,
					status: args.status,
					rawPayload: args.rawPayload,
					errorMessage: args.errorMessage,
					lastSyncedAt: args.lastSyncedAt,
				});
			}
			return existing._id;
		}

		return await ctx.db.insert("webhookEvents", {
			epaycoRef: args.epaycoRef,
			epaycoTransactionId: args.epaycoTransactionId,
			eventType: args.eventType,
			status: args.status,
			rawPayload: args.rawPayload,
			errorMessage: args.errorMessage,
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
