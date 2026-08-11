"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, Product } from "@/types/product";

/**
 * Local cart — Phase 4.
 *
 * Deliberately mirrors the shape of a Shopify cart (lines, quantities,
 * subtotal, checkout handoff) so Phase 5 replaces the internals of this
 * provider and nothing else.
 */

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  currency: string;
  isOpen: boolean;
  isReady: boolean;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "pro1st.cart.v1";

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setLines(readStorage());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* Storage unavailable (private mode) — the cart stays in memory. */
    }
  }, [lines, isReady]);

  const add = useCallback((product: Product, quantity = 1) => {
    if (typeof product.price !== "number") return;
    const price = product.price;

    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          handle: product.handle,
          title: product.title,
          category: product.category,
          price,
          currency: product.currency ?? "INR",
          image: product.images[0],
          quantity,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((l) => l.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) =>
            l.productId === productId ? { ...l, quantity } : l,
          ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      currency: lines[0]?.currency ?? "INR",
      isOpen,
      isReady,
      add,
      remove,
      setQuantity,
      clear,
      open,
      close,
    };
  }, [lines, isOpen, isReady, add, remove, setQuantity, clear, open, close]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
