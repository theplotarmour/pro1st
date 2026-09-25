import "server-only";

/**
 * Shopify Admin GraphQL API — the ONLY file in this app allowed to hold an
 * Admin token. Separate config and endpoint from `client.ts` (the public
 * Storefront client) on purpose: mixing the two tokens in one module is how
 * an Admin token ends up leaking into a Storefront request path.
 *
 * Used exclusively by the Razorpay checkout flow (`src/lib/checkout/service.ts`)
 * to turn a verified payment into a real Shopify order via draft orders —
 * see that file for why draft orders, not `orderCreate`, are the mechanism.
 */

const DEFAULT_API_VERSION = "2026-07";
const REQUEST_TIMEOUT_MS = 15_000;

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
  endpoint: string;
  token: string;
}

let cachedConfig: AdminConfig | null = null;

function getConfig(): AdminConfig {
  if (cachedConfig) return cachedConfig;

  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const version = process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!domain || !token) {
    throw new ShopifyAdminError(
      "Shopify Admin API is not configured. Set SHOPIFY_ADMIN_ACCESS_TOKEN — see .env.example.",
    );
  }

  cachedConfig = {
    endpoint: `https://${domain}/admin/api/${version}/graphql.json`,
    token,
  };
  return cachedConfig;
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
  const { endpoint, token } = getConfig();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
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
