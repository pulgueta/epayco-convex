import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customers: defineTable({
    userId: v.string(),
    epaycoCustomerId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    docType: v.optional(v.string()),
    docNumber: v.optional(v.string()),
    defaultCard: v.optional(v.string()),
    lastSyncedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_epaycoCustomerId", ["epaycoCustomerId"])
    .index("by_email", ["email"]),

  tokens: defineTable({
    userId: v.string(),
    epaycoTokenId: v.string(),
    epaycoCustomerId: v.string(),
    mask: v.string(),
    franchise: v.string(),
    isActive: v.boolean(),
    lastSyncedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_epaycoTokenId", ["epaycoTokenId"]),

  transactions: defineTable({
    userId: v.string(),
    epaycoRef: v.string(),
    epaycoTransactionId: v.optional(v.string()),
    paymentMethod: v.union(
      v.literal("credit_card"),
      v.literal("pse"),
      v.literal("cash"),
      v.literal("daviplata"),
      v.literal("safetypay"),
    ),
    status: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    customerEmail: v.optional(v.string()),
    bankName: v.optional(v.string()),
    cashProvider: v.optional(v.string()),
    responseCode: v.optional(v.string()),
    responseMessage: v.optional(v.string()),
    franchise: v.optional(v.string()),
    splitPayment: v.optional(v.boolean()),
    splitReceivers: v.optional(
      v.array(
        v.object({
          id: v.string(),
          total: v.number(),
          iva: v.number(),
          base_iva: v.number(),
          fee: v.optional(v.number()),
        }),
      ),
    ),
    rawResponse: v.optional(v.any()),
    lastSyncedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_epaycoRef", ["epaycoRef"])
    .index("by_userId_and_status", ["userId", "status"]),

  plans: defineTable({
    epaycoPlanId: v.string(),
    name: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    interval: v.string(),
    intervalCount: v.number(),
    trialDays: v.number(),
    status: v.string(),
    lastSyncedAt: v.number(),
  })
    .index("by_epaycoPlanId", ["epaycoPlanId"])
    .index("by_status", ["status"]),

  subscriptions: defineTable({
    userId: v.string(),
    epaycoSubscriptionId: v.string(),
    epaycoCustomerId: v.string(),
    epaycoPlanId: v.string(),
    epaycoTokenId: v.optional(v.string()),
    status: v.string(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    lastSyncedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_epaycoSubscriptionId", ["epaycoSubscriptionId"])
    .index("by_customerId_and_status", ["epaycoCustomerId", "status"]),

  banks: defineTable({
    bankCode: v.string(),
    bankName: v.string(),
    lastSyncedAt: v.number(),
  }).index("by_bankCode", ["bankCode"]),

  webhookEvents: defineTable({
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
    processedAt: v.optional(v.number()),
    lastSyncedAt: v.number(),
  })
    .index("by_epaycoRef", ["epaycoRef"])
    .index("by_status", ["status"]),
});
