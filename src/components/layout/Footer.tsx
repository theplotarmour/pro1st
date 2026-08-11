import Link from "next/link";
import { footerColumns, legalLinks, site } from "@/data/site";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative gutter-x overflow-hidden border-t border-hairline pt-24">
      <div className="p1-shell relative z-[2]">
        <div className="grid grid-cols-1 gap-14 border-b border-hairline pb-16 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <NewsletterForm />

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {footerColumns.map((column) => (
              <div key={column.head}>
                <div className="p1-mono mb-5 text-[rgba(230,230,230,0.45)]">
                  {column.head}
                </div>
                <div className="flex flex-col gap-3 text-sm text-[rgba(230,230,230,0.72)]">
                  {column.links.map((link) => (
                    <Link key={link.label} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p1-mono flex flex-wrap justify-between gap-6 py-7 pb-[72px] text-[rgba(230,230,230,0.4)]">
          <span>
            © {year} {site.name} · Desire Electronics, Delhi
          </span>
          <span className="flex flex-wrap gap-6">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-[4%] whitespace-nowrap text-center font-display text-[20vw] font-bold leading-[0.8] tracking-[-0.05em] text-white opacity-[0.15]"
      >
        {site.wordmark}
      </div>
    </footer>
  );
}
