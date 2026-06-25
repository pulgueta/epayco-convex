/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    banks: {
      listLocalBanks: FunctionReference<"query", "internal", {}, any, Name>;
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
      >;
    };
    customers: {
      getLocalCustomer: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any,
        Name
      >;
      getLocalCustomerByEpaycoId: FunctionReference<
        "query",
        "internal",
        { epaycoCustomerId: string },
        any,
        Name
      >;
      listLocalCustomers: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
      >;
    };
    plans: {
      getLocalPlan: FunctionReference<
        "query",
        "internal",
        { epaycoPlanId: string },
        any,
        Name
      >;
      listLocalPlans: FunctionReference<
        "query",
        "internal",
        { limit?: number; status?: string },
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
      >;
    };
    subscriptions: {
      getActiveSubscription: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any,
        Name
      >;
      getLocalSubscription: FunctionReference<
        "query",
        "internal",
        { epaycoSubscriptionId: string },
        any,
        Name
      >;
      listLocalSubscriptionsByUser: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
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
        any,
        Name
      >;
    };
    tokens: {
      getLocalTokens: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any,
        Name
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
        any,
        Name
      >;
    };
    transactions: {
      getLocalTransaction: FunctionReference<
        "query",
        "internal",
        { epaycoRef: string },
        any,
        Name
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
        any,
        Name
      >;
    };
    webhooks: {
      processConfirmation: FunctionReference<
        "action",
        "internal",
        { custIdCliente: string; pKey: string; payload: any },
        any,
        Name
      >;
    };
  };
