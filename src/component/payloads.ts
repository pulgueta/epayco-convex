/**
 * Pure helpers for shaping ePayco request payloads. V8-safe (no SDK / Node
 * imports) so they can be unit-tested and shared across action files.
 */

export type SplitInput = {
  splitType?: string;
  splitAppId?: string;
  splitMerchantId?: string;
  splitPrimaryReceiver?: string;
  splitPrimaryReceiverFee?: string;
  splitRule?: string;
  splitReceivers?: Array<{
    id: string;
    total: string;
    iva: string;
    base_iva: string;
    fee?: string;
  }>;
};

/**
 * Build the `split_*` wire fields for a dispersion. `stringifyReceivers`
 * controls whether `split_receivers` is sent as a JSON string (PSE / cash) or
 * a raw array (credit-card charge), matching the official SDK examples.
 */
export function buildSplitPayload(
  split: SplitInput | undefined,
  stringifyReceivers: boolean,
): Record<string, unknown> {
  if (!split) return {};
  const out: Record<string, unknown> = { splitpayment: "true" };
  if (split.splitType) out.split_type = split.splitType;
  if (split.splitAppId) out.split_app_id = split.splitAppId;
  if (split.splitMerchantId) out.split_merchant_id = split.splitMerchantId;
  if (split.splitPrimaryReceiver)
    out.split_primary_receiver = split.splitPrimaryReceiver;
  if (split.splitPrimaryReceiverFee)
    out.split_primary_receiver_fee = split.splitPrimaryReceiverFee;
  if (split.splitRule) out.split_rule = split.splitRule;
  if (split.splitReceivers && split.splitReceivers.length > 0) {
    out.split_receivers = stringifyReceivers
      ? JSON.stringify(split.splitReceivers)
      : split.splitReceivers;
  }
  return out;
}

/** Convert split receivers (string fields) into the numeric form we persist. */
export function storedReceivers(
  split: SplitInput | undefined,
): Array<{
  id: string;
  total: number;
  iva: number;
  base_iva: number;
  fee?: number;
}> | undefined {
  if (!split?.splitReceivers) return undefined;
  return split.splitReceivers.map((r) => ({
    id: r.id,
    total: Number(r.total),
    iva: Number(r.iva),
    base_iva: Number(r.base_iva),
    ...(r.fee !== undefined ? { fee: Number(r.fee) } : {}),
  }));
}
