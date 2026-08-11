import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "dark" | "ash";

const variantClass: Record<ButtonVariant, string> = {
  primary: "p1-btn--primary",
  outline: "p1-btn--outline",
  dark: "p1-btn--dark",
  ash: "p1-btn--ash",
};

interface CommonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`p1-btn ${variantClass[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps extends CommonProps {
  href: string;
  ariaLabel?: string;
  /** External destinations open in a new tab with safe rel. */
  external?: boolean;
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className = "",
  ariaLabel,
  external,
}: ButtonLinkProps) {
  const classes = `p1-btn ${variantClass[variant]} ${className}`.trim();
  const isExternal = external ?? /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
