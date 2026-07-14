import { Outlet, createRootRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
	return (
		<div className="flex min-h-dvh flex-col">
			<SiteHeader />
			<main className="w-full max-w-full flex-1 overflow-x-hidden">
				<Outlet />
			</main>
			<SiteFooter />
		</div>
	);
}
