import { BoardFace } from "@/components/board/BoardFace";
import { ActionLink } from "@/components/site/ActionLink";
import { PageShell } from "@/components/site/PageShell";
import { SITE_COPY } from "@/lib/site-copy";
import { WORK_BOARDS } from "@/lib/showcase";

const workItems = [
  ["coralCasino", SITE_COPY.work.coralCasino, WORK_BOARDS.coralCasino],
  ["fischerTravel", SITE_COPY.work.fischerTravel, WORK_BOARDS.fischerTravel],
  ["montecitoClub", SITE_COPY.work.montecitoClub, WORK_BOARDS.montecitoClub],
  ["godmothers", SITE_COPY.work.godmothers, WORK_BOARDS.godmothers],
  ["distributedGlobal", SITE_COPY.work.distributedGlobal, WORK_BOARDS.distributedGlobal],
  ["filmRoman", SITE_COPY.work.filmRoman, WORK_BOARDS.filmRoman],
] as const;

export default function WorkPage() {
  return (
    <PageShell current="work">
      <section className="page-intro page-intro--work">
        <div className="page-intro__copy">
          <h1 className="page-title" data-copy-id="work.h1">
            {SITE_COPY.work.h1}
          </h1>
        </div>
        <div aria-hidden="true" className="work-intro__boards">
          {workItems.slice(0, 3).map(([key, , brand]) => (
            <div className={`work-intro__board work-intro__board--${key}`} key={key}>
              <BoardFace brand={brand} variant="client" />
            </div>
          ))}
        </div>
      </section>
      <section className="work-gallery">
        {workItems.map(([key, text, brand], index) => {
          const divider = text.indexOf(": ");
          const name = text.slice(0, divider + 1);
          const body = text.slice(divider + 2);

          return (
            <article className="work-case" data-index={String(index + 1).padStart(2, "0")} key={key}>
              <div className="work-case__board">
                <BoardFace brand={brand} decorative={false} variant="client" />
              </div>
              <p className="work-case__copy" data-copy-id={`work.${key}`}>
                <span className="work-case__name">{name}</span>{" "}
                <span className="work-case__body">{body}</span>
              </p>
            </article>
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
