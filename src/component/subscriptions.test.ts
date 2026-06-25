/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test.helper.js";
import { api, internal } from "./_generated/api.js";

describe("subscriptions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("upsertSubscription creates a new subscription", async () => {
    const t = initConvexTest();
    const id = await t.mutation(internal.subscriptions.upsertSubscription, {
      userId: "user1",
      epaycoSubscriptionId: "sub_001",
      epaycoCustomerId: "cust_001",
      epaycoPlanId: "plan_basic",
      status: "active",
      lastSyncedAt: 1000,
    });
    expect(id).toBeDefined();

    const sub = await t.query(api.subscriptions.getLocalSubscription, {
      epaycoSubscriptionId: "sub_001",
    });
    expect(sub).not.toBeNull();
    expect(sub!.status).toBe("active");
    expect(sub!.userId).toBe("user1");
  });

  test("upsertSubscription is idempotent", async () => {
    const t = initConvexTest();
    await t.mutation(internal.subscriptions.upsertSubscription, {
      userId: "user1",
      epaycoSubscriptionId: "sub_002",
      epaycoCustomerId: "cust_001",
      epaycoPlanId: "plan_basic",
      status: "active",
      lastSyncedAt: 1000,
    });

    await t.mutation(internal.subscriptions.upsertSubscription, {
      epaycoSubscriptionId: "sub_002",
      status: "cancelled",
      lastSyncedAt: 1000,
    });

    const sub = await t.query(api.subscriptions.getLocalSubscription, {
      epaycoSubscriptionId: "sub_002",
    });
    expect(sub!.status).toBe("active");
  });

  test("getActiveSubscription returns active sub", async () => {
    const t = initConvexTest();
    await t.mutation(internal.subscriptions.upsertSubscription, {
      userId: "user1",
      epaycoSubscriptionId: "sub_010",
      epaycoCustomerId: "cust_001",
      epaycoPlanId: "plan_basic",
      status: "active",
      lastSyncedAt: 1000,
    });

    const active = await t.query(api.subscriptions.getActiveSubscription, {
      userId: "user1",
    });
    expect(active).not.toBeNull();
    expect(active!.epaycoSubscriptionId).toBe("sub_010");
  });

  test("getActiveSubscription returns null for cancelled", async () => {
    const t = initConvexTest();
    await t.mutation(internal.subscriptions.upsertSubscription, {
      userId: "user1",
      epaycoSubscriptionId: "sub_020",
      epaycoCustomerId: "cust_001",
      epaycoPlanId: "plan_basic",
      status: "cancelled",
      lastSyncedAt: 1000,
    });

    const active = await t.query(api.subscriptions.getActiveSubscription, {
      userId: "user1",
    });
    expect(active).toBeNull();
  });

  test("listLocalSubscriptionsByUser excludes cancelled", async () => {
    const t = initConvexTest();
    await t.mutation(internal.subscriptions.upsertSubscription, {
      userId: "user1",
      epaycoSubscriptionId: "sub_030",
      epaycoCustomerId: "cust_001",
      epaycoPlanId: "plan_basic",
      status: "active",
      lastSyncedAt: 1000,
    });
    await t.mutation(internal.subscriptions.upsertSubscription, {
      userId: "user1",
      epaycoSubscriptionId: "sub_031",
      epaycoCustomerId: "cust_001",
      epaycoPlanId: "plan_pro",
      status: "cancelled",
      lastSyncedAt: 1000,
    });

    const subs = await t.query(api.subscriptions.listLocalSubscriptionsByUser, {
      userId: "user1",
    });
    expect(subs).toHaveLength(1);
    expect(subs[0].epaycoSubscriptionId).toBe("sub_030");
  });
});
