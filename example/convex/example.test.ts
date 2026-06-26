import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test";
import { api } from "./_generated/api";

describe("example", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
  });

  test("getLocalCustomer returns null for unknown user", async () => {
    const t = initConvexTest();
    const customer = await t.query(api.example.getLocalCustomer, {});
    expect(customer).toBeNull();
  });

  test("listTransactions returns empty for unknown user", async () => {
    const t = initConvexTest();
    const transactions = await t.query(api.example.listTransactions, {});
    expect(transactions).toEqual([]);
  });

  test("getActiveSubscription returns null for unknown user", async () => {
    const t = initConvexTest();
    const sub = await t.query(api.example.getActiveSubscription, {});
    expect(sub).toBeNull();
  });
});
