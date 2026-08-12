"use server";

import { createReview } from "./judgeme";

export interface ReviewFormState {
  status: "idle" | "ok" | "error";
  message: string;
}

/** Loose but real: rejects the obvious non-addresses without policing domains. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Server action behind the Write a Review form.
 *
 * Judge.me's create endpoint needs no token, so this could have been called
 * from the browser — it is not, for two reasons: the shop identifiers stay in
 * one place, and the payload is validated before it reaches a service that
 * accepts silently and reports nothing back.
 */
export async function submitReviewAction(
  _previous: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const productExternalId = Number(formData.get("productExternalId"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isFinite(productExternalId) || productExternalId <= 0) {
    return { status: "error", message: "Missing product reference." };
  }
  if (name.length < 2) {
    return { status: "error", message: "Please give a name." };
  }
  if (!EMAIL.test(email)) {
    return { status: "error", message: "That email address doesn't look right." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: "error", message: "Please choose a rating from 1 to 5." };
  }
  if (body.length < 10) {
    return {
      status: "error",
      message: "Please write a little more — at least a sentence.",
    };
  }

  const result = await createReview({
    productExternalId,
    name,
    email,
    rating,
    title: title || undefined,
    body,
  });

  if (!result.ok) return { status: "error", message: result.error };

  /*
    "Received", not "published". The API creates the review in the background
    and a store that restricts web reviews silently creates nothing, so a 200
    is an acknowledgement rather than a guarantee. Saying it appears once
    approved is the only claim the response actually supports.
  */
  return {
    status: "ok",
    message: "Thank you — your review has been received and appears once approved.",
  };
}
