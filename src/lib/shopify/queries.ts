/**
 * Storefront API operations.
 *
 * Every operation below was validated against the live Shopify Storefront
 * GraphQL schema for API version 2026-07 before being committed. Do not edit
 * field names by hand — re-validate first.
 *
 * Note: CartCost.totalTaxAmount is deprecated in 2026-07 (tax is no longer
 * returned by the cart) and is deliberately not queried. Tax is calculated
 * and shown by Shopify at checkout.
 *
 * `quantityAvailable` is also deliberately NOT queried. It requires the
 * `unauthenticated_read_product_inventory` scope, which the public Storefront
 * token does not carry by default. `availableForSale` is what actually gates
 * a purchase, and it needs no extra scope — so the storefront runs on the
 * minimum privilege that does the job. Grant the inventory scope in the
 * Headless channel only if exact stock counts are wanted on the site.
 */

const MONEY = `amount currencyCode`;

const IMAGE = `url altText width height`;

/** Fields needed to render a ProductCard. Kept lean — cards are listed by the dozen. */
export const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    handle
    title
    productType
    vendor
    tags
    availableForSale
    featuredImage { ${IMAGE} }
    priceRange { minVariantPrice { ${MONEY} } }
    compareAtPriceRange { minVariantPrice { ${MONEY} } }
    collections(first: 5) { nodes { handle title } }
    variants(first: 1) {
      nodes {
        id
        sku
        availableForSale
        price { ${MONEY} }
        compareAtPrice { ${MONEY} }
      }
    }
    metafields(identifiers: [{namespace: "custom", key: "featured"}]) {
      namespace
      key
      value
    }
  }
`;

/** Full detail for a product page, including variants and spec metafields. */
export const PRODUCT_DETAIL_FRAGMENT = `
  fragment ProductDetail on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    vendor
    tags
    availableForSale
    seo { title description }
    featuredImage { ${IMAGE} }
    images(first: 20) { nodes { ${IMAGE} } }
    options { name optionValues { name } }
    priceRange { minVariantPrice { ${MONEY} } }
    compareAtPriceRange { minVariantPrice { ${MONEY} } }
    collections(first: 10) { nodes { handle title } }
    variants(first: 50) {
      nodes {
        id
        title
        sku
        availableForSale
        selectedOptions { name value }
        price { ${MONEY} }
        compareAtPrice { ${MONEY} }
        image { ${IMAGE} }
      }
    }
    metafields(identifiers: [
      {namespace: "custom", key: "featured"},
      {namespace: "custom", key: "specifications"},
      {namespace: "custom", key: "features"},
      {namespace: "custom", key: "applications"},
      {namespace: "custom", key: "documents"},
      {namespace: "custom", key: "spec_line"}
    ]) {
      namespace
      key
      value
      type
    }
  }
`;

export const PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query Products($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey) {
      nodes { ...ProductCard }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_DETAIL_FRAGMENT}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ...ProductDetail }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
        description
        image { ${IMAGE} }
        products(first: 250) { nodes { id } }
      }
    }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionProducts($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      handle
      title
      description
      image { ${IMAGE} }
      products(first: $first, after: $after) {
        nodes { ...ProductCard }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

/* ------------------------------------------------------------------ *
 * Cart — Shopify owns the cart, the checkout, the payment and the order.
 * ------------------------------------------------------------------ */

export const CART_FRAGMENT = `
  fragment CartData on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { ${MONEY} }
      totalAmount { ${MONEY} }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { ${MONEY} } }
        merchandise {
          ... on ProductVariant {
            id
            title
            sku
            availableForSale
            price { ${MONEY} }
            image { ${IMAGE} }
            selectedOptions { name value }
            product {
              id
              handle
              title
              productType
              collections(first: 1) { nodes { title handle } }
            }
          }
        }
      }
    }
  }
`;

export const CART_QUERY = `
  ${CART_FRAGMENT}
  query Cart($id: ID!) { cart(id: $id) { ...CartData } }
`;

export const CART_CREATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartData }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartData }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartData }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartData }
      userErrors { field message }
    }
  }
`;
