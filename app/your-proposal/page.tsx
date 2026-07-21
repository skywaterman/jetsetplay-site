import { BoardFace } from "@/components/board/BoardFace";
import { PageShell } from "@/components/site/PageShell";
import { HOUSE_BOARD_COLORWAYS } from "@/lib/board-face";
import { SITE_COPY } from "@/lib/site-copy";

export default function YourProposalPage() {
  return (
    <PageShell current="proposal">
      <section className="proposal-studio">
        <div className="proposal-studio__form">
          <h1 className="page-title" data-copy-id="proposal.h1">
            {SITE_COPY.proposal.h1}
          </h1>
          <p className="proposal-studio__sub" data-copy-id="proposal.sub">
            {SITE_COPY.proposal.sub}
          </p>
          <form className="proposal-form">
            <label>
              <span data-copy-id="proposal.fields.brand">
                {SITE_COPY.proposal.fields.brand}
              </span>
              <input autoComplete="organization" name="brand" type="text" />
            </label>
            <label>
              <span data-copy-id="proposal.fields.recipient">
                {SITE_COPY.proposal.fields.recipient}
              </span>
              <input autoComplete="off" name="recipient" type="text" />
            </label>
            <label>
              <span data-copy-id="proposal.fields.occasion">
                {SITE_COPY.proposal.fields.occasion}
              </span>
              <input autoComplete="off" name="occasion" type="text" />
            </label>
            <button data-copy-id="proposal.button" type="button">
              {SITE_COPY.proposal.button}
            </button>
          </form>
        </div>
        <div className="proposal-studio__stage">
          <BoardFace
            brand={HOUSE_BOARD_COLORWAYS.salonOxblood}
            className="board-face--proposal"
            decorative={false}
            variant="house"
          />
          <p className="proposal-empty" data-copy-id="proposal.empty">
            {SITE_COPY.proposal.empty}
          </p>
        </div>
      </section>
    </PageShell>
  );
}
