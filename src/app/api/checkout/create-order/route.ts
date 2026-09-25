import { NextResponse, type NextRequest } from "next/server";
import { CheckoutError, startCheckout } from "@/lib/checkout/service";

/**
 * Step 1 of Razorpay Standard Checkout: turn the visitor's server-side cart
 * into a Shopify draft order (authoritative pricing) and a matching
 * Razorpay order the checkout modal opens against. See
 * `src/lib/checkout/service.ts` for why a draft order comes first.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateOrderBody {
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  shippingAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  };
}

function missingField(value: unknown): value is undefined | "" {
  return typeof value !== "string" || value.trim().length === 0;
}

export async function POST(request: NextRequest) {
  let body: CreateOrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { customer, shippingAddress } = body;
  const requiredCustomerFields = [
    customer?.email,
    customer?.firstName,
    customer?.lastName,
  ];
  const requiredAddressFields = [
    shippingAddress?.address1,
    shippingAddress?.city,
    shippingAddress?.zip,
    shippingAddress?.country,
  ];

  if (
    requiredCustomerFields.some(missingField) ||
    requiredAddressFields.some(missingField)
  ) {
    return NextResponse.json(
      { error: "Missing required customer or address fields." },
      { status: 400 },
    );
  }

  try {
    const result = await startCheckout(
      {
        email: customer!.email!.trim(),
        firstName: customer!.firstName!.trim(),
        lastName: customer!.lastName!.trim(),
        phone: customer!.phone?.trim(),
      },
      {
        address1: shippingAddress!.address1!.trim(),
        address2: shippingAddress!.address2?.trim(),
        city: shippingAddress!.city!.trim(),
        province: shippingAddress!.province?.trim(),
        zip: shippingAddress!.zip!.trim(),
        country: shippingAddress!.country!.trim(),
      },
    );

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
