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
  test("SHA-256 signature verification", async () => {
    // Import the function directly for unit testing
    const { verifyWebhookSignature } = await import("./signature.js");

    // Create a known signature
    const custIdCliente = "12345";
    const pKey = "secretkey";
    const refPayco = "ref_001";
    const transactionId = "tx_001";
    const amount = "50000";
    const currency = "COP";

    // Compute expected signature
    const data = `${custIdCliente}^${pKey}^${refPayco}^${transactionId}^${amount}^${currency}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(data),
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const isValid = await verifyWebhookSignature(
      custIdCliente,
      pKey,
      refPayco,
      transactionId,
      amount,
      currency,
      expectedSignature,
    );
    expect(isValid).toBe(true);

    // Test with wrong signature
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
});
