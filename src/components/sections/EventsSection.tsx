import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Container } from "@/components/ui/Container";
import { Media } from "@/components/ui/Media";

const DIRECTORY = join(process.cwd(), "public", "img", "events");

/**
 * Captions, keyed by the photograph's filename without its extension.
 *
 * Optional — anything not listed here falls back to the section's own
 * description. Fill these in as the events are identified; a caption naming
 * the show and the year is worth more than a generic line, and it is what the
 * alt text uses too.
 */
const captions: Record<string, string> = {};

const FALLBACK = "The PRO1ST stand on the trade show floor";

interface EventPhoto {
  src: string;
  caption: string | null;
  alt: string;
}

/**
 * Reads the gallery off disk rather than from a hand-kept list.
 *
 * The brief was that more photographs would follow, so adding one is a file
 * copy plus `scripts/optimize-events.py` — no code change, no array to forget
 * to update. This runs at build time (the page is static with ISR), so the
 * directory read costs a request nothing.
 *
 * Sorted newest first. The filenames carry the capture timestamp, so a plain
 * reverse sort puts the most recent event at the top of the grid, which is
 * where a returning dealer would look for it.
 */
function readPhotos(): EventPhoto[] {
  let files: string[];
  try {
    files = readdirSync(DIRECTORY).filter((name) => name.endsWith(".webp"));
  } catch {
    // The directory is absent on a fresh clone until the optimiser has run.
    // An empty gallery is a section that does not render, not a build error.
    return [];
  }

  return files
    .sort((a, b) => b.localeCompare(a))
    .map((name) => {
      const key = name.replace(/\.webp$/, "");
      const caption = captions[key] ?? null;
      return {
        src: `/img/events/${name}`,
        caption,
        alt: caption ?? FALLBACK,
      };
    });
}

/**
 * Event photography — PRO1ST on the floor at trade shows and dealer meets.
 *
 * Sits on Our Story rather than the homepage: it is evidence for the claim
 * the page is already making, not a claim of its own.
 */
export function EventsSection() {
  const photos = readPhotos();
  if (photos.length === 0) return null;

  return (
    <Container
      as="section"
      id="events"
      className="border-t border-hairline pb-24 pt-20 lg:pb-28"
    >
      <div className="mb-12 max-w-[52ch]">
        <div className="p1-eyebrow mb-6">[ On the floor ]</div>
        <h2 className="p1-h4 mb-5">Out of the shop, into the hall.</h2>
        <p className="p1-body">
          PRO1ST shows the range where it gets judged hardest — in front of
          dealers, installers and engineers who have heard everything already.
        </p>
      </div>

      {/*
        A uniform grid, not an editorial layout with a hero tile.

        The count is going to change as photographs are added, and a layout
        that assigns different weight to the first item only reads correctly
        at the count it was designed for. This reflows honestly at three,
        five or thirty.
      */}
      <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={photo.src}>
            <figure className="m-0">
              <div className="group relative aspect-[4/3] overflow-hidden border border-hairline bg-panel">
                <Media
                  src={photo.src}
                  alt={photo.alt}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="transition-transform duration-[600ms] ease-signal group-hover:scale-[1.03]"
                  /*
                    Only the first row is likely to be in view when the
                    section is reached; the rest stay lazy.
                  */
                  eager={index < 3}
                />
              </div>
              {photo.caption ? (
                <figcaption className="p1-mono mt-3 text-soft">
                  {photo.caption}
                </figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>
    </Container>
  );
}
