import type { Product } from "@/types/product";
import { IMG } from "./images";

/**
 * MOCK CATALOGUE — development data only.
 *
 * Every title, price and spec line below is carried over verbatim from the
 * approved design source. Nothing here is invented: where the design source
 * gave no price or no technical figures, the field is simply absent and the
 * UI renders its empty state.
 *
 * This file is replaced wholesale by the Shopify Storefront API in Phase 5.
 * Consume it through `@/lib/products` — never import it into a component.
 */
export const products: Product[] = [
  {
    id: "aj6",
    handle: "aj6-mixer",
    title: "AJ6 Professional Audio Mixer",
    category: "Mixers",
    specLine: "6-channel · 99 DSP · Phantom",
    price: 6750,
    currency: "INR",
    images: [{ src: IMG.aj6, alt: "AJ6 professional audio mixer" }],
    availability: { status: "in-stock" },
    tags: ["mixer", "voice mixer", "dsp", "phantom power", "flagship"],
  },
  {
    id: "um6",
    handle: "um6-mixer",
    title: "UM6 Stereo Mixer",
    category: "Mixers",
    images: [{ src: IMG.um6, alt: "UM6 stereo mixer" }],
    tags: ["mixer", "stereo", "flagship"],
  },
  {
    id: "mx-1600",
    handle: "mx-1600",
    title: "MX-1600 Professional Power Booster",
    category: "Amplifiers",
    specLine: "1600W · Pro booster",
    price: 25000,
    currency: "INR",
    images: [
      {
        src: IMG.mx1600,
        alt: "MX-1600 professional power booster amplifier",
      },
    ],
    availability: { status: "in-stock" },
    tags: ["amplifier", "power booster", "1600w", "flagship"],
  },
  {
    id: "780-tn",
    handle: "780-tn",
    title: "780 TN High Power Compression Driver",
    category: "Drivers",
    specLine: "120W · 8Ω · Titanium",
    price: 5500,
    currency: "INR",
    images: [
      { src: IMG.tn780, alt: "780 TN high power compression driver" },
    ],
    availability: { status: "in-stock" },
    tags: ["driver", "compression driver", "titanium", "flagship"],
  },
  {
    id: "party-box",
    handle: "party-box",
    title: "Party Box Portable Bluetooth Speaker",
    category: "Speakers",
    specLine: "Portable · Bluetooth",
    price: 6480,
    currency: "INR",
    images: [
      { src: IMG.partybox, alt: "Party Box portable Bluetooth speaker" },
    ],
    availability: { status: "in-stock" },
    tags: ["speaker", "portable", "bluetooth", "pa system"],
  },
  {
    id: "xtr-60",
    handle: "xtr-60",
    title: "XTR 6.0 Feedback Eliminator",
    category: "Processors",
    specLine: "1U rack · Zero screech",
    price: 11000,
    currency: "INR",
    images: [{ src: IMG.xtr6, alt: "XTR 6.0 feedback eliminator" }],
    availability: { status: "in-stock" },
    tags: ["processor", "feedback eliminator", "rack", "flagship"],
  },
  {
    id: "tk600",
    handle: "tk600",
    title: "TK600 Uni-Directional Dynamic Microphone",
    category: "Microphones",
    specLine: "Uni-directional · Hi-Fi",
    price: 850,
    currency: "INR",
    images: [
      {
        src: IMG.tk600,
        alt: "TK600 uni-directional dynamic microphone",
      },
    ],
    availability: { status: "in-stock" },
    tags: ["microphone", "dynamic", "uni-directional", "xlr"],
  },
  {
    id: "beta-58s",
    handle: "beta-58s",
    title: "BETA 58S Dynamic Microphone",
    category: "Microphones",
    images: [{ src: IMG.beta58, alt: "BETA 58S dynamic microphone" }],
    tags: ["microphone", "dynamic", "xlr"],
  },
  {
    id: "tk280",
    handle: "tk280",
    title: "TK280 Dynamic Microphone",
    category: "Microphones",
    images: [{ src: IMG.tk280, alt: "TK280 dynamic microphone" }],
    tags: ["microphone", "dynamic"],
  },
  {
    id: "d-750",
    handle: "d-750",
    title: "D-750 HF Cross Over Network",
    category: "Crossovers",
    specLine: "3-way · High frequency",
    price: 550,
    currency: "INR",
    images: [{ src: IMG.d750, alt: "D-750 HF cross over network" }],
    availability: { status: "in-stock" },
    tags: ["crossover", "network", "high frequency"],
  },
  {
    id: "d-450",
    handle: "d-450",
    title: "D-450 Cross Over Network",
    category: "Crossovers",
    images: [{ src: IMG.d450, alt: "D-450 cross over network" }],
    tags: ["crossover", "network"],
  },
  {
    id: "d-518",
    handle: "d-518",
    title: "D-518 Tweeter",
    category: "Drivers",
    images: [{ src: IMG.d518, alt: "D-518 tweeter" }],
    tags: ["tweeter", "driver"],
  },
  {
    id: "t-12",
    handle: "t-12",
    title: '12" Trolley Speaker (T-12)',
    category: "Speakers",
    specLine: "Wheeled · Field rated",
    images: [{ src: IMG.t12, alt: '12" T-12 trolley speaker' }],
    availability: { status: "preorder" },
    tags: ["speaker", "trolley", "portable", "flagship"],
  },
  {
    id: "slim-wire-2-core",
    handle: "slim-wire-2-core",
    title: "Slim Wire 2 Core — 100 Yards",
    category: "Accessories",
    images: [{ src: IMG.wire, alt: "Slim 2-core speaker wire, 100 yard roll" }],
    tags: ["accessory", "cable", "wire"],
  },
  {
    id: "ratchet-belt-15m",
    handle: "ratchet-belt-15m",
    title: "Ratchet Belt — 15m",
    category: "Accessories",
    images: [{ src: IMG.ratchet, alt: "15 metre ratchet tie-down belt" }],
    tags: ["accessory", "ratchet belt", "rigging"],
  },
];

/** Handles shown in the homepage "On the floor" grid, in design order. */
export const bestSellerHandles = [
  "aj6-mixer",
  "mx-1600",
  "780-tn",
  "party-box",
  "xtr-60",
  "tk600",
  "d-750",
  "t-12",
];

/** Flagship line-up, per the brief's Arsenal section. */
export const arsenalHandles = [
  "aj6-mixer",
  "um6-mixer",
  "mx-1600",
  "780-tn",
  "t-12",
  "xtr-60",
];
