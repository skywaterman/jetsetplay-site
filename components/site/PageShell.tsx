import type { ReactNode } from "react";
import type { SiteRoute } from "@/lib/site-copy";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

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
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
    </>
  );
}
