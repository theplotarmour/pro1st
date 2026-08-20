import { Stars } from "@/components/reviews/Stars";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { testimonials } from "@/data/testimonials";

/**
 * Customer reviews — three columns drifting at three speeds behind a mask.
 *
 * Placed straight after the chain and before the origin story. The reader
 * has just been shown the range; what other buyers made of it is the next
 * question they have, and it should be answered before the page changes the
 * subject to who built it.
 *
 * ⚠ The reviews are placeholder copy. See `src/data/testimonials.ts` for what
 * that means and what has to happen before this ships to customers.
 */

/** Averaged from what is on screen, so the figure cannot drift from it. */
const average =
  testimonials.reduce((sum, entry) => sum + entry.rating, 0) /
  testimonials.length;

const columns = [
  { items: testimonials.slice(0, 3), duration: 34, className: "" },
  {
    items: testimonials.slice(3, 6),
    duration: 44,
    className: "hidden md:block",
  },
  {
    items: testimonials.slice(6, 9),
    duration: 38,
    className: "hidden lg:block",
  },
];

export function TestimonialsSection() {
  return (
    <Container as="section" id="reviews" className="py-24 lg:py-32">
      <SectionHeading
        eyebrow="[ Field reports ]"
        title="Judged on the load-out, not the spec sheet."
        titleWidth={22}
        lead="Every unit is bought by someone who has to carry it, rig it and answer for it at 2 AM. This is what they came back and said."
      />

      <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Stars
          value={average}
          size="15px"
          label={`${average.toFixed(1)} out of 5`}
        />
        <span className="p1-mono text-soft">
          {average.toFixed(1)} average across {testimonials.length} reviews
        </span>
      </div>

      {/*
        The mask is what makes a clipped, moving column read as continuous
        rather than cut off — the cards fade out at both ends instead of
        being sliced by a hard edge. `max-h` caps the section so three
        columns of reviews cannot take over the page.
      */}
      <div
        className="mt-12 flex max-h-[680px] justify-center gap-5 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent)",
        }}
      >
        {columns.map((column) => (
          <TestimonialsColumn
            key={column.duration}
            testimonials={column.items}
            duration={column.duration}
            className={`w-full max-w-[330px] ${column.className}`.trim()}
          />
        ))}
      </div>
    </Container>
  );
}
