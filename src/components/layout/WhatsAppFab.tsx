"use client";

import { useEffect, useState } from "react";
import { contact } from "@/data/site";
import { WhatsAppIcon } from "./icons";

/** Appears once the hero is behind you, so it never fights the first screen. */
export function WhatsAppFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={contact.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`WhatsApp us on ${contact.phone}`}
      className="fixed bottom-7 right-7 z-[130] grid place-items-center bg-signal text-ink transition-[opacity,transform] duration-[420ms] ease-signal"
      style={{
        width: 52,
        height: 52,
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px) scale(0.8)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <WhatsAppIcon />
    </a>
  );
}
