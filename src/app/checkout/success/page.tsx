import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <>
      <PageHeader
        eyebrow="[ Order confirmed ]"
        title="Payment received."
        lead={
          order
            ? `Order ${order} is confirmed. We'll be in touch with dispatch details.`
            : "Your order is confirmed. We'll be in touch with dispatch details."
        }
      />

      <Container as="section" className="pb-24 lg:pb-32">
        <Link href="/products" className="p1-btn p1-btn--primary">
          Continue shopping
        </Link>
      </Container>
    </>
  );
}
