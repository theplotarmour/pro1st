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
UI components  →  productRepository  →  Shopify Storefront API
                  content/sections   →  Shopify + brand editorial
```

**There is no second data source.** The mock catalogue was removed once the
Shopify store went live: a hardcoded price is a price that goes stale the
moment the merchant changes it. If Shopify is unreachable, pages fail through
the route error boundary rather than showing stale figures.

- `src/types/product.ts` — the frontend `Product` abstraction.
- `src/data/editorial.ts` — brand voice only. Contains no product facts.
- `src/data/site.ts` — navigation, contact details, standing brand copy.
- `src/data/featured.ts` — curated handles, used only as a fallback until
  products are flagged with `custom.featured` in Shopify.
- `src/lib/content/sections.ts` — joins brand editorial to live Shopify
  products, so section imagery, names and prices are never written down here.
- `src/lib/products/` — the repository seam:
  - `repository.ts` — the interface every page calls.
  - `shopify-repository.ts` — the implementation.
  - `index.ts` — exposes the repository and merchant-controlled featuring.

No component fetches from Shopify directly, and no component holds a product
fact. Sections receive their data as props from server components.

### Page structure

Each route is its own page. The three pinned scroll sections — the exploded
build (620vh), the signal chain (360vh) and the horizontal craft traverse
(300vh) — live **only on the homepage**. Reusing them on interior pages was
what made a multi-page site read as a single endless page.

| Route | Composition |
|---|---|
| `/` | Full signature experience, all three pinned sections |
| `/origin` | Story, trade figures, showroom, CTA |
| `/arsenal` | Flagships + category ecosystem grid |
| `/craft` | Craft panels as a stacked editorial column |

### Logo

`src/components/layout/Wordmark.tsx` is the client's real PRO1ST mark, traced
from the supplied `Logo--.pdf` as vector paths — nine paths, no network
request, crisp at any size. Brand colours are the artwork's own: `#2E3092`,
`#ED1C24`, `#6D6E70`, `#F5821F`, `#00AEEF`.

The mark is multi-colour artwork for a light ground, and its navy "P" sits at
about 1.7:1 against the near-black UI. It is therefore placed on its own light
plate — as the supplied artwork itself presents it — rather than recoloured.

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

## Shopify

Live store: `pro1st-2.myshopify.com` (INR, India). The catalogue is real — 25
products with real prices, SKUs, inventory and CDN media — and is served
through the **Storefront API 2026-07** via the existing "Pro1st Headless"
sales channel.

- **Categories are Shopify collections**, not `productType`. The site taxonomy
  follows what the merchant curates in admin; no deploy to reorganise.
- **Featured products** come from the `custom.featured` metafield when set,
  falling back to the curated handles in `src/data/featured.ts`.
- **Specs / features / applications / documents** come from `custom.*`
  metafields only. No definitions exist yet, so those sections render their
  designed empty states — nothing is fabricated to fill them.
- **Cart and checkout are Shopify's.** Only the cart ID is stored here, in an
  httpOnly cookie. This app holds no order data and never sees a payment
  credential.
- **Least privilege:** `quantityAvailable` / `totalInventory` are not queried;
  they need `unauthenticated_read_product_inventory`, which the public token
  does not carry. `availableForSale` gates purchase and needs no extra scope.

Never put an Admin API token (`shpat_…`) in this application. The only Shopify
credential it uses is the public, read-only Storefront token.

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and sitemap |
| `PRODUCT_SOURCE` | `shopify` (default when configured) or `mock` |
| `SHOPIFY_STORE_DOMAIN` | e.g. `pro1st-2.myshopify.com` |
| `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` | Public Storefront token (Headless channel) |
| `SHOPIFY_API_VERSION` | Pinned to `2026-07` |
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

## Outstanding — needs merchant action

These are business decisions or admin work, not code:

1. **Rotate the Admin API token** that was shared in chat (`shpat_…`).
2. **Product metadata is empty** across all 25 products: no `productType`,
   no tags, no SEO title/description. Specs stay hidden until metafields exist.
3. **Create metafield definitions** (`custom.specifications`, `custom.features`,
   `custom.applications`, `custom.documents`, `custom.spec_line`) and populate
   them — this is what lights up the spec tables.
4. **Taxonomy**: Accessories (13) currently absorbs 4 crossover networks and
   2 compression drivers. Deferred by the client.
5. **XTR 6.0** title/handle conflict — title says "Power Amplifier", handle and
   imagery say "Feedback Eliminator". Deferred by the client.
6. **T-12 trolley speaker** is referenced in the brief but does not exist in
   the catalogue. Not linked anywhere, to avoid a dead tile.
7. **4 products have no SKU**: D-750, A-450, AJ6, Bluetooth Reporter Mic.
8. **Vendor is inconsistent**: "Desire Electronics" vs "Professional Rhythm
   Operator - PRO 1st".
9. Payments, shipping, GST and legal policies — all merchant decisions.
10. Client UAT.
