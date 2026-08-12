/**
 * Site chrome and brand constants.
 *
 * Product facts live in Shopify. Section editorial lives in `editorial.ts`.
 * What remains here is navigation, contact details and standing brand copy.
 *
 * Site-level content. Everything here is carried over from the approved
 * design source — no dates, figures or claims have been added.
 *
 * Anything the client must confirm before launch is marked CONFIRM.
 */

export const site = {
  name: "PRO1ST",
  wordmark: "PRO·1ST",
  positioning: "Professional Rhythm Operators · 1st Choice",
  description:
    "Professional audio equipment — mixers, amplifiers, speakers, microphones, compression drivers and processors. Built loud. Tuned for clarity. Engineered for the long set.",
  /** Set NEXT_PUBLIC_SITE_URL in the deployment environment. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pro1st.in",
  locale: "en_IN",
} as const;

export interface NavItem {
  label: string;
  href: string;
  /** Opens the category panel on desktop. */
  hasMegaMenu?: boolean;
  /**
   * Only render when this Shopify collection actually exists. Keeps a nav
   * item from pointing at an empty category — the same rule the footer uses.
   */
  requiresCollection?: string;
}

/**
 * Primary navigation.
 *
 * Purchasing pathways, not essays. "Home" is an explicit link rather than
 * relying on the logo, which is what usability guidance expects and what
 * Sweetwater, Crutchfield and Audio Advice all do.
 */
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/products", hasMegaMenu: true },
  {
    label: "System Packages",
    href: "/products?category=packages",
    requiresCollection: "packages",
  },
  { label: "Our Story", href: "/origin" },
  { label: "Support & FAQ", href: "/contact#faq" },
  { label: "Wholesale", href: "/wholesale" },
];

/* CONFIRM — supplied by the design source, verify with the client. */
export const contact = {
  addressLines: [
    "1487/2 Moti Cinema Compound,",
    "Chandni Chowk, Delhi-110006",
  ],
  phone: "+91 72900 77778",
  phoneHref: "tel:+917290077778",
  email: "info@pro1st.in",
  whatsappLabel: "Message us",
  whatsappHref: "https://wa.me/917290077778",
  hours: "Mon–Sat · 10:30–19:30",
  /**
   * CONFIRM — the exact street number does not resolve in OpenStreetMap, so
   * this is the Moti Cinema Compound block from OSM's own geocoding, not a
   * guess. Replace with the precise rooftop coordinates if the client has them.
   */
  geo: { latitude: 28.6565844, longitude: 77.2345987 },
} as const;

export const heroContent = {
  status: "Live from Chandni Chowk",
  headlineTop: "Professional",
  headlineAccent: "Rhythm",
  headlineRest: "Operators",
  lead: "The 1st choice of DJs, event professionals and retailers across India. Built loud. Tuned for clarity. Engineered for the long set.",
  meta: "Est. 2004 · Delhi-6 · 10,000+ units shipped",
} as const;




/**
 * Trade figures.
 *
 * CONFIRM — carried over from the approved design source. The two wattage
 * figures describe products, so they should move to Shopify metafields once
 * specifications exist, and be read from there rather than restated here.
 */
export const stats = [
  { to: 20, suffix: "+", initial: "0+", label: "Years in trade" },
  { to: 10000, suffix: "+", initial: "0+", label: "Units shipped" },
  { to: 120, suffix: "W", initial: "0W", label: "Per driver" },
  { to: 1600, suffix: "W", initial: "0W", label: "Pro amp output" },
] as const;

/** MX-1600 exploded-assembly offsets — fixed per layer, never random. */
export const explodeOffsets = [
  { x: -150, y: -190, z: 150, r: -5 },
  { x: 140, y: -140, z: 96, r: 4 },
  { x: -120, y: -92, z: 180, r: -3 },
  { x: 112, y: -32, z: 68, r: 3 },
  { x: -104, y: 40, z: 160, r: -2 },
  { x: 130, y: 98, z: 110, r: 3 },
  { x: -138, y: 152, z: 76, r: -4 },
  { x: 152, y: 200, z: 168, r: 5 },
] as const;


export const manifesto = {
  text: "We don't build for the showroom. We build for the dancefloor at 2 AM, for the wedding generator that won't quit, for the retailer who needs gear that comes back as a referral — not a complaint.",
  /** Word indices rendered in signal orange. */
  highlight: [12, 13, 35],
} as const;

export const tradeContent = {
  dealer: {
    eyebrow: "[ 06 — Trade ]",
    heading: "Stock PRO1st.",
    body: "Dealer margins, PAN-India dispatch and bulk pricing on the full line. GSTIN and a first order is all it takes to open an account.",
    cta: "Dealer enquiry",
  },
  systems: {
    eyebrow: "[ 06 — Systems ]",
    heading: "Or spec a system.",
    body: "Installers and AV contractors: send us the room and the headcount. We will return a chain that interlocks, from mic to cabinet, with load figures.",
    cta: "Talk to an engineer",
  },
} as const;

export const trustPoints = [
  "Factory direct",
  "48-hour burn-in testing",
  "PAN-India delivery",
  "Warranty backed",
] as const;

export const faqs = [
  {
    q: "What products does PRO1st offer?",
    a: "Speakers, mixers, amplifiers, microphones, compression drivers, crossover networks and PA accessories. Twenty-five SKUs published, more assembled to order.",
  },
  {
    q: "Is this gear built for professional use?",
    a: "Yes. Every unit in the line is specified for live events, installations and rental stock, not for home listening.",
  },
  {
    q: "Do you manufacture or import?",
    a: "Both. Drivers, transformers and DSP boards are imported from specialists. Housings, chassis and crossover networks are built and assembled on our floor in Delhi-6.",
  },
  {
    q: "Do you offer bulk and dealer pricing?",
    a: "Yes. Share your GSTIN and expected monthly volume through the dealer form and we will send a rate card within one working day.",
  },
  {
    q: "What warranty do you provide?",
    a: "Twelve months against manufacturing defect from date of invoice, covering drivers, amplifier boards and passive networks. Physical damage and misuse are excluded.",
  },
  {
    q: "How long does delivery take?",
    a: "Delhi NCR in 24–48 hours. Metro cities in 3–5 working days. Remaining PIN codes in 5–8 working days.",
  },
  {
    q: "Can you help me select the right product?",
    a: "Call +91 72900 77778 with your venue size, headcount and existing gear. We will spec the chain end to end.",
  },
  {
    q: "Do you ship across India?",
    a: "Yes, PAN-India by surface and air cargo. Heavy cabinets ship by road transport with insurance available.",
  },
  {
    q: "How do I reach you?",
    a: "Phone or WhatsApp on +91 72900 77778, email info@pro1st.in, or visit 1487/2 Moti Cinema Compound, Chandni Chowk.",
  },
] as const;

export const footerColumns = [
  {
    head: "Trade",
    links: [
      { label: "Dealer enquiry", href: "/contact?enquiry=dealer" },
      { label: "Bulk pricing", href: "/contact?enquiry=dealer" },
      { label: "Spec a system", href: "/contact?enquiry=business" },
    ],
  },
  {
    head: "Explore",
    links: [
      { label: "Shop all", href: "/products" },
      { label: "Our story", href: "/origin" },
      { label: "Wholesale", href: "/wholesale" },
      { label: "Support & FAQ", href: "/contact#faq" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    head: "Contact",
    links: [
      { label: "Get in touch", href: "/contact" },
      { label: "WhatsApp", href: contact.whatsappHref },
      { label: "Showroom", href: "/origin#showroom" },
    ],
  },
] as const;

export const enquiryTypes = [
  { value: "general", label: "General enquiry" },
  { value: "product", label: "Product enquiry" },
  { value: "dealer", label: "Dealer enquiry" },
  { value: "business", label: "Business enquiry" },
] as const;
