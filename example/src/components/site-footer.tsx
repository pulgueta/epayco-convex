import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/icons";

export function SiteFooter() {
	return (
		<footer className="border-t border-border/70 bg-muted/30">
			<div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
				<div className="max-w-xs">
					<Wordmark />
					<p className="mt-3 text-sm text-pretty text-muted-foreground">
						A demo storefront for the{" "}
						<code className="rounded bg-secondary px-1 py-0.5 text-xs">
							@pulgueta/epayco-convex
						</code>{" "}
						component. Single-origin coffee, real ePayco sandbox payments.
					</p>
				</div>

				<nav className="flex flex-col gap-2 text-sm">
					<span className="font-medium">Explore</span>
					<Link
						to="/"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						Shop coffee
					</Link>
					<Link
						to="/split"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						Split payments
					</Link>
					<Link
						to="/plans"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						Coffee Club
					</Link>
					<Link
						to="/account"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						Account
					</Link>
				</nav>

				<div className="flex flex-col gap-2 text-sm">
					<span className="font-medium">Built with</span>
					<a
						href="https://convex.dev"
						target="_blank"
						rel="noreferrer"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						Convex
					</a>
					<a
						href="https://epayco.com"
						target="_blank"
						rel="noreferrer"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						ePayco
					</a>
					<a
						href="https://tanstack.com/router"
						target="_blank"
						rel="noreferrer"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						TanStack Router
					</a>
				</div>
			</div>
			<div className="border-t border-border/70">
				<div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<p>
						Demo only. No real orders are fulfilled. Payments run on the ePayco
						sandbox.
					</p>
					<p>Prices in Colombian pesos (COP).</p>
				</div>
			</div>
		</footer>
	);
}
