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
import { SearchPanel } from "./SearchPanel";
import { CartIcon, MenuIcon, SearchIcon } from "./icons";

export function Header({ categories }: { categories: CategorySummary[] }) {
  const pathname = usePathname();
  const { count, open: openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Route changes close every transient surface.
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
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
        Only the pill nav below is meant to persist while scrolling — it
        already carries its own self-contained glass treatment (see
        `PillBase`), so it is rendered as an independent `fixed` element, not
        nested in this bar.

        This bar (logo, search, cart, dealer link, menu) stays fixed on
        mobile, where the menu button is the only way to reach the nav and
        must stay reachable at any scroll position — so it keeps its glass
        scrim there. From `lg` up the pill nav covers primary navigation, so
        this bar switches to `absolute`: it sits at the top of the document
        over the dark hero and scrolls away with it, and the glass scrim
        drops with it since it would otherwise have nothing to stay legible
        against.
      */}
      <header className="fixed inset-x-0 top-0 z-[110] flex h-[72px] items-center gap-6 gutter-x bg-ink/55 backdrop-blur-md lg:absolute lg:bg-transparent lg:backdrop-blur-none">
        <Logo collapsed={false} />

        <div className="ml-auto flex flex-none items-center gap-5 lg:gap-[18px]">
          {/*
            A button, not a link to /search. The answer to "do you stock an
            AJ6" is a few hundred bytes and the catalogue is already cached
            server-side, so it opens in place rather than costing a
            navigation, a page render and a back press. /search is still
            there behind the submit, and still renders without JavaScript.
          */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search products"
            aria-expanded={searchOpen}
            className="p1-tap grid cursor-pointer place-items-center border-0 bg-transparent p-1 hover:text-signal"
          >
            <SearchIcon />
          </button>

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

      {/*
        The glass pill — the one thing that stays pinned at every scroll
        position. Independently `fixed`, not nested in `<header>`, so its own
        position is never affected by the bar's `lg:absolute` switch above.
        Desktop-only (`lg:flex`): below that width the header's menu button
        opens the full nav instead.

        Centred on the viewport, not on the space left between the logo and
        the actions — those two flank it at different widths, so `mx-auto`
        in a flex row would put it visibly off-centre.

        It carries its own `nav` landmark and label, so nothing here wraps it
        in another. It navigates and nothing more — no category panel opens
        from it, so hovering the bar never covers the page. "Shop All" goes
        to the gallery, where categories are browsable with filters.
      */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] hidden h-[72px] items-center justify-center lg:flex">
        <div className="pointer-events-auto">
          <PillBase items={nav} activeHref={activeHref} />
        </div>
      </div>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
      />
    </>
  );
}
