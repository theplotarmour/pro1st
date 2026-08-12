"use client";

import { useState, type FormEvent } from "react";
import { WhatsAppIcon } from "@/components/layout/icons";
import { contact } from "@/data/site";

/**
 * Dealer registration.
 *
 * Collects what a rate card actually needs — firm, GSTIN, city, volume — and
 * hands the whole thing to WhatsApp pre-written, which is how this trade
 * communicates and how Ahuja runs its own dealer enquiries.
 *
 * GSTIN is validated for FORMAT only, client-side. It is deliberately not
 * verified against the GST portal: that needs a server-side integration and a
 * merchant decision, and a green tick that means nothing is worse than none.
 */

// 2 digits state, 10-char PAN, 1 entity, 1 'Z', 1 checksum.
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function DealerForm() {
  const [gstin, setGstin] = useState("");
  const [sent, setSent] = useState(false);

  const gstinTouched = gstin.length > 0;
  const gstinValid = GSTIN_PATTERN.test(gstin.toUpperCase());

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const lines = [
      "*Dealer account request* — PRO1ST",
      "",
      `Firm: ${form.get("firm")}`,
      `Contact: ${form.get("name")}`,
      `GSTIN: ${String(form.get("gstin") ?? "").toUpperCase()}`,
      `City: ${form.get("city")}`,
      `Phone: ${form.get("phone")}`,
      `Email: ${form.get("email")}`,
      `Expected monthly volume: ${form.get("volume") || "—"}`,
      form.get("notes") ? `\n${form.get("notes")}` : null,
    ].filter(Boolean);

    window.open(
      `${contact.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="firm" label="Firm / shop name" required />
        <Field id="name" label="Contact person" required autoComplete="name" />

        <div className="sm:col-span-2">
          <label htmlFor="gstin" className="p1-label">
            GSTIN
          </label>
          <input
            id="gstin"
            name="gstin"
            required
            value={gstin}
            onChange={(event) => setGstin(event.target.value.toUpperCase())}
            maxLength={15}
            placeholder="07AAACP1234A1Z5"
            aria-describedby="gstin-help"
            aria-invalid={gstinTouched && !gstinValid}
            className="p1-field font-mono tracking-[0.06em]"
            style={{
              borderColor:
                gstinTouched && !gstinValid ? "var(--signal)" : undefined,
            }}
          />
          <p
            id="gstin-help"
            className="p1-mono mt-2 normal-case tracking-[0.04em] text-faint"
          >
            {gstinTouched && !gstinValid
              ? "That doesn't look like a valid GSTIN format."
              : "Checked for format here; verified by our team before your rate card is issued."}
          </p>
        </div>

        <Field id="city" label="City" required />
        <Field id="phone" label="Phone" type="tel" required autoComplete="tel" />
        <Field
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          className="sm:col-span-2"
        />
        <Field
          id="volume"
          label="Expected monthly volume"
          placeholder="e.g. 10–20 units"
          className="sm:col-span-2"
        />
      </div>

      <div>
        <label htmlFor="notes" className="p1-label">
          Anything else <span className="normal-case">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          className="p1-field resize-y"
          placeholder="Which lines you stock, venues you supply, existing brands carried."
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="p1-btn p1-btn--primary">
          <WhatsAppIcon />
          Send on WhatsApp
        </button>
        <a href={`mailto:${contact.email}`} className="p1-link">
          Email instead
        </a>
      </div>

      <p
        aria-live="polite"
        className="p1-mono m-0 min-h-[1.2em] normal-case tracking-[0.04em] text-soft"
      >
        {sent
          ? `WhatsApp should have opened with your details ready to send. If it didn't, write to ${contact.email}.`
          : ""}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  className = "",
  ...rest
}: {
  id: string;
  label: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="p1-label">
        {label}
      </label>
      <input id={id} name={id} className="p1-field" {...rest} />
    </div>
  );
}
