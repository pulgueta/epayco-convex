import { ConvexError, v } from "convex/values";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { epayco } from "./epayco";

/**
 * Shared card/customer plumbing used by both one-time checkout and recurring
 * subscriptions. A user maps to a single ePayco customer; the server receives
 * browser-created ePayco tokens, never raw PAN/CVC values.
 */

export const billingValidator = v.object({
  name: v.string(),
  lastName: v.string(),
  email: v.string(),
  docType: v.string(),
  docNumber: v.string(),
  cellPhone: v.optional(v.string()),
});

export const cardTokenValidator = v.object({
  tokenId: v.string(),
  mask: v.string(),
  franchise: v.string(),
});

export type Billing = {
  name: string;
  lastName: string;
  email: string;
  docType: string;
  docNumber: string;
  cellPhone?: string;
};

export type CardTokenInput = {
  tokenId: string;
  mask: string;
  franchise: string;
};

/**
 * Resolve a `{ tokenCard, customerId }` pair to charge against. Either reuse a
 * saved card (`savedTokenId`) or attach a browser-tokenized new card, creating
 * the ePayco customer on first use.
 */
export async function resolveCardAndCustomer(
  ctx: ActionCtx,
  userId: string,
  billing: Billing,
  opts: { cardToken?: CardTokenInput; savedTokenId?: string },
): Promise<{ tokenCard: string; customerId: string }> {
  const customer = await epayco.getLocalCustomer(ctx, { userId });

  if (opts.savedTokenId) {
    if (!customer) {
      throw new ConvexError({
        message: "No saved profile found for this card.",
      });
    }
    if (opts.savedTokenId.startsWith("app:")) {
      const savedCardId = opts.savedTokenId.slice(4) as Id<"savedCards">;
      const savedCard = await ctx.runQuery(internal.savedCards.getForUser, {
        userId: userId as Id<"users">,
        savedCardId,
      });
      if (!savedCard) {
        throw new ConvexError({
          message: "That saved card is no longer available.",
        });
      }
      return {
        tokenCard: savedCard.epaycoTokenId,
        customerId: savedCard.epaycoCustomerId,
      };
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

  if (!opts.cardToken) {
    throw new ConvexError({
      message: "Provide card details or pick a saved card.",
    });
  }

  const tokenCard = opts.cardToken.tokenId;

  if (customer) {
    try {
      await epayco.addNewToken(ctx, {
        customerId: customer.epaycoCustomerId,
        tokenCard,
      });
      await ctx.runMutation(internal.savedCards.upsert, {
        userId: userId as Id<"users">,
        epaycoTokenId: tokenCard,
        epaycoCustomerId: customer.epaycoCustomerId,
        mask: opts.cardToken.mask,
        franchise: opts.cardToken.franchise,
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
  await ctx.runMutation(internal.savedCards.upsert, {
    userId: userId as Id<"users">,
    epaycoTokenId: tokenCard,
    epaycoCustomerId: created.epaycoCustomerId,
    mask: opts.cardToken.mask,
    franchise: opts.cardToken.franchise,
  });
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
