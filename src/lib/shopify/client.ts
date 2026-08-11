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
 */

const DEFAULT_API_VERSION = "2026-07";

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

let cached: ShopifyConfig | null = null;

function getConfig(): ShopifyConfig {
  if (cached) return cached;

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || DEFAULT_API_VERSION;

  if (!domain || !token) {
    throw new ShopifyError(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_PUBLIC_TOKEN — see .env.example.",
    );
  }

  cached = {
    endpoint: `https://${domain}/api/${version}/graphql.json`,
    token,
  };
  return cached;
}

/** True when the environment can actually reach Shopify. */
export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN &&
      process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
  );
}

interface RequestOptions {
  variables?: Record<string, unknown>;
  /** ISR window in seconds. Pass 0 for cart calls, which must never cache. */
  revalidate?: number;
  tags?: string[];
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; path?: string[] }[];
}

export async function storefront<T>(
  query: string,
  { variables, revalidate = 300, tags }: RequestOptions = {},
): Promise<T> {
  const { endpoint, token } = getConfig();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      ...(revalidate === 0
        ? { cache: "no-store" as const }
        : { next: { revalidate, ...(tags ? { tags } : {}) } }),
    });
  } catch (cause) {
    // Network failure — surfaced to the caller so a page can degrade rather
    // than render a half-built catalogue.
    throw new ShopifyError("Could not reach Shopify.", undefined, cause);
  }

  if (!response.ok) {
    throw new ShopifyError(
      `Shopify Storefront API returned ${response.status}.`,
      response.status,
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new ShopifyError(
      `Shopify Storefront API error: ${json.errors.map((e) => e.message).join("; ")}`,
      response.status,
      json.errors,
    );
  }

  if (!json.data) {
    throw new ShopifyError("Shopify returned no data.");
  }

  return json.data;
}
