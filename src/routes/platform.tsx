import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { registerRoute } from "@/content/site";
import {
  aiTeamNote,
  capitalAtRisk,
  compareUpdated,
  demandFigures,
  differenceHeading,
  differenceLead,
  differenceStory,
  leaseComparison,
  servicesClose,
  servicesHero,
  steps,
  sustainabilityPrinciples,
  workflow,
  workflowFooter,
  type Seg,
} from "@/content/services";
import { SIZES_HALF_FROM_TABLET, intrinsic, variantSrcSet } from "@/lib/responsive-image";

/**
 * /platform — "Our Services".
 *
 * Rebuilt from the old production platform page, then cut. That page ran a
 * paragraph per step and a paragraph per tool; this runs a line each, with the
 * words worth seeing carried in bold ink or bold orange.
 *
 *   1 · Find it, price it, match it   cream   hero + the product screenshot
 *   2 · Four steps, nothing hidden    navy    the journey
 *   3 · Find it. Price it. Match it.   cream   Petra, Peter, Pippa
 *   4 · Built differently             navy    trust, demand, integration
 *   5 · Every figure, sourced         cream   close
 *
 * Same construction as /about: everything is written in the dark idiom and the
 * cream bands carry `.section-light`, which re-points it. `panel` is already a
 * navy card on navy and a white card on cream, so no card is told which ground
 * it is on. The only conditional is the accent orange — `.section-light`
 * rewrites orange-500 to navy ink, and orange-700 is the one it lets through.
 * The 19px semibold on emphasised lines was the size orange-700 needed to
 * pass as large text at 4.1:1; wave 295 took it to 5.78:1, so the size is now
 * kept for rhythm rather than for contrast.
 */

export const Route = createFileRoute("/platform")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Our Services — Impact Investment Group" },
      {
        name: "description",
        content:
          "Find it, price it, match it. We source UK residential property, price every home against named public data, and follow it into managed supported housing.",
      },
      { property: "og:title", content: "Our Services — Impact Investment Group" },
      {
        property: "og:description",
        content:
          "The Property Finder, the Demand Map and an AI team that finds, prices and matches every home — one workflow, every figure sourced.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/platform" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/platform" }],
  }),
});

const ACCENT = {
  teal: { text: "text-teal-600", bar: "bg-teal-600", disc: "bg-teal-600 text-page" },
  /* The disc is a FILLED control carrying a 10px numeral, so the fill is
     orange-600 (white on it is 5.34:1) rather than orange-500 (4.23:1, which
     axe caught on /platform at both widths in wave 412). The bar and the text
     stay 500: a 3px rule is a graphic at 4.23:1 on white, and `text` is only
     ever set on a heading. */
  orange: { text: "text-orange-700", bar: "bg-orange-500", disc: "bg-orange-600 text-page" },
  white: { text: "text-ink", bar: "bg-white/70", disc: "bg-white text-navy-900" },
} as const;

type Accent = keyof typeof ACCENT;

function Rich({ parts, tone }: { parts: Seg[]; tone: "rust" | "teal" }) {
  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <strong
            key={i}
            className={cn(
              "font-bold",
              /* Both accents are orange-700. `Summary` sets Rich at 19px
                 semibold, which axe scores as body text rather than large,
                 and orange-500 is 4.23:1 on white and 3.76:1 on the cream.
                 The teal branch is not reached on this page today; it is
                 stepped down so that it cannot fail on the day it is. */
              part.em === "accent"
                ? tone === "rust"
                  ? "text-orange-700"
                  : "text-orange-700"
                : "text-ink",
            )}
          >
            {part.t}
          </strong>
        ),
      )}
    </>
  );
}

function Band({
  id,
  light,
  grid,
  children,
}: {
  id: string;
  light?: boolean;
  grid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "relative overflow-hidden border-t border-rule",
        id === "services-heading" && "page-intro",
        light ? "section-light" : "bg-page",
      )}
    >
      {grid ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(color-mix(in_srgb,var(--brand-teal-on-ink)_8%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--brand-teal-on-ink)_8%,transparent)_1px,transparent_1px)] [background-size:56px_56px]"
        />
      ) : null}
      <div className="relative mx-auto w-full max-w-[1200px] px-5 py-12 sm:px-8 lg:py-14">
        {children}
      </div>
    </section>
  );
}

function Head({
  eyebrow,
  title,
  id,
  tone = "teal",
  hero,
  centre,
}: {
  eyebrow: string;
  title: string;
  id?: string;
  tone?: "rust" | "teal";
  hero?: boolean;
  centre?: boolean;
}) {
  const Tag = hero ? "h1" : "h2";
  return (
    <div className={centre ? "text-center" : undefined}>
      <p
        className={cn(
          "eyebrow tracking-[0.14em]",
          tone === "rust" ? "text-orange-700" : "text-teal-600",
        )}
      >
        {eyebrow}
      </p>
      <Tag
        id={id}
        className={cn(
          "heading-tight mt-2.5 text-balance font-extrabold tracking-[-0.02em] text-ink",
          hero ? "text-[clamp(2rem,4.6vw,3.25rem)]" : "text-[clamp(1.5rem,2.8vw,2rem)]",
        )}
      >
        {title}
      </Tag>
    </div>
  );
}

function Summary({
  parts,
  tone,
  centre,
}: {
  parts: Seg[];
  tone: "rust" | "teal";
  centre?: boolean;
}) {
  return (
    <p
      className={cn(
        "mt-4 text-[19px] font-semibold leading-[1.5] text-ink-muted",
        centre ? "mx-auto max-w-[64ch] text-center" : "max-w-[62ch]",
      )}
    >
      <Rich parts={parts} tone={tone} />
    </p>
  );
}

const DIFFERENCE_VISUAL = {
  past: { value: "FIXED", unit: "one long term, no review point", tone: "text-orange-700" },
  lessons: { value: "REVIEW", unit: "before risk rolls forward", tone: "text-ink" },
  solution: { value: "5+", unit: "year leases, renewed on evidence", tone: "text-teal-600" },
} as const;

function DifferenceStory() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const selectChapter = (index: number) => {
    setActiveIndex(index);
    tabRefs.current[index]?.focus();
  };
  const activeChapter = differenceStory[activeIndex]!;
  const activeVisual = DIFFERENCE_VISUAL[activeChapter.id as keyof typeof DIFFERENCE_VISUAL];
  const activeAccent = ACCENT[activeChapter.tone as Accent];

  return (
    <>
      <Head eyebrow="How we differ" title={differenceHeading} id="compare-heading" />
      <p className="mt-4 max-w-[66ch] text-[16.5px] leading-relaxed text-ink-muted">
        {differenceLead}
      </p>

      <div className="relative mt-8 overflow-hidden rounded-[var(--radius-panel)] border border-rule bg-page shadow-[var(--shadow-card)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px]"
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-28 top-1/2 size-[430px] -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700",
            activeChapter.tone === "orange"
              ? "bg-orange-500/15"
              : activeChapter.tone === "teal"
                ? "bg-teal-600/18"
                : "bg-white/8",
          )}
        />

        <div className="relative grid lg:grid-cols-[240px_minmax(0,1fr)]">
          <div
            className="border-b border-rule p-4 sm:p-5 lg:border-b-0 lg:border-r"
            role="tablist"
            aria-label="How we differ storyline"
          >
            <p className="mb-3 font-mono text-[10px] max-lg:text-[12px] uppercase tracking-[0.16em] text-ink-muted">
              Choose a chapter
            </p>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {differenceStory.map((chapter, i) => {
                const selected = i === activeIndex;
                const accent = ACCENT[chapter.tone as Accent];
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    role="tab"
                    id={`difference-tab-${chapter.id}`}
                    ref={(element) => {
                      tabRefs.current[i] = element;
                    }}
                    tabIndex={selected ? 0 : -1}
                    aria-selected={selected}
                    aria-controls="difference-story-panel"
                    onClick={() => setActiveIndex(i)}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowRight" || event.key === "ArrowDown"
                          ? (i + 1) % differenceStory.length
                          : event.key === "ArrowLeft" || event.key === "ArrowUp"
                            ? (i - 1 + differenceStory.length) % differenceStory.length
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? differenceStory.length - 1
                                : null;
                      if (next !== null) {
                        event.preventDefault();
                        selectChapter(next);
                      }
                    }}
                    className={cn(
                      "group flex min-h-[64px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-300",
                      selected
                        ? "translate-x-0 border-teal-600/45 bg-page shadow-[0_10px_30px_-18px_color-mix(in_srgb,var(--brand-teal-on-ink)_70%,transparent)] lg:translate-x-1"
                        : "border-transparent bg-transparent hover:border-rule hover:bg-page",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full border font-mono text-sm font-semibold transition-all duration-300",
                        selected
                          ? cn(accent.disc, "border-transparent scale-105")
                          : "border-rule text-ink-muted group-hover:text-ink",
                      )}
                    >
                      {chapter.number}
                    </span>
                    <span>
                      <span
                        className={cn(
                          /* 10px bold: text, so the orange is 700 (6.50:1 on
                             white) rather than 500 (4.22:1). */
                          "block text-[10px] max-lg:text-[12px] font-bold uppercase tracking-[0.11em]",
                          selected ? accent.text : "text-ink-muted",
                        )}
                      >
                        {chapter.eyebrow}
                      </span>
                      <span className="mt-0.5 block text-[12px] max-lg:text-[15px] leading-snug max-lg:leading-[1.6] text-ink-muted">
                        {i === 0 ? "What failed" : i === 1 ? "What we learnt" : "What we built"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id="difference-story-panel"
            role="tabpanel"
            aria-labelledby={`difference-tab-${activeChapter.id}`}
            tabIndex={0}
            className="relative min-h-[500px] p-5 sm:p-8 lg:min-h-[440px] lg:p-10"
          >
            <div
              key={activeChapter.id}
              className="motion-safe:[animation:rise-in_320ms_var(--ease-out-soft)_both]"
            >
              <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.78fr)] lg:items-center">
                <div>
                  <p className={cn("eyebrow", activeAccent.text)}>{activeChapter.eyebrow}</p>
                  <h3 className="heading-tight mt-3 max-w-[19ch] font-heading text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-[-0.025em] text-ink">
                    {activeChapter.title}
                  </h3>
                  <p className="mt-4 max-w-[54ch] text-[14px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                    {activeChapter.body}
                  </p>
                  <ul className="mt-6 grid gap-2.5">
                    {activeChapter.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-3 text-[13px] max-lg:text-[15px] leading-relaxed text-ink-muted"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-[7px] size-1.5 shrink-0 rounded-full",
                            activeAccent.bar,
                          )}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative grid min-h-[220px] place-items-center overflow-hidden rounded-2xl border border-rule bg-page/70 p-5 text-center sm:min-h-[260px]">
                  <span
                    aria-hidden="true"
                    className="absolute inset-5 rounded-full border border-dashed border-rule [animation:spin_28s_linear_infinite] motion-reduce:animate-none"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute size-[145px] rounded-full opacity-20 blur-2xl",
                      activeAccent.bar,
                    )}
                  />
                  <div className="relative">
                    <p
                      className={cn(
                        "font-heading font-extrabold leading-[0.78] tracking-[-0.075em]",
                        activeVisual.tone,
                        /* By the value's shape, not by chapter (wave 567):
                           one or two digits with an optional plus take the
                           figure size, and a word takes the smaller one, so
                           it stays inside the 250px column at 390. */
                        /^\d{1,2}\+?$/.test(activeVisual.value)
                          ? "text-[clamp(6rem,14vw,9rem)]"
                          : "text-[clamp(2.5rem,7vw,4.5rem)]",
                      )}
                    >
                      {activeVisual.value}
                    </p>
                    <p className="mt-5 font-heading text-[13px] font-bold uppercase tracking-[0.14em] text-ink">
                      {activeVisual.unit}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 11px semibold, so orange-700 and not orange-500: 500 is
                4.23:1 on white and 3.76:1 on the cream, under the 4.5:1 body
                floor, and this card's ground is neither of those flat (see
                the wave 412b report, measured off the rendered pixels). Its
                teal sibling two lines down was stepped to 600 in wave 412 and
                this one was missed. */}
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-4 text-[11px] max-lg:text-[12px] text-ink-muted">
              <span className="font-semibold text-orange-700">{leaseComparison[0]!.strip}</span>
              <ArrowRight aria-hidden="true" className="size-3.5 text-ink" />
              <span className="font-semibold text-teal-600">{leaseComparison[1]!.strip}</span>
            </div>
          </div>
        </div>

        <ul className="relative grid border-t border-rule sm:grid-cols-3">
          {sustainabilityPrinciples.map((principle, i) => (
            <li
              key={principle.id}
              className={cn("px-5 py-4", i > 0 && "border-t border-rule sm:border-l sm:border-t-0")}
            >
              <p className="font-heading text-[13px] font-extrabold text-ink">{principle.title}</p>
              <p className="mt-1 text-[11.5px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                {principle.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <DemandTicker />
    </>
  );
}

/**
 * The six sourced statistics, as a lane above `md` and as a list below it.
 *
 * ⚠ WAVE 490, PHONE RULE 4: A PHONE READS, IT DOES NOT CHASE.
 *
 * These are three published figures with their publisher and their date on
 * them, and they were riding a 40-second transform loop 3,082px wide inside a
 * 390px window. What a visitor saw at 390 was a 22px figure with its label cut
 * mid-word at the left edge ("ouseholds on local-authority") and its source
 * running off the right, moving the whole time. The council lane on the home
 * page is decoration and may move; a sourced statistic is information and may
 * not, and that is the line rule 4 draws.
 *
 * REFLOW, NEVER REWORD. Not one of these strings changes. Below `md` the same
 * three items stack, one row each, figure over label over source, and the
 * three clones the loop needs are not rendered at all.
 *
 * TWO MECHANISMS, AND BOTH ARE DELIBERATE. `.demand-ticker` in styles.css
 * stops the lane and stacks it with no JavaScript whatsoever, so the
 * prerendered document is right at every width before a byte of bundle lands
 * and the clones are `display: none` rather than merely still. The query below
 * then drops the clones from the DOM once the bundle is there, so a phone
 * carries three items and not six. It defaults to the LANE, so the prerendered
 * markup is exactly the one this page has always shipped and nothing can
 * mismatch at hydration.
 */
function DemandTicker() {
  const [lane, setLane] = React.useState(true);
  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const read = () => setLane(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  const items = lane ? [...demandFigures, ...demandFigures] : demandFigures;

  return (
    <>
      <div
        className="logo-marquee demand-ticker mt-7 border-y border-rule py-1"
        aria-label="Sourced housing demand figures"
      >
        <div className="logo-marquee__track">
          {items.map((figure, i) => (
            <span
              key={`${figure.id}-${i}`}
              data-clone={i >= demandFigures.length ? "true" : undefined}
              className="inline-flex items-baseline gap-2 px-3 max-md:flex-col max-md:items-start max-md:gap-0.5 max-md:px-0 max-md:py-1.5"
            >
              <strong
                className={cn(
                  "font-heading text-[22px] font-extrabold",
                  ACCENT[figure.accent as Accent].text,
                )}
              >
                {figure.value}
              </strong>
              <span className="text-[12px] max-lg:text-[15px] text-ink-muted">{figure.label}</span>
              <span className="text-[10px] max-lg:text-[13px] text-ink-muted">{figure.source}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[10px] max-lg:text-[13px] text-ink-muted">{compareUpdated}</p>
    </>
  );
}

const PORTAL_ART = {
  petra: "/images/ai-team/petra-point.webp",
  peter: "/images/ai-team/peter-present.webp",
  pippa: "/images/ai-team/pippa-present.webp",
} as const;

const PORTAL_LABEL = {
  petra: "Enter · Find",
  peter: "Enter · Price",
  pippa: "Enter · Match",
} as const;

const PORTAL_ACTION = {
  petra: "Search every sourced listing",
  peter: "Test the full cost picture",
  pippa: "Make the outcome visible",
} as const;

const DEFAULT_WORKFLOW_STEP = workflow[0]!;

/**
 * The approved "Character Portals" concept. Each doorway is a real button,
 * and its expanded profile keeps the existing workflow copy and safeguards.
 */
function CharacterPortals() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = workflow.find((step) => step.id === selectedId) ?? null;

  return (
    <div className="relative">
      <div className="relative z-1">
        <p className="eyebrow tracking-[0.16em] text-teal-600">Option 4 · Character portals</p>
        <h2
          id="tools-heading"
          className="heading-tight mt-2 max-w-[720px] font-heading text-[clamp(2.25rem,5vw,4.35rem)] font-bold text-ink"
        >
          Three doors into <span className="text-orange-700">one platform.</span>
        </h2>
        <p className="mt-3 text-[15px] text-ink-muted sm:text-[16px]">
          Choose where you want to begin.
        </p>

        <div className="relative mt-9 min-h-[310px] sm:mt-12 sm:min-h-[390px]">
          <ol
            aria-label="Choose a platform guide"
            className={cn(
              "mx-auto grid max-w-[780px] grid-cols-3 items-end gap-2 transition-opacity duration-300 sm:gap-5 lg:gap-9",
              selected && "pointer-events-none opacity-0",
            )}
          >
            {workflow.map((step) => {
              const id = step.id as keyof typeof PORTAL_ART;
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === step.id}
                    aria-label={`Meet ${step.claim.split(" ")[0]} — ${PORTAL_LABEL[id]}`}
                    onClick={() => setSelectedId(step.id)}
                    className={cn(
                      "group relative h-[285px] w-full overflow-hidden rounded-b-[16px] rounded-t-[999px] border-2 border-rule bg-[radial-gradient(circle_at_50%_38%,color-mix(in_srgb,var(--brand-teal-on-ink)_20%,transparent),var(--color-navy-800)_66%)] p-0 text-ink",
                      "transition-[transform,box-shadow,border-color] duration-500 ease-out motion-reduce:transition-none",
                      "hover:-translate-y-3 hover:scale-[1.025] hover:border-teal-600 hover:shadow-[0_0_48px_color-mix(in_srgb,var(--brand-teal-on-ink)_28%,transparent)]",
                      "focus-visible:-translate-y-3 focus-visible:border-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-4 focus-visible:ring-offset-navy-900",
                      "sm:h-[350px] lg:h-[390px]",
                      "before:absolute before:inset-[-60%] before:animate-spin before:bg-[conic-gradient(transparent,color-mix(in_srgb,var(--brand-teal-on-ink)_36%,transparent),transparent,color-mix(in_srgb,var(--brand-primary)_30%,transparent),transparent)] before:[animation-duration:7s] before:content-['']",
                      "after:absolute after:inset-2 after:rounded-[inherit] after:bg-page after:content-['']",
                    )}
                  >
                    <img
                      src={PORTAL_ART[id]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      width={347}
                      height={520}
                      className="pointer-events-none absolute bottom-9 left-1/2 z-2 h-[225px] w-[122%] max-w-none -translate-x-1/2 object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-[1.04] motion-reduce:transition-none sm:h-[292px] lg:h-[330px]"
                    />
                    <strong className="absolute inset-x-1.5 bottom-1.5 z-3 rounded-[10px] bg-page/90 px-1 py-2 font-heading text-[10px] max-lg:text-[12px] font-semibold text-ink sm:inset-x-2.5 sm:bottom-2.5 sm:px-2 sm:text-[14px]">
                      {PORTAL_LABEL[id]}
                    </strong>
                  </button>
                </li>
              );
            })}
          </ol>

          {selected ? (
            <div
              role="dialog"
              aria-modal="false"
              aria-labelledby="portal-profile-heading"
              className="absolute inset-0 z-10 grid overflow-hidden rounded-[22px] border border-teal-600/50 bg-page/98 shadow-[0_35px_80px_rgba(0,0,0,0.55)] md:grid-cols-[0.8fr_1.2fr]"
            >
              <div className="relative hidden overflow-hidden bg-[radial-gradient(circle,color-mix(in_srgb,var(--brand-teal-on-ink)_25%,transparent),transparent_68%)] md:block">
                <img
                  src={PORTAL_ART[selected.id as keyof typeof PORTAL_ART]}
                  loading="lazy"
                  alt={selected.claim.split(" ")[0]}
                  width={347}
                  height={520}
                  className="absolute bottom-0 left-1/2 h-[94%] w-full -translate-x-1/2 object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <p className="eyebrow tracking-[0.14em] text-teal-600">{selected.chip}</p>
                <h3
                  id="portal-profile-heading"
                  className="mt-2 font-heading text-[clamp(1.8rem,4vw,3rem)] font-bold text-ink"
                >
                  Hi, I’m {selected.claim.split(" ")[0]}.
                </h3>
                <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink-muted sm:text-[17px]">
                  {selected.body}
                </p>
                <p className="mt-5 font-heading text-[15px] font-bold text-ink sm:text-[17px]">
                  {PORTAL_ACTION[selected.id as keyof typeof PORTAL_ACTION]}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-teal-600 px-4 py-2.5 font-heading text-[13px] font-bold text-page transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 motion-reduce:transition-none"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Return to the doors
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <p className="mx-auto mt-8 max-w-[72ch] text-center text-[14px] max-lg:text-[15px] leading-relaxed text-ink-muted">
          {workflowFooter}
        </p>
        <p className="mx-auto mt-3 max-w-[72ch] text-center text-[12px] max-lg:text-[15px] leading-relaxed text-ink-muted">
          {aiTeamNote}
        </p>
      </div>
    </div>
  );
}

function MissionControl() {
  const [activeId, setActiveId] = React.useState(DEFAULT_WORKFLOW_STEP.id);
  const active = workflow.find((step) => step.id === activeId) ?? DEFAULT_WORKFLOW_STEP;
  const activeKey = active.id as keyof typeof PORTAL_ART;

  return (
    <div className="relative">
      <div className="relative">
        <p className="eyebrow tracking-[0.16em] text-teal-600">
          Option 2 · Platform mission control
        </p>
        <h2
          id="mission-control-heading"
          className="heading-tight mt-2 max-w-[760px] font-heading text-[clamp(2rem,4.6vw,3.8rem)] font-bold text-ink"
        >
          Choose a specialist. <span className="text-orange-700">Activate their tool.</span>
        </h2>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(360px,1.05fr)_minmax(300px,0.95fr)]">
          <div className="relative mx-auto aspect-square w-full max-w-[500px]">
            <span
              aria-hidden="true"
              className="absolute inset-[15%] animate-spin rounded-full border border-dashed border-teal-600/50 [animation-duration:24s] motion-reduce:animate-none"
            />
            {/* ⚠ THE HUB IS LIGHT, AND ITS TEXT DEPENDS ON IT.
                Wave 412 stepped this disc's labels from text-white and
                text-mist to text-ink and text-ink-muted and left the radial
                gradient ending in navy-800, so navy ink was set on a navy
                plate: 1.00:1 and 3.29:1, measured off platform-1280.png. axe
                returned both as INCOMPLETE rather than as violations, which is
                why the wave 412 gate passed them.
                The surface moves. The disc is the teal tint fading into the
                page, both tokens, and the labels read 18.83:1 and 6.97:1 on
                it. Putting navy back here means putting text-white and
                text-mist back with it, and declaring the disc an island. */}
            <div className="absolute inset-[34%] grid place-items-center rounded-full border border-teal-600/50 bg-[radial-gradient(circle,var(--color-tint-teal),var(--color-page)_68%)] text-center shadow-[var(--shadow-glow-teal)]">
              <span>
                <strong className="block font-heading text-ink">One workflow</strong>
                <small className="max-lg:text-[13px] text-ink-muted">Find · Price · Match</small>
              </span>
            </div>
            {workflow.map((step, index) => {
              const key = step.id as keyof typeof PORTAL_ART;
              const position =
                index === 0
                  ? "left-1/2 top-0 -translate-x-1/2"
                  : index === 1
                    ? "bottom-[7%] right-[1%]"
                    : "bottom-[7%] left-[1%]";
              return (
                <button
                  key={step.id}
                  type="button"
                  aria-pressed={activeId === step.id}
                  onClick={() => setActiveId(step.id)}
                  className={cn(
                    "absolute h-[132px] w-[112px] overflow-hidden rounded-[18px] border bg-page/90 text-ink transition duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:h-[142px] sm:w-[126px]",
                    position,
                    activeId === step.id
                      ? "border-teal-600 shadow-[0_0_30px_color-mix(in_srgb,var(--brand-teal-on-ink)_30%,transparent)]"
                      : "border-rule",
                  )}
                >
                  <img
                    src={PORTAL_ART[key]}
                    loading="lazy"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto h-[104px] w-full object-contain sm:h-[112px]"
                  />
                  <span className="font-heading text-[12px] font-bold">
                    {step.claim.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            aria-live="polite"
            className="relative overflow-hidden border border-teal-600/35 bg-[repeating-linear-gradient(0deg,color-mix(in_srgb,var(--brand-teal-on-ink)_3.5%,transparent)_0_3px,transparent_3px_7px)] p-7 shadow-[inset_0_0_55px_color-mix(in_srgb,var(--brand-teal-on-ink)_8%,transparent)] md:min-h-[340px]"
          >
            {/* ⚠ WAVE 490: BELOW `md` THE CHARACTER LEAVES THE TEXT COLUMN.

                One card, three characters: the `src` follows whichever of
                Petra, Peter and Pippa is selected, so this is the whole of the
                fix for all three. Above `md` it is the composition wave 443
                shipped and nothing here touches it.

                What it was at 390: the card is 350px wide, the illustration
                169px of it, running from x=228 to a right edge that clips it
                at 370, with its top 79px inside the card. Petra sat UNDER
                "Describe the home you need. Petra searches the whole sourced
                market for the closest fit." and under the "Tool online" box,
                at a quarter strength, with her pointing arm cut off by the
                card's edge. A ghost behind the words is a decoration on a
                desktop and a smudge on a phone.

                So on a phone she is a figure rather than a wash: 96px tall,
                right-aligned above the copy, at full strength and full colour,
                `object-contain` so nothing is cropped, and the copy runs the
                card's whole width underneath her. The `min-h` goes with her,
                because 340px was reserving room for artwork that is no longer
                in the text column. */}
            <img
              src={PORTAL_ART[activeKey]}
              loading="lazy"
              alt=""
              aria-hidden="true"
              className="relative mb-4 ml-auto block h-24 w-auto object-contain md:absolute md:-bottom-5 md:-right-7 md:mb-0 md:ml-0 md:h-[280px] md:opacity-25 md:saturate-50 md:drop-shadow-[0_0_18px_color-mix(in_srgb,var(--brand-teal-on-ink)_70%,transparent)]"
            />
            <p className="relative eyebrow tracking-[0.14em] text-teal-600">{active.chip}</p>
            <h3 className="relative mt-3 max-w-[12ch] font-heading text-[clamp(1.8rem,3.5vw,2.5rem)] font-bold text-ink">
              Hi, I’m {active.claim.split(" ")[0]}.
            </h3>
            <p className="relative mt-4 max-w-[31ch] text-[15px] leading-relaxed text-ink-muted">
              {active.body}
            </p>
            <p className="relative mt-5 inline-flex border border-teal-600/40 px-3 py-2 text-[13px] max-lg:text-[15px] text-teal-600">
              Tool online · <strong className="ml-1">{PORTAL_ACTION[activeKey]}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Open the illustrative platform capture at its native size on any screen.
 * The dialog keeps the existing caption and supports keyboard dismissal.
 */
function ProductCapture() {
  /* ⚠ ONE ID, SET BY HAND, AND BOTH THINGS THAT NEED A NAME POINT AT IT.
     Radix names a dialog by wiring `aria-labelledby` to the id it generates
     for its own `Title`. Overriding that id with a literal broke the wiring
     and axe returned `aria-dialog-name`, serious, on the open state: the
     title was there and nothing pointed at it. `useId` gives one stable id
     that the content and the title agree on. */
  const titleId = React.useId();
  const capture = (
    <img
      src={servicesHero.image.src}
      loading="lazy"
      alt={servicesHero.image.alt}
      width={2241}
      height={1207}
      className="w-full"
      srcSet={variantSrcSet(servicesHero.image.src)}
      sizes="(min-width: 1200px) 1136px, calc(100vw - 40px)"
    />
  );

  return (
    <figure className="panel overflow-hidden">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="View larger platform preview"
            className="group relative block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600"
          >
            {capture}
            <span className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-rule bg-page px-4 text-sm font-semibold text-ink shadow-[var(--shadow-card)] transition-colors group-hover:bg-secondary">
              View larger <span aria-hidden="true">↗</span>
            </span>
          </button>
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-labelledby={titleId}
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-page sm:inset-6 sm:rounded-2xl sm:border sm:border-rule"
          >
            <DialogTitle id={titleId} className="sr-only">
              {servicesHero.image.caption}
            </DialogTitle>
            {/* ⚠ A SCROLL CONTAINER NEEDS A TAB STOP, which is what axe
                  returns as `scrollable-region-focusable`, serious, and what
                  the first cut of this dialog shipped. `tabIndex` is the stop.

                  ⚠ AND NO NAME OF ITS OWN (wave 490b). It used to point
                  `aria-labelledby` at the dialog's title, so a screen reader
                  entering the dialog heard the caption once as the dialog's
                  name and again as this group's. The dialog already carries
                  the name; the group inside it is only the thing that
                  scrolls.

                  `touch-action` names the two gestures the box is for: drag it
                  sideways, or pinch it. Without it a drag inside a fixed layer
                  is ambiguous and the browser picks.

                  The width comes from the variants manifest rather than from
                  the two numbers on the figure above, which say 2241 by 1207
                  where the file on disk is 1600 by 862. Opening the capture at
                  a width it does not have would upscale it, which is the one
                  thing this dialog exists to avoid. */}
            <div
              tabIndex={0}
              role="group"
              className="flex-1 overflow-auto [touch-action:pan-x_pan-y_pinch-zoom] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600"
            >
              <img
                src={servicesHero.image.src}
                alt=""
                aria-hidden="true"
                width={intrinsic(servicesHero.image.src)?.width}
                height={intrinsic(servicesHero.image.src)?.height}
                className="h-auto max-w-none"
              />
            </div>
            {/* The one new string this wave authors, and it is the
                  accessible name of an icon-only control, which is the only
                  place the canon allows one. `aria-label` rather than an
                  `sr-only` span so it is an attribute rather than a rendered
                  run of text. */}
            <DialogClose
              aria-label="Close"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-full border border-rule bg-page text-ink shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.6} />
            </DialogClose>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      <figcaption className="px-4 py-2.5 text-center text-[12px] max-lg:text-[13px] text-ink-muted">
        {servicesHero.image.caption}
      </figcaption>
    </figure>
  );
}

function LivingComic() {
  const [activeId, setActiveId] = React.useState(DEFAULT_WORKFLOW_STEP.id);

  return (
    <div className="relative font-sans">
      <div className="relative">
        <p className="text-[0.72rem] max-lg:text-[12px] font-medium uppercase tracking-[0.17em] text-teal-600">
          The platform story
        </p>
        <h2
          id="living-comic-heading"
          className="mt-2 font-sans text-[clamp(2.3rem,5vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.04em] text-ink"
        >
          Not a pop-up. <span className="text-teal-600">A living comic.</span>
        </h2>

        <div
          className="mt-8 grid min-h-[470px] grid-cols-1 gap-3 transition-[grid-template-columns] duration-500 ease-out md:grid-cols-[var(--comic-columns)]"
          style={
            {
              "--comic-columns": workflow
                .map((step) => (step.id === activeId ? "1.8fr" : "0.6fr"))
                .join(" "),
            } as React.CSSProperties
          }
        >
          {workflow.map((step, index) => {
            const key = step.id as keyof typeof PORTAL_ART;
            const active = activeId === step.id;
            const quote =
              index === 0
                ? "Tell me what home you need."
                : index === 1
                  ? "Now let’s test the numbers."
                  : "What difference will this home make?";
            const expandedCopy =
              index === 0
                ? "I search the sourced market and bring the closest matches into one view."
                : index === 1
                  ? "I run valuation and cost work against named public data, with every figure traceable."
                  : "I turn the social outcome into a visible, reportable Impact Score.";
            return (
              <button
                key={step.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveId(step.id)}
                className={cn(
                  "group relative min-h-[390px] min-w-0 overflow-hidden border-[3px] border-white bg-page text-left transition-[filter,transform] duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/55 md:min-h-[470px]",
                  index === 0
                    ? "-skew-y-[1deg]"
                    : index === 1
                      ? "skew-y-[1deg]"
                      : "-skew-y-[0.75deg]",
                  active ? "brightness-110" : "hover:brightness-110",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-[-30%] animate-spin bg-[repeating-conic-gradient(from_0deg,color-mix(in_srgb,var(--brand-primary)_16%,transparent)_0deg_7deg,transparent_7deg_14deg)] [animation-duration:34s] motion-reduce:animate-none",
                    index === 1 &&
                      "bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.10)_0deg_7deg,transparent_7deg_14deg)]",
                    index === 2 &&
                      "bg-[repeating-conic-gradient(from_0deg,color-mix(in_srgb,var(--brand-teal-on-ink)_18%,transparent)_0deg_7deg,transparent_7deg_14deg)]",
                  )}
                />
                <span className="absolute left-4 top-4 z-3 -rotate-2 bg-white px-3 py-2 font-sans text-[12px] font-bold text-navy-900 shadow-[6px_6px_0_var(--color-orange-600)] sm:text-[14px]">
                  {step.claim.toUpperCase()}
                </span>
                <img
                  src={PORTAL_ART[key]}
                  loading="lazy"
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-[-10px] right-[-18%] h-[88%] w-[116%] max-w-none object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.28)] transition-[right,transform] duration-500",
                    active && "right-[-3%] scale-[1.04]",
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-4 bottom-4 z-3 rounded-[20px] border-[3px] border-rule bg-white p-4 text-center max-lg:text-[15px] lg:text-[14px] leading-relaxed text-navy-900 transition-[opacity,transform] duration-500 sm:p-5",
                    active
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-7 opacity-0",
                  )}
                >
                  <strong className="mb-1.5 block font-sans text-[15px] font-bold">
                    “{quote}”
                  </strong>
                  {expandedCopy}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ServicesPage() {
  return (
    <div>
      {/* ── 1 · Hero + the product ── cream ──────────────────────────────── */}
      <Band id="services-heading" light>
        <div className="mx-auto max-w-[820px] text-center">
          <Head
            eyebrow={servicesHero.eyebrow}
            title={servicesHero.title}
            id="services-heading"
            tone="rust"
            hero
            centre
          />
          <p className="mt-3 text-[17px] font-semibold text-ink">{servicesHero.lead}</p>
          <Summary parts={servicesHero.summary} tone="rust" centre />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" asChild>
              {/* registerRoute.label, NOT servicesClose.cta. Every control
                  that opens the wait list says the same words: this one used
                  to say something of its own, which is how a page ends up
                  offering what looks like two different actions. */}
              <Link to={registerRoute.to}>{registerRoute.label}</Link>
            </Button>
            <Button variant="secondary" asChild withArrow={false}>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
          <p className="mt-3 text-[12.5px] max-lg:text-[15px] text-ink-muted">
            {servicesClose.ctaNote}
          </p>
        </div>

        {/* The product itself, captioned. The caption is the honest bit: this
            is real UI running on illustrative review data, and saying so is
            what stops a reader taking the figures as live listings. */}
        <Reveal className="mt-10">
          <ProductCapture />
        </Reveal>
      </Band>

      {/* ── 2 · Four steps ── navy ───────────────────────────────────────── */}
      <Band id="steps-heading">
        <Head eyebrow="How it works" title="Four steps, nothing hidden." id="steps-heading" />
        <ol className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.id} index={i} as="li">
              <div className="panel relative flex h-full flex-col overflow-hidden p-5 pt-6">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 top-0 h-[3px]",
                    ACCENT[step.accent as Accent].bar,
                  )}
                />
                {/* The supplied artwork, keyed off its grey ground so it sits
                    on the navy rather than in a grey box. Decorative — the step
                    name and body carry the meaning — so it is empty-alt. */}
                <img
                  src={step.image}
                  alt=""
                  width={360}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  className="mx-auto h-24 w-auto"
                  srcSet={variantSrcSet(step.image)}
                  sizes={SIZES_HALF_FROM_TABLET}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 grid size-9 place-items-center rounded-full font-heading text-[15px] font-extrabold",
                    ACCENT[step.accent as Accent].disc,
                  )}
                >
                  {i + 1}
                </span>
                <h3 className="mt-3.5 font-heading text-[16px] font-bold text-ink">{step.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Band>

      {/*
       * ── 3 · Find it. Price it. Match it. ── cream ──────────────────────
       *
       * This was three tools in a row with three analysts nested inside the
       * third one — six items, and a reader had to work out the relationship
       * before any of it meant anything. Petra, Peter and Pippa ARE find,
       * price and match, so the two lists became one: three steps, three
       * characters, and the tool each works in on a chip.
       *
       * THE PODIUM. Each character stands on top of their card and breaks out
       * of it. That overlap is the whole idea — three cards in a row is what
       * the rest of the site already does, and the break-out is what stops
       * this reading as another card row. It is why the card carries 104px of
       * top padding and the figure is absolutely positioned above it.
       *
       * The ghost numeral behind the claim is 4.5% navy: a counting cue at the
       * edge of visible, not a design element. It sits BEHIND the text, so it
       * never has to meet a contrast ratio.
       *
       * Audience note, from Callum: most people reading this are 35–60 and on
       * a laptop. That is why the claim is 24px, the body 14px and the measure
       * short — do not shrink any of it to fit something else in.
       */}
      <Band id="tools-heading" grid>
        <CharacterPortals />
      </Band>

      <Band id="mission-control-heading" grid>
        <MissionControl />
      </Band>

      <Band id="living-comic-heading" grid>
        <LivingComic />
      </Band>

      {/* ── How we differ ── navy ─────────────────────────────────────────
       *
       * A three-part story replaces the old side-by-side comparison. The
       * section now moves from the sector's structural failures, through the
       * lessons those failures exposed, to the model built in response. The
       * lease comparison is deliberately specific: it explains the review
       * window rather than presenting a shorter term as an end in itself.
       */}
      <Band id="compare-heading">
        <DifferenceStory />
      </Band>

      {/* ── 5 · Close ── cream ───────────────────────────────────────────── */}
    </div>
  );
}
