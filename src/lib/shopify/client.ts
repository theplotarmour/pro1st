import "server-only";

/**
 * Shopify Storefront API client.
 *
 * The only place in the app that talks to Shopify over the wire. Every query
 * in `queries.ts` was validated against the live Storefront schema for the
 * pinned API version before being committed.
 *
 * The token used here is the PUBLIC Storefront access token: read-only, and
 * safe by design. No Admin API token belongs anywhere in this application.
 *
 * Two things this file has to get right, because GraphQL is POST-only:
 *
 *   1. Next's Data Cache does NOT cache POST requests. `next: { revalidate }`
 *      is silently inert here, so without the in-process cache below every
 *      call would be a fresh network round trip — during a static build that
 *      meant ~130 requests in a burst and Shopify throttling us into ETIMEDOUT.
 *   2. A storefront build must survive a slow or flaky store, so requests are
 *      bounded by a timeout and retried with backoff.
 */

const DEFAULT_API_VERSION = "2026-07";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

interface ShopifyConfig {
  endpoint: string;
  token: string;
}

let cachedConfig: ShopifyConfig | null = null;

function getConfig(): ShopifyConfig {
  if (cachedConfig) return cachedConfig;

  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    // Tolerate a pasted URL rather than a bare domain.
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const token = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN?.trim();
  const version = process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!domain || !token) {
    throw new ShopifyError(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_PUBLIC_TOKEN — see .env.example.",
    );
  }

  cachedConfig = {
    endpoint: `https://${domain}/api/${version}/graphql.json`,
    token,
  };
  return cachedConfig;
}

/** True when the environment can actually reach Shopify. */
export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN &&
      process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
  );
}

/* ------------------------------------------------------------------ *
 * In-process response cache
 *
 * Keyed on the operation and its variables. Holds the in-flight promise, so
 * concurrent identical queries share one request instead of racing. This is
 * what keeps a 40-page static build to a handful of network calls.
 * ------------------------------------------------------------------ */

interface CacheEntry {
  expires: number;
  value: Promise<unknown>;
}

const responseCache = new Map<string, CacheEntry>();

function pruneCache(now: number): void {
  if (responseCache.size < 256) return;
  for (const [key, entry] of responseCache) {
    if (entry.expires <= now) responseCache.delete(key);
  }
}

interface RequestOptions {
  variables?: Record<string, unknown>;
  /** Cache lifetime in seconds. Pass 0 for cart calls, which must never cache. */
  revalidate?: number;
  tags?: string[];
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; path?: string[] }[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Network and 5xx failures are worth retrying; a bad query never is. */
function isRetryable(error: unknown): boolean {
  if (error instanceof ShopifyError) {
    return error.status === undefined || error.status >= 500 || error.status === 429;
  }
  return true;
}

async function execute<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  revalidate: number,
  tags: string[] | undefined,
): Promise<T> {
  const { endpoint, token } = getConfig();

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ...(revalidate === 0
          ? { cache: "no-store" as const }
          : { next: { revalidate, ...(tags ? { tags } : {}) } }),
      });

      if (!response.ok) {
        throw new ShopifyError(
          `Shopify Storefront API returned ${response.status}.`,
          response.status,
        );
      }

      const json = (await response.json()) as GraphQLResponse<T>;

      if (json.errors?.length) {
        // A GraphQL error is our bug, not a blip — fail fast, don't retry.
        throw new ShopifyError(
          `Shopify Storefront API error: ${json.errors.map((e) => e.message).join("; ")}`,
          200,
          json.errors,
        );
      }

      if (!json.data) throw new ShopifyError("Shopify returned no data.");
      return json.data;
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_ATTEMPTS) break;
      // 300ms, 900ms — enough to clear a throttle without stalling a build.
      await sleep(300 * 3 ** (attempt - 1));
    }
  }

  if (lastError instanceof ShopifyError) throw lastError;
  throw new ShopifyError(
    "Could not reach Shopify.",
    undefined,
    lastError,
  );
}

export async function storefront<T>(
  query: string,
  { variables, revalidate = 300, tags }: RequestOptions = {},
): Promise<T> {
  if (revalidate === 0) {
    return execute<T>(query, variables, 0, tags);
  }

  const key = `${query}::${JSON.stringify(variables ?? {})}`;
  const now = Date.now();

  const hit = responseCache.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;

  const value = execute<T>(query, variables, revalidate, tags);
  responseCache.set(key, { expires: now + revalidate * 1000, value });
  pruneCache(now);

  // A failed request must not be cached, or one blip poisons the whole build.
  value.catch(() => responseCache.delete(key));

  return value;
}
