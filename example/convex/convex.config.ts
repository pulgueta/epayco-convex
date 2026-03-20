import { defineApp } from "convex/server";
import epaycoConvex from "epayco-convex/convex.config.js";

const app = defineApp();
app.use(epaycoConvex);

export default app;
