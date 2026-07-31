import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { anonymous, username } from "better-auth/plugins";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { env } from "./_generated/server";
import authConfig from "./auth.config";
import { siteUrl, trustedOrigins } from "./authOrigins";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: env.CONVEX_SITE_URL!,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      anonymous(),
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameNormalization: (value) => value.trim().toLowerCase(),
        usernameValidator: (value) => /^[a-z0-9_]+$/.test(value),
      }),
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  });
