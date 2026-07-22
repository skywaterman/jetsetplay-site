import { SITE_COPY } from "@/lib/site-copy";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="type-utility" data-copy-id="footer.location">
        {SITE_COPY.footer.location}
      </p>
      <p className="site-footer__tagline" data-copy-id="footer.tagline">
        {SITE_COPY.footer.tagline}
      </p>
    </footer>
  );
}
