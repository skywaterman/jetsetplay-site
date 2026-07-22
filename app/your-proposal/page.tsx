import { ProposalStudio } from "@/components/proposal/ProposalStudio";
import { PageShell } from "@/components/site/PageShell";

export default function YourProposalPage() {
  return (
    <PageShell current="proposal">
      <ProposalStudio />
    </PageShell>
  );
}
