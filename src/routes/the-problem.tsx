import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PreReleaseBadge } from "@/components/ui/pre-release-badge";
import { cn } from "@/lib/utils";
import { closingBeats, closingStrapline, registerRoute } from "@/content/site";
import { problemClose, problemHero, problemSections } from "@/content/problem";
import { SIZES_HALF_FROM_TABLET, variantSrcSet } from "@/lib/responsive-image";

/**
 * /the-problem — four sections and the shared close.
 *
 *   1 · The scale             navy    1.34m      Petra
 *   2 · The cost of waiting   cream   £2.7bn     — no character, deliberately
 *   3 · Why it stays broken   navy    5          Peter
 *   4 · The opportunity       cream   £39bn      Pippa
 *   5 · Close                 navy    the same CTA as /about and /platform
 *
 * ── THE LAYOUT ────────────────────────────────────────────────────────────
 *
 * One enormous number on the left, the data as rows on the right, and the
 * character OVERSIZED AND BLEEDING OFF THE OUTER EDGE of the page — left on
 * sections one and three, right on section four. Three things about that:
 *
 *   · The bleed is the point. A figure fully inside the container reads as
 *     clip-art dropped onto the page; one that runs off the edge reads as part
 *     of it. That is why the section is `overflow-hidden` and the image is
 *     positioned at a negative offset rather than being given a column.
 *   · Alternating sides gives the page a rhythm — the eye zig-zags down rather
 *     than running straight — which is the whole reason this beat the
 *     centred-gutter version.
 *   · They are gone below lg. At tablet width the bleed eats the copy, and a
 *     shrunk character is worse than none. `hidden lg:block`, no apology.
 *
 * ── WHAT CAME OFF THIS PAGE ───────────────────────────────────────────────
 *
 * ⚠️ THE DEMAND MAP WAS HERE AND IS NOT ANY MORE. The page used to run a
 * hero, a live-counters band and the full interactive DemandMap. The brief was
 * four sections, and the map did not earn one of them: it answers "where", and
 * this page now answers "how big, what it costs, why, and what is funded".
 *
 * It is NOT lost — `<DemandMap readout="overlay" />` still runs on the
 * homepage, which is the only place it was ever the main event. If it is ever
 * wanted back here it is one import and one line.
 *
 * The live-counters band went with it. Those three figures are the platform's
 * own numbers, and this page is deliberately built from published statistics
 * that anyone can check — mixing our counters in among gov.uk releases would
 * borrow authority the counters have not earned yet.
 */

export const Route = createFileRoute("/the-problem")({
  component: TheProblemPage,
  head: () => ({
    meta: [
      { title: "The Problem — Impact Investment Group" },
      { name: "description", content: problemHero.description },
      { property: "og:title", content: "The Problem — Impact Investment Group" },
      { property: "og:description", content: problemHero.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/the-problem" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/the-problem" }],
  }),
});

const PORTRAIT: Record<string, { src: string; w: number; h: number }> = {
  "petra-point": { src: "/images/ai-team/petra-point.webp", w: 338, h: 560 },
  "peter-present": { src: "/images/ai-team/peter-present.webp", w: 281, h: 560 },
  "pippa-point": { src: "/images/ai-team/pippa-point.webp", w: 345, h: 560 },
};

function TheProblemPage() {
  return (
    <div>
      <section className="page-intro border-b border-rule" aria-labelledby="problem-heading">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-12 sm:px-8 lg:py-16">
          <h1
            id="problem-heading"
            className="heading-tight text-balance font-heading text-[clamp(2.5rem,5vw,4rem)] font-extrabold text-ink"
          >
            {problemHero.title}
          </h1>
          <p className="mt-5 max-w-[65ch] text-lg leading-relaxed text-ink-muted">
            {problemHero.description}
          </p>
        </div>
      </section>

      {problemSections.map((section, i) => {
        const portrait = section.character ? PORTRAIT[section.character] : undefined;
        const light = i === 1;
        /* Left on the first character section, right on the last — the
           alternation is what gives the page its rhythm. */
        const onLeft = i % 2 === 0;

        return (
          <section
            key={section.id}
            aria-labelledby={`${section.id}-heading`}
            className={cn(
              "relative overflow-hidden border-t border-rule",
              light ? "section-light" : "bg-page",
            )}
          >
            <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-16">
              <div
                className={cn("relative", portrait && (onLeft ? "lg:pl-[290px]" : "lg:pr-[290px]"))}
              >
                {portrait ? (
                  <img
                    src={portrait.src}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={portrait.w}
                    height={portrait.h}
                    className={cn(
                      "pointer-events-none absolute bottom-0 hidden h-[302px] w-auto drop-shadow-[0_20px_34px_color-mix(in_srgb,var(--brand-ink)_30%,transparent)] lg:block",
                      onLeft ? "-left-12" : "-right-12 -scale-x-100",
                    )}
                    srcSet={variantSrcSet(portrait.src)}
                    sizes={SIZES_HALF_FROM_TABLET}
                  />
                ) : null}

                <div className="grid items-center gap-8 lg:min-h-[250px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-10">
                  <div>
                    <p
                      className={cn(
                        "eyebrow tracking-[0.14em]",
                        light ? "text-orange-700" : "text-teal-600",
                      )}
                    >
                      {section.eyebrow}
                    </p>
                    {/* The figure IS the heading. `sr-only` carries a sentence
                        instead, because "£2.7bn" alone is not a section title
                        to anything reading the document rather than looking. */}
                    <h2 id={`${section.id}-heading`} className="sr-only">
                      {section.eyebrow} — {section.headline}
                    </h2>
                    <p
                      aria-hidden="true"
                      className={cn(
                        "mt-3 font-heading text-[clamp(2.75rem,6.6vw,5rem)] font-extrabold leading-[0.94] tracking-[-0.035em]",
                        light ? "text-orange-700" : "text-teal-600",
                      )}
                    >
                      {section.headline}
                    </p>
                    <p className="mt-4 max-w-[38ch] text-base leading-relaxed text-ink-muted">
                      {section.lead}
                    </p>
                    {section.source ? (
                      <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-ink-muted">
                        {section.source}
                      </p>
                    ) : null}
                  </div>

                  <Reveal index={1}>
                    <ul className="rounded-2xl border border-rule bg-page p-3 shadow-[var(--shadow-card)] sm:p-5">
                      {section.rows.map((r) => (
                        <li
                          key={r.label}
                          className="flex items-baseline justify-between gap-4 border-b border-rule px-1 py-4 last:border-b-0"
                        >
                          <p className="text-[15px] leading-relaxed text-ink-muted">{r.label}</p>
                          {r.value ? (
                            <p
                              className={cn(
                                "shrink-0 font-heading text-[19px] font-extrabold",
                                light ? "text-navy-900" : "text-teal-600",
                              )}
                            >
                              {r.value}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
