import { NextResponse } from "next/server";

/**
 * Magic Checkout's "list promotions" endpoint — surfaces codes proactively
 * before the buyer types one. No mechanism exists in this app to enumerate
 * "active, worth advertising" discount codes in bulk (that's a curated
 * marketing feature, not something Shopify's Discounts API lists as a set
 * meant for this), so this returns an empty list rather than guessing.
 * Codes are still validated on entry via /magic/promotions/apply.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ promotions: [] });
}
