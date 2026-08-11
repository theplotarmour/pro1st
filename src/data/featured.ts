/**
 * Curated line-ups, by Shopify product handle.
 *
 * These are the fallback. The moment a product has `custom.featured = true`
 * in Shopify, the metafield wins and merchandising moves into the merchant's
 * hands where it belongs — see `getFeaturedProducts()`.
 *
 * Handles below are the real handles in pro1st-2.myshopify.com.
 */

/** Homepage "On the floor" grid. */
export const bestSellerHandles = [
  "pro-1st-aj6-professional-audio-mixer",
  "pro1st-mx-1600-professional-power-amplifier",
  "pro-1st-780-tn-high-power-compression-driver-1",
  "pro-1st-party-box-portable-bluetooth-speaker",
  "pro1st-xtr-6-0-feedback-eliminator",
  "pro-1st-tk600-dynamic-microphone",
  "pro1st-d-750-hf-cross-over-network",
  "pro-1st-beta58s-dynamic-vocal-microphone",
];

/**
 * Arsenal flagships, per the brief.
 *
 * The brief also lists the T-12 12" Trolley Speaker, which does not exist in
 * the Shopify catalogue. It is deliberately not referenced here — a handle
 * with no product would render a hole in the grid.
 */
export const arsenalHandles = [
  "pro-1st-aj6-professional-audio-mixer",
  "pro-1st-stereo-echo-audio-mixer",
  "pro1st-mx-1600-professional-power-amplifier",
  "pro-1st-780-tn-high-power-compression-driver-1",
  "pro1st-xtr-6-0-feedback-eliminator",
  "pro-1st-party-box-portable-bluetooth-speaker",
];

/** Products used as the visual anchors of the signal-chain section. */
export const chainHandles = {
  source: "pro-1st-tk600-dynamic-microphone",
  mixer: "pro-1st-aj6-professional-audio-mixer",
  processor: "pro1st-xtr-6-0-feedback-eliminator",
  amplifier: "pro1st-mx-1600-professional-power-amplifier",
  crossover: "pro1st-d-750-hf-cross-over-network",
  driver: "pro-1st-780-tn-high-power-compression-driver-1",
  cabinet: "pro-1st-party-box-portable-bluetooth-speaker",
} as const;
