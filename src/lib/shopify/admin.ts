import "server-only";

/**
 * Shopify Admin GraphQL API — the ONLY file in this app allowed to hold
 * Admin credentials. Separate config and endpoint from `client.ts` (the
 * public Storefront client) on purpose: mixing the two tokens in one module
 * is how an Admin credential ends up leaking into a Storefront request path.
 *
 * Used exclusively by the Razorpay checkout flow (`src/lib/checkout/service.ts`)
 * to turn a verified payment into a real Shopify order via draft orders —
 * see that file for why draft orders, not `orderCreate`, are the mechanism.
 *
 * Auth: this app (created via the Shopify Dev Dashboard, not the legacy
 * "Develop apps" screen) has no static Admin API access token — that token
 * type doesn't exist for this app model. Instead it uses the Client
 * Credentials Grant: exchange SHOPIFY_ADMIN_CLIENT_ID +
 * SHOPIFY_ADMIN_CLIENT_SECRET for a real access token good for 24h
 * (https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant).
 * `getAccessToken` caches that token and refreshes it a minute before
 * expiry, so callers never see the exchange.
 */

const DEFAULT_API_VERSION = "2026-07";
const REQUEST_TIMEOUT_MS = 15_000;
// Refresh this long before Shopify's stated 24h expiry — cheap insurance
// against clock skew and a mid-request expiry.
const REFRESH_MARGIN_MS = 60_000;

export class ShopifyAdminError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ShopifyAdminError";
  }
}

interface AdminConfig {
  domain: string;
  endpoint: string;
  clientId: string;
  clientSecret: string;
}

let cachedConfig: AdminConfig | null = null;

function getConfig(): AdminConfig {
  if (cachedConfig) return cachedConfig;

  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const clientId = process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim();
  const version = process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!domain || !clientId || !clientSecret) {
    throw new ShopifyAdminError(
      "Shopify Admin API is not configured. Set SHOPIFY_ADMIN_CLIENT_ID and SHOPIFY_ADMIN_CLIENT_SECRET — see .env.example.",
    );
  }

  cachedConfig = {
    domain,
    endpoint: `https://${domain}/admin/api/${version}/graphql.json`,
    clientId,
    clientSecret,
  };
  return cachedConfig;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let inFlightExchange: Promise<string> | null = null;

interface AccessTokenResponse {
  access_token: string;
  scope: string;
  expires_in: number;
}

async function exchangeClientCredentials(config: AdminConfig): Promise<string> {
  const response = await fetch(`https://${config.domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new ShopifyAdminError(
      `Shopify OAuth token exchange returned ${response.status}.`,
      response.status,
    );
  }

  const json = (await response.json()) as AccessTokenResponse;
  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000 - REFRESH_MARGIN_MS,
  };
  return cachedToken.accessToken;
}

/** Returns a live Admin API access token, exchanging or refreshing as needed. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }
  // Concurrent callers during a cold cache share one exchange instead of
  // each firing their own token request.
  if (!inFlightExchange) {
    inFlightExchange = exchangeClientCredentials(getConfig()).finally(() => {
      inFlightExchange = null;
    });
  }
  return inFlightExchange;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; path?: string[] }[];
}

/**
 * No cache, no retry loop. A mutation that changes money is worth a slow,
 * single, honest attempt over a fast one that might duplicate on retry.
 */
async function adminRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { endpoint } = getConfig();
  const accessToken = await getAccessToken();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ShopifyAdminError(
      `Shopify Admin API returned ${response.status}.`,
      response.status,
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new ShopifyAdminError(
      `Shopify Admin API error: ${json.errors.map((e) => e.message).join("; ")}`,
      200,
      json.errors,
    );
  }
  if (!json.data) throw new ShopifyAdminError("Shopify Admin API returned no data.");
  return json.data;
}

function unwrapUserErrors(
  userErrors: { field?: string[] | null; message: string }[] | undefined,
  operation: string,
): void {
  if (userErrors && userErrors.length > 0) {
    throw new ShopifyAdminError(
      `${operation}: ${userErrors.map((e) => e.message).join("; ")}`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Draft orders
 * ------------------------------------------------------------------ */

export interface DraftOrderLineItem {
  variantId: string;
  quantity: number;
}

export interface DraftOrderAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface CreateDraftOrderInput {
  email: string;
  lineItems: DraftOrderLineItem[];
  shippingAddress: DraftOrderAddress;
  /** Free-text tag so the draft order is findable in Shopify admin, e.g. "razorpay". */
  tags?: string[];
  note?: string;
}

export interface DraftOrder {
  id: string;
  name: string;
  /** Decimal string, e.g. "1234.50" — the authoritative total, incl. tax/shipping Shopify computes. */
  totalPrice: string;
  currencyCode: string;
  status: "OPEN" | "COMPLETED" | "INVOICE_SENT";
  /** Set once the draft order has been completed into a real order. */
  order: { id: string; name: string } | null;
}

const DRAFT_ORDER_FRAGMENT = `
  id
  name
  totalPrice
  currencyCode
  status
  order { id name }
`;

const DRAFT_ORDER_CREATE_MUTATION = `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder { ${DRAFT_ORDER_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

export async function createDraftOrder(
  input: CreateDraftOrderInput,
): Promise<DraftOrder> {
  const data = await adminRequest<{
    draftOrderCreate: {
      draftOrder: DraftOrder | null;
      userErrors: { field?: string[]; message: string }[];
    };
  }>(DRAFT_ORDER_CREATE_MUTATION, {
    input: {
      email: input.email,
      lineItems: input.lineItems,
      shippingAddress: input.shippingAddress,
      tags: input.tags,
      note: input.note,
    },
  });

  unwrapUserErrors(data.draftOrderCreate.userErrors, "createDraftOrder");
  if (!data.draftOrderCreate.draftOrder) {
    throw new ShopifyAdminError("createDraftOrder: Shopify returned no draft order.");
  }
  return data.draftOrderCreate.draftOrder;
}

const DRAFT_ORDER_QUERY = `
  query DraftOrder($id: ID!) {
    draftOrder(id: $id) { ${DRAFT_ORDER_FRAGMENT} }
  }
`;

export async function getDraftOrder(id: string): Promise<DraftOrder | null> {
  const data = await adminRequest<{ draftOrder: DraftOrder | null }>(
    DRAFT_ORDER_QUERY,
    { id },
  );
  return data.draftOrder;
}

const DRAFT_ORDER_COMPLETE_MUTATION = `
  mutation DraftOrderComplete($id: ID!) {
    draftOrderComplete(id: $id) {
      draftOrder { ${DRAFT_ORDER_FRAGMENT} }
      userErrors { field message }
    }
  }
`;

/** Marks the draft order paid and creates the real Shopify order behind it. */
export async function completeDraftOrder(id: string): Promise<DraftOrder> {
  const data = await adminRequest<{
    draftOrderComplete: {
      draftOrder: DraftOrder | null;
      userErrors: { field?: string[]; message: string }[];
    };
  }>(DRAFT_ORDER_COMPLETE_MUTATION, { id });

  unwrapUserErrors(data.draftOrderComplete.userErrors, "completeDraftOrder");
  if (!data.draftOrderComplete.draftOrder) {
    throw new ShopifyAdminError("completeDraftOrder: Shopify returned no draft order.");
  }
  return data.draftOrderComplete.draftOrder;
}
