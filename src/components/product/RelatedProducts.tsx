import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/types/product";
import { ProductGrid } from "./ProductGrid";

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="border-t border-hairline pt-16"
    >
      <SectionHeading
        eyebrow="[ Also on the floor ]"
        title={<span id="related-heading">Pairs with</span>}
        className="mb-12"
      />
      <ProductGrid products={products} />
    </section>
  );
}
