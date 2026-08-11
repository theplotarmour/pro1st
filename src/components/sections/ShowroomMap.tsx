import { contact } from "@/data/site";

/**
 * The showroom map.
 *
 * This was previously a decorative CSS grid with a dot on it — there was no
 * map to load. It is now a real embedded map.
 *
 * OpenStreetMap is used deliberately: it needs no API key, no billing account
 * and no third-party tracker on the page. The light tiles are filtered to sit
 * in the dark industrial palette rather than punching a white hole in it.
 *
 * The pin is placed on the Moti Cinema Compound area from OpenStreetMap's own
 * geocoding — the exact street number does not resolve, so the map shows the
 * block and the "Open in Maps" link hands the full address to the visitor's
 * own map app for door-to-door routing.
 */

const { latitude, longitude } = contact.geo;

// A tight box around the compound — roughly a 600m frame.
const SPAN = 0.004;
const bbox = [
  longitude - SPAN,
  latitude - SPAN * 0.6,
  longitude + SPAN,
  latitude + SPAN * 0.6,
].join(",");

const embedSrc =
  `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
  `&layer=mapnik&marker=${latitude},${longitude}`;

const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  contact.addressLines.join(" "),
)}`;

export function ShowroomMap() {
  return (
    <div className="relative aspect-[16/9] overflow-hidden border border-hairline bg-panel">
      <iframe
        src={embedSrc}
        title="Map showing the PRO1ST showroom in Chandni Chowk, Delhi"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0"
        style={{
          // Invert the light basemap into the dark palette, then correct the
          // hue so roads and water read normally rather than as negatives.
          filter:
            "invert(1) hue-rotate(180deg) saturate(0.35) brightness(0.92) contrast(1.05)",
        }}
      />

      {/* Signal pin, drawn over the tiles so it keeps the brand accent. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal"
        style={{
          boxShadow: "0 0 0 10px var(--sig-12), 0 0 20px 4px var(--sig-40)",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-[rgba(13,13,15,0.9)] to-transparent p-5">
        <span className="p1-mono text-[rgba(230,230,230,0.55)]">
          Moti Cinema Compound · Delhi-6
        </span>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="p1-mono pointer-events-auto whitespace-nowrap border border-hairline bg-ink px-3 py-2 text-ash transition-[border-color,color] duration-[120ms] ease-signal hover:border-signal hover:text-signal"
        >
          Directions →
        </a>
      </div>
    </div>
  );
}
