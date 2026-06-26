import { v } from "convex/values";

/**
 * Credentials accepted by every component action. The host app passes these in
 * from its own environment (see `EPayco` client wrapper). `apiKey` is the
 * ePayco PUBLIC_KEY and `privateKey` is the PRIVATE_KEY.
 */
export const epaycoCredentialsValidator = v.object({
  apiKey: v.string(),
  privateKey: v.string(),
  testMode: v.optional(v.boolean()),
  lang: v.optional(v.string()),
});

export type EPaycoCredentials = {
  apiKey: string;
  privateKey: string;
  testMode?: boolean;
  lang?: string;
};

/** A split-payment receiver (used by charge / PSE / cash dispersion). */
export const splitReceiverValidator = v.object({
  id: v.string(),
  total: v.string(),
  iva: v.string(),
  base_iva: v.string(),
  fee: v.optional(v.string()),
});

/** Optional split-payment configuration shared by charge / PSE / cash. */
export const splitPaymentValidator = v.object({
  splitType: v.optional(v.string()),
  splitAppId: v.optional(v.string()),
  splitMerchantId: v.optional(v.string()),
  splitPrimaryReceiver: v.optional(v.string()),
  splitPrimaryReceiverFee: v.optional(v.string()),
  splitRule: v.optional(v.string()),
  splitReceivers: v.optional(v.array(splitReceiverValidator)),
});

export const customerInfoValidator = v.object({
  tokenCard: v.string(),
  name: v.string(),
  lastName: v.optional(v.string()),
  email: v.string(),
  phone: v.optional(v.string()),
  cellPhone: v.optional(v.string()),
  docType: v.optional(v.string()),
  docNumber: v.optional(v.string()),
  isDefault: v.optional(v.boolean()),
  city: v.optional(v.string()),
  address: v.optional(v.string()),
});

export const tokenInfoValidator = v.object({
  cardNumber: v.string(),
  expYear: v.string(),
  expMonth: v.string(),
  cvc: v.string(),
  hasCvv: v.optional(v.boolean()),
});

export const chargeInfoValidator = v.object({
  tokenCard: v.string(),
  customerId: v.string(),
  docType: v.string(),
  docNumber: v.string(),
  name: v.string(),
  lastName: v.string(),
  email: v.string(),
  city: v.optional(v.string()),
  address: v.optional(v.string()),
  phone: v.optional(v.string()),
  cellPhone: v.optional(v.string()),
  bill: v.string(),
  description: v.string(),
  value: v.number(),
  tax: v.number(),
  taxBase: v.number(),
  currency: v.optional(v.string()),
  dues: v.optional(v.number()),
  ip: v.optional(v.string()),
  urlResponse: v.optional(v.string()),
  urlConfirmation: v.optional(v.string()),
  methodConfirmation: v.optional(v.string()),
  useDefaultCardCustomer: v.optional(v.boolean()),
  extra1: v.optional(v.string()),
  extra2: v.optional(v.string()),
  extra3: v.optional(v.string()),
  split: v.optional(splitPaymentValidator),
});

export const pseInfoValidator = v.object({
  bank: v.string(),
  typePerson: v.union(v.literal("0"), v.literal("1")),
  docType: v.string(),
  docNumber: v.string(),
  name: v.string(),
  lastName: v.string(),
  email: v.string(),
  cellPhone: v.string(),
  country: v.optional(v.string()),
  bill: v.string(),
  description: v.string(),
  value: v.number(),
  tax: v.number(),
  taxBase: v.number(),
  currency: v.optional(v.string()),
  ip: v.optional(v.string()),
  urlResponse: v.optional(v.string()),
  urlConfirmation: v.optional(v.string()),
  extra1: v.optional(v.string()),
  extra2: v.optional(v.string()),
  extra3: v.optional(v.string()),
  split: v.optional(splitPaymentValidator),
});

export const cashProviderValidator = v.union(
  v.literal("efecty"),
  v.literal("baloto"),
  v.literal("gana"),
  v.literal("redservi"),
  v.literal("puntored"),
  v.literal("sured"),
);

export const cashInfoValidator = v.object({
  docType: v.string(),
  docNumber: v.string(),
  typePerson: v.optional(v.union(v.literal("0"), v.literal("1"))),
  name: v.string(),
  lastName: v.string(),
  email: v.string(),
  cellPhone: v.string(),
  bill: v.string(),
  description: v.string(),
  value: v.number(),
  tax: v.number(),
  taxBase: v.number(),
  currency: v.optional(v.string()),
  ip: v.optional(v.string()),
  urlResponse: v.optional(v.string()),
  urlConfirmation: v.optional(v.string()),
  endDate: v.optional(v.string()),
  extra1: v.optional(v.string()),
  extra2: v.optional(v.string()),
  extra3: v.optional(v.string()),
  split: v.optional(splitPaymentValidator),
});

export const daviplataInfoValidator = v.object({
  docType: v.string(),
  docNumber: v.string(),
  name: v.string(),
  lastName: v.string(),
  email: v.string(),
  indCountry: v.optional(v.string()),
  phone: v.string(),
  country: v.optional(v.string()),
  city: v.optional(v.string()),
  address: v.optional(v.string()),
  ip: v.optional(v.string()),
  description: v.string(),
  value: v.number(),
  tax: v.number(),
  taxBase: v.number(),
  currency: v.optional(v.string()),
  methodConfirmation: v.optional(v.string()),
  urlConfirmation: v.optional(v.string()),
});

export const safetypayInfoValidator = v.object({
  cash: v.union(v.literal("1"), v.literal("2")),
  endDate: v.optional(v.string()),
  docType: v.string(),
  docNumber: v.string(),
  name: v.string(),
  lastName: v.string(),
  email: v.string(),
  indCountry: v.optional(v.string()),
  phone: v.string(),
  country: v.optional(v.string()),
  city: v.optional(v.string()),
  address: v.optional(v.string()),
  invoice: v.optional(v.string()),
  ip: v.optional(v.string()),
  description: v.string(),
  value: v.number(),
  tax: v.number(),
  ico: v.optional(v.number()),
  taxBase: v.number(),
  currency: v.optional(v.string()),
  methodConfirmation: v.optional(v.string()),
  urlConfirmation: v.optional(v.string()),
});

export const planInfoValidator = v.object({
  idPlan: v.string(),
  name: v.string(),
  description: v.string(),
  amount: v.number(),
  currency: v.string(),
  interval: v.string(),
  intervalCount: v.number(),
  trialDays: v.number(),
  iva: v.optional(v.number()),
  ico: v.optional(v.number()),
});

export const subscriptionInfoValidator = v.object({
  idPlan: v.string(),
  customer: v.string(),
  tokenCard: v.string(),
  docType: v.string(),
  docNumber: v.string(),
  urlConfirmation: v.optional(v.string()),
  methodConfirmation: v.optional(v.string()),
});

export const paymentMethodValidator = v.union(
  v.literal("credit_card"),
  v.literal("pse"),
  v.literal("cash"),
  v.literal("daviplata"),
  v.literal("safetypay"),
);

export const transactionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("failed"),
  v.literal("expired"),
  v.literal("reversed"),
);

/** Split receivers persisted on a transaction (numeric form for local use). */
export const storedSplitReceiverValidator = v.object({
  id: v.string(),
  total: v.number(),
  iva: v.number(),
  base_iva: v.number(),
  fee: v.optional(v.number()),
});
