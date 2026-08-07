import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { anonymous, username } from "better-auth/plugins";

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { env } from "./_generated/server";
import authConfig from "./auth.config";
import { siteUrl, trustedOrigins } from "./authOrigins";
import { isValidUsername } from "./lib/validation";

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
      anonymous({
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          if (!("runMutation" in ctx)) {
            throw new Error("Account linking requires an action context.");
          }
          await ctx.runMutation(internal.profiles.linkAnonymousAccount, {
            anonymousAuthUserId: anonymousUser.user.id,
            permanentAuthUserId: newUser.user.id,
            username:
              typeof newUser.user.username === "string"
                ? newUser.user.username
                : null,
            email: newUser.user.email ?? null,
          });
        },
      }),
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameNormalization: (value) => value.trim().toLowerCase(),
        usernameValidator: isValidUsername,
      }),
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  });
