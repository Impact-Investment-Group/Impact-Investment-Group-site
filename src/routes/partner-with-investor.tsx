import { createFileRoute } from "@tanstack/react-router";
import { PartnerPage } from "@/components/partners/partner-page";
import { InvestorContribution } from "@/components/partners/investor-contribution";
import { getPartnerSummary } from "@/content/partner-summaries";

const profile = getPartnerSummary("investor");

export const Route = createFileRoute("/partner-with-investor")({
  loader: async () => {
    const { getPartnerProfile } = await import("@/content/partners");
    return { profile: getPartnerProfile("investor") };
  },
  component: PartnerRoutePage,
  head: () => partnerHead(profile.label, profile.summary, profile.path),
});

function partnerHead(label: string, description: string, path: string) {
  return {
    meta: [
      { title: `${label} partnerships | Impact Investment Group` },
      { name: "description", content: description },
      { property: "og:title", content: `${label} partnerships | Impact Investment Group` },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: path },
    ],
    links: [{ rel: "canonical", href: path }],
  };
}

function PartnerRoutePage() {
  const { profile } = Route.useLoaderData();
  return (
    <>
      <PartnerPage profile={profile} />
      <InvestorContribution />
    </>
  );
}
