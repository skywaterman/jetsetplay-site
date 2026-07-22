import type { ReactNode } from "react";
import type { SiteRoute } from "@/lib/site-copy";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { PageReveal } from "./PageReveal";

export function PageShell({
  children,
  current,
}: {
  children: ReactNode;
  current: SiteRoute;
}) {
  return (
    <>
      <SiteHeader current={current} />
      <main className="min-h-screen">
        <PageReveal>{children}</PageReveal>
      </main>
      <SiteFooter />
    </>
  );
}
