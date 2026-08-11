# PRO1ST — Digital Commerce Experience

Production frontend for PRO1ST (Desire Electronics, Chandni Chowk, New Delhi),
built by PlotArmour Studio. Converted from the approved Claude-generated UI
prototype in `_design-source/` — implemented and productionised, not redesigned.

## Stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · no animation
library — the design's scroll choreography is ported as plain rAF + scroll
handlers. Deploy target: Vercel. Commerce: Shopify (Phase 5).

```bash
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

## Fonts

Space Grotesk, Inter and JetBrains Mono are **self-hosted** from
`public/fonts` and declared in `src/app/fonts.css` — not loaded through
`next/font/google`. The build must not depend on `fonts.gstatic.com` being
reachable from the CI machine.

All three are variable fonts, split into `latin` / `latin-ext` / `greek`
subsets carrying `unicode-range`, so a browser fetches latin-ext (₹) or greek
(Ω) only when those glyphs are rendered. The three latin subsets are
preloaded in `layout.tsx`.

To refresh, re-pull the subsets from the Google Fonts CSS API and regenerate
`src/app/fonts.css` rather than hand-editing it. All three families are
SIL Open Font License 1.1.

## Architecture

```
UI components  →  productRepository  →  mock data | Shopify Storefront API
```

- `src/types/product.ts` — the frontend `Product` abstraction.
- `src/data/` — mock catalogue and site content. **The only place content lives.**
- `src/lib/products/` — the repository seam:
  - `repository.ts` — the interface every page calls.
  - `mock-repository.ts` — current source.
  - `shopify-repository.ts` — Phase 5 implementation (documented stub).
  - `index.ts` — picks the source from `PRODUCT_SOURCE`.

No component imports `src/data/products.ts` directly. Swapping to Shopify means
implementing `shopify-repository.ts` and setting `PRODUCT_SOURCE=shopify` —
nothing in `src/components/` changes.

### Components

```
components/
├── layout/     Header, MobileNav, MegaMenu, Footer, Preloader, CursorRing, WhatsAppFab
├── hero/       Hero, HeroChassis, ChassisShell, Waveform
├── product/    ProductCard, ProductGrid, ProductGallery, ProductInfo,
│               ProductSpecs, ProductFeatures, ProductFilters, RelatedProducts
├── commerce/   CartDrawer, CartView, CartItem, AddToCartButton, CheckoutButton
├── sections/   BuildSection, ChainSection, CraftSection, OriginSection,
│               ArsenalSection, Manifesto, ContactCTA, ContactForm,
│               ShowroomSection, TrustBar, FaqSection, CategoryMarquee
└── ui/         Button, Badge, Container, SectionHeading, PageHeader, Media,
                Reveal, Magnetic, Counter, ParallaxMedia, EmptyState
```

## Routes

| Route | Notes |
|---|---|
| `/` | Full brand experience |
| `/origin` | Story and heritage |
| `/arsenal` | Flagship line-up + signal chain |
| `/products` | Gallery. Category filter is `?category=<slug>` so `/products/[handle]` stays free for detail pages |
| `/products/[handle]` | Product detail, statically generated |
| `/craft` | Engineering editorial |
| `/contact` | General / product / dealer / business enquiries |
| `/search` | `?q=` — server-rendered, works without JS |
| `/cart` | Full cart |

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and sitemap |
| `PRODUCT_SOURCE` | `mock` (default) or `shopify` |
| `SHOPIFY_STORE_DOMAIN` | Phase 5 |
| `SHOPIFY_STOREFRONT_TOKEN` | Phase 5 |
| `NEXT_PUBLIC_CHECKOUT_URL` | Enables the checkout button |
| `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` | Enables newsletter signup |

Where an integration is absent the UI says so plainly rather than simulating
success. Nothing in this build pretends to work.

## Content rules honoured

- No invented dates, founders, expansion claims, prices or specifications.
- Every string in `src/data/` is carried over from the approved design source.
- `ProductSpecs` renders an empty state instead of placeholder figures; add
  entries to `specifications` only from client-supplied data.
- Client-confirmable values are marked `CONFIRM` in `src/data/site.ts`.

## Motion

Pinned scroll sections (`BuildSection`, `ChainSection`, `CraftSection`) are pure
functions of scroll progress, so they scrub in both directions. They un-pin
below 900–1024px — mobile gets a composed vertical layout rather than a shrunk
desktop one. Everything respects `prefers-reduced-motion`.

## Outstanding (Phase 5–6)

- Shopify Storefront queries + `toProduct` mapping.
- Real product media, specifications, documents and variants.
- Client UAT.
