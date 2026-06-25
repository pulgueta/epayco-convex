import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import {
  epaycoCredentialsValidator,
  safetypayInfoValidator,
} from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { rateLimiter } from "./rateLimits.js";

/** Create a SafetyPay transaction (cash or online bank). */
export const createSafetyPayPayment = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    safetypayInfo: safetypayInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "createSafetyPayPayment", {
      key: args.userId,
      throws: true,
    });

    const info = args.safetypayInfo;
    const epayco = getEpaycoClient(args.credentials);

    const result = unwrap(
      await epayco.safetypay.create({
        cash: info.cash,
        ...(info.endDate ? { end_date: info.endDate } : {}),
        doc_type: info.docType,
        doc_number: info.docNumber,
        name: info.name,
        last_name: info.lastName,
        email: info.email,
        ind_country: info.indCountry ?? "57",
        phone: info.phone,
        country: info.country ?? "CO",
        ...(info.invoice ? { invoice: info.invoice } : {}),
        ...(info.city ? { city: info.city } : {}),
        ...(info.address ? { address: info.address } : {}),
        ...(info.ip ? { ip: info.ip } : {}),
        currency: info.currency ?? "COP",
        description: info.description,
        value: info.value,
        tax: info.tax,
        ico: info.ico ?? 0,
        tax_base: info.taxBase,
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
        paymentMethod: "safetypay",
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
