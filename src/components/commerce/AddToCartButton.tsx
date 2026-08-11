"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useCart } from "@/lib/cart/CartProvider";
import { defaultVariant, isPurchasable } from "@/lib/format";
import type { Product } from "@/types/product";

interface AddToCartButtonProps {
  product: Product;
  /** Explicit variant, when a selector is present. Defaults to the first sellable one. */
  variantId?: string;
  quantity?: number;
  className?: string;
  variant?: "primary" | "ash";
  label?: string;
}

/**
 * A product that can't be bought isn't broken — it's an enquiry. The control
 * becomes a contact link rather than a dead button.
 */
export function AddToCartButton({
  product,
  variantId,
  quantity = 1,
  className = "",
  variant = "primary",
  label = "Add to cart",
}: AddToCartButtonProps) {
  const { add, isPending } = useCart();

  const selected = variantId
    ? product.variants.find((v) => v.id === variantId)
    : defaultVariant(product);

  const sellable = isPurchasable(product) && selected?.availableForSale;

  if (!sellable) {
    return (
      <ButtonLink
        href={`/contact?enquiry=product&product=${product.handle}`}
        variant="outline"
        className={`justify-center ${className}`.trim()}
      >
        {product.availability.status === "out-of-stock"
          ? "Notify me"
          : "Enquire"}
      </ButtonLink>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add(product, quantity, selected?.id);
      }}
      className={`p1-btn p1-btn--${variant} justify-center ${className}`.trim()}
    >
      {isPending ? "Adding…" : label}
    </button>
  );
}
