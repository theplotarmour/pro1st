import { NextResponse, type NextRequest } from "next/server";
import { getShippingQuote } from "@/lib/checkout/service";

/**
 * Magic Checkout's shipping-info endpoint. Per Razorpay's own docs this is
 * "publicly accessible, requires no authentication" by design — Razorpay
 * calls it server-to-server live as the buyer fills in an address. It stays
 * a pure read/quote calculator (real Shopify-computed rates, see
 * getShippingQuote), never a mutation, which is what makes that safe.
 *
 * Request shape per Razorpay's docs:
 * { order_id, razorpay_order_id, email, contact, addresses: [{id, zipcode, state_code, country, ...}] }
 * `order_id` here is the receipt this app set at order-creation — the
 * cart's own token — which is what resolves the cart, not razorpay_order_id.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ShippingRequestAddress {
  id: string;
  address1?: string;
  city?: string;
  state_code?: string;
  zipcode?: string;
  country?: string;
}

interface ShippingRequestBody {
  order_id?: string;
  addresses?: ShippingRequestAddress[];
}

export async function POST(request: NextRequest) {
  let body: ShippingRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.order_id || !Array.isArray(body.addresses)) {
    return NextResponse.json({ error: "Missing order_id or addresses." }, { status: 400 });
  }

  try {
    const results = await getShippingQuote(
      body.order_id,
      body.addresses.map((address) => ({
        id: address.id,
        address1: address.address1,
        city: address.city,
        state: address.state_code,
        zipcode: address.zipcode ?? "",
        country: address.country ?? "IN",
      })),
    );

    return NextResponse.json({
      addresses: results.map((result) => ({
        id: result.id,
        shipping_methods: result.shippingMethods.map((method) => ({
          id: method.id,
          name: method.name,
          serviceable: method.serviceable,
          shipping_fee: method.shippingFeePaise,
          cod: false,
        })),
      })),
    });
  } catch (error) {
    console.error("[pro1st] magic/shipping failed.", error);
    // Not-serviceable, not a 500 — a buyer mid-checkout should never see a
    // broken-looking step over a transient Shopify hiccup.
    return NextResponse.json({
      addresses: (body.addresses ?? []).map((address) => ({
        id: address.id,
        shipping_methods: [],
      })),
    });
  }
}
