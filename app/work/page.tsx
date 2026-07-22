import { ActionLink } from "@/components/site/ActionLink";
import { PageShell } from "@/components/site/PageShell";
import { SITE_COPY } from "@/lib/site-copy";

const workItems = [
  ["coralCasino", SITE_COPY.work.coralCasino],
  ["fischerTravel", SITE_COPY.work.fischerTravel],
  ["montecitoClub", SITE_COPY.work.montecitoClub],
  ["godmothers", SITE_COPY.work.godmothers],
  ["distributedGlobal", SITE_COPY.work.distributedGlobal],
  ["filmRoman", SITE_COPY.work.filmRoman],
] as const;

export default function WorkPage() {
  return (
    <PageShell current="work">
      <section className="page-intro page-intro--work">
        <h1 className="page-title" data-copy-id="work.h1">
          {SITE_COPY.work.h1}
        </h1>
      </section>
      <section className="work-ledger">
        {workItems.map(([key, text]) => {
          const divider = text.indexOf(": ");
          const name = text.slice(0, divider + 1);
          const body = text.slice(divider + 2);

          return (
            <p className="work-ledger__row" data-copy-id={`work.${key}`} key={key}>
              <span className="work-ledger__name">{name}</span>{" "}
              <span className="work-ledger__body">{body}</span>
            </p>
          );
        })}
      </section>
      <section className="page-close page-close--felt">
        <p className="page-close__line" data-copy-id="work.closing">
          {SITE_COPY.work.closing}
        </p>
        <ActionLink copyId="work.cta" href="/commission" tone="dark">
          {SITE_COPY.work.cta}
        </ActionLink>
      </section>
    </PageShell>
  );
}
