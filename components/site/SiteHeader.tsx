import Link from "next/link";
import { SITE_COPY, type SiteRoute } from "@/lib/site-copy";
import { Wordmark } from "./Wordmark";

const routes: Array<{ key: SiteRoute; href: string }> = [
  { key: "home", href: "/" },
  { key: "work", href: "/work" },
  { key: "games", href: "/games" },
  { key: "proposal", href: "/your-proposal" },
  { key: "commission", href: "/commission" },
];

export function SiteHeader({ current }: { current: SiteRoute }) {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <Wordmark />
      </div>
      <nav className="site-nav" aria-label="Primary navigation">
        {routes.map(({ key, href }) => (
          <Link
            aria-current={current === key ? "page" : undefined}
            className="site-nav__link"
            data-copy-id={`navigation.${key}`}
            href={href}
            key={key}
          >
            <span aria-hidden="true" className="site-nav__pip" />
            {SITE_COPY.navigation[key]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
