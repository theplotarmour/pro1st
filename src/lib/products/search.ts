import type { Product } from "@/types/product";

/**
 * Catalogue search: matching and ranking, in one place.
 *
 * This replaced a Shopify query of the form `term OR sku:*term* OR tag:term`
 * sorted by RELEVANCE, which had two faults that showed up immediately on a
 * real search.
 *
 * The first is why "amplifier" returned microphones. Shopify's default
 * product search reads the body copy, and a microphone's description says
 * things like "connect to an amplifier" — so the mic matched, on a phrase
 * that describes what the product plugs into rather than what it is. The
 * fix is that **description is not a matchable field here**. A product is
 * only a result if the query matches its identity: title, category, tags,
 * SKU or vendor.
 *
 * The second is why they came back interleaved. `OR` across three clauses
 * gave Shopify no way to rank a title hit above a tag hit, so amplifiers
 * appeared, then microphones, then more amplifiers. Ranking is explicit here
 * and every weight is visible below.
 *
 * Running locally rather than as a query is a deliberate trade. The
 * catalogue is a few dozen products and is already resident — `getRelated`
 * leans on the same cache for the same reason — so a search costs no network
 * call at all, which is what makes typing-speed results possible without
 * hitting Shopify on every keystroke. It stops being the right trade in the
 * thousands, at which point this becomes a Shopify `search` query with the
 * ranking pushed server-side.
 */

/** Terms shorter than this are ignored unless they are the entire query. */
const MIN_TERM = 2;

/*
  Weights. Ordered by how strongly the field states what a product *is*.

  A SKU hit outranks everything but an exact title: someone typing
  "DE-PRO1ST-MX1600" knows precisely what they want and is not browsing.
*/
const SCORE = {
  titleExact: 1000,
  sku: 320,
  titleWordExact: 140,
  titleWordPrefix: 100,
  titleSubstring: 60,
  categoryExact: 80,
  categoryPrefix: 55,
  tagExact: 50,
  tagPrefix: 32,
  vendor: 20,
} as const;

/** Lowercase, punctuation to spaces, runs collapsed. */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(value: string): string[] {
  const flat = normalise(value);
  return flat ? flat.split(" ") : [];
}

/**
 * Crude singular form, enough for "amplifiers" to reach "Amplifier".
 *
 * Not a stemmer. A real one would fold "housing" to "hous" and start
 * matching things nobody asked for; trailing plurals are the only case this
 * catalogue actually hits.
 */
function stem(word: string): string {
  if (word.length > 3 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** True when `word` is the term, allowing for a trailing plural on either. */
function sameWord(word: string, term: string): boolean {
  return word === term || stem(word) === stem(term);
}

function startsWith(word: string, term: string): boolean {
  return word.startsWith(term) || stem(word).startsWith(stem(term));
}

/** How strongly one product answers one term. Zero means it does not. */
function scoreTerm(product: Product, term: string): number {
  const title = normalise(product.title);
  const titleWords = words(product.title);
  const categoryWords = words(product.category);
  const sku = normalise(product.sku ?? "");

  let score = 0;

  if (title === term) score += SCORE.titleExact;

  if (sku && sku.includes(term)) score += SCORE.sku;

  if (titleWords.some((word) => sameWord(word, term))) {
    score += SCORE.titleWordExact;
  } else if (titleWords.some((word) => startsWith(word, term))) {
    score += SCORE.titleWordPrefix;
  } else if (title.includes(term)) {
    // Catches a term that straddles a word break, e.g. "mx1600" against
    // "MX-1600", which normalisation has split into two words.
    score += SCORE.titleSubstring;
  }

  if (categoryWords.some((word) => sameWord(word, term))) {
    score += SCORE.categoryExact;
  } else if (categoryWords.some((word) => startsWith(word, term))) {
    score += SCORE.categoryPrefix;
  }

  for (const tag of product.tags) {
    const tagWords = words(tag);
    if (tagWords.some((word) => sameWord(word, term))) {
      score += SCORE.tagExact;
      break;
    }
    if (tagWords.some((word) => startsWith(word, term))) {
      score += SCORE.tagPrefix;
      break;
    }
  }

  if (product.vendor && words(product.vendor).some((w) => sameWord(w, term))) {
    score += SCORE.vendor;
  }

  return score;
}

/**
 * Rank `products` against `query`, strongest first.
 *
 * Every term must match something. "power amplifier" returns the units that
 * are both, not everything that is either — an OR across terms is what makes
 * a two-word search return more results than a one-word search, which is the
 * opposite of what typing a second word means.
 */
export function searchProducts(
  products: Product[],
  query: string,
  limit?: number,
): Product[] {
  const terms = words(query).filter(
    (term, _index, all) => term.length >= MIN_TERM || all.length === 1,
  );
  if (terms.length === 0) return [];

  const ranked: { product: Product; score: number }[] = [];

  for (const product of products) {
    let total = 0;
    let matchedEvery = true;

    for (const term of terms) {
      const score = scoreTerm(product, term);
      if (score === 0) {
        matchedEvery = false;
        break;
      }
      total += score;
    }

    if (matchedEvery) ranked.push({ product, score: total });
  }

  ranked.sort(
    (a, b) =>
      b.score - a.score ||
      // Stable and predictable past the score: in stock first, then
      // alphabetical. Without a tie-break the order depends on catalogue
      // order, which shifts whenever the merchant reorders a collection.
      Number(b.product.availability.status === "in-stock") -
        Number(a.product.availability.status === "in-stock") ||
      a.product.title.localeCompare(b.product.title),
  );

  const hits = ranked.map((entry) => entry.product);
  return limit ? hits.slice(0, limit) : hits;
}
