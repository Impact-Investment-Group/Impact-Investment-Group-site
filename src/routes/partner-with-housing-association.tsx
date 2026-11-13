import { createFileRoute } from "@tanstack/react-router";
import { PartnerPage } from "@/components/partners/partner-page";
import { getPartnerSummary } from "@/content/partner-summaries";

const profile = getPartnerSummary("housing-association");
export const Route = createFileRoute("/partner-with-housing-association")({
  loader: async () => {
    const { getPartnerProfile } = await import("@/content/partners");
    return { profile: getPartnerProfile("housing-association") };
  },
  component: PartnerRoutePage,
  head: () => ({
    meta: [
      { title: "Partner with a Housing Association — Impact Investment Group" },
      { name: "description", content: profile.summary },
      {
        property: "og:title",
        content: "Partner with a Housing Association — Impact Investment Group",
      },
      { property: "og:description", content: profile.summary },
      { property: "og:url", content: profile.path },
    ],
    links: [{ rel: "canonical", href: profile.path }],
  }),
});

function PartnerRoutePage() {
  const { profile } = Route.useLoaderData();
  return <PartnerPage profile={profile} />;
}
