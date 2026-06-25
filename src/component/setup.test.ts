/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api.js";
import { initConvexTest } from "./setup.test.helper.js";

export { initConvexTest };

describe("component setup", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  test("schema tables exist", async () => {
    const t = initConvexTest();
    // Verify we can query the customers table
    const customers = await t.query(api.customers.listLocalCustomers, {});
    expect(customers).toEqual([]);
  });
});
