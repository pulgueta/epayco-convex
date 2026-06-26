import { httpRouter } from "convex/server";
import { registerRoutes } from "@pulgueta/epayco-convex";
import { auth } from "./auth";
import { components } from "./_generated/api";

const http = httpRouter();

// Register Convex Auth HTTP routes
auth.addHttpRoutes(http);

// Register ePayco webhook and response routes
registerRoutes(http, components.epayco, {
	pathPrefix: "/epayco",
});

export default http;
