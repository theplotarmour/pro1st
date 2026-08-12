import type { Metadata, Viewport } from "next";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { site } from "@/data/site";
import { CartProvider } from "@/lib/cart/CartProvider";
import { productRepository } from "@/lib/products";
import "./globals.css";

/**
 * Latin subsets are preloaded because every page uses all three families
 * above the fold. latin-ext and greek stay lazy — their unicode-range means
 * the browser fetches them only when a ₹ or Ω is actually rendered.
 */
const preloadedFonts = [
  "/fonts/space-grotesk-latin.woff2",
  "/fonts/inter-latin.woff2",
  "/fonts/jetbrains-mono-latin.woff2",
];

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.positioning}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    title: `${site.name} — ${site.positioning}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.positioning}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0F",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched once for the header and mobile nav; every page shares it.
  const categories = await productRepository.getCategories();

  return (
    <html lang="en-IN">
      <head>
        {preloadedFonts.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        {/*
          Progressive enhancement. Reveal animations start hidden and are
          shown by JS; without JS the page would render blank. This restores
          every animated element to its final state.
        */}
        <noscript>
          <style>{`
            [data-p1-rise] { opacity: 1 !important; transform: none !important; }
            [data-p1-word], [data-p1-hero-word] { transform: none !important; }
          `}</style>
        </noscript>
      </head>
      <body>
        <SmoothScroll />
        <CartProvider>
          <Header categories={categories} />
          <main id="main">{children}</main>
          <Footer />
          <WhatsAppFab />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
