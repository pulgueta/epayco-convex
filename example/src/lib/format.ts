/** Colombian peso formatting + payment-status presentation helpers. */

const COP = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	maximumFractionDigits: 0,
});

/** Format an integer COP amount, e.g. 48000 → "$48.000". */
export function formatCOP(value: number): string {
	return COP.format(value);
}

export type StatusTone = "success" | "pending" | "danger" | "neutral";

export type StatusMeta = {
	label: string;
	tone: StatusTone;
	description: string;
};

const STATUS_META: Record<string, StatusMeta> = {
	approved: {
		label: "Approved",
		tone: "success",
		description: "Payment captured successfully.",
	},
	pending: {
		label: "Pending",
		tone: "pending",
		description: "Waiting for the customer or bank to confirm.",
	},
	rejected: {
		label: "Rejected",
		tone: "danger",
		description: "The issuer declined this payment.",
	},
	failed: {
		label: "Failed",
		tone: "danger",
		description: "The payment could not be processed.",
	},
	expired: {
		label: "Expired",
		tone: "neutral",
		description: "The payment window closed before completion.",
	},
	reversed: {
		label: "Reversed",
		tone: "neutral",
		description: "The charge was reversed or refunded.",
	},
};

export function statusMeta(status: string | undefined | null): StatusMeta {
	return (
		STATUS_META[(status ?? "").toLowerCase()] ?? {
			label: status ? status : "Unknown",
			tone: "neutral",
			description: "Status not yet reported.",
		}
	);
}

/** Title-case an ePayco payment method key for display. */
export function paymentMethodLabel(method: string | undefined | null): string {
	switch (method) {
		case "credit_card":
			return "Credit card";
		case "pse":
			return "PSE";
		case "cash":
			return "Cash";
		case "daviplata":
			return "Daviplata";
		case "safetypay":
			return "SafetyPay";
		default:
			return method ?? "—";
	}
}
