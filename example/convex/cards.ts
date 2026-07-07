import { ConvexError, v } from "convex/values";
import type { ActionCtx } from "./_generated/server";
import { epayco } from "./epayco";

/**
 * Shared card/customer plumbing used by both one-time checkout and recurring
 * subscriptions. A user maps to a single ePayco customer; cards are tokenized
 * by ePayco through the server-side component and never stored by this app.
 */

export const billingValidator = v.object({
  name: v.string(),
  lastName: v.string(),
  email: v.string(),
  docType: v.string(),
  docNumber: v.string(),
  cellPhone: v.optional(v.string()),
});

export const cardValidator = v.object({
  cardNumber: v.string(),
  expMonth: v.string(),
  expYear: v.string(),
  cvc: v.string(),
});

export type Billing = {
  name: string;
  lastName: string;
  email: string;
  docType: string;
  docNumber: string;
  cellPhone?: string;
};

export type CardInput = {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
};

/** Pull the ePayco token id straight out of the `createToken` response, the
 *  same way the component does — never infer "the newest token" by recency. */
function tokenIdOf(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const root = result as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const id = data.id ?? data.token ?? data.tokenId ?? root.id ?? root.token;
  return id ? String(id) : null;
}

/**
 * Resolve a `{ tokenCard, customerId }` pair to charge against. Either reuse a
 * saved card (`savedTokenId`) or tokenize the supplied `card`, creating the
 * ePayco customer on first use and attaching the new token to it afterwards.
 */
export async function resolveCardAndCustomer(
  ctx: ActionCtx,
  userId: string,
  billing: Billing,
  opts: { card?: CardInput; savedTokenId?: string },
): Promise<{ tokenCard: string; customerId: string }> {
  const customer = await epayco.getLocalCustomer(ctx, { userId });

  if (opts.savedTokenId) {
    if (!customer) {
      throw new ConvexError({
        message: "No saved profile found for this card.",
      });
    }
    const componentTokenId = opts.savedTokenId.startsWith("component:")
      ? opts.savedTokenId.slice("component:".length)
      : opts.savedTokenId;
    const tokens = await epayco.getLocalTokens(ctx, { userId });
    const match = tokens.find(
      (t: { _id: string; epaycoTokenId: string }) =>
        t._id === componentTokenId || t.epaycoTokenId === componentTokenId,
    );
    if (!match) {
      throw new ConvexError({
        message: "That saved card is no longer available.",
      });
    }
    return {
      tokenCard: match.epaycoTokenId,
      customerId: customer.epaycoCustomerId,
    };
  }

  if (!opts.card) {
    throw new ConvexError({
      message: "Provide card details or pick a saved card.",
    });
  }

  // Use the exact token returned by this call — not whichever token is newest.
  const tokenResult = await epayco.createToken(ctx, {
    userId,
    tokenInfo: opts.card,
  });
  const tokenCard = tokenIdOf(tokenResult);
  if (!tokenCard) {
    throw new ConvexError({
      message: "Could not tokenize that card. Check the details.",
    });
  }

  if (customer) {
    try {
      await epayco.addNewToken(ctx, {
        customerId: customer.epaycoCustomerId,
        tokenCard,
      });
    } catch {
      // Non-fatal: the charge passes token_card + customer_id explicitly.
    }
    return { tokenCard, customerId: customer.epaycoCustomerId };
  }

  await epayco.createCustomer(ctx, {
    userId,
    customerInfo: {
      tokenCard,
      name: billing.name,
      lastName: billing.lastName,
      email: billing.email,
      cellPhone: billing.cellPhone,
      docType: billing.docType,
      docNumber: billing.docNumber,
    },
  });
  const created = await epayco.getLocalCustomer(ctx, { userId });
  if (!created) {
    throw new ConvexError({
      message: "Could not create your payment profile.",
    });
  }
  return { tokenCard, customerId: created.epaycoCustomerId };
}

export function invoiceNumber(): string {
  return `TOS-${Date.now().toString(36).toUpperCase()}`;
}

export function refOf(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const root = result as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const ref = data.ref_payco ?? data.refPayco ?? root.ref_payco;
  return ref ? String(ref) : null;
}

export function statusOf(result: unknown): string {
  if (!result || typeof result !== "object") return "pending";
  const root = result as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const raw = String(
    data.estado ?? data.x_response ?? data.respuesta ?? root.estado ?? "",
  )
    .toLowerCase()
    .trim();
  switch (raw) {
    case "aceptada":
    case "approved":
      return "approved";
    case "rechazada":
    case "rejected":
    case "cancelada":
      return "rejected";
    case "fallida":
    case "abandonada":
    case "failed":
      return "failed";
    case "reversada":
    case "reversed":
      return "reversed";
    case "expirada":
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}
