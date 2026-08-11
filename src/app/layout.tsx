import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { CursorRing } from "@/components/layout/CursorRing";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Preloader } from "@/components/layout/Preloader";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { site } from "@/data/site";
import { CartProvider } from "@/lib/cart/CartProvider";
import { productRepository } from "@/lib/products";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--f-d",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--f-b",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--f-m",
  display: "swap",
});

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
    <html
      lang="en-IN"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <CartProvider>
          <Preloader />
          <CursorRing />
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
