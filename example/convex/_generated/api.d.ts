/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as auth from "../auth.js";
import type * as cards from "../cards.js";
import type * as catalog from "../catalog.js";
import type * as epayco from "../epayco.js";
import type * as http from "../http.js";
import type * as payments from "../payments.js";
import type * as savedCards from "../savedCards.js";
import type * as subscriptions from "../subscriptions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  auth: typeof auth;
  cards: typeof cards;
  catalog: typeof catalog;
  epayco: typeof epayco;
  http: typeof http;
  payments: typeof payments;
  savedCards: typeof savedCards;
  subscriptions: typeof subscriptions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  epayco: {
    banks: {
      listLocalBanks: FunctionReference<"query", "internal", {}, any>;
    };
    cashApi: {
      createCashPayment: FunctionReference<
        "action",
        "internal",
        {
          cashInfo: {
            bill: string;
            cellPhone: string;
            currency?: string;
            description: string;
            docNumber: string;
            docType: string;
            email: string;
            endDate?: string;
            extra1?: string;
            extra2?: string;
            extra3?: string;
            ip?: string;
            lastName: string;
            name: string;
            split?: {
              splitAppId?: string;
              splitMerchantId?: string;
              splitPrimaryReceiver?: string;
              splitPrimaryReceiverFee?: string;
              splitReceivers?: Array<{
                base_iva: string;
                fee?: string;
                id: string;
                iva: string;
                total: string;
              }>;
              splitRule?: string;
              splitType?: string;
            };
            tax: number;
            taxBase: number;
            typePerson?: "0" | "1";
            urlConfirmation?: string;
            urlResponse?: string;
            value: number;
          };
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          provider:
            | "efecty"
            | "baloto"
            | "gana"
            | "redservi"
            | "puntored"
            | "sured";
          userId: string;
        },
        any
      >;
      getCashPayment: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          epaycoRef: string;
        },
        any
      >;
    };
    chargesApi: {
      createCharge: FunctionReference<
        "action",
        "internal",
        {
          chargeInfo: {
            address?: string;
            bill: string;
            cellPhone?: string;
            city?: string;
            currency?: string;
            customerId: string;
            description: string;
            docNumber: string;
            docType: string;
            dues?: number;
            email: string;
            extra1?: string;
            extra2?: string;
            extra3?: string;
            ip?: string;
            lastName: string;
            methodConfirmation?: string;
            name: string;
            phone?: string;
            split?: {
              splitAppId?: string;
              splitMerchantId?: string;
              splitPrimaryReceiver?: string;
              splitPrimaryReceiverFee?: string;
              splitReceivers?: Array<{
                base_iva: string;
                fee?: string;
                id: string;
                iva: string;
                total: string;
              }>;
              splitRule?: string;
              splitType?: string;
            };
            tax: number;
            taxBase: number;
            tokenCard: string;
            urlConfirmation?: string;
            urlResponse?: string;
            useDefaultCardCustomer?: boolean;
            value: number;
          };
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          userId: string;
        },
        any
      >;
      getCharge: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          epaycoRef: string;
        },
        any
      >;
    };
    customers: {
      getLocalCustomer: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      getLocalCustomerByEpaycoId: FunctionReference<
        "query",
        "internal",
        { epaycoCustomerId: string },
        any
      >;
      listLocalCustomers: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        any
      >;
    };
    customersApi: {
      addDefaultCard: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          customerId: string;
          franchise: string;
          mask: string;
          token: string;
        },
        any
      >;
      addNewToken: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          customerId: string;
          tokenCard: string;
        },
        any
      >;
      createCustomer: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          customerInfo: {
            address?: string;
            cellPhone?: string;
            city?: string;
            docNumber?: string;
            docType?: string;
            email: string;
            isDefault?: boolean;
            lastName?: string;
            name: string;
            phone?: string;
            tokenCard: string;
          };
          userId: string;
        },
        any
      >;
      deleteCustomerCard: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          customerId: string;
          franchise: string;
          mask: string;
        },
        any
      >;
      getCustomer: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          epaycoCustomerId: string;
        },
        any
      >;
      listCustomers: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          page?: number;
          perPage?: number;
        },
        any
      >;
      updateCustomer: FunctionReference<
        "action",
        "internal",
        {
          address?: string;
          cellPhone?: string;
          city?: string;
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          email?: string;
          epaycoCustomerId: string;
          lastName?: string;
          name?: string;
          phone?: string;
          userId: string;
        },
        any
      >;
    };
    daviplataApi: {
      confirmDaviplataPayment: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          idSessionToken: string;
          otp: string;
          refPayco: string;
        },
        any
      >;
      createDaviplataPayment: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          daviplataInfo: {
            address?: string;
            city?: string;
            country?: string;
            currency?: string;
            description: string;
            docNumber: string;
            docType: string;
            email: string;
            indCountry?: string;
            ip?: string;
            lastName: string;
            methodConfirmation?: string;
            name: string;
            phone: string;
            tax: number;
            taxBase: number;
            urlConfirmation?: string;
            value: number;
          };
          userId: string;
        },
        any
      >;
    };
    plans: {
      getLocalPlan: FunctionReference<
        "query",
        "internal",
        { epaycoPlanId: string },
        any
      >;
      listLocalPlans: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string },
        any
      >;
    };
    plansApi: {
      createPlan: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          planInfo: {
            amount: number;
            currency: string;
            description: string;
            ico?: number;
            idPlan: string;
            interval: string;
            intervalCount: number;
            iva?: number;
            name: string;
            trialDays: number;
          };
        },
        any
      >;
      deletePlan: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          epaycoPlanId: string;
        },
        any
      >;
      getPlan: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          epaycoPlanId: string;
        },
        any
      >;
      listPlans: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
        },
        any
      >;
      updatePlan: FunctionReference<
        "action",
        "internal",
        {
          amount?: number;
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          currency?: string;
          description?: string;
          epaycoPlanId: string;
          interval?: string;
          intervalCount?: number;
          name?: string;
          trialDays?: number;
        },
        any
      >;
    };
    pseApi: {
      createPseTransaction: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          pseInfo: {
            bank: string;
            bill: string;
            cellPhone: string;
            country?: string;
            currency?: string;
            description: string;
            docNumber: string;
            docType: string;
            email: string;
            extra1?: string;
            extra2?: string;
            extra3?: string;
            ip?: string;
            lastName: string;
            name: string;
            split?: {
              splitAppId?: string;
              splitMerchantId?: string;
              splitPrimaryReceiver?: string;
              splitPrimaryReceiverFee?: string;
              splitReceivers?: Array<{
                base_iva: string;
                fee?: string;
                id: string;
                iva: string;
                total: string;
              }>;
              splitRule?: string;
              splitType?: string;
            };
            tax: number;
            taxBase: number;
            typePerson: "0" | "1";
            urlConfirmation?: string;
            urlResponse?: string;
            value: number;
          };
          userId: string;
        },
        any
      >;
      getBanks: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
        },
        any
      >;
      getPseTransaction: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          ticketId: string;
        },
        any
      >;
    };
    safetypayApi: {
      createSafetyPayPayment: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          safetypayInfo: {
            address?: string;
            cash: "1" | "2";
            city?: string;
            country?: string;
            currency?: string;
            description: string;
            docNumber: string;
            docType: string;
            email: string;
            endDate?: string;
            ico?: number;
            indCountry?: string;
            invoice?: string;
            ip?: string;
            lastName: string;
            methodConfirmation?: string;
            name: string;
            phone: string;
            tax: number;
            taxBase: number;
            urlConfirmation?: string;
            value: number;
          };
          userId: string;
        },
        any
      >;
    };
    subscriptions: {
      getActiveSubscription: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
      getLocalSubscription: FunctionReference<
        "query",
        "internal",
        { epaycoSubscriptionId: string },
        any
      >;
      listLocalSubscriptionsByUser: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
    };
    subscriptionsApi: {
      cancelSubscription: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          epaycoSubscriptionId: string;
        },
        any
      >;
      chargeSubscription: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          customer: string;
          docNumber: string;
          docType: string;
          idPlan: string;
          ip?: string;
          tokenCard: string;
          userId: string;
        },
        any
      >;
      createSubscription: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          subscriptionInfo: {
            customer: string;
            docNumber: string;
            docType: string;
            idPlan: string;
            methodConfirmation?: string;
            tokenCard: string;
            urlConfirmation?: string;
          };
          userId: string;
        },
        any
      >;
      getSubscription: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          epaycoSubscriptionId: string;
        },
        any
      >;
      listSubscriptions: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
        },
        any
      >;
    };
    tokens: {
      getLocalTokens: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any
      >;
    };
    tokensApi: {
      createToken: FunctionReference<
        "action",
        "internal",
        {
          credentials: {
            apiKey: string;
            lang?: string;
            privateKey: string;
            testMode?: boolean;
          };
          tokenInfo: {
            cardNumber: string;
            cvc: string;
            expMonth: string;
            expYear: string;
            hasCvv?: boolean;
          };
          userId: string;
        },
        any
      >;
    };
    transactions: {
      getLocalTransaction: FunctionReference<
        "query",
        "internal",
        { epaycoRef: string },
        any
      >;
      listLocalTransactions: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          paymentMethod?:
            | "credit_card"
            | "pse"
            | "cash"
            | "daviplata"
            | "safetypay";
          status?: string;
          userId: string;
        },
        any
      >;
    };
    webhooks: {
      processConfirmation: FunctionReference<
        "action",
        "internal",
        { custIdCliente: string; pKey: string; payload: any },
        any
      >;
    };
  };
};
