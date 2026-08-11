"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { contact, enquiryTypes } from "@/data/site";

type EnquiryValue = (typeof enquiryTypes)[number]["value"];

function isEnquiry(value: string | null): value is EnquiryValue {
  return enquiryTypes.some((type) => type.value === value);
}

/**
 * Enquiry form.
 *
 * There is no backend and Shopify does not own contact forms, so rather than
 * post into a void the form composes a fully-populated email in the visitor's
 * own client. It genuinely works today, and swapping in a real endpoint later
 * touches only `onSubmit`.
 */
export function ContactForm() {
  const params = useSearchParams();
  const requested = params.get("enquiry");
  const product = params.get("product");

  const [type, setType] = useState<EnquiryValue>(
    isEnquiry(requested) ? requested : "general",
  );
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label =
      enquiryTypes.find((t) => t.value === type)?.label ?? "Enquiry";

    const bodyLines = [
      `Enquiry type: ${label}`,
      `Name: ${form.get("name")}`,
      `Company: ${form.get("company") || "—"}`,
      `Phone: ${form.get("phone") || "—"}`,
      product ? `Product: ${product}` : null,
      "",
      String(form.get("message") ?? ""),
    ].filter(Boolean);

    const href =
      `mailto:${contact.email}` +
      `?subject=${encodeURIComponent(`${label} — ${form.get("name")}`)}` +
      `&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = href;
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset className="m-0 border-0 p-0">
        <legend className="p1-label">Enquiry type</legend>
        <div className="flex flex-wrap gap-2">
          {enquiryTypes.map((option) => {
            const isActive = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                aria-pressed={isActive}
                className={`p1-mono cursor-pointer border px-4 py-2.5 transition-[border-color,color,background-color] duration-[120ms] ease-signal ${
                  isActive
                    ? "border-signal bg-signal text-ink"
                    : "border-hairline text-[rgba(230,230,230,0.7)] hover:border-signal hover:text-signal"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {product ? (
        <p className="p1-mono m-0 normal-case tracking-[0.04em] text-[rgba(230,230,230,0.5)]">
          About: {product}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="p1-label">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            className="p1-field"
          />
        </div>
        <div>
          <label htmlFor="contact-company" className="p1-label">
            Company <span className="normal-case">(optional)</span>
          </label>
          <input
            id="contact-company"
            name="company"
            autoComplete="organization"
            className="p1-field"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="p1-label">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="p1-field"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="p1-label">
            Phone <span className="normal-case">(optional)</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="p1-field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="p1-label">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className="p1-field resize-y"
          placeholder="Venue size, headcount, existing gear — whatever helps us spec it."
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="p1-btn p1-btn--primary">
          Send enquiry
        </button>
        <a href={contact.phoneHref} className="p1-link">
          Or call {contact.phone}
        </a>
      </div>

      <p
        aria-live="polite"
        className="p1-mono m-0 min-h-[1.2em] normal-case tracking-[0.04em] text-[rgba(230,230,230,0.5)]"
      >
        {sent
          ? `Your email client should have opened. If it didn't, write to ${contact.email}.`
          : ""}
      </p>
    </form>
  );
}
