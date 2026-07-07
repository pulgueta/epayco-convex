import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  savedCards: defineTable({
    userId: v.id("users"),
    epaycoTokenId: v.string(),
    epaycoCustomerId: v.string(),
    mask: v.string(),
    franchise: v.string(),
    isActive: v.boolean(),
    lastSyncedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_epaycoTokenId", ["epaycoTokenId"]),
});
