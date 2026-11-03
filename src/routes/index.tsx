import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CouncilPanel } from "@/components/home/council-panel";
import { DemandMap } from "@/components/home/demand-map";
import { HomeHero } from "@/components/home/hero";
import { MissionSolution } from "@/components/home/mission-solution";
import { Button } from "@/components/ui/button";
import { IconCircle } from "@/components/ui/icon-circle";
import { PreReleaseBadge } from "@/components/ui/pre-release-badge";
import { Reveal } from "@/components/ui/reveal";
import { charityPledge } from "@/content/charity";
import { closingCopy, demandMapCopy } from "@/content/home";
import { registerRoute } from "@/content/site";
import {
  dataSources,
  dataSourcesDisclaimer,
  dataSourcesEyebrow,
  openStreetMapAttribution,
  platformStats,
  platformStatsSource,
} from "@/content/trust";
import { iconByName } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";

/** The single orange action this page exists to get. Hero + closing band only. */
const PRIMARY_LABEL = registerRoute.label;

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
      {/* 1 · Hero */}
      <HomeHero />

      {/* 2 · Our mission | The problem, flipping to Our solution */}
      <MissionSolution />

      {/* Wave 576 (10 Oct 2026): the pledge follows the need the mission opens
          with. Cream with a top rule so it does not weld to the white council
          panel below it. The sentence alone. */}
      <div className="border-t border-rule bg-page-alt">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 lg:py-12">
          <p className="mx-auto max-w-[48ch] text-balance text-center font-heading text-[clamp(1.25rem,2.4vw,1.75rem)] font-bold leading-[1.3] text-ink">
            {charityPledge}
          </p>
        </div>
      </div>

      {/* Commissioning councils — a band, not a numbered section. It sits
          between the mission panel and the demand map because that is the
          hinge in the argument: this is who is asking, immediately before the
          map showing where.

          Now an anchored panel rather than a loose strip. The count, the
          "of ~296" denominator and the disclaimer live in a fixed label block
          inside the component, so the compliance text is structural instead of
          a caption that a later layout pass would trim. See CouncilPanel. */}
      <CouncilPanel />

      {/* 3 · Live UK demand map — stays dark, the glow needs it.

          Option A of four: the map moves right and roughly doubles, and
          everything that used to sit under the statements comes out.

          What was removed was dead UI, not features. The ten category chips
          were <li> elements with no handler and were never passed to
          <DemandMap visibleIds>; both dropdowns carried options and no
          onChange. Hover, click, selection and the readout all live inside
          DemandMap and are untouched by this.

          Two disclaimers were under there. The commissioning-briefs one was a
          straight duplicate of what CouncilPanel now states in full beside the
          crests, so it is deleted — see the note in content/home.ts. The
          illustrative-purposes one is NOT tied to the dropdowns: the map still
          shows illustrative data, so it survives as one line behind an info
          icon in the left column.

          The map column is capped in WIDTH because the SVG scales off its
          620 × 760 viewBox — width is the only thing that controls its height.
          560px puts it at ~686px tall, which is roughly the height of the left
          column beside it, so the two balance. */}
      {/*
       * WAVE 412: THE SECTION IS LIGHT AND THE MAP IS THE ISLAND.
       *
       * The cream band rather than the page white, because everything in the
       * left column is a card and a card needs a ground to sit on. The map
       * itself keeps its darkness on its own rounded plate inside this
       * section; see the note on that plate in demand-map.tsx for why the dot
       * field cannot follow the page into the light.
       */}
      <section aria-labelledby="demand-heading" className="section-light border-t border-rule">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:items-stretch">
            <div className="flex min-w-0 flex-col">
              <p className="eyebrow text-teal-600">{demandMapCopy.eyebrow}</p>
              <h2
                id="demand-heading"
                className="heading-tight mt-2 max-w-[20ch] text-balance text-[clamp(1.5rem,2.8vw,2rem)] font-bold text-ink"
              >
                {demandMapCopy.title}
              </h2>
              <p className="measure mt-4 text-base leading-relaxed text-ink-muted">
                {demandMapCopy.lead}
              </p>

              {/* A recorded snapshot, not a live feed — see content/trust.ts.
                  The caption says so once beneath the row rather than three
                  times, once per card, which is also more honest. */}
              {/* ⚠ WAVE 414: TWO AND ONE ON A PHONE, THREE ACROSS FROM 640px.
                  At 360 three columns leave 100px a card, and these labels are
                  phrases rather than words: "Homes sourced to date" wraps to
                  four lines in 100px at 12px and the row becomes three tall
                  thin boxes of broken text. Two columns give 155px and two
                  lines. The third card takes the whole of the second row
                  rather than leaving a hole beside it, which also puts the
                  emphasised figure on a line of its own. */}
              <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {platformStats.map((stat) => (
                  <li
                    key={stat.label}
                    className={cn(
                      "rounded-2xl border p-4 shadow-[var(--shadow-card)]",
                      "last:col-span-2 sm:last:col-span-1",
                      /* The emphasised figure keeps its teal fill and its
                         white numeral (5.25:1); the other two are white cards
                         with a teal-600 numeral on white (5.25:1) and navy ink
                         under it. Same three cards, same hierarchy, read the
                         other way up. */
                      stat.emphasis ? "border-teal-600 bg-teal-600" : "border-rule bg-page",
                    )}
                  >
                    <span
                      className={cn(
                        "block font-heading text-[22px] font-extrabold leading-none tracking-[-0.02em]",
                        stat.emphasis ? "text-page" : "text-teal-600",
                      )}
                    >
                      {stat.value}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 block text-[12px] max-lg:text-[15px] font-semibold leading-snug max-lg:leading-[1.6]",
                        stat.emphasis ? "text-page" : "text-ink",
                      )}
                    >
                      {stat.label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] max-lg:text-[12px] font-semibold text-teal-600">
                {/* WAVE 413: THE ONE SMALL LOOP THIS WAVE ADDS, and the only
                    thing on the site that repeats forever besides the map's
                    node pulse and the council marquee. It is 6px across and it
                    breathes over 2 seconds, which is what makes the word
                    beside it ("live") legible as a claim about NOW rather than
                    as a label somebody typed once. Nothing moves and nothing
                    reflows: it is opacity on an absolutely positioned ring.
                    Still under reduced motion, where the filled dot and the
                    Activity glyph say the same thing without moving. */}
                <span aria-hidden="true" className="live-dot" />
                <Activity aria-hidden="true" className="size-3" />
                {platformStatsSource}
              </p>

              {/* Client-approved copy, verbatim. */}
              <ul className="mt-7 grid gap-4">
                {demandMapCopy.statements.map((statement) => (
                  <li key={statement.heading} className="flex items-start gap-3">
                    <IconCircle
                      icon={icon(statement.icon)}
                      size="compact"
                      tone={statement.tone}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <h3 className="heading-tight text-base font-bold text-ink">
                        {statement.heading}
                      </h3>
                      <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
                        {statement.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* The action sits directly under the statements rather than at
                  the foot of the column. It follows on from them — read what
                  the platform does, then go and look at it — and at the bottom
                  it was sharing a corner with the compliance note, which made
                  the note look like the button's small print.

                  It also no longer points at registration. "Our Services" is
                  /platform in primaryNav (content/site.ts), so this is the
                  same destination the nav calls Our Services.

                  ⚠️ That means this section now has no registration CTA at
                  all. The hero role cards and the closing band still do, so the
                  page is not without one — but if this section was pulling its
                  weight on sign-ups, this is the change that stops it. */}
              <div className="mt-7">
                <Button variant="primary" asChild>
                  <Link to="/platform">View Our Platform</Link>
                </Button>
              </div>

              {/* mt-auto keeps the note at the foot of the column, level with
                  the bottom of the map rather than floating up the middle. */}
              <p className="mt-auto flex items-start gap-2 pt-7 text-[11px] max-lg:text-[15px] leading-[1.6] text-ink-muted">
                <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                {demandMapCopy.illustrativeNote}
              </p>
            </div>

            <Reveal>
              <DemandMap readout="below" />
            </Reveal>
          </div>

          {/* Provenance of the map's data, so it sits with what it describes.
              The eyebrow runs inline with the logos and the two attributions
              share one line — both saved a row each, and every word of them is
              still here. ODbL requires the OpenStreetMap credit wherever its
              data is used. */}
          <div className="mt-8 border-t border-rule pt-4">
            <div className="flex flex-col items-center gap-3">
              <h3 className="eyebrow tracking-[0.14em] text-teal-600">{dataSourcesEyebrow}</h3>
              <ul className="flex flex-wrap items-center justify-center gap-3">
                {dataSources.map((source) => (
                  <li
                    key={source.id}
                    className="inline-flex h-14 items-center justify-center rounded-lg border border-rule bg-white px-4 py-2"
                  >
                    <img
                      src={source.logo}
                      alt={`${source.name} — ${source.blurb}`}
                      width={source.artwork.w}
                      height={source.artwork.h}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-auto max-w-[10.5rem] object-contain"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-2.5 text-center text-[11px] max-lg:text-[15px] leading-relaxed text-ink-muted">
              {dataSourcesDisclaimer} · {openStreetMapAttribution} ·{" "}
              <Link
                to="/about"
                className="font-semibold text-teal-600 transition-colors duration-200 hover:text-orange-700"
              >
                Where our data comes from
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* 4 · Closing CTA — cream. With Who We Connect gone the page alternates
          cleanly again: navy hero, cream mission/solution, navy demand map,
          cream close, navy footer. The orange button is a fill, not text, so it
          survives on the light ground; everything else re-points to the cream
          palette.

          Halved (~720px → ~370px) without dropping a word. Three changes did
          it: the headline steps from 56px to 34px on a 26ch measure so it
          still breaks over two lines; the vision statement sits on a 40rem
          measure at 15px so it fits two lines instead of three; and the four
          points run as one centred row of 32px rings rather than a two-column
          block of 60px ones, which alone was 176px of the old height. Padding
          drops from 96px to 40/48px. Everything stays centred on one axis. */}
    </>
  );
}
