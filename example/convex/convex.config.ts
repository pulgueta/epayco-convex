import { defineApp } from "convex/server";
import epayco from "@pulgueta/epayco-convex/convex.config.js";

const app = defineApp();
app.use(epayco);

export default app;
