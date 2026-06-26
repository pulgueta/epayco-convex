import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  epaycoCredentialsValidator,
  cashInfoValidator,
  cashProviderValidator,
} from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { buildSplitPayload, storedReceivers } from "./payloads.js";
import { rateLimiter } from "./rateLimits.js";

/** Create a cash payment voucher (Efecty, Baloto, Gana, ...). */
export const createCashPayment = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    provider: cashProviderValidator,
    cashInfo: cashInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "createCashPayment", {
      key: args.userId,
      throws: true,
    });

    const info = args.cashInfo;
    const epayco = getEpaycoClient(args.credentials);

    const result = unwrap(
      await epayco.cash.create(args.provider, {
        invoice: info.bill,
        description: info.description,
        value: String(info.value),
        tax: String(info.tax),
        tax_base: String(info.taxBase),
        currency: info.currency ?? "COP",
        type_person: info.typePerson ?? "0",
        doc_type: info.docType,
        doc_number: info.docNumber,
        name: info.name,
        last_name: info.lastName,
        email: info.email,
        cell_phone: info.cellPhone,
        ...(info.endDate ? { end_date: info.endDate } : {}),
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
          "transactionId",
          "transaction_id",
        ]),
        paymentMethod: "cash",
        status: "pending",
        amount: info.value,
        currency: info.currency ?? "COP",
        description: info.description,
        customerEmail: info.email,
        cashProvider: args.provider,
        splitPayment: info.split !== undefined ? true : undefined,
        splitReceivers: storedReceivers(info.split),
        rawResponse: data,
        lastSyncedAt: Date.now(),
      });
    }

    return result;
  },
});

/** Look up a cash transaction by ref_payco. */
export const getCashPayment = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoRef: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.cash.get(args.epaycoRef));
  },
});
