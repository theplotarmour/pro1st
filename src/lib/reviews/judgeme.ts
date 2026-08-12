import "server-only";

/**
 * Judge.me Storefront integration.
 *
 * Verified against the official OpenAPI document at https://judge.me/api/docs.yaml
 * (the /api/docs page is a Redoc shell; the spec itself is the yaml). Nothing
 * here is guessed — every path, parameter and response key below appears in
 * that document.
 *
 * What the spec actually says, and what it forces:
 *
 *   - GET /api/v1/reviews authenticates with `api_token` + `shop_domain` as
 *     QUERY parameters, using the PRIVATE token. That token therefore cannot
 *     go anywhere near the browser, which is why this module is `server-only`
 *     and why the components render on the server.
 *
 *   - GET /api/v1/reviews takes `product_id`, and the spec is explicit that
 *     this is "Judge.me internal ID of the Product" — NOT the Shopify product
 *     ID. The spec publishes no endpoint for translating a Shopify ID into a
 *     Judge.me one. Reviews themselves do carry `product_external_id`, so the
 *     store's reviews are fetched once and grouped by that field instead of
 *     inventing a lookup endpoint. See `fetchAllReviews` for the cost.
 *
 *   - Review `title` and `body` are documented as raw and unsanitised —
 *     "do not print it out as-is in frontend". They are rendered as text
 *     nodes, never as HTML.
 *
 *   - POST /api/v1/reviews is `security: []` — no authentication. It is still
 *     proxied through a server action so the submission is validated and the
 *     shop identifiers stay in one place.
 */

const API_BASE = "https://judge.me/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;
/** The spec caps per_page at 100. */
const MAX_PER_PAGE = 100;
/** Stop paging even if the store somehow reports more. */
const MAX_PAGES = 20;

export interface JudgemeReview {
  id: number;
  title: string | null;
  body: string | null;
  rating: number;
  /** Shopify product ID this review belongs to. */
  product_external_id: number | null;
  reviewer: { name?: string | null } | null;
  /** 'not-yet' | 'ok' | 'spam' */
  curated: string | null;
  hidden: boolean | null;
  created_at: string | null;
  verified: string | null;
}

export interface ProductReviewSummary {
  reviews: JudgemeReview[];
  count: number;
  /** Mean rating to one decimal, or null when there is nothing to average. */
  average: number | null;
  /** Reviews per star, index 0 = 1 star. */
  distribution: [number, number, number, number, number];
}

interface JudgemeConfig {
  token: string;
  shopDomain: string;
  platform: string;
}

/**
 * Returns null rather than throwing when unconfigured.
 *
 * The store may not have Judge.me installed yet, and a missing integration
 * must not take the product page down with it — the page renders without a
 * reviews section instead.
 */
function getConfig(): JudgemeConfig | null {
  const token = process.env.JUDGEME_PRIVATE_TOKEN;
  const shopDomain =
    process.env.JUDGEME_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN;

  if (!token || !shopDomain) return null;

  return {
    token,
    shopDomain,
    platform: process.env.JUDGEME_PLATFORM ?? "shopify",
  };
}

export function isJudgemeConfigured(): boolean {
  return getConfig() !== null;
}

export function getShopIdentity(): { shopDomain: string; platform: string } | null {
  const config = getConfig();
  if (!config) return null;
  return { shopDomain: config.shopDomain, platform: config.platform };
}

/* ------------------------------------------------------------------ *
 * In-process cache
 *
 * Same reasoning as the Shopify client: the whole catalogue's reviews are
 * one request, and every product page rendered in a build or an ISR pass
 * would otherwise repeat it.
 * ------------------------------------------------------------------ */

const CACHE_TTL_MS = 300_000;
let cache: { at: number; value: Promise<JudgemeReview[]> } | null = null;

async function requestPage(
  config: JudgemeConfig,
  page: number,
): Promise<{ reviews: JudgemeReview[] }> {
  const url = new URL(`${API_BASE}/reviews`);
  url.searchParams.set("api_token", config.token);
  url.searchParams.set("shop_domain", config.shopDomain);
  url.searchParams.set("per_page", String(MAX_PER_PAGE));
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    /*
      Cached, not `no-store`.

      `no-store` here opted the whole product route out of static rendering —
      Next treats an uncached fetch during render as dynamic server usage, so
      every product page silently stopped being prerendered and became a
      per-request render. Reviews are not worth that.

      300s matches the route's own revalidate, so the page and its reviews go
      stale together rather than one refreshing without the other.
    */
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(
      `Judge.me returned ${response.status} for GET /reviews page ${page}.`,
    );
  }

  return (await response.json()) as { reviews: JudgemeReview[] };
}

/**
 * Every published review in the store.
 *
 * The spec gives no way to ask for one Shopify product's reviews directly —
 * `product_id` means Judge.me's own ID and nothing documented converts one to
 * the other. So the store is read once and grouped locally.
 *
 * That is the right shape for a catalogue of this size and a store that is
 * only now collecting reviews. It is NOT the right shape at tens of thousands
 * of reviews: at that point the fix is to store each product's Judge.me
 * internal ID in a Shopify metafield when Judge.me webhooks fire, and query
 * `product_id` directly.
 */
async function fetchAllReviews(): Promise<JudgemeReview[]> {
  const config = getConfig();
  if (!config) return [];

  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.value;

  const load = (async () => {
    const collected: JudgemeReview[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const data = await requestPage(config, page);
      const batch = data.reviews ?? [];
      collected.push(...batch);
      if (batch.length < MAX_PER_PAGE) break;
    }

    return collected;
  })();

  cache = { at: now, value: load };
  // A failed read must not be cached, or one blip blanks reviews for 5 minutes.
  load.catch(() => {
    cache = null;
  });

  return load;
}

/** Published, visible, product-level reviews only. */
function isPublic(review: JudgemeReview): boolean {
  return review.curated !== "spam" && review.hidden !== true;
}

/**
 * Reviews for one Shopify product.
 *
 * Never throws. Judge.me being unreachable degrades the product page to no
 * reviews section, which is the correct failure for a storefront: the product
 * is still buyable.
 */
export async function getProductReviews(
  shopifyProductId: string | number,
): Promise<ProductReviewSummary> {
  const empty: ProductReviewSummary = {
    reviews: [],
    count: 0,
    average: null,
    distribution: [0, 0, 0, 0, 0],
  };

  if (!isJudgemeConfigured()) return empty;

  // Shopify IDs arrive as gid://shopify/Product/123; Judge.me stores the
  // numeric form.
  const numericId = Number(String(shopifyProductId).replace(/\D/g, ""));
  if (!Number.isFinite(numericId) || numericId === 0) return empty;

  let all: JudgemeReview[];
  try {
    all = await fetchAllReviews();
  } catch (error) {
    console.error("[pro1st] Judge.me unreachable; rendering without reviews.", error);
    return empty;
  }

  const reviews = all
    .filter(isPublic)
    .filter((review) => Number(review.product_external_id) === numericId)
    .sort((a, b) => {
      const at = a.created_at ? Date.parse(a.created_at) : 0;
      const bt = b.created_at ? Date.parse(b.created_at) : 0;
      return bt - at;
    });

  if (reviews.length === 0) return empty;

  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let total = 0;

  for (const review of reviews) {
    const rating = Math.round(review.rating);
    total += rating;
    if (rating >= 1 && rating <= 5) {
      distribution[rating - 1] = (distribution[rating - 1] ?? 0) + 1;
    }
  }

  return {
    reviews,
    count: reviews.length,
    average: Math.round((total / reviews.length) * 10) / 10,
    distribution,
  };
}

export interface CreateReviewInput {
  productExternalId: number;
  name: string;
  email: string;
  rating: number;
  title?: string;
  body: string;
}

/**
 * Submit a review.
 *
 * POST /api/v1/reviews is documented as `security: []` — no token. The
 * required body fields are `shop_domain`, `platform`, `name`, `email`,
 * `rating` and `body`; `id` is the product's Shopify ID and is optional,
 * because omitting it files the review against the shop rather than a
 * product.
 *
 * The spec also notes the review is created "in background" and that stores
 * which restrict web reviews will silently create nothing — so a 200 here
 * means accepted for processing, not published. The UI says exactly that.
 */
export async function createReview(
  input: CreateReviewInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = getConfig();
  if (!config) {
    return { ok: false, error: "Reviews are not configured for this store." };
  }

  try {
    const response = await fetch(`${API_BASE}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        shop_domain: config.shopDomain,
        platform: config.platform,
        id: input.productExternalId,
        name: input.name,
        email: input.email,
        rating: input.rating,
        title: input.title,
        body: input.body,
      }),
    });

    if (!response.ok) {
      /*
        Read the body. Judge.me returns 422 with a reason — the field it
        objected to, or that the product is unknown to it — and swallowing
        that leaves nothing to debug but a status code. Logged in full
        server-side; the reader gets the message only when it is short enough
        to be a real sentence rather than a dump.
      */
      const detail = await response.text().catch(() => "");
      console.error(
        `[pro1st] Judge.me POST /reviews ${response.status}: ${detail.slice(0, 500)}`,
      );

      let reason = "";
      try {
        const parsed = JSON.parse(detail) as {
          error?: string;
          message?: string;
          errors?: unknown;
        };
        reason =
          parsed.error ??
          parsed.message ??
          (typeof parsed.errors === "string" ? parsed.errors : "");
      } catch {
        reason = "";
      }

      return {
        ok: false,
        error: reason
          ? `Judge.me rejected the review: ${reason}`
          : `Judge.me rejected the review (${response.status}).`,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[pro1st] Judge.me review submission failed.", error);
    return { ok: false, error: "Could not reach the review service." };
  }
}
