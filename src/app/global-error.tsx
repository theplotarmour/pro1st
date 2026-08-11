"use client";

/**
 * Last-resort boundary — replaces the whole document, so it carries its own
 * minimal styling rather than depending on the app shell that just failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0D0D0F",
          color: "#E6E6E6",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#FF6A00",
              margin: "0 0 20px",
            }}
          >
            PRO·1ST
          </p>
          <h1
            style={{
              fontSize: 40,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "#fff",
            }}
          >
            Something broke.
          </h1>
          <p style={{ lineHeight: 1.6, color: "rgba(230,230,230,0.72)" }}>
            The page failed to load. Reload to try again.
            {error.digest ? ` Reference ${error.digest}.` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              background: "#FF6A00",
              color: "#0D0D0F",
              border: 0,
              padding: "16px 26px",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
