import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { AccountMenu } from "@/components/auth/account-menu";
import { CartSheet } from "@/components/cart-sheet";
import { Wordmark } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV = [
	{ to: "/", label: "Shop", exact: true },
	{ to: "/split", label: "Split Pay", exact: false },
	{ to: "/plans", label: "Coffee Club", exact: false },
] as const;

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
				<Link to="/" aria-label="Tostado home" className="shrink-0">
					<Wordmark />
				</Link>

				<nav className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							activeOptions={{ exact: item.exact }}
							className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:px-3"
							activeProps={{ className: "text-foreground font-medium" }}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="flex shrink-0 items-center gap-0.5">
					<ThemeToggle />
					<CartSheet />
					<Authenticated>
						<AccountMenu />
					</Authenticated>
					<Unauthenticated>
						<Button asChild size="sm" className="ml-1">
							<Link to="/account">Sign in</Link>
						</Button>
					</Unauthenticated>
				</div>
			</div>
		</header>
	);
}
