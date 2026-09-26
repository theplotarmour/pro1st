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
  /**
   * This app replaced Shopify's own Liquid storefront at the same domain.
   * Google already has `/collections/:handle` and `/pages/about-us` indexed
   * from that storefront — this app doesn't have those routes (categories
   * are `/products?category=`, About Us is `/origin`), so without a
   * redirect those URLs 404 and the indexed equity is lost outright. 301s
   * preserve it onto the equivalent route here.
   */
  async redirects() {
    return [
      {
        source: "/collections/:handle",
        destination: "/products?category=:handle",
        permanent: true,
      },
      {
        source: "/pages/about-us",
        destination: "/origin",
        permanent: true,
      },
      {
        source: "/pages/contact",
        destination: "/contact",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
