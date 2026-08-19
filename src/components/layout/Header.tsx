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
  const [mobileOpen, setMobileOpen] = useState(false);

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

      {/*
        Absolute, not fixed: the header belongs to the top of the page and
        scrolls away with it. It keeps no scroll state — the condense-on-scroll
        height, background and blur existed only to keep a pinned bar legible
        over the content passing beneath it, and there is no pinned bar now.
      */}
      <header className="absolute inset-x-0 top-0 z-[120] flex h-[72px] items-center gap-6 gutter-x">
        <Logo collapsed={false} />

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

        <div className="ml-auto flex flex-none items-center gap-5 lg:gap-[18px]">
          <Link
            href="/search"
            aria-label="Search products"
            className="p1-tap grid place-items-center p-1 hover:text-signal"
          >
            <SearchIcon />
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="p1-tap grid cursor-pointer place-items-center border-0 bg-transparent p-1 hover:text-signal"
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
            className="p1-tap grid cursor-pointer place-items-center border-0 bg-transparent p-1 hover:text-signal lg:hidden"
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
