import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  epaycoCredentialsValidator,
  daviplataInfoValidator,
} from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { statusFromEstado } from "./status.js";

/** Start a Daviplata payment. Returns a ref_payco + id_session_token used for OTP confirmation. */
export const createDaviplataPayment = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    daviplataInfo: daviplataInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const info = args.daviplataInfo;
    const epayco = getEpaycoClient(args.credentials);

    const result = unwrap(
      await epayco.daviplata.create({
        doc_type: info.docType,
        doc_number: info.docNumber,
        name: info.name,
        last_name: info.lastName,
        email: info.email,
        ind_country: info.indCountry ?? "CO",
        phone: info.phone,
        country: info.country ?? "CO",
        ...(info.city ? { city: info.city } : {}),
        ...(info.address ? { address: info.address } : {}),
        ...(info.ip ? { ip: info.ip } : {}),
        currency: info.currency ?? "COP",
        description: info.description,
        value: String(info.value),
        tax: String(info.tax),
        tax_base: String(info.taxBase),
        method_confirmation: info.methodConfirmation ?? "",
        ...(info.urlConfirmation
          ? { url_confirmation: info.urlConfirmation }
          : {}),
      }),
    );

    const data = dataOf(result);
    const refPayco = pick(data, ["ref_payco", "refPayco"]);

    if (refPayco) {
      await ctx.runMutation(internal.transactions.upsertTransaction, {
        userId: args.userId,
        epaycoRef: refPayco,
        epaycoTransactionId: pick(data, ["transactionId", "transaction_id"]),
        paymentMethod: "daviplata",
        status: "pending",
        amount: info.value,
        currency: info.currency ?? "COP",
        description: info.description,
        customerEmail: info.email,
        rawResponse: data,
        lastSyncedAt: Date.now(),
      });
    }

    return result;
  },
});

/** Confirm a Daviplata payment with the customer's OTP. */
export const confirmDaviplataPayment = action({
  args: {
    credentials: epaycoCredentialsValidator,
    refPayco: v.string(),
    idSessionToken: v.string(),
    otp: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.daviplata.confirm({
        ref_payco: args.refPayco,
        id_session_token: args.idSessionToken,
        otp: args.otp,
      }),
    );

    const data = dataOf(result);
    await ctx.runMutation(internal.transactions.updateTransactionStatus, {
      epaycoRef: args.refPayco,
      status: statusFromEstado(pick(data, ["estado", "x_response", "respuesta"])),
      rawResponse: data,
    });

    return result;
  },
});
