import { ActionLink } from "@/components/site/ActionLink";
import { PageShell } from "@/components/site/PageShell";
import { SITE_COPY } from "@/lib/site-copy";

const secondaryGames = [
  ["talisman", SITE_COPY.games.talisman],
  ["clack", SITE_COPY.games.clack],
  ["dossier", SITE_COPY.games.dossier],
  ["minis", SITE_COPY.games.minis],
] as const;

function GameCopy({ copyId, text }: { copyId: string; text: string }) {
  const divider = text.indexOf(": ");
  const name = text.slice(0, divider + 1);
  const body = text.slice(divider + 2);

  return (
    <p className="game-entry__copy" data-copy-id={copyId}>
      <span className="game-entry__name">{name}</span>{" "}
      <span className="game-entry__body">{body}</span>
    </p>
  );
}

export default function GamesPage() {
  return (
    <PageShell current="games">
      <section className="page-intro page-intro--games">
        <h1 className="page-title" data-copy-id="games.h1">
          {SITE_COPY.games.h1}
        </h1>
      </section>
      <section className="games-flagship">
        <GameCopy copyId="games.backgammon" text={SITE_COPY.games.backgammon} />
      </section>
      <section className="games-grid">
        {secondaryGames.map(([key, text]) => (
          <article className="game-entry" key={key}>
            <GameCopy copyId={`games.${key}`} text={text} />
          </article>
        ))}
      </section>
      <section className="games-cta">
        <ActionLink copyId="games.cta" href="/commission" tone="light">
          {SITE_COPY.games.cta}
        </ActionLink>
      </section>
    </PageShell>
  );
}
