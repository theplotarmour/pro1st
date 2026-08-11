"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Cart, Product } from "@/types/product";
import {
  addToCartAction,
  clearCartAction,
  fetchCartAction,
  removeCartLineAction,
  updateCartLineAction,
  type CartResult,
} from "./actions";

/**
 * Client-side cart state.
 *
 * The cart itself lives in Shopify; this provider is a view of it. Every
 * mutation goes through a server action and the authoritative cart comes
 * back — quantities, availability and totals are never computed here, so the
 * UI cannot disagree with what the buyer will be charged.
 */

interface CartContextValue {
  cart: Cart | null;
  lines: Cart["lines"];
  count: number;
  subtotal: number;
  currency: string;
  checkoutUrl: string | null;
  isOpen: boolean;
  isReady: boolean;
  isPending: boolean;
  error: string | null;
  add: (product: Product, quantity?: number, variantId?: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  dismissError: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    fetchCartAction()
      .then((result) => {
        if (!active) return;
        setCart(result.cart);
        if (result.error) setError(result.error);
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const apply = useCallback((result: CartResult) => {
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    setCart(result.cart);
  }, []);

  const run = useCallback(
    (operation: () => Promise<CartResult>) => {
      startTransition(async () => {
        apply(await operation());
      });
    },
    [apply],
  );

  const add = useCallback(
    (product: Product, quantity = 1, variantId?: string) => {
      // Fall back to the first sellable variant — single-variant products
      // still have exactly one, so this covers the whole catalogue.
      const id =
        variantId ??
        product.variants.find((v) => v.availableForSale)?.id ??
        product.variants[0]?.id;

      if (!id) {
        setError("This product can't be added to the cart yet.");
        return;
      }

      setIsOpen(true);
      run(() => addToCartAction(id, quantity));
    },
    [run],
  );

  const setQuantity = useCallback(
    (lineId: string, quantity: number) =>
      run(() => updateCartLineAction(lineId, quantity)),
    [run],
  );

  const remove = useCallback(
    (lineId: string) => run(() => removeCartLineAction(lineId)),
    [run],
  );

  const clear = useCallback(() => run(() => clearCartAction()), [run]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      lines: cart?.lines ?? [],
      count: cart?.totalQuantity ?? 0,
      subtotal: cart?.subtotal ?? 0,
      currency: cart?.currency ?? "INR",
      checkoutUrl: cart?.checkoutUrl ?? null,
      isOpen,
      isReady,
      isPending,
      error,
      add,
      setQuantity,
      remove,
      clear,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      dismissError: () => setError(null),
    }),
    [
      cart,
      isOpen,
      isReady,
      isPending,
      error,
      add,
      setQuantity,
      remove,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
