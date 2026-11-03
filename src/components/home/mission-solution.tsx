import { Link } from "@tanstack/react-router";
import * as React from "react";
// WAVE 414: named imports rather than a namespace one. Nothing here was
// looked up by string, so this file alone was tree-shakable, but a
// namespace import beside a dynamic one reads as though it is not and the
// next person to add `Icons[name]` here would be adding it to something
// that already looked like it allowed that. See director-card.tsx.
import { ArrowRight, Baby, Circle, House, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal, useCountUp } from "@/components/ui/reveal";
import {
  challengeCopy,
  impactProof,
  purposeCopy,
  purposeStats,
  purposeStatsNote,
  solutionCopy,
} from "@/content/home";
import { iconByName } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import {
  SIZES_CARD_ILLUSTRATION,
  SIZES_HALF_FROM_TABLET,
  variantSrcSet,
} from "@/lib/responsive-image";

/**
 * MissionSolution — the need and the answer, as one bento grid with two faces.
 *
 * ── THE THREE THINGS THAT WERE WRONG WITH THE FIRST BENTO ─────────────────
 *
 * Callum: "colours look very dull… tons of gaps… still too much information."
 * All three were the same mistake in different clothes, and all three are
 * fixed by rules rather than by nudging:
 *
 * 1 · GAPS. Six stat tiles in a three-across grid is two rows with an empty
 *     sixth slot, and that tall right column stretched the orange hero into a
 *     mostly-empty rectangle. THE COUNT NOW DIVIDES THE ROW. Three stats, one
 *     row, no orphan — and the two columns come out close enough in height
 *     that nothing has to stretch to fill.
 *
 *     ⚠️ IF YOU ADD A FOURTH STAT, ADD A FIFTH AND A SIXTH TOO, or change the
 *     grid to four across. Anything that leaves a hole brings the gaps back.
 *
 * 2 · DULL. Everything on the cream face was a white card, so the only colour
 *     in a very large block was one orange rectangle. On cream the brand's
 *     teal only passes contrast as a DARK text colour, which reads muted — so
 *     brightness here cannot come from text. It comes from FILLS: the problem
 *     tile is navy, one stat tile is solid teal with white on it, the flip bar
 *     is an orange gradient. Four grounds in one grid instead of one.
 *
 * 3 · TOO MUCH. Six figures became three. Five bullets became three, and they
 *     moved INSIDE the problem tile rather than sitting in a box of their own —
 *     one fewer container, one fewer border, one fewer gap. The progress bars
 *     are gone: they compared a count of households against a sum of pounds,
 *     which was decoration pretending to be data.
 *
 * ⚠️ THE DROPPED FIGURES ARE NOT DELETED. `purposeStats` still holds all six in
 * content/home.ts; `SHOWN` below picks three by id. Swapping which three is a
 * one-line change and nothing else has to move.
 *
 * ── THE TWO FACES ─────────────────────────────────────────────────────────
 *
 * Both faces share one grid — same columns, same tile positions, same block
 * order: statement tile, three tiles, flip bar. Reading one face teaches you
 * the other. Only the ground and the content change.
 *
 * They are stacked in a single grid cell and crossfaded rather than rotated in
 * 3D: a 3D flip on a block this tall is heavy, and the cell takes the height of
 * the taller face so nothing jumps.
 *
 * ⚠️ THE GROUND TRAVELS WITH THE FACE, NOT THE SECTION. The front carries
 * `.section-light` and the back `bg-page`; the <section> is transparent. A
 * background on the section shows through the crossfade as a flash of the wrong
 * colour.
 */

/** Three, because three divides the row. See note 1 above before changing. */
const SHOWN = ["waiting-lists", "temporary-accommodation", "asset-requirement"] as const;

const icon = (name?: string): LucideIcon => iconByName(name);

/**
 * The hero figure, counting.
 *
 * `useCountUp` wants a number and the content gives a formatted string, so the
 * digits come out and are re-formatted on the way back — en-GB, because this is
 * a UK statistic and the separator must be a comma wherever the visitor is.
 * The static string stays in the accessibility tree: a screen reader should
 * hear "176,130", not a number ticking.
 *
 * WAVE 413: `tabular-nums`. Barlow's default figures are proportional, so a 1
 * is narrower than a 0 and the numeral changed WIDTH on nearly every frame of
 * the count: six digits jittering left and right for 1.4 seconds under a
 * headline. Tabular figures all occupy one advance width, so the number counts
 * up without moving. It is the whole reason the count is watchable.
 */
function CountUpFigure({ value, className }: { value: string; className?: string }) {
  const target = Number(value.replace(/[^0-9]/g, "")) || 0;
  const { ref, display } = useCountUp(target, 1400);
  return (
    <>
      <span ref={ref} aria-hidden="true" className={cn("tabular-nums", className)}>
        {Math.round(display).toLocaleString("en-GB")}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}

/**
 * A stat tile. The first of the three is SOLID TEAL with white on it; the other
 * two are the standard panel. That is the rhythm — a row of three identical
 * white cards is what made this block read as beige.
 *
 * White on teal-600 is 5.25:1, which passes AA at any size, so the fill is safe
 * for the label as well as the figure.
 */
function StatTile({ stat, filled }: { stat: (typeof purposeStats)[number]; filled: boolean }) {
  const Glyph = icon(stat.icon);
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] p-5 transition-all duration-300",
        "hover:-translate-y-1",
        filled
          ? "bg-teal-600 hover:shadow-[0_18px_34px_-18px_color-mix(in_srgb,var(--brand-teal-ink)_80%,transparent)]"
          : "panel hover:shadow-[0_18px_34px_-20px_color-mix(in_srgb,var(--brand-ink)_50%,transparent)]",
      )}
    >
      <Glyph
        aria-hidden="true"
        strokeWidth={1.7}
        className={cn(
          "absolute -right-3 -top-3 size-20 opacity-[0.13]",
          filled ? "text-[#ffffff]" : "text-teal-600",
        )}
      />
      <p
        className={cn(
          "font-heading text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold leading-none tracking-[-0.03em]",
          filled ? "text-[#ffffff]" : "text-orange-700",
        )}
      >
        {stat.value}
      </p>
      <p
        className={cn(
          "mt-2 text-[13px] font-bold leading-snug",
          filled ? "text-[#ffffff]" : "text-ink",
        )}
      >
        {stat.label}
      </p>
      {/* The source remains readable for touch, keyboard and pointer users. */}
      <p
        className={cn(
          "mt-3 text-xs leading-relaxed",
          /* SOLID white, not 85%. 85% white on the orange-600 fill is 4.32:1
             and about 4.25:1 on the teal-600 one, at 11px, against a 4.5:1
             floor; `text-page` is #ffffff and 5.34:1 on orange-600, 5.25:1 on
             teal-600. No gate could ever have reached this line, because it
             is max-h-0 and opacity-0 until the tile is hovered, so it is in no
             screenshot and axe never evaluates it. rel412b MINOR 2. */
          filled ? "text-page" : "text-ink-muted",
        )}
      >
        {stat.basis}
      </p>
    </div>
  );
}

/**
 * The flip control — a full-width bar across the foot of the column rather than
 * a tile in the grid.
 *
 * It was a white card sitting quietly beside the content, which is the last
 * thing an invitation should be. As a bar it spans the column, carries the
 * orange gradient and is unmistakably the thing to press.
 */
function FlipBar({
  label,
  title,
  hint,
  onFlip,
}: {
  label: string;
  title: string;
  hint: string;
  onFlip: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-panel)] bg-linear-to-r from-orange-600 to-orange-600 lg:from-orange-700 px-6 py-4 text-left transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
    >
      {/* ⚠ WAVE 490: BELOW `lg` THE GRADIENT STOPS AT ORANGE-600, AND THAT IS
          A FAILING PAIR THIS WAVE FOUND RATHER THAN CAUSED.

          `scripts/wave412-screenshots.py` measures every node axe returns as
          INCOMPLETE off the shot's own pixels. Run against a build of
          `origin/main` `f61b3b8` it reports all THREE of this bar's lines at
          390 as **4.27:1 against a 4.5:1 floor**, on a ground of
          rgb(206, 81, 38). That is wave 443's palette meeting a gradient that
          runs to orange-500, where white is 3.53:1, and wave 443 did not re-run
          this gate.

          Wave 295's ruling decides the fix: where a pairing fails, THE SURFACE
          MOVES, never the orange. So below `lg` the gradient ends at
          orange-600, which `CLAUDE.md` names as the fill of any text-bearing
          control. Above `lg` nothing changed in wave 490, because rule 8 of
          that wave was that the desktop does not move and the 1280 reading of
          this bar passed.

          WAVE 777: THE DESKTOP RUNS 700 TO 600 NOW, and the same rule decided
          it. orange-600 became the platform's fill step, #CC4A22, where white
          is 4.60:1 (`text-page` 4.51:1), and the 600-to-500 run then read
          4.30:1 under the 10px label and the 12.5px line at 1280. The left end
          is the colour it always was (#BB441B, now named orange-700) and the
          run ends on the fill rather than on orange-500, so no text on this
          bar sits on orange-500 any more. That closes proposal 9 in
          `docs/WAVE490_REPORT.md`. Below `lg` it is still flat orange-600.

          ⚠ ALL THREE LINES ARE SOLID WHITE, AND THEY HAVE TO BE.
          They used to be white at 78%, 100% and 88% over an orange-600 to
          orange-500 gradient, written as two rgba() literals and a hex in a
          component. Measured off home-1280.png and home-390.png, the ground
          under them reads rgb(177, 81, 50) and rgb(182, 85, 53), where 78%
          white is 3.79:1 and 3.60:1 and 88% white is 4.36:1 and 4.11:1, all
          four under the 4.5:1 floor a 10px and a 12.5px label answers to.
          Solid white on the same ground is 5.13:1 and 4.84:1.
          The hierarchy is size and weight now, which is what it should have
          been: 10px/800 over 17 to 20px/800 over 12.5px/400. And `text-page`
          is the token, so there is no colour literal left in here. */}
      <span className="min-w-0">
        <span className="block font-heading text-[10px] max-lg:text-[12px] font-extrabold uppercase tracking-[0.16em] text-page">
          {label}
        </span>
        <span className="heading-tight block font-heading text-[clamp(1.0625rem,1.6vw,1.25rem)] font-extrabold text-page">
          {title}
        </span>
        <span className="block text-[12.5px] max-lg:text-[15px] text-page">{hint}</span>
      </span>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/18 transition-transform duration-500 group-hover:rotate-180">
        <RefreshCw aria-hidden="true" className="size-5 text-page" />
      </span>
    </button>
  );
}

export function MissionSolution() {
  const [showSolution, setShowSolution] = React.useState(false);
  const hasFlipped = React.useRef(false);
  const needHeading = React.useRef<HTMLHeadingElement | null>(null);
  const solutionHeading = React.useRef<HTMLHeadingElement | null>(null);
  const flip = React.useCallback(() => {
    hasFlipped.current = true;
    setShowSolution((value) => !value);
  }, []);
  React.useEffect(() => {
    if (!hasFlipped.current) return;
    const heading = showSolution ? solutionHeading.current : needHeading.current;
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [showSolution]);

  /* Picked BY ID, never by position — re-ordering content/home.ts must not
     silently promote a different statistic into the big orange tile. */
  const hero = purposeStats.find((s) => s.id === "children-ta") ?? purposeStats[0]!;
  const shown = SHOWN.map((id) => purposeStats.find((s) => s.id === id)).filter(
    (s): s is (typeof purposeStats)[number] => Boolean(s),
  );

  /* Three of the five bullets. The full list stays in content/home.ts. */
  const points = challengeCopy.points.slice(0, 3);

  const faceBase = "col-start-1 row-start-1 transition-opacity duration-500 ease-out";

  /* ⚠ WAVE 490: BELOW `md` THE INACTIVE FACE LEAVES THE FLOW, AND THE REASON
     IS 295 PIXELS OF CREAM.

     Both faces are stacked in ONE grid cell so they can cross-fade, and a grid
     cell takes the height of its tallest occupant. At 1280 and at 768 the two
     faces are the same height, so that costs nothing and the cross-fade is
     free. At 390 they are not: the need face runs to 1,265px and the solution
     face to 1,559px, so whichever one is showing, the reader scrolls up to
     294px of empty cream before "Working with all local authorities".
     Measured on the built site at 25 September 2026: paragraph bottom 2,658,
     section bottom 2,953, next section top 2,953.

     `hidden` below `md` takes the inactive face out of the grid entirely, so
     the cell is the height of the face somebody is reading. Above `md`
     nothing changes at all: both faces are in the cell, both are the same
     height, and the cross-fade is exactly the one wave 412 shipped.

     AND THE SWAP IS A DISPLAY SWAP, NOT AN ANIMATED HEIGHT. Wave 413's law of
     motion is transform and opacity only with ONE named exception, the
     disclosure's height, and a 300px height transition on a section this tall
     would be a second one bought for a flourish. An element coming out of
     `display: none` has no before-change style for a transition to start
     from, so the incoming face simply appears: instant at every setting,
     including reduced motion, which is what the probe asserts. */
  const offBelowMd = "hidden md:block";

  return (
    <section
      aria-labelledby={showSolution ? "mission-solution-heading" : "mission-heading"}
      className="relative isolate grid"
    >
      {/* ══ FRONT — the need ══════════════════════════════════════════════ */}
      <div
        className={cn(
          faceBase,
          "section-light",
          showSolution ? cn(offBelowMd, "pointer-events-none opacity-0") : "opacity-100",
        )}
        /* ⚠ WAVE 414: `inert` AS WELL AS `aria-hidden`, AND THE PAIR IS
           THE POINT. The two faces of this section are stacked in one grid
           cell and the hidden one was `opacity-0 pointer-events-none
           aria-hidden`: invisible to the eye, unreachable by a pointer, gone
           from the accessibility tree, and STILL IN THE TAB ORDER with every
           link and button inside it focusable. axe returns that as
           `aria-hidden-focus`, serious, and it was the one serious violation
           on the home page at every width. On a phone it is worse than a
           violation: a visitor tabbing or swiping through the page lands in a
           face nobody can see, twice.

           `inert` is the attribute for exactly this and React 19 passes it
           through. It takes the subtree out of the tab order, out of the
           accessibility tree and out of find-in-page in one word. */
        inert={showSolution}
        aria-hidden={showSolution}
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 py-11 sm:px-8 lg:py-12">
          <Reveal>
            <p className="eyebrow tracking-[0.14em] text-orange-700">{purposeCopy.eyebrow}</p>
            <h2
              id="mission-heading"
              ref={needHeading}
              tabIndex={-1}
              className="heading-tight mt-2 max-w-[24ch] text-balance font-heading text-[clamp(1.625rem,3.2vw,2.375rem)] font-extrabold tracking-[-0.025em] text-ink"
            >
              {/* The emphasis is picked out of the title rather than the title
                  being split into two fields — one source of truth for the
                  sentence, and the highlight cannot drift out of it. */}
              {purposeCopy.title.split(purposeCopy.emphasis).map((part, i, all) => (
                <React.Fragment key={i}>
                  {part}
                  {i < all.length - 1 ? (
                    <span className="text-orange-700">{purposeCopy.emphasis}</span>
                  ) : null}
                </React.Fragment>
              ))}
            </h2>
          </Reveal>

          <div className="mt-6 flex flex-col gap-3.5 lg:flex-row">
            {/* ── left column ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-3.5 lg:w-[41%]">
              {/* THE HERO TILE. Content is BOTTOM-ALIGNED. Centred, it floated
                  in an orange field with dead space above and below; against
                  the foot of the tile the space above reads as deliberate, the
                  way a poster's does. The glyph fills the top so it is never
                  empty. */}
              <Reveal className="flex flex-1">
                <div className="relative flex w-full flex-col justify-end overflow-hidden rounded-[var(--radius-panel)] bg-orange-600 p-6 lg:min-h-[270px]">
                  <Baby
                    aria-hidden="true"
                    strokeWidth={1.2}
                    className="pointer-events-none absolute -right-8 -top-8 size-48 text-[#ffffff] opacity-[0.14]"
                  />
                  {/* SOLID white on both lines here, not 88%. In exact
                      arithmetic 88% white over orange-600 is 4.496:1, axe
                      rounds that to 4.50 and passes it, and the pixel
                      measurement only ever sees the nodes axe hands back as
                      INCOMPLETE, so a pair failing by less than a rounding
                      width was invisible to both halves of the gate. Measured
                      off the wave 412 and 412b home shots alike at 4.46:1.
                      `text-page` is 5.34:1. The numeral between these two was
                      already solid white, which is what proved the shortfall
                      was the alpha and not anti-aliasing. rel412b MINOR 1. */}
                  <p className="eyebrow tracking-[0.14em] text-page">{hero.label}</p>
                  <p className="mt-1.5 font-heading text-[clamp(3rem,6.6vw,4.75rem)] font-extrabold leading-none tracking-[-0.04em] text-[#ffffff]">
                    <CountUpFigure value={hero.value} />
                  </p>
                  <p className="mt-2.5 text-[12px] max-lg:text-[13px] text-page">{hero.basis}</p>
                </div>
              </Reveal>

              {/* The only photograph in the section, and the reason the block
                  does not read as a dashboard. The scrim runs to 92% at the
                  foot — at 88% the caption was still fighting the roofs. */}
              <Reveal index={1}>
                <div className="group relative h-[150px] overflow-hidden rounded-[var(--radius-panel)]">
                  <img
                    src="/images/why-estate-aerial.webp"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={1600}
                    height={640}
                    className="size-full scale-105 object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                    srcSet={variantSrcSet("/images/why-estate-aerial.webp")}
                    sizes={SIZES_HALF_FROM_TABLET}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-[color-mix(in_srgb,var(--brand-ink)_92%,transparent)] via-[color-mix(in_srgb,var(--brand-ink)_45%,transparent)] to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="eyebrow tracking-[0.14em] text-white">Where this happens</p>
                    <p className="heading-tight mt-0.5 font-heading text-[17px] font-extrabold text-[#ffffff]">
                      Every local authority in the UK
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* ── right column ─────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col gap-3.5">
              {/* THE LOUDEST CARD ON THE BAND, AND IT IS NO LONGER THE
                  DARKEST ONE. This was a navy tile on the cream, put there
                  because a dark tile in a light grid is the highest-contrast
                  thing on the band and the sentence the section argues had to
                  land first. Wave 412 kept the job and changed the means: a
                  white card with a 4px orange rule across the top. It is still
                  the one card the eye goes to, and it is no longer the second
                  navy island on a route that has already spent its one on the
                  demand map. The bullets still live inside it, one fewer box
                  and one fewer gap. */}
              <Reveal index={1}>
                <div className="rounded-[var(--radius-panel)] border border-rule border-t-4 border-t-orange-500 bg-page p-6 shadow-[var(--shadow-card)]">
                  <p className="eyebrow tracking-[0.14em] text-teal-600">{challengeCopy.eyebrow}</p>
                  <h3 className="heading-tight mt-1.5 font-heading text-[clamp(1.25rem,2.1vw,1.5rem)] font-extrabold text-ink">
                    {challengeCopy.title}
                  </h3>
                  <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {points.map((point) => {
                      const Glyph = icon(point.icon);
                      return (
                        <li key={point.text} className="flex items-start gap-2.5">
                          <Glyph
                            aria-hidden="true"
                            strokeWidth={1.9}
                            className={cn(
                              "mt-px size-4 shrink-0",
                              /* Two hard-coded hexes lived here, and one of
                                 them was #ff7a29, the amber this site retired
                                 in wave 295. Both are tokens now, and both are
                                 measured as GRAPHICS on white against the 3:1
                                 floor of SC 1.4.11: orange-500 is 4.23:1 and
                                 teal-600 is 5.25:1. The old pair was 2.3:1 and
                                 2.41:1, which failed on any light ground. */
                              point.tone === "orange" ? "text-orange-500" : "text-teal-600",
                            )}
                          />
                          <span className="text-[12.5px] max-lg:text-[15px] leading-[1.6] text-ink-muted">
                            {point.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    to="/the-problem"
                    className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-heading text-[13px] font-bold text-teal-600 lg:min-h-0 transition-colors duration-200 hover:text-orange-700"
                  >
                    See the full picture
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
              </Reveal>

              <div className="grid flex-1 gap-3.5 sm:grid-cols-3">
                {shown.map((stat, i) => (
                  <Reveal key={stat.id} index={i} className="flex">
                    <StatTile stat={stat} filled={i === 0} />
                  </Reveal>
                ))}
              </div>

              <Reveal index={2}>
                <FlipBar
                  label="The other side"
                  title="See our solution"
                  hint="The same picture, joined up."
                  onFlip={flip}
                />
              </Reveal>
            </div>
          </div>

          <p className="mt-3.5 text-[11px] max-lg:text-[15px] leading-relaxed text-ink-muted">
            {purposeStatsNote}
          </p>
        </div>
      </div>

      {/* ══ BACK — the answer ═════════════════════════════════════════════ */}
      <div
        className={cn(
          faceBase,
          "bg-page",
          showSolution ? "opacity-100" : cn(offBelowMd, "pointer-events-none opacity-0"),
        )}
        inert={!showSolution}
        aria-hidden={!showSolution}
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 py-11 sm:px-8 lg:py-12">
          <Reveal>
            <p className="eyebrow tracking-[0.14em] text-teal-600">{solutionCopy.eyebrow}</p>
            <h2
              id="mission-solution-heading"
              ref={solutionHeading}
              tabIndex={-1}
              className="heading-tight mt-2 max-w-[24ch] text-balance font-heading text-[clamp(1.625rem,3.2vw,2.375rem)] font-extrabold tracking-[-0.025em] text-ink"
            >
              {/* The last of the three carries the accent — the same rhythm the
                  closing strapline uses everywhere else on the site. */}
              {solutionCopy.title.split(". ").map((part, i, all) => (
                <span key={part} className={i === all.length - 1 ? "text-orange-700" : undefined}>
                  {part}
                  {i < all.length - 1 ? ". " : ""}
                </span>
              ))}
            </h2>
          </Reveal>

          <div className="mt-6 flex flex-col gap-3.5 lg:flex-row">
            <div className="flex flex-col gap-3.5 lg:w-[41%]">
              {/* Mirrors the orange tile exactly — same position, same
                  bottom-aligned content, same oversized glyph. */}
              <Reveal className="flex flex-1">
                <div className="relative flex w-full flex-col justify-end overflow-hidden rounded-[var(--radius-panel)] bg-teal-600 p-6 lg:min-h-[270px]">
                  <House
                    aria-hidden="true"
                    strokeWidth={1.2}
                    className="pointer-events-none absolute -right-8 -top-8 size-48 text-[#ffffff] opacity-[0.14]"
                  />
                  <p className="eyebrow tracking-[0.14em] text-page">{impactProof.eyebrow}</p>
                  <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 font-heading font-extrabold leading-none tracking-[-0.04em] text-page">
                    <span className="text-[clamp(2.25rem,4vw,3rem)]">
                      {impactProof.multiplier.from.figure}
                    </span>
                    <span className="text-[13px] font-semibold">
                      {impactProof.multiplier.from.label}
                    </span>
                    <ArrowRight aria-hidden="true" className="size-6 shrink-0" />
                    <span className="text-[clamp(3rem,6.6vw,4.75rem)]">
                      {impactProof.multiplier.to.figure}
                    </span>
                    <span className="text-[13px] font-semibold">
                      {impactProof.multiplier.to.label}
                    </span>
                  </p>
                  {/* ⚠️ ILLUSTRATIVE, AND IT SAYS SO. A conversion model, not a
                      delivered result. The disclaimer travels with the figure
                      and is not a caption a later layout pass may trim. */}
                  <p className="mt-3 text-[13px] leading-relaxed text-page">
                    {impactProof.multiplier.disclaimer}
                  </p>
                </div>
              </Reveal>

              <Reveal index={1}>
                <div className="group relative h-[150px] overflow-hidden rounded-[var(--radius-panel)] border border-rule bg-page shadow-[var(--shadow-card)]">
                  <img
                    src="/images/ai-team/trio-wave.webp"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={934}
                    height={558}
                    className="absolute -bottom-1 right-2 h-[152px] w-auto translate-y-3 transition-transform duration-700 ease-out group-hover:translate-y-0"
                    srcSet={variantSrcSet("/images/ai-team/trio-wave.webp")}
                    sizes={SIZES_CARD_ILLUSTRATION}
                  />
                  <div className="absolute inset-y-0 left-0 flex max-w-[54%] flex-col justify-center p-5">
                    <p className="eyebrow tracking-[0.14em] text-teal-600">Who it is for</p>
                    <p className="heading-tight mt-0.5 font-heading text-[17px] font-extrabold text-ink">
                      Everyone in the chain, in one place
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="flex flex-1 flex-col gap-3.5">
              {/* The mirror of the navy tile on the front — here it is teal-edged
                  on navy, and it carries the roster inside it for the same
                  reason the bullets moved: one fewer box. */}
              <Reveal index={1}>
                <div className="rounded-[var(--radius-panel)] border border-rule bg-page p-6 shadow-[var(--shadow-card)]">
                  <p className="eyebrow tracking-[0.14em] text-teal-600">The platform</p>
                  <p className="mt-2 max-w-[70ch] text-[13.5px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                    {solutionCopy.assertion}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {solutionCopy.roster.map((name) => (
                      <li
                        key={name}
                        className="rounded-full border border-teal-600 px-3 py-1.5 text-[11.5px] max-lg:text-[12px] font-semibold text-ink"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <div className="grid flex-1 gap-3.5 sm:grid-cols-3">
                {solutionCopy.stages.map((stage, i) => {
                  const Glyph = icon(stage.icon);
                  const filled = i === 0;
                  return (
                    <Reveal key={stage.id} index={i} className="flex">
                      <div
                        className={cn(
                          "group relative flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-panel)] p-5 transition-all duration-300 hover:-translate-y-1",
                          /* ⚠ THE FILLED CARD KEEPS WHITE INK. White on
                             teal-600 is 5.25:1; navy on it is 3.58:1 and
                             fails, which is exactly what a blanket
                             text-white-to-text-ink conversion would have done
                             here. `text-page` rather than `text-white` so the
                             light remap's substring rule cannot reach it while
                             the unconverted files still rely on that rule. */
                          filled
                            ? "bg-teal-600 shadow-[var(--shadow-card)]"
                            : "border border-rule bg-page shadow-[var(--shadow-card)] hover:border-teal-600 hover:shadow-[var(--shadow-card-hover)]",
                        )}
                      >
                        <Glyph
                          aria-hidden="true"
                          strokeWidth={1.5}
                          className={cn(
                            "absolute -right-3 -top-3 size-20 opacity-[0.14]",
                            filled ? "text-page" : "text-teal-600",
                          )}
                        />
                        <span
                          className={cn(
                            "font-heading text-[11px] max-lg:text-[12px] font-extrabold tracking-[0.14em]",
                            filled ? "text-page/80" : "text-teal-600",
                          )}
                        >
                          {stage.number}
                        </span>
                        <p
                          className={cn(
                            "heading-tight mt-1 font-heading text-[15px] font-extrabold",
                            filled ? "text-page" : "text-ink",
                          )}
                        >
                          {stage.name}
                        </p>
                        <ul className="mt-2.5 flex flex-col gap-1.5">
                          {stage.points.map((point) => (
                            <li
                              key={point.text}
                              className={cn(
                                "text-[11.5px] max-lg:text-[12px] leading-[1.6]",
                                filled ? "text-page/90" : "text-ink-muted",
                              )}
                            >
                              {point.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              <Reveal index={2}>
                <FlipBar
                  label="Back to it"
                  title="See the need"
                  hint="The problem this answers."
                  onFlip={flip}
                />
              </Reveal>
            </div>
          </div>

          <p className="mt-3.5 text-[11px] max-lg:text-[15px] leading-relaxed text-ink-muted">
            <Link to="/solutions" className="font-semibold text-teal-600 hover:text-orange-700">
              Read how it works →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
