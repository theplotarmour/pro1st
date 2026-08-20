import { Stars } from "@/components/reviews/Stars";
import type { Testimonial } from "@/data/testimonials";

/**
 * One vertically scrolling column of review cards.
 *
 * Adapted from the supplied `testimonials-columns-1` component. Two things
 * changed and both were deliberate.
 *
 * **The motion is CSS, not `motion/react`.** The original drives an infinite
 * `translateY` through the library's animator, which is a rAF loop writing a
 * transform every frame — three of them here, at three speeds, for as long as
 * the section is on screen. The identical result comes from one keyframe the
 * compositor runs on its own thread, so the dependency buys nothing and costs
 * a bundle plus main-thread work on exactly the low-end phones this site was
 * tuned for. Nothing about this animation is interruptible, measured or
 * state-driven, which is the only thing that would argue for JS.
 *
 * **No avatars.** The original pulls faces from randomuser.me — photographs
 * of real people captioned with invented names. That is a worse fabrication
 * than the quote itself, and it would need a third-party image host in the
 * CSP and `next.config` for the privilege. Initials in a hairline square say
 * the same thing, load nothing, and suit the industrial set.
 *
 * The card is the site's own: square corners, hairline border, panel ground,
 * mono metadata, signal-orange stars. The source's `rounded-3xl` and
 * `shadow-primary/10` belong to a different, softer system.
 */
export function TestimonialsColumn({
  testimonials,
  duration = 30,
  className = "",
}: {
  testimonials: Testimonial[];
  /** Seconds for one full pass. Vary per column so they never lock in step. */
  duration?: number;
  className?: string;
}) {
  return (
    <div className={`p1-marquee ${className}`.trim()}>
      <div
        className="p1-marquee-track flex flex-col gap-5"
        style={
          { "--p1-marquee-duration": `${duration}s` } as React.CSSProperties
        }
      >
        {/*
          Rendered twice: the loop returns to -50%, which is the top of the
          second copy and pixel-identical to the start. The duplicate is
          hidden from assistive tech so the reviews are not announced twice.
        */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex flex-col gap-5"
            aria-hidden={copy === 1 ? "true" : undefined}
          >
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} testimonial={testimonial} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Initials, for the avatar square. "Harpreet Singh" -> "HS". */
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Card({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="m-0 border border-hairline bg-panel p-7">
      <Stars
        value={testimonial.rating}
        size="13px"
        label={`${testimonial.rating} out of 5`}
      />

      <blockquote className="m-0 mt-5 text-[15px] leading-[1.6] text-body">
        {testimonial.quote}
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
        <span
          aria-hidden="true"
          className="p1-mono grid h-9 w-9 flex-none place-items-center border border-hairline text-soft"
        >
          {initials(testimonial.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-strong">
            {testimonial.name}
          </span>
          <span className="p1-mono mt-1 block truncate text-faint">
            {testimonial.role}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
