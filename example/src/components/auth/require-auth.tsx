import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Gate a route's content behind a Convex Auth session. Unauthenticated visitors
 * get a contextual sign-in panel in place; the cart and intent survive sign-in
 * because nothing navigates away.
 */
export function RequireAuth({
	title = "Sign in to continue",
	description = "Create a free demo account to try the ePayco-powered flows. No card needed to sign up.",
	children,
}: {
	title?: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<>
			<AuthLoading>
				<div className="mx-auto w-full max-w-md px-4 py-16">
					<Skeleton className="h-80 w-full rounded-xl" />
				</div>
			</AuthLoading>

			<Unauthenticated>
				<div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
					<Card className="p-2">
						<CardHeader className="items-center text-center">
							<span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
								<Lock className="size-5" />
							</span>
							<CardTitle className="font-display text-2xl font-semibold">
								{title}
							</CardTitle>
							<CardDescription className="text-pretty">
								{description}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<SignInForm />
						</CardContent>
					</Card>
				</div>
			</Unauthenticated>

			<Authenticated>{children}</Authenticated>
		</>
	);
}
