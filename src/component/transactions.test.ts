/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test.helper.js";
import { api, internal } from "./_generated/api.js";

describe("transactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("upsertTransaction creates a new transaction", async () => {
    const t = initConvexTest();
    const id = await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_001",
      paymentMethod: "credit_card",
      status: "approved",
      amount: 50000,
      currency: "COP",
      description: "Test payment",
      lastSyncedAt: 1000,
    });
    expect(id).toBeDefined();

    const tx = await t.query(api.transactions.getLocalTransaction, {
      epaycoRef: "ref_001",
    });
    expect(tx).not.toBeNull();
    expect(tx!.amount).toBe(50000);
    expect(tx!.status).toBe("approved");
    expect(tx!.paymentMethod).toBe("credit_card");
  });

  test("upsertTransaction is idempotent", async () => {
    const t = initConvexTest();
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_002",
      paymentMethod: "pse",
      status: "pending",
      amount: 100000,
      currency: "COP",
      description: "PSE payment",
      lastSyncedAt: 1000,
    });

    // Same timestamp - should not update
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_002",
      paymentMethod: "pse",
      status: "approved",
      amount: 100000,
      currency: "COP",
      description: "PSE payment",
      lastSyncedAt: 1000,
    });

    const tx = await t.query(api.transactions.getLocalTransaction, {
      epaycoRef: "ref_002",
    });
    expect(tx!.status).toBe("pending");
  });

  test("upsertTransaction updates with newer timestamp", async () => {
    const t = initConvexTest();
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_003",
      paymentMethod: "cash",
      status: "pending",
      amount: 75000,
      currency: "COP",
      description: "Cash payment",
      lastSyncedAt: 1000,
    });

    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_003",
      paymentMethod: "cash",
      status: "approved",
      amount: 75000,
      currency: "COP",
      description: "Cash payment",
      lastSyncedAt: 2000,
    });

    const tx = await t.query(api.transactions.getLocalTransaction, {
      epaycoRef: "ref_003",
    });
    expect(tx!.status).toBe("approved");
  });

  test("listLocalTransactions filters by userId", async () => {
    const t = initConvexTest();
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_100",
      paymentMethod: "credit_card",
      status: "approved",
      amount: 10000,
      currency: "COP",
      description: "TX 1",
      lastSyncedAt: 1000,
    });
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user2",
      epaycoRef: "ref_101",
      paymentMethod: "pse",
      status: "approved",
      amount: 20000,
      currency: "COP",
      description: "TX 2",
      lastSyncedAt: 1000,
    });

    const user1Txs = await t.query(api.transactions.listLocalTransactions, {
      userId: "user1",
    });
    expect(user1Txs).toHaveLength(1);
    expect(user1Txs[0].epaycoRef).toBe("ref_100");
  });

  test("listLocalTransactions filters by status", async () => {
    const t = initConvexTest();
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_200",
      paymentMethod: "credit_card",
      status: "approved",
      amount: 10000,
      currency: "COP",
      description: "Approved TX",
      lastSyncedAt: 1000,
    });
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_201",
      paymentMethod: "credit_card",
      status: "pending",
      amount: 20000,
      currency: "COP",
      description: "Pending TX",
      lastSyncedAt: 1000,
    });

    const approvedTxs = await t.query(api.transactions.listLocalTransactions, {
      userId: "user1",
      status: "approved",
    });
    expect(approvedTxs).toHaveLength(1);
    expect(approvedTxs[0].status).toBe("approved");
  });

  test("updateTransactionStatus updates existing transaction", async () => {
    const t = initConvexTest();
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_300",
      paymentMethod: "pse",
      status: "pending",
      amount: 50000,
      currency: "COP",
      description: "PSE TX",
      lastSyncedAt: 1000,
    });

    await t.mutation(internal.transactions.updateTransactionStatus, {
      epaycoRef: "ref_300",
      status: "approved",
      responseCode: "1",
      responseMessage: "Aprobada",
    });

    const tx = await t.query(api.transactions.getLocalTransaction, {
      epaycoRef: "ref_300",
    });
    expect(tx!.status).toBe("approved");
    expect(tx!.responseCode).toBe("1");
  });

  test("upsertTransaction drains a confirmation that arrived first", async () => {
    const t = initConvexTest();
    // A verified confirmation lands before the local transaction exists, so the
    // webhook handler parked it as a pending event.
    await t.mutation(internal.webhooks.storeWebhookEvent, {
      epaycoRef: "ref_race",
      eventType: "confirmation",
      status: "pending",
      rawPayload: {
        x_ref_payco: "ref_race",
        x_cod_response: "1",
        x_response_reason_text: "Aprobada",
      },
      lastSyncedAt: 1000,
    });

    // The charge action now persists the transaction (initially pending).
    await t.mutation(internal.transactions.upsertTransaction, {
      userId: "user1",
      epaycoRef: "ref_race",
      paymentMethod: "pse",
      status: "pending",
      amount: 50000,
      currency: "COP",
      description: "PSE TX",
      lastSyncedAt: 2000,
    });

    // The waiting confirmation is applied on insert, not dropped.
    const tx = await t.query(api.transactions.getLocalTransaction, {
      epaycoRef: "ref_race",
    });
    expect(tx!.status).toBe("approved");
    expect(tx!.responseCode).toBe("1");
    expect(tx!.responseMessage).toBe("Aprobada");

    const event = await t.query(internal.webhooks.getWebhookEvent, {
      epaycoRef: "ref_race",
    });
    expect(event!.status).toBe("processed");
  });
});
