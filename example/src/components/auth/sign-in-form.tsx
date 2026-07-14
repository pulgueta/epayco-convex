import { useAuthActions } from "@convex-dev/auth/react";
import { CircleAlert, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errorMessage } from "@/lib/errors";

type Flow = "signIn" | "signUp";

const DOCUMENT_TYPES = [
	{ value: "CC", label: "Cédula de ciudadanía" },
	{ value: "CE", label: "Cédula de extranjería" },
	{ value: "NIT", label: "Tax identification" },
	{ value: "PP", label: "Passport" },
	{ value: "TI", label: "Tarjeta de identidad" },
] as const;

function nationalPhone(value: string) {
	const digits = value.replace(/\D/g, "");
	return digits.startsWith("57") && digits.length === 12
		? digits.slice(2)
		: digits;
}

export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
	const { signIn } = useAuthActions();
	const [flow, setFlow] = useState<Flow>("signUp");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [phone, setPhone] = useState("");
	const [documentType, setDocumentType] = useState("CC");
	const [documentNumber, setDocumentNumber] = useState("");
	const [profileConsent, setProfileConsent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const signUpComplete =
		firstName.trim() &&
		lastName.trim() &&
		nationalPhone(phone).length === 10 &&
		documentNumber.trim() &&
		profileConsent;
	const canSubmit =
		!!email.trim() &&
		password.length >= 8 &&
		(flow === "signIn" || !!signUpComplete);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await signIn(
				"password",
				flow === "signIn"
					? { email, password, flow }
					: {
							email,
							password,
							flow,
							firstName,
							lastName,
							phone: `+57${nationalPhone(phone)}`,
							documentType,
							documentNumber,
						},
			);
			onSuccess?.();
		} catch (err) {
			setError(
				errorMessage(
					err,
					flow === "signIn"
						? "Wrong email or password."
						: "Could not create that account.",
				),
			);
			setLoading(false);
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="@container grid min-w-0 gap-5"
			noValidate
		>
			<Tabs
				className="min-w-0"
				value={flow}
				onValueChange={(value) => {
					setFlow(value as Flow);
					setError(null);
				}}
			>
				<TabsList className="grid h-10 w-full grid-cols-2">
					<TabsTrigger value="signUp">Create account</TabsTrigger>
					<TabsTrigger value="signIn">Sign in</TabsTrigger>
				</TabsList>

				<TabsContent value="signUp" className="mt-4 grid min-w-0 gap-4">
					<p className="text-sm text-muted-foreground">
						Your customer details will prefill the ePayco sandbox checkout.
					</p>

					<div className="grid gap-4 @md:grid-cols-2">
						<div className="grid min-w-0 gap-2">
							<Label htmlFor="firstName">First name</Label>
							<Input
								id="firstName"
								name="firstName"
								autoComplete="given-name"
								placeholder="Camila"
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								required
							/>
						</div>
						<div className="grid min-w-0 gap-2">
							<Label htmlFor="lastName">Last name</Label>
							<Input
								id="lastName"
								name="lastName"
								autoComplete="family-name"
								placeholder="Restrepo"
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								required
							/>
						</div>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="phone">Mobile number</Label>
						<div className="flex min-w-0 rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
							<span className="flex shrink-0 items-center border-r border-input px-3 text-sm text-muted-foreground">
								+57
							</span>
							<Input
								id="phone"
								name="phone"
								type="tel"
								inputMode="tel"
								autoComplete="tel-national"
								placeholder="300 123 4567"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								className="border-0 shadow-none focus-visible:ring-0"
								required
							/>
						</div>
					</div>

					<div className="grid gap-4 @lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
						<div className="grid min-w-0 gap-2">
							<Label htmlFor="authDocumentType">Document type</Label>
							<Select
								value={documentType}
								onValueChange={(value) => setDocumentType(value ?? "")}
							>
								<SelectTrigger id="authDocumentType" className="w-full min-w-0">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DOCUMENT_TYPES.map((document) => (
										<SelectItem key={document.value} value={document.value}>
											{document.value} - {document.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid min-w-0 gap-2">
							<Label htmlFor="authDocumentNumber">Document number</Label>
							<Input
								id="authDocumentNumber"
								name="documentNumber"
								inputMode="numeric"
								placeholder="1032456789"
								value={documentNumber}
								onChange={(event) => setDocumentNumber(event.target.value)}
								required
							/>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			<div className="grid gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="camila@example.com"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete={flow === "signIn" ? "current-password" : "new-password"}
					placeholder={
						flow === "signUp" ? "At least 8 characters" : "Your password"
					}
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					required
					minLength={8}
				/>
			</div>

			{flow === "signUp" ? (
				<div className="flex items-start gap-2.5">
					<Checkbox
						id="profileConsent"
						checked={profileConsent}
						onCheckedChange={(checked) => setProfileConsent(checked === true)}
						className="mt-0.5"
					/>
					<Label
						htmlFor="profileConsent"
						className="text-sm leading-5 font-normal"
					>
						Save these details to my demo profile so future checkouts can be
						filled automatically.
					</Label>
				</div>
			) : null}

			{error ? (
				<Alert variant="destructive" aria-live="polite">
					<CircleAlert />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			<Button
				type="submit"
				size="lg"
				className="h-10 w-full"
				disabled={loading || !canSubmit}
				aria-busy={loading}
			>
				{loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
				{loading
					? "Working..."
					: flow === "signIn"
						? "Sign in"
						: "Create account"}
			</Button>
		</form>
	);
}
