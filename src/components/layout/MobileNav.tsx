"use client";

import Link from "next/link";
import { useEffect } from "react";
import { contact, primaryNav } from "@/data/site";
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
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      id="mobile-nav"
      hidden={!open}
      className="fixed inset-0 z-[118] flex flex-col overflow-y-auto bg-ink pt-[72px] lg:hidden"
    >
      <nav aria-label="Mobile" className="gutter-x flex flex-col py-6">
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="border-b border-hairline py-5 font-display text-2xl font-medium tracking-[-0.02em] text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="gutter-x pb-8">
        <div className="p1-mono mb-4 text-[rgba(230,230,230,0.45)]">
          Categories
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              onClick={onClose}
              className="flex items-baseline justify-between gap-2 border-b border-hairline pb-2 text-sm text-[rgba(230,230,230,0.72)]"
            >
              {category.name}
              <span className="font-mono text-[10px] text-[rgba(230,230,230,0.4)]">
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
