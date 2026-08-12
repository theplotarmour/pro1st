"use client";

import { useState } from "react";
import { Stars } from "@/components/reviews/Stars";
import type { JudgemeReview } from "@/lib/reviews/judgeme";

const PAGE_SIZE = 5;

/**
 * The reviews themselves, paginated.
 *
 * Pagination is local. The whole product's reviews already arrived with the
 * page — Judge.me's index endpoint pages across the entire store rather than
 * one product, so fetching "page 2 of this product" is not a request that
 * exists. Slicing an array the server already sent is both correct and
 * instant.
 *
 * `title` and `body` are rendered as text nodes. The Judge.me spec states
 * plainly that both are raw and unsanitised, so they are never passed to
 * dangerouslySetInnerHTML — a review body is attacker-controlled input.
 */
export function ReviewList({ reviews }: { reviews: JudgemeReview[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = reviews.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <ol className="m-0 flex list-none flex-col gap-0 p-0">
        {shown.map((review) => (
          <li key={review.id} className="border-t border-hairline py-7">
            <div className="flex flex-wrap items-center gap-4">
              <Stars
                value={review.rating}
                size="14px"
                label={`${review.rating} out of 5`}
              />
              <span className="p1-mono text-muted">
                {review.reviewer?.name?.trim() || "Verified buyer"}
              </span>
              {review.verified ? (
                <span className="p1-mono text-signal">Verified</span>
              ) : null}
              {review.created_at ? (
                <time
                  dateTime={review.created_at}
                  className="p1-mono ml-auto text-faint"
                >
                  {formatDate(review.created_at)}
                </time>
              ) : null}
            </div>

            {review.title ? (
              <h3 className="mt-4 font-display text-base font-medium text-strong">
                {review.title}
              </h3>
            ) : null}

            {review.body ? (
              <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.65] text-body">
                {review.body}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      {pages > 1 ? (
        <nav
          aria-label="Reviews pagination"
          className="flex items-center gap-4 border-t border-hairline pt-6"
        >
          <button
            type="button"
            onClick={() => setPage(current - 1)}
            disabled={current === 1}
            className="p1-mono cursor-pointer border border-hairline px-4 py-2 text-ash transition-colors hover:border-signal hover:text-signal disabled:cursor-default disabled:opacity-35 disabled:hover:border-hairline disabled:hover:text-ash"
          >
            ← Newer
          </button>
          <span aria-live="polite" className="p1-mono text-soft">
            {current} / {pages}
          </span>
          <button
            type="button"
            onClick={() => setPage(current + 1)}
            disabled={current === pages}
            className="p1-mono cursor-pointer border border-hairline px-4 py-2 text-ash transition-colors hover:border-signal hover:text-signal disabled:cursor-default disabled:opacity-35 disabled:hover:border-hairline disabled:hover:text-ash"
          >
            Older →
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
