/**
 * Extract a human-readable message from a thrown value. The ePayco component
 * throws `ConvexError({ code, message })`, which Convex serializes onto
 * `err.data` — so we read that first, then fall back to a plain `message`.
 */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
	if (err && typeof err === "object") {
		const data = (err as { data?: unknown }).data;
		if (
			data &&
			typeof data === "object" &&
			"message" in data &&
			typeof (data as { message?: unknown }).message === "string"
		) {
			return (data as { message: string }).message;
		}
		if (
			"message" in err &&
			typeof (err as { message?: unknown }).message === "string"
		) {
			return (err as { message: string }).message;
		}
	}
	return fallback;
}
