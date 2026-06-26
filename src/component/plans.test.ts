/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test.helper.js";
import { api, internal } from "./_generated/api.js";

describe("plans", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("upsertPlan creates a new plan", async () => {
    const t = initConvexTest();
    const id = await t.mutation(internal.plans.upsertPlan, {
      epaycoPlanId: "plan_basic",
      name: "Basic Plan",
      description: "Basic monthly plan",
      amount: 29900,
      currency: "COP",
      interval: "month",
      intervalCount: 1,
      trialDays: 7,
      status: "active",
      lastSyncedAt: 1000,
    });
    expect(id).toBeDefined();

    const plan = await t.query(api.plans.getLocalPlan, {
      epaycoPlanId: "plan_basic",
    });
    expect(plan).not.toBeNull();
    expect(plan!.name).toBe("Basic Plan");
    expect(plan!.amount).toBe(29900);
  });

  test("upsertPlan is idempotent with same timestamp", async () => {
    const t = initConvexTest();
    await t.mutation(internal.plans.upsertPlan, {
      epaycoPlanId: "plan_pro",
      name: "Pro Plan",
      description: "Pro plan",
      amount: 59900,
      currency: "COP",
      interval: "month",
      intervalCount: 1,
      trialDays: 0,
      status: "active",
      lastSyncedAt: 1000,
    });

    await t.mutation(internal.plans.upsertPlan, {
      epaycoPlanId: "plan_pro",
      name: "Pro Plan Updated",
      lastSyncedAt: 1000,
    });

    const plan = await t.query(api.plans.getLocalPlan, {
      epaycoPlanId: "plan_pro",
    });
    expect(plan!.name).toBe("Pro Plan");
  });

  test("listLocalPlans returns all plans", async () => {
    const t = initConvexTest();
    await t.mutation(internal.plans.upsertPlan, {
      epaycoPlanId: "plan_1",
      name: "Plan 1",
      description: "First",
      amount: 10000,
      currency: "COP",
      interval: "month",
      intervalCount: 1,
      trialDays: 0,
      status: "active",
      lastSyncedAt: 1000,
    });
    await t.mutation(internal.plans.upsertPlan, {
      epaycoPlanId: "plan_2",
      name: "Plan 2",
      description: "Second",
      amount: 20000,
      currency: "COP",
      interval: "year",
      intervalCount: 1,
      trialDays: 30,
      status: "active",
      lastSyncedAt: 1000,
    });

    const plans = await t.query(api.plans.listLocalPlans, {});
    expect(plans).toHaveLength(2);
  });

  test("listLocalPlans filters by status", async () => {
    const t = initConvexTest();
    await t.mutation(internal.plans.upsertPlan, {
      epaycoPlanId: "plan_active",
      name: "Active",
      description: "Active plan",
      amount: 10000,
      currency: "COP",
      interval: "month",
      intervalCount: 1,
      trialDays: 0,
      status: "active",
      lastSyncedAt: 1000,
    });
    await t.mutation(internal.plans.upsertPlan, {
      epaycoPlanId: "plan_deleted",
      name: "Deleted",
      description: "Deleted plan",
      amount: 20000,
      currency: "COP",
      interval: "month",
      intervalCount: 1,
      trialDays: 0,
      status: "deleted",
      lastSyncedAt: 1000,
    });

    const activePlans = await t.query(api.plans.listLocalPlans, {
      status: "active",
    });
    expect(activePlans).toHaveLength(1);
    expect(activePlans[0].name).toBe("Active");
  });
});
