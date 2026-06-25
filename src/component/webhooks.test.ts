/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test.helper.js";
import { internal } from "./_generated/api.js";

describe("webhooks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("storeWebhookEvent creates a new event", async () => {
    const t = initConvexTest();
    const id = await t.mutation(internal.webhooks.storeWebhookEvent, {
      epaycoRef: "ref_w001",
      eventType: "confirmation",
      status: "pending",
      rawPayload: { x_ref_payco: "ref_w001", x_cod_response: "1" },
      lastSyncedAt: 1000,
    });
    expect(id).toBeDefined();

    const event = await t.query(internal.webhooks.getWebhookEvent, {
      epaycoRef: "ref_w001",
    });
    expect(event).not.toBeNull();
    expect(event!.status).toBe("pending");
    expect(event!.eventType).toBe("confirmation");
  });

  test("markWebhookProcessed updates event status", async () => {
    const t = initConvexTest();
    await t.mutation(internal.webhooks.storeWebhookEvent, {
      epaycoRef: "ref_w002",
      eventType: "confirmation",
      status: "pending",
      rawPayload: {},
      lastSyncedAt: 1000,
    });

    await t.mutation(internal.webhooks.markWebhookProcessed, {
      epaycoRef: "ref_w002",
      status: "processed",
    });

    const event = await t.query(internal.webhooks.getWebhookEvent, {
      epaycoRef: "ref_w002",
    });
    expect(event!.status).toBe("processed");
    expect(event!.processedAt).toBeDefined();
  });

  test("markWebhookProcessed with error message", async () => {
    const t = initConvexTest();
    await t.mutation(internal.webhooks.storeWebhookEvent, {
      epaycoRef: "ref_w003",
      eventType: "confirmation",
      status: "pending",
      rawPayload: {},
      lastSyncedAt: 1000,
    });

    await t.mutation(internal.webhooks.markWebhookProcessed, {
      epaycoRef: "ref_w003",
      status: "failed",
      errorMessage: "Invalid signature",
    });

    const event = await t.query(internal.webhooks.getWebhookEvent, {
      epaycoRef: "ref_w003",
    });
    expect(event!.status).toBe("failed");
    expect(event!.errorMessage).toBe("Invalid signature");
  });
});

describe("verifyWebhookSignature (pure function)", () => {
  const custIdCliente = "12345";
  const pKey = "secretkey";
  const refPayco = "ref_001";
  const transactionId = "tx_001";
  const amount = "50000";
  const currency = "COP";

  // Pinned, externally-computed SHA-256 of the canonical wire string
  //   `${custId}^${pKey}^${ref}^${txId}^${amount}^${currency}`
  // i.e. SHA256("12345^secretkey^ref_001^tx_001^50000^COP"). Hardcoding it
  // (rather than recomputing with the implementation's own routine) means a
  // regression in field order/separator would actually fail this test.
  const KNOWN_GOOD_SIGNATURE =
    "16514e8ce6f372b83a414bbb9141d3a09c213df702d91819f999c14e0d5b893b";

  test("accepts the known-good signature", async () => {
    const { verifyWebhookSignature } = await import("./signature.js");
    const isValid = await verifyWebhookSignature(
      custIdCliente,
      pKey,
      refPayco,
      transactionId,
      amount,
      currency,
      KNOWN_GOOD_SIGNATURE,
    );
    expect(isValid).toBe(true);
  });

  test("rejects a wrong signature", async () => {
    const { verifyWebhookSignature } = await import("./signature.js");
    const isInvalid = await verifyWebhookSignature(
      custIdCliente,
      pKey,
      refPayco,
      transactionId,
      amount,
      currency,
      "wrong_signature",
    );
    expect(isInvalid).toBe(false);
  });

  test("rejects when a signed field is tampered", async () => {
    const { verifyWebhookSignature } = await import("./signature.js");
    // Same pinned signature, but a different amount must not validate.
    const isInvalid = await verifyWebhookSignature(
      custIdCliente,
      pKey,
      refPayco,
      transactionId,
      "99999",
      currency,
      KNOWN_GOOD_SIGNATURE,
    );
    expect(isInvalid).toBe(false);
  });
});
