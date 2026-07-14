import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Menu } from "lucide-react";
import { AccountMenu } from "@/components/auth/account-menu";
import { CartSheet } from "@/components/cart-sheet";
import { Wordmark } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
	{ to: "/", label: "Shop", exact: true },
	{ to: "/split", label: "Split Pay", exact: false },
	{ to: "/plans", label: "Coffee Club", exact: false },
] as const;

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
				<Link to="/" aria-label="Tostado home" className="shrink-0">
					<Wordmark />
				</Link>

				<nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							activeOptions={{ exact: item.exact }}
							className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
						<Button
							size="sm"
							className="ml-1 hidden md:inline-flex"
							render={<Link to="/account" />}
						>
							Sign in
						</Button>
					</Unauthenticated>
					<MobileNavigation />
				</div>
			</div>
		</header>
	);
}

function MobileNavigation() {
	return (
		<Sheet>
			<SheetTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						aria-label="Open navigation"
					/>
				}
			>
				<Menu />
			</SheetTrigger>
			<SheetContent className="w-[min(88vw,22rem)] gap-0" side="right">
				<SheetHeader className="border-b border-border px-5 py-5">
					<SheetTitle className="font-display text-xl">Tostado</SheetTitle>
					<SheetDescription>
						Explore every ePayco flow in the sandbox store.
					</SheetDescription>
				</SheetHeader>

				<nav className="grid gap-1 p-3" aria-label="Mobile navigation">
					{NAV.map((item) => (
						<SheetClose
							key={item.to}
							render={
								<Link
									to={item.to}
									activeOptions={{ exact: item.exact }}
									className="rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									activeProps={{
										className: "bg-muted text-foreground font-medium",
									}}
								/>
							}
						>
							{item.label}
						</SheetClose>
					))}
					<Authenticated>
						<SheetClose
							render={
								<Link
									to="/account"
									className="rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									activeProps={{
										className: "bg-muted text-foreground font-medium",
									}}
								/>
							}
						>
							Account
						</SheetClose>
					</Authenticated>
				</nav>

				<Unauthenticated>
					<div className="mt-auto border-t border-border p-4">
						<SheetClose
							render={
								<Button
									size="lg"
									className="h-10 w-full"
									render={<Link to="/account" />}
								/>
							}
						>
							Create account or sign in
						</SheetClose>
					</div>
				</Unauthenticated>
			</SheetContent>
		</Sheet>
	);
}
