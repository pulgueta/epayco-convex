import { ConvexAuthProvider } from "@convex-dev/auth/react";
import type { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart";

/**
 * Every app-wide provider in one place. Order matters: Convex Auth is outermost
 * (queries/actions need a session), then theme, then the client-only cart, then
 * tooltip + toast surfaces.
 */
export function AppProviders({
	client,
	children,
}: {
	client: ConvexReactClient;
	children: ReactNode;
}) {
	return (
		<ConvexAuthProvider client={client}>
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				enableSystem
				disableTransitionOnChange
			>
				<CartProvider>
					<TooltipProvider delayDuration={150}>
						{children}
						<Toaster position="top-center" closeButton richColors />
					</TooltipProvider>
				</CartProvider>
			</ThemeProvider>
		</ConvexAuthProvider>
	);
}
