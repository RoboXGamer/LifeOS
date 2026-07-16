import { ConvexClient, ConvexHttpClient } from "convex/browser";
import type { ConvexClientOptions } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) throw new Error("VITE_CONVEX_URL is not configured.");

export const convex = new ConvexClient(convexUrl);
export const WORKSPACE_ID = "jh76dypnzxqdx5h79whr09xr0s8anw4e";

export function createConvexClient(
  address: string,
  options?: ConvexClientOptions,
): ConvexClient {
  return new ConvexClient(address, options);
}

export function createConvexHttpClient(
  address: string,
  options?: ConstructorParameters<typeof ConvexHttpClient>[1],
): ConvexHttpClient {
  return new ConvexHttpClient(address, options);
}
