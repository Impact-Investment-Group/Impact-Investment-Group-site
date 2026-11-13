import { createFileRoute } from "@tanstack/react-router";
import { PartnerPage } from "@/components/partners/partner-page";
import { getPartnerSummary } from "@/content/partner-summaries";

const profile = getPartnerSummary("resident");
export const Route = createFileRoute("/partner-with-resident")({
  loader: async () => {
    const { getPartnerProfile } = await import("@/content/partners");
    return { profile: getPartnerProfile("resident") };
  },
  component: PartnerRoutePage,
  head: () => ({
    meta: [
      { title: "Housing for Residents, Individuals & Families — Impact Investment Group" },
      { name: "description", content: profile.summary },
      {
        property: "og:title",
        content: "Housing for Residents, Individuals & Families — Impact Investment Group",
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
