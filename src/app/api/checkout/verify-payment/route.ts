import { NextResponse, type NextRequest } from "next/server";
import { CheckoutError, verifyAndCompletePayment } from "@/lib/checkout/service";

/**
 * Step 3 of Razorpay Standard Checkout: the frontend success callback lands
 * here with the three Razorpay fields. `completePayment` verifies the
 * signature, confirms the payment is captured, and completes the Shopify
 * draft order — see `src/lib/checkout/service.ts`. This is never the only
 * caller: the webhook route hits the same function so a lost network reply
 * here doesn't leave a paid order stuck as a draft.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyPaymentBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export async function POST(request: NextRequest) {
  let body: VerifyPaymentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json(
      { error: "Missing razorpay_order_id, razorpay_payment_id or razorpay_signature." },
      { status: 400 },
    );
  }

  try {
    const result = await verifyAndCompletePayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return NextResponse.json({ ok: true, orderName: result.orderName });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[pro1st] verify-payment failed.", error);
    return NextResponse.json(
      { error: "Could not verify payment. Please contact us with your payment ID." },
      { status: 500 },
    );
  }
}
