/**
 * Brand editorial.
 *
 * Voice, not data. Every product fact — name, price, image, availability —
 * is resolved from Shopify at request time by `lib/content/sections.ts`.
 * Nothing in this file describes a product; it only describes the brand's
 * position on one.
 *
 * All copy carried over verbatim from the approved design source. No dates,
 * figures or claims have been added.
 */

import type { chainHandles } from "./featured";

export interface ChainRole {
  key: keyof typeof chainHandles;
  label: string;
  /** What this stage does in the chain — editorial, not a spec sheet. */
  spec: string;
}

/** Source to subwoofer: the seven stages, in signal order. */
export const chainRoles: ChainRole[] = [
  { key: "source", label: "Source", spec: "Where the performance enters the chain" },
  { key: "mixer", label: "Mixer", spec: "Levels, tone and routing under one hand" },
  { key: "processor", label: "Processor", spec: "Cleans the room before it fights back" },
  { key: "amplifier", label: "Amplifier", spec: "Turns line level into moved air" },
  { key: "crossover", label: "Crossover", spec: "Sends each band to the driver built for it" },
  { key: "driver", label: "Driver", spec: "The last piece of metal before the room" },
  { key: "cabinet", label: "Cabinet", spec: "Everything above, in a box you can carry" },
];

export const buildCopy = {
  eyebrow: "[ 01 — The build ]",
  heading: "Eight layers. One chassis.",
  lead: "Pressed and stacked in the order it leaves our floor.",
  /** Which Shopify product is taken apart in this section. */
  handle: "pro1st-mx-1600-professional-power-amplifier",
  shortName: "MX-1600",
  callouts: [
    { text: "Pressed steel faceplate", side: "left", top: "24%", rule: 80 },
    { text: "Hand-biased output pairs", side: "left", top: "62%", rule: 110 },
    { text: "Extruded heat-sink flank", side: "right", top: "33%", rule: 80 },
    { text: "Built for continuous load", side: "right", top: "70%", rule: 110 },
  ],
} as const;

export const craftCopy = [
  {
    handle: "pro-1st-780-tn-high-power-compression-driver-1",
    title: "Magnet, voice coil, titanium.",
    body: "Compression drivers sourced from specialists, mated to housings built on our floor, so they survive humidity, road shocks and 14-hour weddings.",
  },
  {
    handle: "pro1st-mx-1600-professional-power-amplifier",
    title: "Pressed, painted, assembled.",
    body: "The amplifier chassis is pressed, painted and assembled in Delhi. Output transistors are matched in pairs and biased by hand.",
  },
  {
    handle: "pro-1st-party-box-portable-bluetooth-speaker",
    title: "Wheels, handle, weatherproof shell.",
    body: "A portable cabinet is a tool, not a trophy. Reinforced corners, gasket-sealed back panel, batteries that outlast the gig.",
  },
] as const;

export const originCopy = {
  eyebrow: "[ 02 — Origin ]",
  heading: "From a workshop in Chandni Chowk, we move air across India.",
  body: [
    "Desire Electronics has traded in audio since 2004. PRO1st is the professional line: imported drivers, transformers and DSP boards mated to housings, chassis and crossovers built on our own floor at Moti Cinema Compound.",
    "That split is deliberate. We buy the components nobody should improvise, and we build the parts that decide whether a cabinet survives a monsoon load-in. Every unit is bench-tested before it leaves the compound.",
  ],
  /**
   * CONFIRM — no facility photography exists in Shopify Files yet, so this
   * falls back to flagship product media. Upload a real workshop photograph
   * and point this at it.
   */
  imageHandle: "pro1st-mx-1600-professional-power-amplifier",
} as const;
