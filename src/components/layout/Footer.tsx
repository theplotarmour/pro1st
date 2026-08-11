import Link from "next/link";
import { footerColumns, contact, site } from "@/data/site";
import { getPolicies } from "@/lib/shopify/policies";
import { productRepository } from "@/lib/products";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Footer.
 *
 * Every link now goes somewhere real. Previously almost the whole footer —
 * Warranty, Shipping, Returns, Privacy, Terms, Rate card, Spec sheets —
 * pointed at the enquiry form, so the site had one destination wearing eleven
 * labels. Now:
 *
 *   - Product links resolve to real Shopify collections, built from the
 *     catalogue rather than hardcoded, so they cannot rot.
 *   - Legal links render real Shopify policy documents, and a policy that the
 *     merchant has not written simply does not appear.
 *   - Only genuinely enquiry-shaped actions point at the enquiry form.
 */
export async function Footer() {
  const [categories, policies] = await Promise.all([
    productRepository.getCategories().catch(() => []),
    getPolicies(),
  ]);

  const productLinks = categories.slice(0, 6).map((category) => ({
    label: category.name,
    href: `/products?category=${category.slug}`,
  }));

  const policyLinks = policies.map((policy) => ({
    label: policy.title,
    href: `/policies/${policy.handle}`,
  }));

  const columns = [
    { head: "Products", links: productLinks },
    ...footerColumns,
    ...(policyLinks.length > 0
      ? [{ head: "Legal", links: policyLinks }]
      : []),
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="relative gutter-x overflow-hidden border-t border-hairline pt-24">
      <div className="p1-shell relative z-[2]">
        <div className="grid grid-cols-1 gap-14 border-b border-hairline pb-16 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <NewsletterForm />

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {columns.map((column) => (
              <div key={column.head}>
                <div className="p1-mono mb-5 text-soft">{column.head}</div>
                <div className="flex flex-col gap-3 text-sm text-body">
                  {column.links.map((link) => (
                    <Link
                      key={`${column.head}-${link.label}`}
                      href={link.href}
                      className="transition-colors duration-[160ms] ease-signal hover:text-signal"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p1-mono flex flex-wrap items-center justify-between gap-6 py-7 pb-[72px] text-faint">
          <span>
            © {year} {site.name} · Desire Electronics, Delhi
          </span>
          <span className="flex flex-wrap items-center gap-6">
            <a href={contact.phoneHref} className="hover:text-signal">
              {contact.phone}
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-signal"
            >
              {contact.email}
            </a>
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-[4%] whitespace-nowrap text-center font-display text-[20vw] font-bold leading-[0.8] tracking-[-0.05em] text-strong opacity-[0.06]"
      >
        {site.wordmark}
      </div>
    </footer>
  );
}
