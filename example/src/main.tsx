import "@fontsource-variable/geist";
import "@fontsource-variable/fraunces";
import "./styles.css";

import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { AppProviders } from "@/components/providers";
import { routeTree } from "./routeTree.gen";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
if (!convexUrl) {
	throw new Error(
		"Missing VITE_CONVEX_URL. Run `npx convex dev` and copy the deployment URL into example/.env.local.",
	);
}

const convex = new ConvexReactClient(convexUrl);

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
	ReactDOM.createRoot(rootElement).render(
		<StrictMode>
			<AppProviders client={convex}>
				<RouterProvider router={router} />
			</AppProviders>
		</StrictMode>,
	);
}
