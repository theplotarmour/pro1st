import "server-only";

import { storefront } from "./client";

/**
 * Shop policies come from Shopify, where the merchant writes them.
 *
 * Only policies that actually exist are exposed. The footer used to link
 * Warranty / Shipping / Returns / Terms straight at the enquiry form, which is
 * why every one of them opened the same page — none of that content existed.
 * Now a policy appears in the footer the moment it is written in Shopify
 * admin, and stays absent until then.
 */

export interface Policy {
  title: string;
  handle: string;
  body: string;
}

const POLICIES_QUERY = `
  query ShopPolicies {
    shop {
      privacyPolicy { title handle body }
      refundPolicy { title handle body }
      shippingPolicy { title handle body }
      termsOfService { title handle body }
      subscriptionPolicy { title handle body }
    }
  }
`;

type PolicyKey =
  | "privacyPolicy"
  | "refundPolicy"
  | "shippingPolicy"
  | "termsOfService"
  | "subscriptionPolicy";

export async function getPolicies(): Promise<Policy[]> {
  try {
    const data = await storefront<{
      shop: Record<PolicyKey, Policy | null>;
    }>(POLICIES_QUERY, { revalidate: 3600 });

    return Object.values(data.shop).filter(
      (policy): policy is Policy => Boolean(policy?.handle && policy.body),
    );
  } catch (error) {
    // A missing policy list must never take the footer or a build down.
    console.error("[pro1st] policies unavailable:", error);
    return [];
  }
}

export async function getPolicy(handle: string): Promise<Policy | null> {
  const policies = await getPolicies();
  return policies.find((policy) => policy.handle === handle) ?? null;
}
