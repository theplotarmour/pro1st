import { NextResponse, type NextRequest } from "next/server";
import { CheckoutError, validateDiscountCode } from "@/lib/checkout/service";

/**
 * Magic Checkout's "apply promotions" endpoint. Validates the typed-in code
 * against a real Shopify discount code — see
 * src/lib/checkout/service.ts#validateDiscountCode. Unauthenticated by
 * Razorpay's own design, same reasoning as /magic/shipping.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApplyPromotionBody {
  order_id?: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  let body: ApplyPromotionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.order_id || !body.code) {
    return NextResponse.json({ error: "Missing order_id or code." }, { status: 400 });
  }

  try {
    const result = await validateDiscountCode(body.code, body.order_id);
    return NextResponse.json({
      promotion: {
        reference_id: result.code,
        type: "offer",
        code: result.code,
        value: result.valuePaise,
        value_type: result.valueType === "PERCENTAGE" ? "percentage" : "fixed_amount",
        description: result.description,
      },
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[pro1st] magic/promotions/apply failed.", error);
    return NextResponse.json({ error: "Could not validate this code." }, { status: 500 });
  }
}
