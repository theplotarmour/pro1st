"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { contact, primaryNav } from "@/data/site";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import type { CategorySummary } from "@/types/product";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  categories: CategorySummary[];
}

/**
 * Full-height mobile panel. Composed for the small screen rather than a
 * shrunk desktop bar: large tap targets, categories exposed one level up,
 * and the dealer CTA kept in reach at the bottom.
 */
export function MobileNav({ open, onClose, categories }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Escape, scroll lock, focus trap and focus restore all live in one place.
  useFocusTrap(panelRef, open, { onClose });

  return (
    <div
      ref={panelRef}
      id="mobile-nav"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      tabIndex={-1}
      hidden={!open}
      className="fixed inset-0 z-[118] flex flex-col overflow-y-auto bg-ink pt-[72px] lg:hidden"
    >
      <nav aria-label="Mobile" className="gutter-x flex flex-col py-6">
        {primaryNav
          .filter(
            (item) =>
              !item.requiresCollection ||
              categories.some((c) => c.slug === item.requiresCollection),
          )
          .map((item) => {
            // Same rule the desktop pill uses: longest matching prefix wins,
            // and "/" only ever matches the home route.
            const path = item.href.split(/[?#]/)[0] ?? item.href;
            const isCurrent =
              path === "/" ? pathname === "/" : pathname.startsWith(path);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isCurrent ? "page" : undefined}
                className={`border-b border-hairline py-5 font-display text-2xl font-medium tracking-[-0.02em] ${
                  isCurrent ? "text-signal" : "text-strong"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="gutter-x pb-8">
        <div className="p1-mono mb-4 text-soft">
          Categories
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              onClick={onClose}
              className="flex items-baseline justify-between gap-2 border-b border-hairline pb-2 text-sm text-body"
            >
              {category.name}
              <span className="font-mono text-[10px] text-faint">
                {String(category.count).padStart(2, "0")}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="gutter-x mt-auto flex flex-col gap-3 border-t border-hairline py-8">
        <Link
          href="/contact?enquiry=dealer"
          onClick={onClose}
          className="p1-btn p1-btn--primary justify-center"
        >
          Dealer enquiry
        </Link>
        <a
          href={contact.phoneHref}
          className="p1-btn p1-btn--outline justify-center"
        >
          {contact.phone}
        </a>
      </div>
    </div>
  );
}
