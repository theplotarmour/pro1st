"use client";

import { useCart } from "@/lib/cart/CartProvider";
import { availabilityLabel, isPurchasable } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import type { Product } from "@/types/product";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
  variant?: "primary" | "ash";
  /** Compact label used inside product cards. */
  label?: string;
}

/**
 * Products without a price aren't broken — they're an enquiry. The button
 * becomes a contact link rather than a dead control.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  className = "",
  variant = "primary",
  label = "Add to cart",
}: AddToCartButtonProps) {
  const { add } = useCart();

  if (!isPurchasable(product)) {
    return (
      <ButtonLink
        href={`/contact?enquiry=product&product=${product.handle}`}
        variant="outline"
        className={`justify-center ${className}`.trim()}
      >
        {availabilityLabel(product) === "Coming soon"
          ? "Notify me"
          : "Enquire"}
      </ButtonLink>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add(product, quantity);
      }}
      className={`p1-btn p1-btn--${variant} justify-center ${className}`.trim()}
    >
      {label}
    </button>
  );
}
