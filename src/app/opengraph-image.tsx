import { ImageResponse } from "next/og";
import { site } from "@/data/site";

/**
 * Default social card. Rendered at build time from the brand palette rather
 * than shipped as a binary, so it stays in sync with the design tokens.
 *
 * Deliberately typeface-agnostic: loading Space Grotesk here would mean a
 * network fetch during build, which is exactly what broke the first deploy.
 *
 * Colours are literal here on purpose. This is rendered by Satori, which has
 * no CSS custom properties — and a social card has no theme to follow anyway,
 * so it always uses the brand's native dark palette.
 */
export const alt = `${site.name} — ${site.positioning}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0D0D0F",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "rgba(230,230,230,0.6)",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#FF6A00",
              display: "flex",
            }}
          />
          {site.positioning}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: -6,
              color: "#FFFFFF",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Professional
          </div>
          <div
            style={{
              fontSize: 132,
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: -6,
              textTransform: "uppercase",
              display: "flex",
              color: "#FFFFFF",
            }}
          >
            <span style={{ color: "#FF6A00" }}>Rhythm</span>
            <span>&nbsp;Operators</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid rgba(230,230,230,0.1)",
            paddingTop: 28,
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(230,230,230,0.45)",
          }}
        >
          <span>PRO·1ST</span>
          <span>Chandni Chowk · Delhi</span>
        </div>
      </div>
    ),
    size,
  );
}
