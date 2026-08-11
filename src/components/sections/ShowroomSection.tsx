import { Container } from "@/components/ui/Container";
import { contact } from "@/data/site";

const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  contact.addressLines.join(" "),
)}`;

interface Row {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

const rows: Row[] = [
  { label: "Phone", value: contact.phone, href: contact.phoneHref },
  { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
  {
    label: "WhatsApp",
    value: contact.whatsappLabel,
    href: contact.whatsappHref,
    external: true,
  },
  { label: "Hours", value: contact.hours },
];

/** Showroom details. Shared by the homepage and the Contact page. */
export function ShowroomSection({
  as: Heading = "h2",
}: {
  as?: "h1" | "h2";
}) {
  return (
    <Container
      as="section"
      id="showroom"
      className="border-t border-hairline pb-24 pt-20 lg:pb-32"
    >
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <div>
          <div className="p1-eyebrow mb-6">[ Showroom ]</div>
          <Heading className="p1-h4 mb-8">
            {contact.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </Heading>

          <div className="flex flex-col border-t border-hairline">
            {rows.map((row) =>
              row.href ? (
                <a
                  key={row.label}
                  href={row.href}
                  {...(row.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="p1-mono flex justify-between gap-4 border-b border-hairline py-[18px]"
                >
                  <span className="text-[rgba(230,230,230,0.45)]">
                    {row.label}
                  </span>
                  <span>{row.value}</span>
                </a>
              ) : (
                <div
                  key={row.label}
                  className="p1-mono flex justify-between gap-4 border-b border-hairline py-[18px]"
                >
                  <span className="text-[rgba(230,230,230,0.45)]">
                    {row.label}
                  </span>
                  <span>{row.value}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open the PRO1st showroom in Google Maps"
          className="group relative block aspect-[16/9] overflow-hidden border border-hairline bg-panel"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(var(--p1-hairline) 1px,transparent 1px),linear-gradient(90deg,var(--p1-hairline) 1px,transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute left-[46%] top-[44%] h-2.5 w-2.5 rounded-full bg-signal"
            style={{
              boxShadow: "0 0 0 10px var(--sig-12), 0 0 20px 4px var(--sig-40)",
            }}
          />
          <span className="p1-mono absolute bottom-5 left-5 text-[rgba(230,230,230,0.4)] group-hover:text-signal">
            Open in maps →
          </span>
        </a>
      </div>
    </Container>
  );
}
