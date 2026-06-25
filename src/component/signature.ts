/**
 * ePayco webhook (confirmation) signature verification.
 *
 * ePayco signs each confirmation with:
 *   SHA256( p_cust_id_cliente ^ p_key ^ x_ref_payco ^ x_transaction_id ^ x_amount ^ x_currency_code )
 *
 * This runs in the default Convex (V8) runtime using Web Crypto — no Node
 * built-ins required — so it is safe to import from queries/mutations/actions.
 */
export async function verifyWebhookSignature(
  custIdCliente: string,
  pKey: string,
  xRefPayco: string,
  xTransactionId: string,
  xAmount: string,
  xCurrencyCode: string,
  receivedSignature: string,
): Promise<boolean> {
  const data = `${custIdCliente}^${pKey}^${xRefPayco}^${xTransactionId}^${xAmount}^${xCurrencyCode}`;
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  );
  const computedSignature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(computedSignature, receivedSignature);
}

/** Constant-time string comparison to avoid leaking timing information. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
