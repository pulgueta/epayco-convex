/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as banks from "../banks.js";
import type * as cashApi from "../cashApi.js";
import type * as chargesApi from "../chargesApi.js";
import type * as customers from "../customers.js";
import type * as customersApi from "../customersApi.js";
import type * as daviplataApi from "../daviplataApi.js";
import type * as epaycoClient from "../epaycoClient.js";
import type * as payloads from "../payloads.js";
import type * as plans from "../plans.js";
import type * as plansApi from "../plansApi.js";
import type * as pseApi from "../pseApi.js";
import type * as rateLimits from "../rateLimits.js";
import type * as safetypayApi from "../safetypayApi.js";
import type * as signature from "../signature.js";
import type * as status from "../status.js";
import type * as subscriptions from "../subscriptions.js";
import type * as subscriptionsApi from "../subscriptionsApi.js";
import type * as tokens from "../tokens.js";
import type * as tokensApi from "../tokensApi.js";
import type * as transactions from "../transactions.js";
import type * as validators from "../validators.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  banks: typeof banks;
  cashApi: typeof cashApi;
  chargesApi: typeof chargesApi;
  customers: typeof customers;
  customersApi: typeof customersApi;
  daviplataApi: typeof daviplataApi;
  epaycoClient: typeof epaycoClient;
  payloads: typeof payloads;
  plans: typeof plans;
  plansApi: typeof plansApi;
  pseApi: typeof pseApi;
  rateLimits: typeof rateLimits;
  safetypayApi: typeof safetypayApi;
  signature: typeof signature;
  status: typeof status;
  subscriptions: typeof subscriptions;
  subscriptionsApi: typeof subscriptionsApi;
  tokens: typeof tokens;
  tokensApi: typeof tokensApi;
  transactions: typeof transactions;
  validators: typeof validators;
  webhooks: typeof webhooks;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
