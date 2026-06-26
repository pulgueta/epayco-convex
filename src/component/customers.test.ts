/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test.helper.js";
import { api, internal } from "./_generated/api.js";

describe("customers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("upsertCustomer creates a new customer", async () => {
    const t = initConvexTest();
    const id = await t.mutation(internal.customers.upsertCustomer, {
      userId: "user1",
      epaycoCustomerId: "cust_123",
      name: "John Doe",
      email: "john@example.com",
      phone: "3001234567",
      lastSyncedAt: 1000,
    });
    expect(id).toBeDefined();

    const customer = await t.query(api.customers.getLocalCustomer, {
      userId: "user1",
    });
    expect(customer).not.toBeNull();
    expect(customer!.name).toBe("John Doe");
    expect(customer!.email).toBe("john@example.com");
    expect(customer!.epaycoCustomerId).toBe("cust_123");
  });

  test("upsertCustomer is idempotent with same lastSyncedAt", async () => {
    const t = initConvexTest();
    await t.mutation(internal.customers.upsertCustomer, {
      userId: "user1",
      epaycoCustomerId: "cust_123",
      name: "John Doe",
      email: "john@example.com",
      lastSyncedAt: 1000,
    });

    // Second upsert with same timestamp should not update
    await t.mutation(internal.customers.upsertCustomer, {
      userId: "user1",
      epaycoCustomerId: "cust_123",
      name: "Jane Doe",
      email: "jane@example.com",
      lastSyncedAt: 1000,
    });

    const customer = await t.query(api.customers.getLocalCustomer, {
      userId: "user1",
    });
    expect(customer!.name).toBe("John Doe");
  });

  test("upsertCustomer updates with newer lastSyncedAt", async () => {
    const t = initConvexTest();
    await t.mutation(internal.customers.upsertCustomer, {
      userId: "user1",
      epaycoCustomerId: "cust_123",
      name: "John Doe",
      email: "john@example.com",
      lastSyncedAt: 1000,
    });

    await t.mutation(internal.customers.upsertCustomer, {
      userId: "user1",
      epaycoCustomerId: "cust_123",
      name: "John Updated",
      email: "john.updated@example.com",
      lastSyncedAt: 2000,
    });

    const customer = await t.query(api.customers.getLocalCustomer, {
      userId: "user1",
    });
    expect(customer!.name).toBe("John Updated");
    expect(customer!.email).toBe("john.updated@example.com");
  });

  test("getLocalCustomerByEpaycoId finds customer", async () => {
    const t = initConvexTest();
    await t.mutation(internal.customers.upsertCustomer, {
      userId: "user1",
      epaycoCustomerId: "cust_456",
      name: "Test User",
      email: "test@example.com",
      lastSyncedAt: 1000,
    });

    const customer = await t.query(api.customers.getLocalCustomerByEpaycoId, {
      epaycoCustomerId: "cust_456",
    });
    expect(customer).not.toBeNull();
    expect(customer!.userId).toBe("user1");
  });

  test("listLocalCustomers returns all customers", async () => {
    const t = initConvexTest();
    await t.mutation(internal.customers.upsertCustomer, {
      userId: "user1",
      epaycoCustomerId: "cust_1",
      name: "User 1",
      email: "user1@example.com",
      lastSyncedAt: 1000,
    });
    await t.mutation(internal.customers.upsertCustomer, {
      userId: "user2",
      epaycoCustomerId: "cust_2",
      name: "User 2",
      email: "user2@example.com",
      lastSyncedAt: 1000,
    });

    const customers = await t.query(api.customers.listLocalCustomers, {});
    expect(customers).toHaveLength(2);
  });
});
