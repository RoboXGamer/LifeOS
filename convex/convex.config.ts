import betterAuth from "@convex-dev/better-auth/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    CONVEX_SITE_URL: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
    TRUSTED_ORIGINS: v.optional(v.string()),
  },
});

app.use(betterAuth);

export default app;
