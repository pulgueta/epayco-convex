import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

function value(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

const TostadoPassword = Password<DataModel>({
	profile(params) {
		const email = value(params.email)?.toLowerCase();
		if (!email) throw new Error("Enter a valid email address.");

		const firstName = value(params.firstName);
		const lastName = value(params.lastName);
		const phone = value(params.phone);
		const documentType = value(params.documentType);
		const documentNumber = value(params.documentNumber);

		if (params.flow === "signUp") {
			if (
				!firstName ||
				!lastName ||
				!phone ||
				!documentType ||
				!documentNumber
			) {
				throw new Error("Complete your customer details.");
			}
			if (!/^\+57\d{10}$/.test(phone)) {
				throw new Error("Enter a valid Colombian mobile number.");
			}
			if (!["CC", "CE", "NIT", "PP", "TI"].includes(documentType)) {
				throw new Error("Choose a valid document type.");
			}
		}

		return {
			email,
			...(firstName ? { firstName } : {}),
			...(lastName ? { lastName } : {}),
			...(firstName && lastName ? { name: `${firstName} ${lastName}` } : {}),
			...(phone ? { phone } : {}),
			...(documentType ? { documentType } : {}),
			...(documentNumber ? { documentNumber } : {}),
		};
	},
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [TostadoPassword],
});
