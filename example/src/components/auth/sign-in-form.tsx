import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";

type Flow = "signIn" | "signUp";

export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
	const { signIn } = useAuthActions();
	const [flow, setFlow] = useState<Flow>("signUp");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await signIn("password", { email, password, flow });
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
		<form onSubmit={handleSubmit} className="grid gap-4" noValidate>
			<div className="grid gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
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
					placeholder={flow === "signUp" ? "At least 8 characters" : "••••••••"}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					minLength={8}
				/>
			</div>

			{error ? (
				<p
					role="alert"
					className="text-sm text-destructive"
					aria-live="polite"
				>
					{error}
				</p>
			) : null}

			<Button
				type="submit"
				size="lg"
				className="mt-1 w-full"
				disabled={loading || !email || password.length < 8}
				aria-busy={loading}
			>
				{loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
				{loading
					? "Working…"
					: flow === "signIn"
						? "Sign in"
						: "Create account"}
			</Button>

			<p className="text-center text-sm text-muted-foreground">
				{flow === "signIn"
					? "New to Tostado? "
					: "Already have an account? "}
				<button
					type="button"
					className="font-medium text-foreground underline-offset-4 hover:underline"
					onClick={() => {
						setFlow(flow === "signIn" ? "signUp" : "signIn");
						setError(null);
					}}
				>
					{flow === "signIn" ? "Create one" : "Sign in"}
				</button>
			</p>
		</form>
	);
}
