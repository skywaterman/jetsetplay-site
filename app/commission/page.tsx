import Image from "next/image";
import { PageShell } from "@/components/site/PageShell";
import { SITE_COPY } from "@/lib/site-copy";

const processSteps = [
  ["signal", SITE_COPY.commission.signal, "/editorial/personalization.jpg"],
  ["design", SITE_COPY.commission.design, "/editorial/studio-materials.jpg"],
  ["craft", SITE_COPY.commission.craft, "/editorial/backgammon-clutch.jpg"],
  ["dispatch", SITE_COPY.commission.dispatch, "/editorial/dossier-cards.jpg"],
] as const;

export default function CommissionPage() {
  return (
    <PageShell current="commission">
      <section className="page-intro page-intro--commission">
        <div className="page-intro__copy">
          <h1 className="page-title" data-copy-id="commission.h1">
            {SITE_COPY.commission.h1}
          </h1>
        </div>
        <div className="commission-intro__image">
          <Image alt="" fill priority sizes="(max-width: 800px) 100vw, 55vw" src="/editorial/studio-materials.jpg" />
        </div>
      </section>
      <section className="process-ledger">
        {processSteps.map(([key, text, image]) => {
          const divider = text.indexOf(". ");
          const name = text.slice(0, divider + 1);
          const body = text.slice(divider + 2);

          return (
            <article className="process-ledger__row" key={key}>
              <div className="process-ledger__image">
                <Image alt="" fill sizes="(max-width: 800px) 100vw, 30vw" src={image} />
              </div>
              <p data-copy-id={`commission.${key}`}>
                <span className="process-ledger__name">{name}</span>{" "}
                <span className="process-ledger__body">{body}</span>
              </p>
            </article>
          );
        })}
      </section>
      <section className="commission-contact">
        <div>
          <h2 className="section-title" data-copy-id="commission.contactH2">
            {SITE_COPY.commission.contactH2}
          </h2>
          <p data-copy-id="commission.contact">
            {SITE_COPY.commission.contact}
          </p>
        </div>
        <a
          className="action-link action-link--dark"
          data-copy-id="commission.button"
          href="mailto:ciao@jetsetplay.co?subject=Commission%20a%20game"
        >
          {SITE_COPY.commission.button}
          <span aria-hidden="true" className="action-link__mark">
            ↗
          </span>
        </a>
      </section>
    </PageShell>
  );
}
