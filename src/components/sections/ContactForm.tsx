"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { WhatsAppIcon } from "@/components/layout/icons";
import { contact, enquiryTypes } from "@/data/site";

type EnquiryValue = (typeof enquiryTypes)[number]["value"];

function isEnquiry(value: string | null): value is EnquiryValue {
  return enquiryTypes.some((type) => type.value === value);
}

/**
 * Enquiry form.
 *
 * There is no backend and Shopify does not own contact forms, so the form
 * hands the enquiry to WhatsApp with the whole thing pre-written. That is how
 * this trade actually communicates — a dealer in Chandni Chowk replies on
 * WhatsApp, not to a contact-form inbox — and it reaches a real person on the
 * first tap instead of depending on a configured mail client.
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

    const lines = [
      `*${label}* — PRO1ST`,
      "",
      `Name: ${form.get("name")}`,
      `Email: ${form.get("email")}`,
      form.get("company") ? `Company: ${form.get("company")}` : null,
      form.get("phone") ? `Phone: ${form.get("phone")}` : null,
      product ? `Product: ${product}` : null,
      "",
      String(form.get("message") ?? ""),
    ].filter(Boolean);

    // wa.me carries the whole enquiry, so the first message already contains
    // everything needed to quote — no back-and-forth to collect basics.
    const href = `${contact.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;

    window.open(href, "_blank", "noopener,noreferrer");
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
                    : "border-hairline text-body hover:border-signal hover:text-signal"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {product ? (
        <p className="p1-mono m-0 normal-case tracking-[0.04em] text-soft">
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
          <WhatsAppIcon />
          Send on WhatsApp
        </button>
        <a href={contact.phoneHref} className="p1-link">
          Or call {contact.phone}
        </a>
        <a href={`mailto:${contact.email}`} className="p1-link">
          Email instead
        </a>
      </div>

      <p
        aria-live="polite"
        className="p1-mono m-0 min-h-[1.2em] normal-case tracking-[0.04em] text-soft"
      >
        {sent
          ? `WhatsApp should have opened with your enquiry ready to send. If it didn't, write to ${contact.email}.`
          : ""}
      </p>
    </form>
  );
}
