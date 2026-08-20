import { NextResponse, type NextRequest } from "next/server";
import { formatPrice, priceLabel } from "@/lib/format";
import { productRepository } from "@/lib/products";

/**
 * Type-ahead endpoint for the header search.
 *
 * The ranking lives in `searchProducts` and runs against the in-process
 * catalogue cache, so this handler does no Shopify round trip on a warm
 * process — which is what makes a request per keystroke affordable. It is
 * still debounced on the client; this is the floor, not a licence.
 *
 * The response is a deliberately narrow projection rather than the `Product`
 * shape. A product carries variants, options, specifications and full
 * descriptions, none of which a six-row dropdown renders, and shipping all of
 * it would put tens of kilobytes on every keystroke.
 */

/** Rows in the dropdown. The full grid is one click away on /search. */
const LIMIT = 6;

export interface SearchHit {
  handle: string;
  title: string;
  category: string;
  price: string;
  image: { src: string; alt: string } | null;
  inStock: boolean;
}

export interface SearchResponse {
  query: string;
  total: number;
  hits: SearchHit[];
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json<SearchResponse>({ query, total: 0, hits: [] });
  }

  let results;
  try {
    results = await productRepository.search(query);
  } catch (error) {
    console.error("[pro1st] Search failed.", error);
    // A dead search must not throw a 500 into a keystroke handler; an empty
    // result reads as "nothing found", which is the honest degradation.
    return NextResponse.json<SearchResponse>({ query, total: 0, hits: [] });
  }

  const hits = results.slice(0, LIMIT).map<SearchHit>((product) => {
    const image = product.images[0];
    return {
      handle: product.handle,
      title: product.title,
      category: product.category,
      price:
        typeof product.price === "number"
          ? formatPrice(product.price, product.currency)
          : priceLabel(product),
      image: image ? { src: image.src, alt: image.alt } : null,
      inStock: product.availability.status === "in-stock",
    };
  });

  return NextResponse.json<SearchResponse>({
    query,
    total: results.length,
    hits,
  });
}
