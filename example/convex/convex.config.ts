import { defineApp } from "convex/server";
import epaycoConvex from "@pulgueta/epayco-convex/convex.config.js";

const app = defineApp();
app.use(epaycoConvex);

export default app;
