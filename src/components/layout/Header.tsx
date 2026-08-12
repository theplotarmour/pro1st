"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar";
import { primaryNav } from "@/data/site";
import { useCart } from "@/lib/cart/CartProvider";
import type { CategorySummary } from "@/types/product";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { CartIcon, MenuIcon, SearchIcon } from "./icons";

export function Header({ categories }: { categories: CategorySummary[] }) {
  const pathname = usePathname();
  const { count, open: openCart } = useCart();
  const [condensed, setCondensed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route changes close every transient surface.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // A nav item tied to a collection only appears when that collection exists
  // in Shopify. Create a "packages" collection and System Packages appears.
  const available = new Set(categories.map((category) => category.slug));
  const nav = primaryNav.filter(
    (item) => !item.requiresCollection || available.has(item.requiresCollection),
  );

  // The pill shows exactly one label while collapsed, so "active" has to
  // resolve to a single item rather than a predicate several items can pass.
  // Longest matching prefix wins; "/" only ever matches the home route.
  const activeHref =
    nav
      .filter((item) => {
        const path = item.href.split(/[?#]/)[0] ?? item.href;
        return path === "/" ? pathname === "/" : pathname.startsWith(path);
      })
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ??
    nav[0]?.href ??
    "/";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-signal focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>

      <header
        className="fixed inset-x-0 top-0 z-[120] flex items-center gap-6 gutter-x border-b transition-[height,background-color,border-color,backdrop-filter] duration-[420ms] ease-signal"
        style={{
          height: condensed ? 56 : 72,
          backgroundColor: condensed ? "var(--header-bg)" : "transparent",
          backdropFilter: condensed ? "blur(16px)" : "none",
          borderBottomColor: condensed ? "var(--hairline)" : "transparent",
        }}
      >
        <Logo collapsed={condensed} />

        {/*
          Centred on the viewport, not on the space left between the logo and
          the actions — those two flank it at different widths, so `mx-auto`
          in the flex row put it visibly off-centre. Absolute positioning also
          keeps the pill from shifting sideways when the cart badge appears.

          It carries its own `nav` landmark and label, so the header must not
          wrap it in another. It navigates and nothing more — no category panel
          opens from it, so hovering the bar never covers the page. "Shop All"
          goes to the gallery, where categories are browsable with filters.
        */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 hidden items-center justify-center lg:flex">
          <div className="pointer-events-auto">
            <PillBase items={nav} activeHref={activeHref} />
          </div>
        </div>

        <div className="ml-auto flex flex-none items-center gap-4 lg:gap-[18px]">
          <Link
            href="/search"
            aria-label="Search products"
            className="grid place-items-center p-1 hover:text-signal"
          >
            <SearchIcon />
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="relative grid cursor-pointer place-items-center border-0 bg-transparent p-1 hover:text-signal"
          >
            <CartIcon />
            {count > 0 ? (
              <span className="absolute -right-1.5 -top-[3px] grid h-[15px] min-w-[15px] place-items-center bg-signal px-[3px] font-mono text-[9px] font-medium text-ink">
                {count}
              </span>
            ) : null}
          </button>

          <Link
            href="/contact?enquiry=dealer"
            className="p1-mono hidden whitespace-nowrap border border-hairline px-4 py-[9px] text-ash transition-[border-color,color] duration-[120ms] ease-signal hover:border-signal hover:text-signal xl:inline-block"
          >
            Dealer enquiry
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="grid cursor-pointer place-items-center border-0 bg-transparent p-1 hover:text-signal lg:hidden"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
      />
    </>
  );
}
