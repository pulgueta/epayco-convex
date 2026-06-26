import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  epaycoCredentialsValidator,
  customerInfoValidator,
} from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { rateLimiter } from "./rateLimits.js";

/** Create an ePayco customer (links a tokenized card to a profile). */
export const createCustomer = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    customerInfo: customerInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "createCustomer", {
      key: args.userId,
      throws: true,
    });

    const info = args.customerInfo;
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.customers.create({
        token_card: info.tokenCard,
        name: info.name,
        last_name: info.lastName ?? "",
        email: info.email,
        default: info.isDefault ?? true,
        ...(info.phone ? { phone: info.phone } : {}),
        ...(info.cellPhone ? { cell_phone: info.cellPhone } : {}),
        ...(info.city ? { city: info.city } : {}),
        ...(info.address ? { address: info.address } : {}),
      }),
    );

    const data = dataOf(result);
    const epaycoCustomerId =
      pick(data, ["customerId", "id_customer", "id", "uid"]) ??
      pick(result, ["customerId", "id_customer", "id", "uid"]);

    if (epaycoCustomerId) {
      await ctx.runMutation(internal.customers.upsertCustomer, {
        userId: args.userId,
        epaycoCustomerId,
        name: info.name,
        email: info.email,
        phone: info.phone ?? info.cellPhone,
        docType: info.docType,
        docNumber: info.docNumber,
        lastSyncedAt: Date.now(),
      });
    }

    return result;
  },
});

/** Fetch a customer from ePayco by its ePayco id. */
export const getCustomer = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoCustomerId: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.customers.get(args.epaycoCustomerId));
  },
});

/** List customers from ePayco (paginated). */
export const listCustomers = action({
  args: {
    credentials: epaycoCredentialsValidator,
    page: v.optional(v.number()),
    perPage: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(
      await epayco.customers.list({
        page: args.page ?? 1,
        perPage: args.perPage ?? 20,
      }),
    );
  },
});

/** Update a customer's mutable fields on ePayco and locally. */
export const updateCustomer = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    epaycoCustomerId: v.string(),
    name: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    cellPhone: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.customers.update(args.epaycoCustomerId, {
        ...(args.name ? { name: args.name } : {}),
        ...(args.lastName ? { last_name: args.lastName } : {}),
        ...(args.email ? { email: args.email } : {}),
        ...(args.phone ? { phone: args.phone } : {}),
        ...(args.cellPhone ? { cell_phone: args.cellPhone } : {}),
        ...(args.city ? { city: args.city } : {}),
        ...(args.address ? { address: args.address } : {}),
      }),
    );

    await ctx.runMutation(internal.customers.upsertCustomer, {
      userId: args.userId,
      epaycoCustomerId: args.epaycoCustomerId,
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.email !== undefined ? { email: args.email } : {}),
      ...(args.phone !== undefined ? { phone: args.phone } : {}),
      lastSyncedAt: Date.now(),
    });

    return result;
  },
});

/** Remove a card (token) from a customer on ePayco. */
export const deleteCustomerCard = action({
  args: {
    credentials: epaycoCredentialsValidator,
    franchise: v.string(),
    mask: v.string(),
    customerId: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(
      await epayco.customers.delete({
        franchise: args.franchise,
        mask: args.mask,
        customer_id: args.customerId,
      }),
    );
  },
});

/** Set an existing token as the customer's default card. */
export const addDefaultCard = action({
  args: {
    credentials: epaycoCredentialsValidator,
    customerId: v.string(),
    token: v.string(),
    franchise: v.string(),
    mask: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.customers.addDefaultCard({
        franchise: args.franchise,
        token: args.token,
        mask: args.mask,
        customer_id: args.customerId,
      }),
    );

    await ctx.runMutation(internal.customers.setDefaultCard, {
      epaycoCustomerId: args.customerId,
      defaultCard: args.token,
      lastSyncedAt: Date.now(),
    });

    return result;
  },
});

/** Attach an additional token to an existing customer. */
export const addNewToken = action({
  args: {
    credentials: epaycoCredentialsValidator,
    customerId: v.string(),
    tokenCard: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(
      await epayco.customers.addNewToken({
        token_card: args.tokenCard,
        customer_id: args.customerId,
      }),
    );
  },
});
