/** Line icons at the design's 1.4px stroke. Decorative by default. */

export function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M13.5 13.5 17.5 17.5" />
    </svg>
  );
}

export function CartIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M3 5h13l-1.2 9H4.2z" />
      <path d="M7 5V3.5h6V5" />
    </svg>
  );
}

export function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M4 4 16 16" />
          <path d="M16 4 4 16" />
        </>
      ) : (
        <>
          <path d="M3 6h14" />
          <path d="M3 13h14" />
        </>
      )}
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--signal)"
      strokeWidth="1.2"
      aria-hidden="true"
      className="flex-none"
    >
      <rect x="3.5" y="3.5" width="17" height="17" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="var(--signal)" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2-.5 0-1 .2-3.4-.8-2.9-1.2-4.7-4.2-4.8-4.4-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 2 .9 2.1c.1.2.1.3 0 .5s-.2.4-.4.6c-.2.2-.3.4-.2.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.5.2.1.4.1.5-.1.2-.2.6-.7.8-1 .2-.2.3-.2.6-.1.2.1 1.5.7 1.8.9.3.1.4.2.5.3.1.2.1.6-.1 1.2z" />
    </svg>
  );
}
