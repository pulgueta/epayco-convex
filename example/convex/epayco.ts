import { getAuthUserId } from "@convex-dev/auth/server";
import { EPayco } from "@pulgueta/epayco-convex";
import type { Auth } from "convex/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { components } from "./_generated/api";

/**
 * A single host-side ePayco client, shared by every action in this app.
 *
 * Credentials are read from the deployment environment (`EPAYCO_PUBLIC_KEY` /
 * `EPAYCO_PRIVATE_KEY`) by the component itself, so they never appear in the
 * function code. `testMode: true` keeps every call on the ePayco sandbox.
 */
export const epayco = new EPayco(components.epayco, { testMode: true });

/**
 * Resolve the signed-in user, or throw. The identity is always derived
 * server-side from the Convex Auth session — a client can never pass in a
 * `userId` to widen its access.
 */
export async function requireUser(ctx: { auth: Auth }): Promise<Id<"users">> {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new ConvexError({ message: "You must be signed in to do that." });
	}
	return userId;
}
