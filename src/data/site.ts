import { IMG } from "./images";

/**
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
}

/** Primary navigation — the information architecture from the brief. */
export const primaryNav: NavItem[] = [
  { label: "Origin", href: "/origin" },
  { label: "Arsenal", href: "/arsenal" },
  { label: "Product Gallery", href: "/products", hasMegaMenu: true },
  { label: "Craft", href: "/craft" },
  { label: "Get in Touch", href: "/contact" },
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
} as const;

export const heroContent = {
  status: "Live from Chandni Chowk",
  headlineTop: "Professional",
  headlineAccent: "Rhythm",
  headlineRest: "Operators",
  lead: "The 1st choice of DJs, event professionals and retailers across India. Built loud. Tuned for clarity. Engineered for the long set.",
  meta: "Est. 2004 · Delhi-6 · 10,000+ units shipped",
} as const;

/** Scrolling category rail under the hero. */
export const marqueeCategories = [
  { label: "Speakers", image: IMG.t12 },
  { label: "Mixers", image: IMG.aj6 },
  { label: "Amplifiers", image: IMG.mx1600 },
  { label: "Microphones", image: IMG.beta58 },
  { label: "Crossovers", image: IMG.d450 },
  { label: "PA Systems", image: IMG.partybox },
  { label: "Drivers", image: IMG.d518 },
  { label: "Accessories", image: IMG.wire },
] as const;

export const originContent = {
  eyebrow: "[ 02 — Origin ]",
  heading: "From a workshop in Chandni Chowk, we move air across India.",
  body: [
    "Desire Electronics has traded in audio since 2004. PRO1st is the professional line: imported drivers, transformers and DSP boards mated to housings, chassis and crossovers built on our own floor at Moti Cinema Compound.",
    "That split is deliberate. We buy the components nobody should improvise, and we build the parts that decide whether a cabinet survives a monsoon load-in. Every unit is bench-tested before it leaves the compound.",
  ],
  image: { src: IMG.workshop, alt: "PRO1st assembly floor, Chandni Chowk" },
} as const;

export const stats = [
  { to: 20, suffix: "+", initial: "0+", label: "Years in trade" },
  { to: 10000, suffix: "+", initial: "0+", label: "Units shipped" },
  { to: 120, suffix: "W", initial: "0W", label: "Per driver" },
  { to: 1600, suffix: "W", initial: "0W", label: "Pro amp output" },
] as const;

/** The signal chain — source to subwoofer. */
export const chainNodes = [
  {
    label: "Source",
    product: "TK600 / BETA58S Microphones",
    spec: "Dynamic · Supercardioid · XLR",
    price: "₹850",
    image: IMG.tk600,
    handle: "pro-1st-tk600-dynamic-microphone",
  },
  {
    label: "Mixer",
    product: "AJ6 Voice Mixer",
    spec: "6-channel · 99 DSP · Phantom",
    price: "₹6,750",
    image: IMG.aj6,
    handle: "pro-1st-aj6-professional-audio-mixer",
  },
  {
    label: "Processor",
    product: "XTR 6.0 Feedback Eliminator",
    spec: "1U rack · Zero screech",
    price: "₹11,000",
    image: IMG.xtr6,
    handle: "pro1st-xtr-6-0-feedback-eliminator",
  },
  {
    label: "Amplifier",
    product: "MX-1600 Power Booster",
    spec: "1600W · Pro booster",
    price: "₹25,000",
    image: IMG.mx1600,
    handle: "pro1st-mx-1600-professional-power-amplifier",
  },
  {
    label: "Crossover",
    product: "D-750 / A-450 Network",
    spec: "2-way & 3-way · 8Ω",
    price: "₹550",
    image: IMG.d750,
    handle: "pro1st-d-750-hf-cross-over-network",
  },
  {
    label: "Driver",
    product: "780 TN Compression Driver",
    spec: "120W · 8Ω · Titanium",
    price: "₹5,500",
    image: IMG.tn780,
    handle: "pro-1st-780-tn-high-power-compression-driver-1",
  },
  {
    label: "Cabinet",
    product: "Party Box / T-12 Trolley",
    spec: "Portable · Bluetooth · Wheeled",
    price: "₹6,480",
    image: IMG.t12,
    handle: "pro-1st-party-box-portable-bluetooth-speaker",
  },
] as const;

/** MX-1600 exploded-assembly offsets — fixed per layer, never random. */
export const explodeOffsets = [
  { x: -330, y: -215, z: 210, r: -13 },
  { x: 315, y: -168, z: 128, r: 9 },
  { x: -268, y: -104, z: 268, r: -7 },
  { x: 246, y: -38, z: 86, r: 6 },
  { x: -232, y: 46, z: 232, r: -5 },
  { x: 288, y: 112, z: 150, r: 8 },
  { x: -306, y: 178, z: 98, r: -11 },
  { x: 338, y: 236, z: 246, r: 12 },
] as const;

export const buildContent = {
  eyebrow: "[ 01 — The build ]",
  heading: "Eight layers. One chassis.",
  lead: "The MX-1600, pressed and stacked in the order it leaves our floor.",
  image: IMG.mx1600,
  imageAlt: "MX-1600 professional power booster amplifier",
  unit: "MX-1600 · ₹25,000",
  callouts: [
    { text: "Pressed steel faceplate", side: "left", top: "24%", rule: 80 },
    { text: "Hand-biased output pairs", side: "left", top: "62%", rule: 110 },
    { text: "Extruded heat-sink flank", side: "right", top: "33%", rule: 80 },
    { text: "1600W · 2Ω stable", side: "right", top: "70%", rule: 110 },
  ],
} as const;

export const craftPanels = [
  {
    num: "[ 01 / 03 ]",
    imageFirst: true,
    image: IMG.tn780,
    imageAlt: "780 TN compression driver",
    title: "Magnet, voice coil, titanium.",
    body: "Compression drivers sourced from specialists, mated to housings built on our floor, so they survive humidity, road shocks and 14-hour weddings.",
  },
  {
    num: "[ 02 / 03 ]",
    imageFirst: false,
    image: IMG.mx1600,
    imageAlt: "MX-1600 amplifier chassis",
    title: "1600 watts. One toggle.",
    body: "The MX-1600 chassis is pressed, painted and assembled in Delhi. Output transistors are matched in pairs and biased by hand.",
  },
  {
    num: "[ 03 / 03 ]",
    imageFirst: true,
    image: IMG.t12,
    imageAlt: "T-12 trolley speaker",
    title: "Wheels, handle, weatherproof shell.",
    body: "A trolley speaker is a tool, not a trophy. Reinforced corners, gasket-sealed back panel, batteries that outlast the gig.",
  },
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
    head: "Products",
    links: [
      { label: "Microphones", href: "/products?category=microphones" },
      { label: "Mixers", href: "/products?category=mixers" },
      { label: "Amplifiers", href: "/products?category=amplifiers" },
      { label: "Speakers", href: "/products?category=speakers" },
      { label: "Crossovers", href: "/products?category=crossovers" },
    ],
  },
  {
    head: "Trade",
    links: [
      { label: "Dealer enquiry", href: "/contact?enquiry=dealer" },
      { label: "Bulk pricing", href: "/contact?enquiry=dealer" },
      { label: "Spec a system", href: "/contact?enquiry=business" },
      { label: "Rate card", href: "/contact?enquiry=dealer" },
    ],
  },
  {
    head: "Support",
    links: [
      { label: "Warranty", href: "/contact?enquiry=general" },
      { label: "Spec sheets", href: "/products" },
      { label: "Shipping", href: "/contact?enquiry=general" },
      { label: "Returns", href: "/contact?enquiry=general" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "Origin", href: "/origin" },
      { label: "Craft", href: "/craft" },
      { label: "Arsenal", href: "/arsenal" },
      { label: "WhatsApp", href: contact.whatsappHref },
    ],
  },
] as const;

export const legalLinks = [
  { label: "Privacy", href: "/contact" },
  { label: "Terms", href: "/contact" },
  { label: "Warranty", href: "/contact" },
  { label: "Shipping", href: "/contact" },
  { label: "Returns", href: "/contact" },
] as const;

export const enquiryTypes = [
  { value: "general", label: "General enquiry" },
  { value: "product", label: "Product enquiry" },
  { value: "dealer", label: "Dealer enquiry" },
  { value: "business", label: "Business enquiry" },
] as const;
