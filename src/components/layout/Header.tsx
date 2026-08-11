"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { primaryNav } from "@/data/site";
import { useCart } from "@/lib/cart/CartProvider";
import type { CategorySummary } from "@/types/product";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { CartIcon, MenuIcon, SearchIcon } from "./icons";

export function Header({ categories }: { categories: CategorySummary[] }) {
  const pathname = usePathname();
  const { count, open: openCart } = useCart();
  const [condensed, setCondensed] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route changes close every transient surface.
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes the category panel from anywhere inside it.
  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMegaOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [megaOpen]);

  const closeMega = useCallback(() => setMegaOpen(false), []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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

        <nav
          aria-label="Primary"
          className="mx-auto hidden gap-7 font-body text-[13px] font-medium tracking-[0.02em] lg:flex"
        >
          {primaryNav.map((item) =>
            item.hasMegaMenu ? (
              <div
                key={item.href}
                onMouseEnter={() => setMegaOpen(true)}
                className="relative"
              >
                {/*
                  The panel opens on hover for pointers and on focus for
                  keyboards — hover alone made the whole category menu
                  unreachable without a mouse.
                */}
                <Link
                  href={item.href}
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                  onFocus={() => setMegaOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setMegaOpen(false);
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setMegaOpen(true);
                    }
                  }}
                  className="block py-1.5 hover:text-strong"
                  style={{
                    color: isActive(item.href)
                      ? "var(--p1-signal)"
                      : undefined,
                  }}
                >
                  {item.label}
                </Link>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="py-1.5 hover:text-strong"
                style={{
                  color: isActive(item.href) ? "var(--p1-signal)" : undefined,
                }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-4 lg:ml-0 lg:gap-[18px]">
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

      {megaOpen ? (
        <MegaMenu categories={categories} onClose={closeMega} />
      ) : null}

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
      />
    </>
  );
}
