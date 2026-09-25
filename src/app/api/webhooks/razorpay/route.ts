import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay/client";
import { CheckoutError, completePaymentFromWebhook } from "@/lib/checkout/service";

/**
 * Server-side reconciliation for Razorpay payments.
 *
 * The frontend's `verify-payment` call is for immediate UX; this is the
 * durable path — it fires even if the buyer closes the tab right after
 * paying. Both ultimately reach the same idempotency-guarded completion
 * logic in `src/lib/checkout/service.ts`, so whichever lands first
 * completes the Shopify draft order and the other is a no-op.
 *
 * Register this URL in the Razorpay dashboard under Settings → Webhooks,
 * subscribed to `payment.captured`, and copy the signing secret it shows
 * into RAZORPAY_WEBHOOK_SECRET. Modeled on the existing Shopify webhook
 * receiver at src/app/api/revalidate/route.ts.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[pro1st] /api/webhooks/razorpay: RAZORPAY_WEBHOOK_SECRET not set.");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) return NextResponse.json({ ok: false }, { status: 401 });

  // The raw body is what Razorpay signed — parse only after verifying.
  const rawBody = await request.text();
  const valid = verifyWebhookSignature({ rawBody, signature, secret });
  if (!valid) return NextResponse.json({ ok: false }, { status: 401 });

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (event.event !== "payment.captured") {
    // Acknowledge and ignore — we only subscribed to payment.captured, but
    // Razorpay dashboards sometimes fan a webhook URL out to more events.
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment?.order_id) {
    return NextResponse.json(
      { ok: false, error: "Webhook payload missing payment id/order id." },
      { status: 400 },
    );
  }

  try {
    await completePaymentFromWebhook(payment.order_id, payment.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CheckoutError) {
      console.error(`[pro1st] webhook completePayment: ${error.message}`);
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[pro1st] webhook completePayment failed.", error);
    // Non-2xx tells Razorpay to retry the webhook.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
