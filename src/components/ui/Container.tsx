import type { ElementType, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Drop the horizontal gutter when the parent already applies it. */
  bleed?: boolean;
  id?: string;
}

/** The page's shared 1440px measure plus the responsive gutter. */
export function Container({
  children,
  as: Tag = "div",
  className = "",
  bleed = false,
  id,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={`p1-shell ${bleed ? "" : "gutter-x"} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
