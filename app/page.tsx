import Image from "next/image";
import { HomeBoardRecolor } from "@/components/board/HomeBoardRecolor";
import { ActionLink } from "@/components/site/ActionLink";
import { PageShell } from "@/components/site/PageShell";
import { SITE_COPY } from "@/lib/site-copy";

const houseItems = [
  ["backgammon", SITE_COPY.home.house.backgammon, "/editorial/backgammon-clutch.jpg"],
  ["talisman", SITE_COPY.home.house.talisman, "/editorial/talisman-dominoes.jpg"],
  ["clack", SITE_COPY.home.house.clack, "/editorial/clack-mahjong.jpg"],
  ["dossier", SITE_COPY.home.house.dossier, "/editorial/dossier-cards.jpg"],
  ["minis", SITE_COPY.home.house.minis, "/editorial/personalization.jpg"],
] as const;

const soulTitleParts = SITE_COPY.home.soul.h2.split(" · ");

export default function HomePage() {
  return (
    <PageShell current="home">
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow" data-copy-id="home.eyebrow">
            {SITE_COPY.home.eyebrow}
          </p>
          <h1 className="page-title page-title--hero" data-copy-id="home.h1">
            {SITE_COPY.home.h1}
          </h1>
          <p className="home-hero__sub type-lead" data-copy-id="home.sub">
            {SITE_COPY.home.sub}
          </p>
          <div className="action-group">
            <ActionLink
              copyId="home.ctaPrimary"
              href="/commission"
              tone="dark"
            >
              {SITE_COPY.home.ctaPrimary}
            </ActionLink>
            <ActionLink
              copyId="home.ctaSecondary"
              href="/your-proposal"
              tone="dark"
            >
              {SITE_COPY.home.ctaSecondary}
            </ActionLink>
          </div>
        </div>
        <div className="home-hero__theatre">
          <HomeBoardRecolor />
          <div aria-hidden="true" className="home-hero__pieces">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="home-thesis">
        <h2 className="section-title" data-copy-id="home.thesis.h2">
          {SITE_COPY.home.thesis.h2}
        </h2>
        <div className="home-thesis__copy">
          <p data-copy-id="home.thesis.paragraph1">
            {SITE_COPY.home.thesis.paragraph1}
          </p>
          <p data-copy-id="home.thesis.paragraph2">
            {SITE_COPY.home.thesis.paragraph2}
          </p>
        </div>
      </section>

      <section className="home-house">
        <header className="home-house__header">
          <h2 className="section-title" data-copy-id="home.house.h2">
            {SITE_COPY.home.house.h2}
          </h2>
        </header>
        <div className="house-gallery">
          {houseItems.map(([key, text, image]) => {
            const divider = text.indexOf(". ");
            const lead = text.slice(0, divider + 1);
            const body = text.slice(divider + 2);

            return (
              <article className={`house-card house-card--${key}`} key={key}>
                <div className="house-card__image">
                  <Image alt="" fill sizes="(max-width: 800px) 100vw, 50vw" src={image} />
                </div>
                <p className="house-card__copy" data-copy-id={`home.house.${key}`}>
                  <span className="house-card__name">{lead}</span>{" "}
                  <span className="house-card__body">{body}</span>
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-proof">
        <h2 className="eyebrow" data-copy-id="home.proof.h2">
          {SITE_COPY.home.proof.h2}
        </h2>
        <p className="home-proof__clients" data-copy-id="home.proof.clients">
          {SITE_COPY.home.proof.clients}
        </p>
      </section>

      <section className="home-soul">
        <div aria-hidden="true" className="home-soul__board">
          <Image alt="" fill sizes="(max-width: 800px) 100vw, 42vw" src="/editorial/personalization.jpg" />
        </div>
        <h2 className="section-title" data-copy-id="home.soul.h2">
          {soulTitleParts.map((part, index) => (
            <span className="phrase-lock" key={part}>
              {part}
              {index < soulTitleParts.length - 1 ? " ·" : ""}
              {index < soulTitleParts.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>
        <div className="home-soul__copy">
          <p data-copy-id="home.soul.body">{SITE_COPY.home.soul.body}</p>
          <ActionLink
            copyId="home.soul.cta"
            href="/commission?edition=beirut"
            tone="dark"
          >
            {SITE_COPY.home.soul.cta}
          </ActionLink>
        </div>
      </section>

      <section className="home-closing">
        <p data-copy-id="home.closing">{SITE_COPY.home.closing}</p>
      </section>
    </PageShell>
  );
}
