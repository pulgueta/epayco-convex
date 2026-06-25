import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  epaycoCredentialsValidator,
  chargeInfoValidator,
} from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { buildSplitPayload, storedReceivers } from "./payloads.js";
import { statusFromEstado } from "./status.js";
import { rateLimiter } from "./rateLimits.js";

/** Charge a tokenized credit card. */
export const createCharge = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    chargeInfo: chargeInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "createCharge", {
      key: args.userId,
      throws: true,
    });

    const info = args.chargeInfo;
    const epayco = getEpaycoClient(args.credentials);

    const result = unwrap(
      await epayco.charge.create({
        token_card: info.tokenCard,
        customer_id: info.customerId,
        doc_type: info.docType,
        doc_number: info.docNumber,
        name: info.name,
        last_name: info.lastName,
        email: info.email,
        ...(info.city ? { city: info.city } : {}),
        ...(info.address ? { address: info.address } : {}),
        ...(info.phone ? { phone: info.phone } : {}),
        ...(info.cellPhone ? { cell_phone: info.cellPhone } : {}),
        bill: info.bill,
        description: info.description,
        value: String(info.value),
        tax: String(info.tax),
        tax_base: String(info.taxBase),
        currency: info.currency ?? "COP",
        dues: String(info.dues ?? 1),
        ...(info.ip ? { ip: info.ip } : {}),
        ...(info.urlResponse ? { url_response: info.urlResponse } : {}),
        ...(info.urlConfirmation
          ? { url_confirmation: info.urlConfirmation }
          : {}),
        ...(info.methodConfirmation
          ? { method_confirmation: info.methodConfirmation }
          : {}),
        ...(info.useDefaultCardCustomer !== undefined
          ? { use_default_card_customer: info.useDefaultCardCustomer }
          : {}),
        extras: {
          extra1: info.extra1 ?? "",
          extra2: info.extra2 ?? "",
          extra3: info.extra3 ?? "",
        },
        ...buildSplitPayload(info.split, false),
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
          "x_transaction_id",
        ]),
        paymentMethod: "credit_card",
        status: statusFromEstado(
          pick(data, ["estado", "x_response", "respuesta"]),
        ),
        amount: info.value,
        currency: info.currency ?? "COP",
        description: info.description,
        customerEmail: info.email,
        franchise: pick(data, ["franchise", "franquicia", "x_franchise"]),
        responseCode: pick(data, ["cod_respuesta", "x_cod_response"]),
        responseMessage: pick(data, [
          "respuesta",
          "x_response_reason_text",
          "response_reason_text",
        ]),
        splitPayment: info.split !== undefined ? true : undefined,
        splitReceivers: storedReceivers(info.split),
        rawResponse: data,
        lastSyncedAt: Date.now(),
      });
    }

    return result;
  },
});

/** Look up a transaction by ref_payco directly from ePayco. */
export const getCharge = action({
  args: {
    credentials: epaycoCredentialsValidator,
    epaycoRef: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    return unwrap(await epayco.charge.get(args.epaycoRef));
  },
});
