import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { epayco, requireUser } from "./epayco";
import { cartLineValidator, priceItems, type CartLine } from "./catalog";
import {
	billingValidator,
	cardValidator,
	invoiceNumber,
	refOf,
	resolveCardAndCustomer,
} from "./cards";

/**
 * One-time payments: credit card, marketplace split, cash voucher and PSE.
 *
 * Every action recomputes the amount from the cart with `priceItems` — the
 * browser only ever sends product ids + quantities, never money. The ePayco
 * component persists each transaction locally keyed by `ref_payco`, so the UI
 * can reactively follow its status after the action returns.
 */

// --- Split partners ----------------------------------------------------------

/**
 * Marketplace recipients for the "Community Harvest" split. In production the
 * `epaycoId` of each receiver is a real ePayco merchant id; here they default to
 * the store's own client id (set `EPAYCO_SPLIT_RECEIVER_*` env vars to point at
 * real sub-merchants). The percentages always sum to 100.
 */
export const SPLIT_PARTNERS = [
	{
		id: "roaster",
		name: "Tostado Roastery",
		role: "Roasting, packaging & fulfillment",
		percentage: 55,
	},
	{
		id: "cooperative",
		name: "Asociación de Caficultores",
		role: "Grower cooperative — paid directly",
		percentage: 35,
	},
	{
		id: "logistics",
		name: "Última Milla Logistics",
		role: "Carbon-neutral last-mile delivery",
		percentage: 10,
	},
] as const;

export const listSplitPartners = query({
	args: {},
	returns: v.any(),
	handler: async () => SPLIT_PARTNERS,
});

// --- Saved cards -------------------------------------------------------------

/** Tokenize a card and link it to the user's ePayco customer, without charging. */
export const saveCard = action({
	args: { card: cardValidator, billing: billingValidator },
	returns: v.any(),
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const { tokenCard } = await resolveCardAndCustomer(ctx, userId, args.billing, {
			card: args.card,
		});
		return { tokenCard };
	},
});

// --- Credit-card checkout ----------------------------------------------------

export const payWithCard = action({
	args: {
		items: v.array(cartLineValidator),
		billing: billingValidator,
		card: v.optional(cardValidator),
		savedTokenId: v.optional(v.string()),
	},
	returns: v.any(),
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const cart = priceItems(args.items as CartLine[]);
		const { tokenCard, customerId } = await resolveCardAndCustomer(
			ctx,
			userId,
			args.billing,
			{ card: args.card, savedTokenId: args.savedTokenId },
		);

		const result = await epayco.chargeCreditCard(ctx, {
			userId,
			chargeInfo: {
				tokenCard,
				customerId,
				docType: args.billing.docType,
				docNumber: args.billing.docNumber,
				name: args.billing.name,
				lastName: args.billing.lastName,
				email: args.billing.email,
				cellPhone: args.billing.cellPhone,
				bill: invoiceNumber(),
				description: cart.description,
				value: cart.value,
				tax: cart.tax,
				taxBase: cart.taxBase,
				currency: cart.currency,
			},
		});

		return { refPayco: refOf(result) };
	},
});

// --- Split (marketplace) charge ---------------------------------------------

export const payWithSplit = action({
	args: {
		items: v.array(cartLineValidator),
		billing: billingValidator,
		card: v.optional(cardValidator),
		savedTokenId: v.optional(v.string()),
	},
	returns: v.any(),
	handler: async (ctx, args) => {
		const userId = await requireUser(ctx);
		const cart = priceItems(args.items as CartLine[]);
		const { tokenCard, customerId } = await resolveCardAndCustomer(
			ctx,
			userId,
			args.billing,
			{ card: args.card, savedTokenId: args.savedTokenId },
		);

		// Split the trusted total across partners by percentage. The last partner
		// absorbs the rounding remainder so the parts always sum to the total.
		const primaryId =
			process.env.EPAYCO_SPLIT_PRIMARY_RECEIVER ??
			process.env.EPAYCO_P_CUST_ID_CLIENTE ??
			"";
		let allocated = 0;
		const splitReceivers = SPLIT_PARTNERS.map((partner, index) => {
			const isLast = index === SPLIT_PARTNERS.length - 1;
			const amount = isLast
				? cart.value - allocated
				: Math.round((cart.value * partner.percentage) / 100);
			allocated += amount;
			return {
				id:
					process.env[`EPAYCO_SPLIT_RECEIVER_${partner.id.toUpperCase()}`] ??
					primaryId,
				total: String(amount),
				iva: "0",
				base_iva: String(amount),
			};
		});

		const result = await epayco.chargeCreditCard(ctx, {
			userId,
			chargeInfo: {
				tokenCard,
				customerId,
				docType: args.billing.docType,
				docNumber: args.billing.docNumber,
				name: args.billing.name,
				lastName: args.billing.lastName,
				email: args.billing.email,
				cellPhone: args.billing.cellPhone,
				bill: invoiceNumber(),
				description: `Community Harvest — ${cart.description}`,
				value: cart.value,
				tax: cart.tax,
				taxBase: cart.taxBase,
				currency: cart.currency,
				split: {
					splitType: "02",
					splitPrimaryReceiver: primaryId,
					splitRule: "Y",
					splitReceivers,
				},
			},
		});

		return { refPayco: refOf(result) };
	},
});

// The component also exposes PSE, cash (Efecty/Baloto), Daviplata and SafetyPay
// via `epayco.createPseTransaction`, `epayco.createCashPayment`, etc. This demo
// keeps checkout focused on cards; see the component README for those rails.
