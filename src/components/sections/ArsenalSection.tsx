import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/types/product";

interface ArsenalSectionProps {
  products: Product[];
  totalCount: number;
  eyebrow?: string;
  title?: string;
  as?: "h1" | "h2";
  tilt?: boolean;
}

/** Featured product block. Data arrives as a prop — never fetched in here. */
export function ArsenalSection({
  products,
  totalCount,
  eyebrow = "[ 04 — On the floor ]",
  title = "What professionals reorder.",
  as = "h2",
  tilt = true,
}: ArsenalSectionProps) {
  return (
    <Container
      as="section"
      id="products"
      className="border-t border-hairline py-24 lg:py-32"
    >
      <Reveal className="mb-14">
        <SectionHeading eyebrow={eyebrow} title={title} as={as} />
      </Reveal>

      <ProductGrid products={products} tilt={tilt} priorityCount={4} />

      <Link href="/products" className="p1-link mt-12">
        View all {totalCount} products →
      </Link>
    </Container>
  );
}
