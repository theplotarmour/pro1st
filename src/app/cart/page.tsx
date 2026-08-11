import type { Metadata } from "next";
import { CartView } from "@/components/commerce/CartView";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your PRO1st cart.",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <PageHeader eyebrow="[ Cart ]" title="Your rig." />
      <Container as="section" className="pb-24 lg:pb-32">
        <CartView />
      </Container>
    </>
  );
}
