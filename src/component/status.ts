/**
 * Normalization of ePayco transaction states into the component's canonical
 * status vocabulary: pending | approved | rejected | failed | expired | reversed.
 *
 * Pure functions, safe in any runtime.
 */
export type TransactionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "failed"
  | "expired"
  | "reversed";

/** Map ePayco's `x_cod_response` (webhook) numeric code to a canonical status. */
export function statusFromCodResponse(cod: string | number): TransactionStatus {
  switch (String(cod)) {
    case "1":
      return "approved";
    case "2":
    case "11":
    case "12":
      return "rejected";
    case "3":
    case "7":
      return "pending";
    case "4":
      return "failed";
    case "6":
      return "reversed";
    case "9":
    case "10":
      return "expired";
    default:
      return "pending";
  }
}

/** Map ePayco's textual `estado` / `x_response` to a canonical status. */
export function statusFromEstado(
  estado: string | undefined | null,
): TransactionStatus {
  switch ((estado ?? "").toLowerCase().trim()) {
    case "aceptada":
    case "approved":
      return "approved";
    case "rechazada":
    case "rejected":
      return "rejected";
    case "pendiente":
    case "pending":
      return "pending";
    case "fallida":
    case "abandonada":
    case "failed":
      return "failed";
    case "cancelada":
      return "rejected";
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
