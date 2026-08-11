import type { NextConfig } from "next";

/**
 * Product imagery currently comes from the approved design-source hosts.
 * When Shopify is connected, add `cdn.shopify.com` (already listed) and drop
 * the demo host below.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pro1st-demo.netlify.app" },
      { protocol: "https", hostname: "pro1st.in" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

export default nextConfig;
