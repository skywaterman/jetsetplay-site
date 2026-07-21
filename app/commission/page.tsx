import { PageShell } from "@/components/site/PageShell";
import { SITE_COPY } from "@/lib/site-copy";

const processSteps = [
  ["signal", SITE_COPY.commission.signal],
  ["design", SITE_COPY.commission.design],
  ["craft", SITE_COPY.commission.craft],
  ["dispatch", SITE_COPY.commission.dispatch],
] as const;

export default function CommissionPage() {
  return (
    <PageShell current="commission">
      <section className="page-intro page-intro--commission">
        <h1 className="page-title" data-copy-id="commission.h1">
          {SITE_COPY.commission.h1}
        </h1>
      </section>
      <section className="process-ledger">
        {processSteps.map(([key, text]) => {
          const divider = text.indexOf(". ");
          const name = text.slice(0, divider + 1);
          const body = text.slice(divider + 2);

          return (
            <p className="process-ledger__row" data-copy-id={`commission.${key}`} key={key}>
              <span className="process-ledger__name">{name}</span>{" "}
              <span className="process-ledger__body">{body}</span>
            </p>
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
