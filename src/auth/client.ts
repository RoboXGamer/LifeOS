import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/client";
import { anonymousClient, usernameClient } from "better-auth/client/plugins";

const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
if (!convexSiteUrl) {
  throw new Error("VITE_CONVEX_SITE_URL is not configured.");
}

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [
    convexClient(),
    crossDomainClient(),
    anonymousClient(),
    usernameClient(),
  ],
});
