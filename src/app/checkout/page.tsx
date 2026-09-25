import type { Metadata } from "next";
import { RazorpayCheckoutForm } from "@/components/commerce/RazorpayCheckoutForm";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="[ Checkout ]"
        title="Where's it going."
        lead="Payment is handled by Razorpay — this application never sees your card details."
      />

      <Container as="section" className="pb-24 lg:pb-32">
        <div className="max-w-3xl">
          <RazorpayCheckoutForm />
        </div>
      </Container>
    </>
  );
}
