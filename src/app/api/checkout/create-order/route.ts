import { NextResponse } from "next/server";
import { CheckoutError, startCheckout } from "@/lib/checkout/service";

/**
 * Creates the Magic Checkout order directly from the server-side cart — no
 * request body needed, the cart is already tracked in a cookie. See
 * src/lib/checkout/service.ts for why address collection happens inside
 * Razorpay's own UI now, not here.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await startCheckout();
    return NextResponse.json({
      orderId: result.razorpayOrderId,
      amount: result.amountPaise,
      currency: result.currency,
      keyId: result.keyId,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[pro1st] create-order failed.", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
