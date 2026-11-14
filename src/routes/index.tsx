import { createFileRoute, Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CouncilPanel } from "@/components/home/council-panel";
import { DemandMap } from "@/components/home/demand-map";
import { HomeHero } from "@/components/home/hero";
import { MissionSolution } from "@/components/home/mission-solution";
import { HomeFaq } from "@/components/faq/home-faq";
import { CharityImpact } from "@/components/charity/charity-impact";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { LogoMarquee } from "@/components/ui/logo-marquee";
import { demandMapCopy } from "@/content/home";
import {
  dataSources,
  dataSourcesDisclaimer,
  dataSourcesEyebrow,
  openStreetMapAttribution,
} from "@/content/trust";
import { iconByName } from "@/lib/icon-registry";
import "@/components/home/friendly-home.css";

const icon = (name: string): LucideIcon => iconByName(name);

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Impact Investment Group — Social Impact Property & Supported Housing" },
      {
        name: "description",
        content:
          "A UK social-impact property platform matching local authorities, providers, landlords and investors to compliant supported housing.",
      },
      {
        property: "og:title",
        content: "Impact Investment Group — Social Impact Property & Supported Housing",
      },
      {
        property: "og:description",
        content:
          "Matching local authorities, care and support providers, landlords and investors to compliant supported housing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://impactinvestmentgroup.co.uk/" },
      /* The link card WhatsApp, LinkedIn and X draw. Absolute URL, 1200 x 630,
         under 300 KB: WhatsApp ignores a relative path and a larger file. */
      {
        property: "og:image",
        content: "https://impactinvestmentgroup.co.uk/images/brand/og-default-20261105-v3.png",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Impact Investment Group logo" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content: "https://impactinvestmentgroup.co.uk/images/brand/og-default-20261105-v3.png",
      },
    ],
    links: [{ rel: "canonical", href: "https://impactinvestmentgroup.co.uk/" }],
  }),
});

function HomePage() {
  return (
    <>
      <HomeHero />
      <MissionSolution />
      <CharityImpact variant="home" />
      <CouncilPanel />
      <section
        data-buddy-topic="property"
        aria-labelledby="demand-heading"
        className="home-demand-friendly section-light border-t border-rule"
      >
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-14">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-teal-600">{demandMapCopy.eyebrow}</p>
              <h2
                id="demand-heading"
                className="mt-3 max-w-[22ch] font-heading text-[clamp(1.9rem,3.1vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.025em] text-ink"
              >
                {demandMapCopy.title}
              </h2>
              <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-ink-muted">
                {demandMapCopy.lead}
              </p>
              <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-ink-muted">
                <Info aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal-600" />
                {demandMapCopy.illustrativeNote}
              </p>
              <ul className="mt-8 space-y-5">
                {demandMapCopy.statements.map((statement) => {
                  const Glyph = icon(statement.icon);
                  return (
                    <li key={statement.heading} className="flex gap-3">
                      <Glyph aria-hidden="true" className="mt-1 size-5 shrink-0 text-teal-600" />
                      <div>
                        <h3 className="text-base font-semibold text-ink">{statement.heading}</h3>
                        <p className="mt-1 max-w-[55ch] text-sm leading-relaxed text-ink-muted">
                          {statement.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-7">
                <Button variant="primary" asChild>
                  <Link to="/platform">View Our Platform</Link>
                </Button>
              </div>
            </div>
            <Reveal>
              <DemandMap readout="below" />
            </Reveal>
          </div>
          <div id="data-sources" className="mt-10 border-t border-rule pt-8 text-center">
            <h3 id="data-sources-heading" className="text-base font-semibold text-teal-600">
              {dataSourcesEyebrow}
            </h3>
            <LogoMarquee
              items={dataSources}
              label={dataSourcesEyebrow}
              focusable
              progressiveImages
              durationSeconds={dataSources.length * 6}
              className="mt-6 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              plateClassName="h-28 w-56 overflow-hidden p-3 sm:h-32 sm:w-64"
              imgClassName="size-full"
            />
            <p className="mx-auto mt-6 max-w-[100ch] text-xs leading-relaxed text-ink-muted">
              {dataSourcesDisclaimer} · {openStreetMapAttribution} ·{" "}
              <Link
                to="/about"
                className="font-semibold text-teal-600 underline-offset-4 hover:underline"
              >
                Where our data comes from
              </Link>
            </p>
          </div>
        </div>
      </section>
      <HomeFaq />
    </>
  );
}
