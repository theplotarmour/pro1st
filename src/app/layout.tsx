import type { Metadata, Viewport } from "next";
import { Archivo, DM_Sans, IBM_Plex_Sans, Manrope, Sora } from "next/font/google";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AnchorScroll } from "@/components/motion/AnchorScroll";
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

/*
 * Sora, Archivo, Manrope, DM Sans and IBM Plex Sans, added to round out the
 * type system beyond the original three (Space Grotesk / Inter / JetBrains
 * Mono, still self-hosted in fonts.css). `next/font/google` downloads and
 * self-hosts these the same way — no runtime dependency on
 * fonts.gstatic.com, same reasoning fonts.css already documents — without
 * hand-subsetting five more variable fonts to match that manual pipeline.
 * Each becomes a CSS custom property (`--font-sora`, etc.), referenced from
 * globals.css so the mapping stays in one place with the original three.
 */
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});
const fontVariables = `${sora.variable} ${archivo.variable} ${manrope.variable} ${dmSans.variable} ${ibmPlexSans.variable}`;

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
    <html lang="en-IN" className={fontVariables}>
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
          A reload starts at the top.

          Browsers restore the previous scroll position on reload, which is
          right for an article and wrong here: reloading this site is what
          someone does to see a change, and landing halfway down hides the
          thing they reloaded for.

          Three details, each of which this got wrong before it got right.

          It runs during head parse. Restoration is part of loading the
          document, so an effect in a client component is already too late —
          the page would restore and then visibly jump.

          `auto` is handed back on `pagehide`, not on `load`. Doing it at
          `load` looks correct and is not: Chrome performs its restore after
          that event, so re-arming there simply let the restore happen a
          moment later. It landed at 396px on every page from every starting
          position — the same number each time because the document was still
          streaming and 396 was the entire scrollable height at that instant.
          Deferring to `pagehide` keeps restoration off for this document's
          whole life and hands it back before the entry is left, so a later
          back or forward to this page still restores normally.

          Restoration is switched off for every reload, hash or not. On a
          hash reload the browser's restore is not a second opinion worth
          having either — it fires against a document that is still
          streaming, lands at whatever the scrollable height happened to be,
          and then fights `AnchorScroll` for the rest of the load. Turning it
          off gives `AnchorScroll` a clean zero to work from. Where the page
          ends up is its decision either way: the top without a hash, the
          anchor with one.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];var r=e?e.type==="reload":performance.navigation&&performance.navigation.type===1;if(!r)return;history.scrollRestoration="manual";addEventListener("pagehide",function(){try{history.scrollRestoration="auto"}catch(_){}},{once:true})}catch(_){}})()`,
          }}
        />

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
        <AnchorScroll />
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
