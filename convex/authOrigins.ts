function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export const siteUrl = normalizeOrigin(env.SITE_URL ?? "http://localhost:5173");

const additionalOrigins = (
  env.TRUSTED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

export const trustedOrigins = [...new Set([siteUrl, ...additionalOrigins])];
import { env } from "./_generated/server";
