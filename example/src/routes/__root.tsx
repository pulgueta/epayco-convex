import { Outlet, createRootRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
	return (
		<div className="flex min-h-dvh flex-col">
			<SiteHeader />
			<main className="flex-1">
				<Outlet />
			</main>
			<SiteFooter />
		</div>
	);
}
