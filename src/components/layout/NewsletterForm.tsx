"use client";

import { useState, type FormEvent } from "react";
import { contact } from "@/data/site";

type Status = "idle" | "sending" | "done" | "unconfigured" | "error";

/**
 * Stock-alert signup.
 *
 * There is no list provider yet, so rather than fake a success state the form
 * reports honestly and hands the user a working alternative. Point
 * NEXT_PUBLIC_NEWSLETTER_ENDPOINT at the real endpoint to activate it.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!endpoint) {
      setStatus("unconfigured");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(response.ok ? "done" : "error");
      if (response.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "done"
      ? "You're on the list."
      : status === "unconfigured"
        ? `Signup isn't live yet — email ${contact.email} for stock alerts.`
        : status === "error"
          ? "That didn't go through. Try again, or email us."
          : null;

  return (
    <form onSubmit={onSubmit} noValidate={false}>
      <label htmlFor="newsletter-email" className="p1-label">
        Stock alerts &amp; new gear
      </label>
      <div className="flex max-w-[360px] items-center gap-3 border-b border-hairline pb-3 transition-colors duration-[120ms] ease-signal focus-within:border-signal">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.in"
          autoComplete="email"
          className="flex-1 border-0 bg-transparent py-1 text-[15px] text-white outline-none placeholder:text-[rgba(230,230,230,0.35)]"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="p1-mono cursor-pointer border-0 bg-transparent text-signal disabled:opacity-50"
        >
          {status === "sending" ? "Sending" : "Subscribe"}
        </button>
      </div>
      <p
        aria-live="polite"
        className="p1-mono mt-3 min-h-[1.2em] normal-case tracking-[0.04em] text-[rgba(230,230,230,0.5)]"
      >
        {message}
      </p>
    </form>
  );
}
