import type { ReactNode } from "react";
import { Container } from "./Container";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}

/**
 * Interior-page masthead. Clears the fixed header and gives every non-home
 * route the same opening rhythm as the homepage sections.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: PageHeaderProps) {
  return (
    <Container as="header" className="pb-14 pt-[136px] lg:pb-20 lg:pt-[184px]">
      <div className="p1-eyebrow mb-6">{eyebrow}</div>
      <h1 className="p1-h-xl max-w-[18ch] text-strong">{title}</h1>
      {lead ? <p className="p1-lead mt-8 max-w-[56ch]">{lead}</p> : null}
      {children}
    </Container>
  );
}
