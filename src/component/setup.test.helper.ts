/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "./schema.js";

const modules = import.meta.glob("./**/*.ts");

export function initConvexTest() {
  const t = convexTest(schema, modules);
  return t;
}
