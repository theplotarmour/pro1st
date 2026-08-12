"use client";

import { useActionState, useState } from "react";
import { Stars } from "@/components/reviews/Stars";
import {
  submitReviewAction,
  type ReviewFormState,
} from "@/lib/reviews/actions";

const INITIAL: ReviewFormState = { status: "idle", message: "" };

/**
 * Write a Review.
 *
 * Collapsed behind a button by default — an open form under every product
 * pushes the reviews themselves off the screen, and the overwhelming majority
 * of readers are here to read rather than write.
 *
 * The rating control is a radio group, not a row of buttons. Radios give
 * keyboard support and a real form value for free, and the stars are drawn as
 * their labels.
 */
export function WriteReviewForm({
  productExternalId,
  productTitle,
}: {
  productExternalId: number;
  productTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [state, action, pending] = useActionState(submitReviewAction, INITIAL);

  if (state.status === "ok") {
    return (
      <p
        role="status"
        className="border border-hairline bg-panel p-6 text-[15px] leading-[1.6] text-body"
      >
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p1-btn p1-btn--outline"
      >
        Write a review
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6 border border-hairline bg-panel p-6">
      <input type="hidden" name="productExternalId" value={productExternalId} />

      <div>
        <h3 className="p1-mono mb-1 text-muted">Review</h3>
        <p className="font-display text-lg font-medium text-strong">
          {productTitle}
        </p>
      </div>

      <fieldset className="border-0 p-0">
        <legend className="p1-label mb-2">Rating</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer p-1"
              title={`${value} out of 5`}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                required
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              {/*
                One star per label, filled or empty. The previous version hid
                the empty track with an arbitrary-variant selector, which
                collapsed the component's box to zero width and made every
                star invisible.
              */}
              <SingleStar filled={rating >= value} />
              <span className="sr-only">{value} out of 5</span>
            </label>
          ))}
          <span className="p1-mono ml-2 text-soft">
            {rating > 0 ? `${rating}/5` : "Select"}
          </span>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="name" label="Name" required autoComplete="name" />
        <Field
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
        />
      </div>

      <Field id="title" label="Headline (optional)" />

      <div>
        <label htmlFor="body" className="p1-label">
          Your review
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          minLength={10}
          className="p1-field resize-y"
          placeholder="How does it perform? Where are you using it?"
        />
      </div>

      <p className="p1-mono normal-case leading-relaxed tracking-[0.04em] text-faint">
        Your email is used to verify the review and is not published.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="p1-btn p1-btn--primary disabled:opacity-50"
        >
          {pending ? "Sending…" : "Submit review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p1-link"
        >
          Cancel
        </button>
      </div>

      <p
        aria-live="polite"
        className="p1-mono m-0 min-h-[1.2em] normal-case tracking-[0.04em] text-signal"
      >
        {state.status === "error" ? state.message : ""}
      </p>
    </form>
  );
}

/** One star, at input size. Same path the rating display uses. */
function SingleStar({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill={filled ? "var(--signal)" : "var(--hairline-strong)"}
      aria-hidden="true"
      className="block transition-colors duration-150"
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z" />
    </svg>
  );
}

function Field({
  id,
  label,
  ...rest
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="p1-label">
        {label}
      </label>
      <input id={id} name={id} className="p1-field" {...rest} />
    </div>
  );
}
