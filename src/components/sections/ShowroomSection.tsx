import { Container } from "@/components/ui/Container";
import { contact } from "@/data/site";
import { ShowroomMap } from "./ShowroomMap";

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
                  <span className="text-soft">
                    {row.label}
                  </span>
                  <span>{row.value}</span>
                </a>
              ) : (
                <div
                  key={row.label}
                  className="p1-mono flex justify-between gap-4 border-b border-hairline py-[18px]"
                >
                  <span className="text-soft">
                    {row.label}
                  </span>
                  <span>{row.value}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <ShowroomMap />
      </div>
    </Container>
  );
}
