import type { Product } from "@/types/product";
import { IMG } from "./images";

/**
 * LOCAL FALLBACK CATALOGUE — development only.
 *
 * The real catalogue lives in Shopify and is served by
 * `shopify-repository.ts`. This file exists so the UI still runs with no
 * credentials (`PRODUCT_SOURCE=mock`), and so component work never depends on
 * network access.
 *
 * Titles, prices and categories mirror the live Shopify store. Nothing here
 * is invented: products with no published price carry none, and no
 * specifications are declared at all — those come from Shopify metafields.
 */

interface MockSeed {
  id: string;
  handle: string;
  title: string;
  category: string;
  price?: number;
  sku?: string;
  image: string;
  specLine?: string;
  available?: boolean;
  tags?: string[];
}

const SEEDS: MockSeed[] = [
  {
    id: "aj6",
    handle: "pro-1st-aj6-professional-audio-mixer",
    title: "PRO 1st AJ6 Professional Audio Mixer",
    category: "Mixers",
    price: 6750,
    image: IMG.aj6,
    tags: ["mixer", "dsp"],
  },
  {
    id: "um6",
    handle: "pro-1st-stereo-echo-audio-mixer",
    title: "PRO-1ST Stereo Echo Audio Mixer",
    category: "Mixers",
    price: 1999,
    sku: "DE-MIX-UM6-ECHO",
    image: IMG.um6,
    tags: ["mixer", "echo"],
  },
  {
    id: "mx-1600",
    handle: "pro1st-mx-1600-professional-power-amplifier",
    title: "PRO1ST MX-1600 Professional Power Booster Amplifier",
    category: "Amplifiers",
    price: 25000,
    sku: "DE-PRO1ST-MX1600",
    image: IMG.mx1600,
    tags: ["amplifier"],
  },
  {
    id: "xtr-60",
    handle: "pro1st-xtr-6-0-feedback-eliminator",
    title: "Pro 1st XTR 6.0 Professional Rack-Mount Power Amplifier",
    category: "Amplifiers",
    price: 11000,
    sku: "PRO1ST-XTR-6.0-AMP",
    image: IMG.xtr6,
    tags: ["rack"],
  },
  {
    id: "780-tn",
    handle: "pro-1st-780-tn-high-power-compression-driver-1",
    title: "PRO-1ST 780 TN High Power Compression Driver Unit",
    category: "Accessories",
    price: 5500,
    sku: "DE-PRO1ST-780TN-120W",
    image: IMG.tn780,
    tags: ["driver", "compression driver"],
  },
  {
    id: "party-box",
    handle: "pro-1st-party-box-portable-bluetooth-speaker",
    title: "PRO-1ST Party Box Portable Bluetooth Speaker",
    category: "Speakers",
    price: 6480,
    sku: "DE-SPK-PB12-RGB",
    image: IMG.partybox,
    tags: ["speaker", "bluetooth"],
  },
  {
    id: "tk600",
    handle: "pro-1st-tk600-dynamic-microphone",
    title: "Pro 1st TK600 Professional Uni-Directional Dynamic Microphone",
    category: "Microphones",
    price: 850,
    sku: "PRO1ST-MIC-TK600-XLR",
    image: IMG.tk600,
    tags: ["microphone", "xlr"],
  },
  {
    id: "beta-58s",
    handle: "pro-1st-beta58s-dynamic-vocal-microphone",
    title: "PRO-1ST BETA58S Professional Dynamic Vocal Microphone",
    category: "Microphones",
    price: 550,
    sku: "DE-PRO1ST-BETA58S",
    image: IMG.beta58,
    tags: ["microphone"],
  },
  {
    id: "tk280",
    handle: "pro-1st-tk280-professional-dynamic-microphone",
    title: "PRO 1st TK280 Professional Dynamic Microphone",
    category: "Microphones",
    price: 975,
    sku: "DE-MIC-TK280-BLK",
    image: IMG.tk280,
    tags: ["microphone"],
  },
  {
    id: "d-750",
    handle: "pro1st-d-750-hf-cross-over-network",
    title: "PRO1ST D-750 HF Cross Over Network",
    category: "Accessories",
    price: 550,
    image: IMG.d750,
    tags: ["crossover"],
  },
  {
    id: "d-450",
    handle: "pro-1st-a-450-precision-audio-crossover-network",
    title: "PRO 1st A-450 Precision Audio Crossover Network",
    category: "Accessories",
    price: 410,
    image: IMG.d450,
    tags: ["crossover"],
  },
  {
    id: "d-518",
    handle: "pro-1st-d518-professional-tweeter",
    title: "PRO1ST Compression Driver Unit",
    category: "Accessories",
    price: 1300,
    sku: "DE-PRO1ST-CDU-RED",
    image: IMG.d518,
    tags: ["driver", "tweeter"],
  },
  {
    id: "wire",
    handle: "pro-1st-professional-speaker-wire-roll",
    title: "PRO-1ST Professional Speaker Wire Roll",
    category: "Accessories",
    price: 1650,
    sku: "DE-WIRE-SPK-MULTI",
    image: IMG.wire,
    tags: ["cable"],
  },
  {
    id: "ratchet",
    handle: "pro-1st-heavy-duty-ratchet-tie-down-strap-with-double-j-hook",
    title: "PRO-1ST Heavy Duty Ratchet Tie Down Strap",
    category: "Accessories",
    price: 900,
    sku: "DE-RATCHET-STRAP-5T-BLK",
    image: IMG.ratchet,
    tags: ["rigging"],
  },
];

/**
 * Builds a complete Product from a seed. Every mock product gets one default
 * variant so the cart path is identical to Shopify's — a single-variant
 * product in Shopify is also just one variant titled "Default Title".
 */
function toProduct(seed: MockSeed): Product {
  const available = seed.available ?? true;
  const currency = "INR";

  const product: Product = {
    id: seed.id,
    handle: seed.handle,
    title: seed.title,
    category: seed.category,
    categoryHandle: seed.category.toLowerCase(),
    collections: [
      { handle: seed.category.toLowerCase(), title: seed.category },
    ],
    currency,
    images: [{ src: seed.image, alt: seed.title }],
    options: [],
    variants: [
      {
        id: `mock-variant-${seed.id}`,
        title: "Default Title",
        currency,
        availableForSale: available && seed.price !== undefined,
        selectedOptions: [],
        ...(seed.price !== undefined ? { price: seed.price } : {}),
        ...(seed.sku ? { sku: seed.sku } : {}),
      },
    ],
    tags: seed.tags ?? [],
    availability: { status: available ? "in-stock" : "out-of-stock" },
  };

  if (seed.price !== undefined) product.price = seed.price;
  if (seed.sku) product.sku = seed.sku;
  if (seed.specLine) product.specLine = seed.specLine;

  return product;
}

export const products: Product[] = SEEDS.map(toProduct);
