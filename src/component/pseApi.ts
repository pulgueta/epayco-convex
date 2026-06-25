import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { epaycoCredentialsValidator, pseInfoValidator } from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { buildSplitPayload, storedReceivers } from "./payloads.js";
import { rateLimiter } from "./rateLimits.js";

/** Create a PSE (bank debit) transaction. Returns a `urlbanco` to redirect to. */
export const createPseTransaction = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    pseInfo: pseInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "createPseTransaction", {
      key: args.userId,
      throws: true,
    });

    const info = args.pseInfo;
    const epayco = getEpaycoClient(args.credentials);

    const result = unwrap(
      await epayco.bank.create({
        bank: info.bank,
        invoice: info.bill,
        description: info.description,
        value: String(info.value),
        tax: String(info.tax),
        tax_base: String(info.taxBase),
        currency: info.currency ?? "COP",
        type_person: info.typePerson,
        doc_type: info.docType,
        doc_number: info.docNumber,
        name: info.name,
        last_name: info.lastName,
        email: info.email,
        country: info.country ?? "CO",
        cell_phone: info.cellPhone,
        ...(info.ip ? { ip: info.ip } : {}),
        ...(info.urlResponse ? { url_response: info.urlResponse } : {}),
        ...(info.urlConfirmation
          ? { url_confirmation: info.urlConfirmation }
          : {}),
        metodoconfirmacion: "GET",
        extra1: info.extra1 ?? "",
        extra2: info.extra2 ?? "",
        extra3: info.extra3 ?? "",
        ...buildSplitPayload(info.split, true),
      }),
    );

    const data = dataOf(result);
    const refPayco = pick(data, ["ref_payco", "refPayco"]);

    if (refPayco) {
      await ctx.runMutation(internal.transactions.upsertTransaction, {
        userId: args.userId,
        epaycoRef: refPayco,
        epaycoTransactionId: pick(data, [
          "transactionID",
          "transactionId",
          "transaction_id",
        ]),
        paymentMethod: "pse",
        status: "pending",
        amount: info.value,
        currency: info.currency ?? "COP",
        description: info.description,
        customerEmail: info.email,
        bankName: pick(data, ["bank", "banco"]) ?? info.bank,
        splitPayment: info.split !== undefined ? true : undefined,
        splitReceivers: storedReceivers(info.split),
        rawResponse: data,
        lastSyncedAt: Date.now(),
      });
    }

    return result;
  },
});

/** Look up a PSE transaction's current state by its ticket id. */
export const getPseTransaction = action({
  args: {
    credentials: epaycoCredentialsValidator,
    ticketId: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.bank.get(args.ticketId));
  },
});

/** Fetch the PSE bank list and cache it locally. */
export const getBanks = action({
  args: { credentials: epaycoCredentialsValidator },
  returns: v.any(),
  handler: async (ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(await epayco.bank.getBanks());

    const list = Array.isArray(result.data)
      ? (result.data as Array<Record<string, unknown>>)
      : [];

    for (const bank of list) {
      const bankCode = pick(bank, ["bankCode", "code", "value", "pseCode"]);
      const bankName = pick(bank, ["bankName", "name", "description", "label"]);
      if (bankCode && bankName) {
        await ctx.runMutation(internal.banks.upsertBank, {
          bankCode,
          bankName,
          lastSyncedAt: Date.now(),
        });
      }
    }

    return result;
  },
});
