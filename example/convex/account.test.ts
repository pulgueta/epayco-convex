import { describe, expect, test } from "vitest";
import { initConvexTest } from "./setup.test";
import { api } from "./_generated/api";

describe("account", () => {
	test("getMe returns null when signed out", async () => {
		const t = initConvexTest();
		expect(await t.query(api.account.getMe, {})).toBeNull();
	});

	test("getMe returns the customer profile used to prefill checkout", async () => {
		const t = initConvexTest();
		const userId = await t.run((ctx) =>
			ctx.db.insert("users", {
				email: "camila@example.com",
				name: "Camila Restrepo",
				firstName: "Camila",
				lastName: "Restrepo",
				phone: "+573001234567",
				documentType: "CC",
				documentNumber: "1032456789",
			}),
		);

		const me = await t
			.withIdentity({ subject: userId })
			.query(api.account.getMe, {});
		expect(me).toEqual({
			email: "camila@example.com",
			name: "Camila Restrepo",
			firstName: "Camila",
			lastName: "Restrepo",
			phone: "+573001234567",
			documentType: "CC",
			documentNumber: "1032456789",
		});
	});

	test("getLocalTokens returns [] when signed out", async () => {
		const t = initConvexTest();
		expect(await t.query(api.account.getLocalTokens, {})).toEqual([]);
	});

	test("exposeApi reads require authentication", async () => {
		const t = initConvexTest();
		// The component's exposeApi queries derive identity server-side and refuse
		// anonymous callers — a client can never read another user's records.
		await expect(t.query(api.account.getCustomer, {})).rejects.toThrow();
		await expect(t.query(api.account.listTransactions, {})).rejects.toThrow();
	});
});

describe("catalog", () => {
	test("listProducts returns the store catalog", async () => {
		const t = initConvexTest();
		const products = await t.query(api.catalog.listProducts, {});
		expect(Array.isArray(products)).toBe(true);
		expect(products.length).toBeGreaterThan(0);
	});

	test("plan tiers always sum split percentages to 100", async () => {
		const t = initConvexTest();
		const partners = await t.query(api.payments.listSplitPartners, {});
		const total = partners.reduce(
			(sum: number, p: { percentage: number }) => sum + p.percentage,
			0,
		);
		expect(total).toBe(100);
	});
});
