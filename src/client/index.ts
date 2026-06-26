import { httpActionGeneric, queryGeneric } from "convex/server";
import type {
	Auth,
	GenericActionCtx,
	GenericDataModel,
	GenericQueryCtx,
	HttpRouter,
} from "convex/server";
import type { Infer } from "convex/values";
import { v } from "convex/values";
import type { ComponentApi } from "../component/_generated/component.js";
import {
	chargeInfoValidator,
	customerInfoValidator,
	cashInfoValidator,
	cashProviderValidator,
	daviplataInfoValidator,
	planInfoValidator,
	pseInfoValidator,
	safetypayInfoValidator,
	subscriptionInfoValidator,
	tokenInfoValidator,
} from "../component/validators.js";

type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type ActionCtx = Pick<
	GenericActionCtx<GenericDataModel>,
	"runQuery" | "runMutation" | "runAction"
>;

type CustomerInfo = Infer<typeof customerInfoValidator>;
type TokenInfo = Infer<typeof tokenInfoValidator>;
type ChargeInfo = Infer<typeof chargeInfoValidator>;
type PseInfo = Infer<typeof pseInfoValidator>;
type CashInfo = Infer<typeof cashInfoValidator>;
type CashProvider = Infer<typeof cashProviderValidator>;
type DaviplataInfo = Infer<typeof daviplataInfoValidator>;
type SafetyPayInfo = Infer<typeof safetypayInfoValidator>;
type PlanInfo = Infer<typeof planInfoValidator>;
type SubscriptionInfo = Infer<typeof subscriptionInfoValidator>;

export interface EPaycoOptions {
	/** ePayco PUBLIC_KEY. Falls back to `EPAYCO_PUBLIC_KEY`. */
	publicKey?: string;
	/** ePayco PRIVATE_KEY. Falls back to `EPAYCO_PRIVATE_KEY`. */
	privateKey?: string;
	/** Run against the ePayco sandbox. Falls back to `EPAYCO_TEST_MODE === "true"`. */
	testMode?: boolean;
	/** API language ("ES" | "EN"). Falls back to `EPAYCO_LANG` or "ES". */
	lang?: string;
}

/**
 * Host-side client for the ePayco component. Construct it once with the
 * component reference and (optionally) credentials, then call its methods from
 * your own actions/queries. Credentials are read from the environment by
 * default so secrets never need to be hard-coded.
 */
export class EPayco {
	public component: ComponentApi;
	private options: EPaycoOptions;

	constructor(component: ComponentApi, options?: EPaycoOptions) {
		this.component = component;
		this.options = options ?? {};
	}

	private creds() {
		const apiKey = this.options.publicKey ?? process.env.EPAYCO_PUBLIC_KEY;
		const privateKey =
			this.options.privateKey ?? process.env.EPAYCO_PRIVATE_KEY;
		if (!apiKey || !privateKey) {
			throw new Error(
				"ePayco credentials are required: set EPAYCO_PUBLIC_KEY and EPAYCO_PRIVATE_KEY (or pass publicKey/privateKey to the EPayco constructor).",
			);
		}
		return {
			apiKey,
			privateKey,
			testMode:
				this.options.testMode ?? process.env.EPAYCO_TEST_MODE === "true",
			lang: this.options.lang ?? process.env.EPAYCO_LANG ?? "ES",
		};
	}

	// --- Tokens ---

	async createToken(
		ctx: ActionCtx,
		args: { userId: string; tokenInfo: TokenInfo },
	) {
		return await ctx.runAction(this.component.tokensApi.createToken, {
			credentials: this.creds(),
			...args,
		});
	}

	async getLocalTokens(ctx: QueryCtx, args: { userId: string }) {
		return await ctx.runQuery(this.component.tokens.getLocalTokens, args);
	}

	// --- Customers ---

	async createCustomer(
		ctx: ActionCtx,
		args: { userId: string; customerInfo: CustomerInfo },
	) {
		return await ctx.runAction(this.component.customersApi.createCustomer, {
			credentials: this.creds(),
			...args,
		});
	}

	async getCustomer(
		ctx: ActionCtx,
		args: { epaycoCustomerId: string; userId: string },
	) {
		return await ctx.runAction(this.component.customersApi.getCustomer, {
			credentials: this.creds(),
			...args,
		});
	}

	async listCustomers(
		ctx: ActionCtx,
		args: { page?: number; perPage?: number } = {},
	) {
		return await ctx.runAction(this.component.customersApi.listCustomers, {
			credentials: this.creds(),
			...args,
		});
	}

	async updateCustomer(
		ctx: ActionCtx,
		args: {
			userId: string;
			epaycoCustomerId: string;
			name?: string;
			lastName?: string;
			email?: string;
			phone?: string;
			cellPhone?: string;
			city?: string;
			address?: string;
		},
	) {
		return await ctx.runAction(this.component.customersApi.updateCustomer, {
			credentials: this.creds(),
			...args,
		});
	}

	async deleteCustomerCard(
		ctx: ActionCtx,
		args: { franchise: string; mask: string; customerId: string },
	) {
		return await ctx.runAction(this.component.customersApi.deleteCustomerCard, {
			credentials: this.creds(),
			...args,
		});
	}

	async addDefaultCard(
		ctx: ActionCtx,
		args: {
			customerId: string;
			token: string;
			franchise: string;
			mask: string;
		},
	) {
		return await ctx.runAction(this.component.customersApi.addDefaultCard, {
			credentials: this.creds(),
			...args,
		});
	}

	async addNewToken(
		ctx: ActionCtx,
		args: { customerId: string; tokenCard: string },
	) {
		return await ctx.runAction(this.component.customersApi.addNewToken, {
			credentials: this.creds(),
			...args,
		});
	}

	async getLocalCustomer(ctx: QueryCtx, args: { userId: string }) {
		return await ctx.runQuery(this.component.customers.getLocalCustomer, args);
	}

	// --- Plans ---

	async createPlan(ctx: ActionCtx, args: { planInfo: PlanInfo }) {
		return await ctx.runAction(this.component.plansApi.createPlan, {
			credentials: this.creds(),
			...args,
		});
	}

	async getPlan(ctx: ActionCtx, args: { epaycoPlanId: string }) {
		return await ctx.runAction(this.component.plansApi.getPlan, {
			credentials: this.creds(),
			...args,
		});
	}

	async listPlans(ctx: ActionCtx) {
		return await ctx.runAction(this.component.plansApi.listPlans, {
			credentials: this.creds(),
		});
	}

	async updatePlan(
		ctx: ActionCtx,
		args: {
			epaycoPlanId: string;
			name?: string;
			description?: string;
			amount?: number;
			currency?: string;
			interval?: string;
			intervalCount?: number;
			trialDays?: number;
		},
	) {
		return await ctx.runAction(this.component.plansApi.updatePlan, {
			credentials: this.creds(),
			...args,
		});
	}

	async deletePlan(ctx: ActionCtx, args: { epaycoPlanId: string }) {
		return await ctx.runAction(this.component.plansApi.deletePlan, {
			credentials: this.creds(),
			...args,
		});
	}

	async getLocalPlan(ctx: QueryCtx, args: { epaycoPlanId: string }) {
		return await ctx.runQuery(this.component.plans.getLocalPlan, args);
	}

	async listLocalPlans(ctx: QueryCtx, args: { status?: string } = {}) {
		return await ctx.runQuery(this.component.plans.listLocalPlans, args);
	}

	// --- Subscriptions ---

	async createSubscription(
		ctx: ActionCtx,
		args: { userId: string; subscriptionInfo: SubscriptionInfo },
	) {
		return await ctx.runAction(
			this.component.subscriptionsApi.createSubscription,
			{ credentials: this.creds(), ...args },
		);
	}

	async getSubscription(
		ctx: ActionCtx,
		args: { epaycoSubscriptionId: string },
	) {
		return await ctx.runAction(
			this.component.subscriptionsApi.getSubscription,
			{ credentials: this.creds(), ...args },
		);
	}

	async listSubscriptionsFromEpayco(ctx: ActionCtx) {
		return await ctx.runAction(this.component.subscriptionsApi.listSubscriptions, {
			credentials: this.creds(),
		});
	}

	async cancelSubscription(
		ctx: ActionCtx,
		args: { epaycoSubscriptionId: string },
	) {
		return await ctx.runAction(
			this.component.subscriptionsApi.cancelSubscription,
			{ credentials: this.creds(), ...args },
		);
	}

	async chargeSubscription(
		ctx: ActionCtx,
		args: {
			userId: string;
			idPlan: string;
			customer: string;
			tokenCard: string;
			docType: string;
			docNumber: string;
			ip?: string;
		},
	) {
		return await ctx.runAction(
			this.component.subscriptionsApi.chargeSubscription,
			{ credentials: this.creds(), ...args },
		);
	}

	async getActiveSubscription(ctx: QueryCtx, args: { userId: string }) {
		return await ctx.runQuery(
			this.component.subscriptions.getActiveSubscription,
			args,
		);
	}

	async listSubscriptions(ctx: QueryCtx, args: { userId: string }) {
		return await ctx.runQuery(
			this.component.subscriptions.listLocalSubscriptionsByUser,
			args,
		);
	}

	// --- Credit-card charges ---

	async chargeCreditCard(
		ctx: ActionCtx,
		args: { userId: string; chargeInfo: ChargeInfo },
	) {
		return await ctx.runAction(this.component.chargesApi.createCharge, {
			credentials: this.creds(),
			...args,
		});
	}

	async getCharge(ctx: ActionCtx, args: { epaycoRef: string }) {
		return await ctx.runAction(this.component.chargesApi.getCharge, {
			credentials: this.creds(),
			...args,
		});
	}

	// --- PSE ---

	async createPseTransaction(
		ctx: ActionCtx,
		args: { userId: string; pseInfo: PseInfo },
	) {
		return await ctx.runAction(this.component.pseApi.createPseTransaction, {
			credentials: this.creds(),
			...args,
		});
	}

	async getPseTransaction(ctx: ActionCtx, args: { ticketId: string }) {
		return await ctx.runAction(this.component.pseApi.getPseTransaction, {
			credentials: this.creds(),
			...args,
		});
	}

	async getBanks(ctx: ActionCtx) {
		return await ctx.runAction(this.component.pseApi.getBanks, {
			credentials: this.creds(),
		});
	}

	async listLocalBanks(ctx: QueryCtx) {
		return await ctx.runQuery(this.component.banks.listLocalBanks, {});
	}

	// --- Cash ---

	async createCashPayment(
		ctx: ActionCtx,
		args: { userId: string; provider: CashProvider; cashInfo: CashInfo },
	) {
		return await ctx.runAction(this.component.cashApi.createCashPayment, {
			credentials: this.creds(),
			...args,
		});
	}

	async getCashPayment(ctx: ActionCtx, args: { epaycoRef: string }) {
		return await ctx.runAction(this.component.cashApi.getCashPayment, {
			credentials: this.creds(),
			...args,
		});
	}

	// --- Daviplata ---

	async createDaviplataPayment(
		ctx: ActionCtx,
		args: { userId: string; daviplataInfo: DaviplataInfo },
	) {
		return await ctx.runAction(
			this.component.daviplataApi.createDaviplataPayment,
			{ credentials: this.creds(), ...args },
		);
	}

	async confirmDaviplataPayment(
		ctx: ActionCtx,
		args: { refPayco: string; idSessionToken: string; otp: string },
	) {
		return await ctx.runAction(
			this.component.daviplataApi.confirmDaviplataPayment,
			{ credentials: this.creds(), ...args },
		);
	}

	// --- SafetyPay ---

	async createSafetyPayPayment(
		ctx: ActionCtx,
		args: { userId: string; safetypayInfo: SafetyPayInfo },
	) {
		return await ctx.runAction(
			this.component.safetypayApi.createSafetyPayPayment,
			{ credentials: this.creds(), ...args },
		);
	}

	// --- Transactions (local reactive reads) ---

	async getTransaction(ctx: QueryCtx, args: { epaycoRef: string }) {
		return await ctx.runQuery(
			this.component.transactions.getLocalTransaction,
			args,
		);
	}

	async listTransactions(
		ctx: QueryCtx,
		args: {
			userId: string;
			status?: string;
			paymentMethod?:
				| "credit_card"
				| "pse"
				| "cash"
				| "daviplata"
				| "safetypay";
			limit?: number;
		},
	) {
		return await ctx.runQuery(
			this.component.transactions.listLocalTransactions,
			args,
		);
	}
}

/**
 * Build a set of public, auth-gated queries the host app can re-export directly
 * to its clients, so reactive reads don't need a bespoke wrapper per app.
 */
export function exposeApi(
	component: ComponentApi,
	options: {
		auth: (
			ctx: { auth: Auth },
			operation: { type: "read" } | { type: "create" } | { type: "manage" },
		) => Promise<string>;
	},
) {
	return {
		// NOTE: none of these queries accept a client-supplied `userId`. The scope
		// is always the identity resolved by `options.auth`, so an authenticated
		// caller can never widen access to another user's records.
		listTransactions: queryGeneric({
			args: {
				status: v.optional(v.string()),
				limit: v.optional(v.number()),
			},
			handler: async (ctx, args) => {
				const userId = await options.auth(ctx, { type: "read" });
				return await ctx.runQuery(
					component.transactions.listLocalTransactions,
					{
						userId,
						status: args.status,
						limit: args.limit,
					},
				);
			},
		}),
		getTransaction: queryGeneric({
			args: { epaycoRef: v.string() },
			handler: async (ctx, args) => {
				const userId = await options.auth(ctx, { type: "read" });
				const transaction = await ctx.runQuery(
					component.transactions.getLocalTransaction,
					{ epaycoRef: args.epaycoRef },
				);
				// Transactions carry customer PII; only return it to its owner.
				if (!transaction || transaction.userId !== userId) return null;
				return transaction;
			},
		}),
		getCustomer: queryGeneric({
			args: {},
			handler: async (ctx) => {
				const userId = await options.auth(ctx, { type: "read" });
				return await ctx.runQuery(component.customers.getLocalCustomer, {
					userId,
				});
			},
		}),
		listSubscriptions: queryGeneric({
			args: {},
			handler: async (ctx) => {
				const userId = await options.auth(ctx, { type: "read" });
				return await ctx.runQuery(
					component.subscriptions.listLocalSubscriptionsByUser,
					{ userId },
				);
			},
		}),
		getActiveSubscription: queryGeneric({
			args: {},
			handler: async (ctx) => {
				const userId = await options.auth(ctx, { type: "read" });
				return await ctx.runQuery(
					component.subscriptions.getActiveSubscription,
					{ userId },
				);
			},
		}),
	};
}

/**
 * Register ePayco webhook (confirmation) and response HTTP routes on the host's
 * router. `custIdCliente` / `pKey` are used to verify the confirmation
 * signature and default to `EPAYCO_P_CUST_ID_CLIENTE` / `EPAYCO_P_KEY`.
 */
export function registerRoutes(
	http: HttpRouter,
	component: ComponentApi,
	options: {
		pathPrefix?: string;
		custIdCliente?: string;
		pKey?: string;
	} = {},
) {
	const pathPrefix = options.pathPrefix ?? "/epayco";
	const custIdCliente =
		options.custIdCliente ?? process.env.EPAYCO_P_CUST_ID_CLIENTE ?? "";
	const pKey = options.pKey ?? process.env.EPAYCO_P_KEY ?? "";

	const handleConfirmation = async (
		ctx: { runAction: GenericActionCtx<GenericDataModel>["runAction"] },
		payload: Record<string, unknown>,
	) => {
		return await ctx.runAction(component.webhooks.processConfirmation, {
			custIdCliente,
			pKey,
			payload,
		});
	};

	http.route({
		path: `${pathPrefix}/confirmation`,
		method: "POST",
		handler: httpActionGeneric(async (ctx, request) => {
			const contentType = request.headers.get("content-type") ?? "";
			let payload: Record<string, unknown> = {};
			if (contentType.includes("application/json")) {
				payload = await request.json();
			} else {
				const form = await request.formData();
				form.forEach((value, key) => {
					payload[key] = typeof value === "string" ? value : "";
				});
			}
			const result = await handleConfirmation(ctx, payload);
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}),
	});

	http.route({
		path: `${pathPrefix}/confirmation`,
		method: "GET",
		handler: httpActionGeneric(async (ctx, request) => {
			const url = new URL(request.url);
			const payload: Record<string, string> = {};
			url.searchParams.forEach((value, key) => {
				payload[key] = value;
			});
			const result = await handleConfirmation(ctx, payload);
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}),
	});

	http.route({
		path: `${pathPrefix}/response`,
		method: "GET",
		handler: httpActionGeneric(async (ctx, request) => {
			const url = new URL(request.url);
			const refPayco = url.searchParams.get("ref_payco");
			if (!refPayco) {
				return new Response(
					JSON.stringify({ error: "ref_payco parameter required" }),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}
			const transaction = await ctx.runQuery(
				component.transactions.getLocalTransaction,
				{ epaycoRef: refPayco },
			);
			// This endpoint is public (ePayco redirects the buyer's browser here),
			// so expose only a minimal status payload — never the full row, which
			// holds customerEmail, responseMessage, splitReceivers and rawResponse.
			const body = transaction
				? {
						found: true,
						ref_payco: transaction.epaycoRef,
						status: transaction.status,
						paymentMethod: transaction.paymentMethod,
						amount: transaction.amount,
						currency: transaction.currency,
					}
				: { found: false };
			return new Response(JSON.stringify(body), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}),
	});
}
