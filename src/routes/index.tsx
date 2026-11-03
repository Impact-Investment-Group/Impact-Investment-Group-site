import { createFileRoute, Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CouncilPanel } from "@/components/home/council-panel";
import { DemandMap } from "@/components/home/demand-map";
import { HomeHero } from "@/components/home/hero";
import { MissionSolution } from "@/components/home/mission-solution";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { demandMapCopy } from "@/content/home";
import {
  dataSources,
  dataSourcesDisclaimer,
  dataSourcesEyebrow,
  openStreetMapAttribution,
  platformStats,
  platformStatsSource,
} from "@/content/trust";
import { iconByName } from "@/lib/icon-registry";

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
        content: "https://impactinvestmentgroup.co.uk/images/brand/og-default.png",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Impact Investment Group logo" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content: "https://impactinvestmentgroup.co.uk/images/brand/og-default.png",
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
      <CouncilPanel />
      <section aria-labelledby="demand-heading" className="section-light border-t border-rule">
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
              <dl className="mt-7 border-y border-rule">
                {platformStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="grid grid-cols-[.65fr_1fr] items-baseline gap-4 border-b border-rule py-3.5 last:border-b-0"
                  >
                    <dt className="col-start-2 text-sm leading-relaxed text-ink-muted">
                      {stat.label}
                    </dt>
                    <dd className="col-start-1 row-start-1 font-heading text-2xl font-bold text-ink">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">{platformStatsSource}</p>
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
          <div className="mt-10 border-t border-rule pt-6">
            <h3 className="text-sm font-semibold text-teal-600">{dataSourcesEyebrow}</h3>
            <ul className="mt-4 flex flex-wrap items-center gap-6">
              {dataSources.map((source) => (
                <li key={source.id} className="h-10">
                  <img
                    src={source.logo}
                    alt={source.name + ": " + source.blurb}
                    width={source.artwork.w}
                    height={source.artwork.h}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-auto max-w-[10.5rem] object-contain"
                  />
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-[100ch] text-xs leading-relaxed text-ink-muted">
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
    </>
  );
}
