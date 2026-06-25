import { describe, expect, test } from "vitest";
import { exposeApi } from "./index.js";
import { anyApi, type ApiFromModules } from "convex/server";
import { components, initConvexTest } from "./setup.test.js";

export const { listTransactions, getCustomer, getActiveSubscription } =
  exposeApi(components.epaycoConvex, {
    auth: async (ctx, _operation) => {
      return (await ctx.auth.getUserIdentity())?.subject ?? "anonymous";
    },
  });

const testApi = (
  anyApi as unknown as ApiFromModules<{
    "index.test": {
      listTransactions: typeof listTransactions;
      getCustomer: typeof getCustomer;
      getActiveSubscription: typeof getActiveSubscription;
    };
  }>
)["index.test"];

describe("client tests", () => {
  test("should expose query functions", async () => {
    const t = initConvexTest().withIdentity({
      subject: "user1",
    });
    const transactions = await t.query(testApi.listTransactions, {});
    expect(transactions).toEqual([]);
  });

  test("should expose getCustomer", async () => {
    const t = initConvexTest().withIdentity({
      subject: "user1",
    });
    const customer = await t.query(testApi.getCustomer, {});
    expect(customer).toBeNull();
  });

  test("should expose getActiveSubscription", async () => {
    const t = initConvexTest().withIdentity({
      subject: "user1",
    });
    const sub = await t.query(testApi.getActiveSubscription, {});
    expect(sub).toBeNull();
  });

  // Regression: the exposed queries must never let an authenticated caller
  // widen scope to another user by passing a foreign `userId`. The arg no
  // longer exists, so the request is rejected outright.
  test("rejects a client-supplied userId (no scope widening)", async () => {
    const t = initConvexTest().withIdentity({
      subject: "user1",
    });
    await expect(
      t.query(testApi.listTransactions, {
        userId: "victim",
      } as unknown as Record<string, never>),
    ).rejects.toThrow();
    await expect(
      t.query(testApi.getCustomer, {
        userId: "victim",
      } as unknown as Record<string, never>),
    ).rejects.toThrow();
  });
});
