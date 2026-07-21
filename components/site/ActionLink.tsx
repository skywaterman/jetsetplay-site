import Link from "next/link";

export function ActionLink({
  children,
  copyId,
  href,
  tone = "light",
}: {
  children: React.ReactNode;
  copyId: string;
  href: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      className={`action-link action-link--${tone}`}
      data-copy-id={copyId}
      href={href}
    >
      {children}
      <span aria-hidden="true" className="action-link__mark">
        ↗
      </span>
    </Link>
  );
}
