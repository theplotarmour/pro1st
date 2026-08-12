import { Container } from "@/components/ui/Container";
import { ReviewList } from "@/components/reviews/ReviewList";
import { Stars } from "@/components/reviews/Stars";
import { WriteReviewForm } from "@/components/reviews/WriteReviewForm";
import { getProductReviews, isJudgemeConfigured } from "@/lib/reviews/judgeme";

/**
 * Product reviews section.
 *
 * A server component: the Judge.me private token authenticates by query
 * parameter, so the fetch has to happen where the token can never be
 * serialised to the client. Only the finished review objects cross over.
 *
 * Renders nothing at all when Judge.me is unconfigured. An empty "0 reviews"
 * block on every product is worse than no block — it advertises that nobody
 * has bought the thing.
 */
export async function ProductReviews({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  if (!isJudgemeConfigured()) return null;

  const { reviews, count, average, distribution } =
    await getProductReviews(productId);

  const externalId = Number(String(productId).replace(/\D/g, ""));

  return (
    <Container as="section" id="reviews" className="border-t border-hairline py-20 lg:py-28">
      <div className="mb-12">
        <div className="p1-eyebrow mb-5">[ Reviews ]</div>
        <h2 className="p1-h2">What owners report.</h2>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <div>
          {count > 0 && average !== null ? (
            <>
              <div className="flex items-baseline gap-4">
                <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em] text-strong">
                  {average.toFixed(1)}
                </span>
                <div>
                  <Stars
                    value={average}
                    size="18px"
                    label={`${average} out of 5`}
                  />
                  <div className="p1-mono mt-2 text-muted">
                    {count} {count === 1 ? "review" : "reviews"}
                  </div>
                </div>
              </div>

              {/*
                The distribution is the part a buyer actually reads — an
                average of 4.6 means something different at three reviews than
                at three hundred, and the shape says which.
              */}
              <dl className="mt-8 flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const value = distribution[star - 1] ?? 0;
                  const share = count > 0 ? (value / count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <dt className="p1-mono w-8 flex-none text-soft">
                        {star}★
                      </dt>
                      <dd className="m-0 flex flex-1 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="h-1 flex-1 bg-[var(--hairline)]"
                        >
                          <span
                            className="block h-full bg-signal"
                            style={{ width: `${share}%` }}
                          />
                        </span>
                        <span className="p1-mono w-6 flex-none text-right text-faint">
                          {value}
                        </span>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </>
          ) : (
            <p className="p1-body max-w-[36ch]">
              No reviews yet. If you own this unit, yours would be the first.
            </p>
          )}

          <div className="mt-9">
            <WriteReviewForm
              productExternalId={externalId}
              productTitle={productTitle}
            />
          </div>
        </div>

        <div>
          {count > 0 ? (
            <ReviewList reviews={reviews} />
          ) : (
            <p className="p1-mono border-t border-hairline pt-7 text-faint">
              Nothing here yet.
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}
