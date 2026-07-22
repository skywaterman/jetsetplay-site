import Image from "next/image";
import { BoardFace } from "@/components/board/BoardFace";
import { ActionLink } from "@/components/site/ActionLink";
import { PageShell } from "@/components/site/PageShell";
import { HOUSE_BOARD_COLORWAYS } from "@/lib/board-face";
import { SITE_COPY } from "@/lib/site-copy";
import { GAME_ROSTER } from "@/lib/showcase";

const secondaryGames = [
  ["talisman", SITE_COPY.games.talisman, "/editorial/talisman-dominoes.jpg"],
  ["clack", SITE_COPY.games.clack, "/editorial/clack-mahjong.jpg"],
  ["dossier", SITE_COPY.games.dossier, "/editorial/dossier-cards.jpg"],
  ["minis", SITE_COPY.games.minis, "/editorial/personalization.jpg"],
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
        <div className="page-intro__copy">
          <h1 className="page-title" data-copy-id="games.h1">
            {SITE_COPY.games.h1}
          </h1>
        </div>
        <div className="games-intro__image">
          <Image alt="" fill priority sizes="(max-width: 800px) 100vw, 55vw" src="/editorial/backgammon-clutch.jpg" />
        </div>
      </section>
      <section className="games-flagship">
        <div className="games-flagship__board">
          <BoardFace brand={HOUSE_BOARD_COLORWAYS.houseFelt} decorative={false} variant="house" />
        </div>
        <GameCopy copyId="games.backgammon" text={SITE_COPY.games.backgammon} />
      </section>
      <section className="games-grid">
        {secondaryGames.map(([key, text, image]) => (
          <article className="game-entry" key={key}>
            <div className="game-entry__image">
              <Image alt="" fill sizes="(max-width: 800px) 100vw, 50vw" src={image} />
            </div>
            <GameCopy copyId={`games.${key}`} text={text} />
          </article>
        ))}
      </section>
      <ol className="game-roster" aria-label={SITE_COPY.navigation.games}>
        {GAME_ROSTER.map((game) => (
          <li key={game}>{game}</li>
        ))}
      </ol>
      <section className="games-cta">
        <ActionLink copyId="games.cta" href="/commission" tone="light">
          {SITE_COPY.games.cta}
        </ActionLink>
      </section>
    </PageShell>
  );
}
