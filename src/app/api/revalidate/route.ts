import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { clearResponseCache } from "@/lib/shopify/client";

/**
 * Shopify webhook receiver: re-render the site when the catalogue changes.
 *
 * Why this exists rather than relying on `revalidate = 300` alone:
 *
 *   - Time-based revalidation is stale-while-revalidate. The first request
 *     after the window still serves the OLD page and only then rebuilds in
 *     the background, so a merchant who changes an image, reloads, and sees
 *     the old one concludes nothing works.
 *   - `revalidateTag` cannot be used here at all. The Storefront API is
 *     GraphQL over POST, and Next does not cache POST requests, so the
 *     `tags` passed in `client.ts` are inert. Path revalidation is the only
 *     lever that works.
 *   - The in-process response cache in `client.ts` must be cleared too, or a
 *     warm instance re-renders from stale data and emits identical HTML.
 *
 * Set up in Shopify admin under Settings → Notifications → Webhooks. Point
 * `products/create`, `products/update`, `products/delete` and
 * `collections/update` at POST /api/revalidate, then copy the signing secret
 * Shopify shows into SHOPIFY_WEBHOOK_SECRET.
 *
 * The endpoint is public, so every request is HMAC-verified against that
 * secret. It is rejected outright when the secret is not configured — an
 * unauthenticated endpoint that forces re-renders on demand is a free way to
 * hammer both this app and the Shopify API.
 */

export const runtime = "nodejs";
/** Webhooks must never be served from a cache. */
export const dynamic = "force-dynamic";

/** Paths that render catalogue data. `layout` also covers the header's nav. */
const CATALOGUE_PATHS = ["/", "/products", "/wholesale", "/origin", "/search"];

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[pro1st] /api/revalidate: SHOPIFY_WEBHOOK_SECRET not set.");
    return Response.json({ ok: false }, { status: 503 });
  }

  const signature = request.headers.get("x-shopify-hmac-sha256");
  if (!signature) return Response.json({ ok: false }, { status: 401 });

  // The raw body is what Shopify signed — parse only after verifying.
  const body = await request.text();
  const digest = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return Response.json({ ok: false }, { status: 401 });
  }

  clearResponseCache();
  for (const path of CATALOGUE_PATHS) revalidatePath(path);
  // Product and policy detail pages are dynamic segments; revalidating the
  // layout covers every route beneath it, including the header's categories.
  revalidatePath("/", "layout");

  const topic = request.headers.get("x-shopify-topic") ?? "unknown";
  console.log(`[pro1st] revalidated after ${topic}`);

  return Response.json({ ok: true, topic });
}
