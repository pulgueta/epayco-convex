import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { epaycoCredentialsValidator, tokenInfoValidator } from "./validators.js";
import { getEpaycoClient, unwrap, dataOf, pick } from "./epaycoClient.js";
import { rateLimiter } from "./rateLimits.js";

/** Tokenize a card via ePayco and cache the resulting token locally. */
export const createToken = action({
  args: {
    credentials: epaycoCredentialsValidator,
    userId: v.string(),
    tokenInfo: tokenInfoValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "createToken", {
      key: args.userId,
      throws: true,
    });

    const epayco = getEpaycoClient(args.credentials);
    const result = unwrap(
      await epayco.token.create({
        "card[number]": args.tokenInfo.cardNumber,
        "card[exp_year]": args.tokenInfo.expYear,
        "card[exp_month]": args.tokenInfo.expMonth,
        "card[cvc]": args.tokenInfo.cvc,
        hasCvv: args.tokenInfo.hasCvv ?? true,
      }),
    );

    const data = dataOf(result);
    // ePayco returns the card details (mask, franchise name) under `result.card`.
    const card =
      typeof result.card === "object" && result.card !== null
        ? (result.card as Record<string, unknown>)
        : {};
    const tokenId =
      pick(data, ["id", "token", "tokenId"]) ??
      pick(result, ["id", "token", "tokenId"]);

    if (tokenId) {
      await ctx.runMutation(internal.tokens.upsertToken, {
        userId: args.userId,
        epaycoTokenId: tokenId,
        epaycoCustomerId: "",
        mask:
          pick(data, ["mask"]) ??
          pick(card, ["mask"]) ??
          `****${args.tokenInfo.cardNumber.slice(-4)}`,
        franchise:
          pick(data, ["franchise"]) ??
          pick(card, ["name", "franchise"]) ??
          "unknown",
        isActive: true,
        lastSyncedAt: Date.now(),
      });
    }

    return result;
  },
});
