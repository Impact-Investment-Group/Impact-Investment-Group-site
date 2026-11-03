import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PreReleaseBadge } from "@/components/ui/pre-release-badge";
import { DirectorCard } from "@/components/about/director-card";
import { cn } from "@/lib/utils";
import {
  accountableChain,
  chainAccents,
  chainNotice,
  chainNoticeEmphasis,
  figureAccents,
  leadershipCapability,
  problemFigures,
  problemHeading,
  summaries,
  team,
  teamTitle,
  whatWeDo,
  whoWeAre,
  whyPartner,
  whyWeExist,
  type Seg,
} from "@/content/about";
import {
  SIZES_CARD_ILLUSTRATION,
  SIZES_HALF_FROM_TABLET,
  variantSrcSet,
} from "@/lib/responsive-image";

/**
 * /about — the old production site's layout, on the homepage's section rhythm.
 *
 *   1 · Who We Are + the team        cream
 *   2 · Why We Exist + the figures   white
 *   3 · What We Do + the chain       cream
 *   4 · Why Partner + the close      white
 *
 * ── How the two grounds are handled ───────────────────────────────────────
 *
 * WAVE 412 REWROTE THIS NOTE BECAUSE THE MECHANISM IT DESCRIBED IS GONE. The
 * file used to be written in the DARK idiom and rely on `.section-light` to
 * re-point every colour in it onto the light palette. That remap was deleted;
 * nothing rewrites a class on this site any more.
 *
 * So the file is written in the LIGHT idiom, which is the site's only idiom:
 * `text-ink`, `text-ink-muted`, `text-teal-600`, `panel`, `border-rule`. The
 * two alternating grounds differ by one class, `.section-light`, and that
 * class now does one thing: it paints the band cream. `panel` is the white
 * card on both grounds, so a card still does not need to be told where it is.
 *
 * The one conditional left is the eyebrow, and it is a design choice rather
 * than a contrast one: `Head` takes a tone so the rust eyebrow and the teal
 * eyebrow can alternate down the page. Both clear AA on both grounds.
 *
 * LOOK comes from the old iip-web About page; COPY is the client's four
 * sections, verbatim; the TEAM layout is kept as built. Blocks that only
 * existed on the old page are folded into the section that answers for them:
 * the sourced figures into Why We Exist, the three-company chain and both of
 * its compliance paragraphs into What We Do. Every figure keeps a live link to
 * its publication — none may appear without one.
 */

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Us — Impact Investment Group" },
      {
        name: "description",
        content:
          "Meet the team connecting investors, landlords and developers with councils, housing associations and care and support organisations across the UK.",
      },
      { property: "og:title", content: "About Us — Impact Investment Group" },
      {
        property: "og:description",
        content:
          "Meet our team, understand why we exist and see how our housing, investment, care and support network works.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

/**
 * Emphasis inside a summary line.
 *
 * "ink" is bold in the section's strongest text colour, `text-ink`, which is
 * navy-900 on both of the site's grounds: 18.83:1 on white and 16.75:1 on the
 * cream.
 *
 * "accent" is orange, and on a light ground every orange WORD is orange-700
 * (5.78:1 on the cream, 6.50:1 on white). 500 is 3.76:1 there and is a rule, a
 * chip border or a glyph, never a word. The claim line is set at 20px minimum,
 * semibold, and the smaller lines under it get `small` so their accents fall
 * back to ink.
 *
 * ⚠ THAT 20px FLOOR WAS A CONTRAST FLOOR AND NO LONGER IS. orange-700 was
 * 4.1:1 on the cream and only cleared AA as large text; since wave 295 it is
 * 5.78:1 and passes at any size. The floor is kept because it is also a
 * typographic decision, but it is now a choice rather than a requirement.
 * On navy none of this applies, though the headroom is smaller than it was:
 * orange-500 is 4.01:1 on navy-800, not the 7.2:1 of the old amber, so it is
 * large text and non-text marks there now.
 */
function Rich({ parts, tone, small }: { parts: Seg[]; tone: "rust" | "teal"; small?: boolean }) {
  /*
   * On the CREAM, an accent in a small line is demoted to navy ink. That began
   * as a contrast rule: orange-700 was 4.1:1 there and passed only as large
   * text. Since wave 295 it is 5.78:1 and passes at any size, so the demotion
   * is now a style choice and not a failure being avoided. Ink is 16.8:1 and
   * still reads as emphasis. On NAVY `small` changes nothing.
   */
  /* Wave 412: the teal branch took orange-500, which is 3.75:1 on the cream
   * and failed at eyebrow size once the light remap was gone. Every orange
   * WORD on a light ground is orange-700 now; 500 survives as a rule, a chip
   * border and an icon glyph, where the floor is 3:1. */
  const accent = tone === "teal" ? "text-orange-700" : small ? "text-ink" : "text-orange-700";
  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <strong key={i} className={cn("font-bold", part.em === "accent" ? accent : "text-ink")}>
            {part.t}
          </strong>
        ),
      )}
    </>
  );
}

/**
 * Bolds the listed substrings inside a plain string, in place.
 *
 * Used for the compliance notice, where the four negatives ("not authorised or
 * regulated by…") have to be the parts a skimming reader's eye stops on. The
 * terms are matched literally and each is expected to appear ONCE — if a term
 * is not found it is silently skipped rather than throwing, because a missing
 * bold is a styling regression and a blank compliance notice is not.
 */
function Emphasise({ text, terms }: { text: string; terms: string[] }) {
  const pattern = terms
    .filter((t) => text.includes(t))
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!pattern) return <>{text}</>;
  return (
    <>
      {text.split(new RegExp(`(${pattern})`, "g")).map((chunk, i) =>
        terms.includes(chunk) ? (
          <strong key={i} className="font-semibold text-ink">
            {chunk}
          </strong>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </>
  );
}

/**
 * One character per step of the chain, by POSITION not by company — re-order
 * `accountableChain` and the cast follows. Same three used on /the-problem and
 * /solutions, which is the point: About should not introduce new furniture.
 */
const CAST = [
  "/images/ai-team/petra-point.webp",
  "/images/ai-team/peter-present.webp",
  "/images/ai-team/pippa-present.webp",
] as const;

/** Per-card accents, so a row of data does not read as one block of colour. */
const ACCENT = {
  teal: { text: "text-teal-600", bar: "bg-teal-600", disc: "bg-teal-600 text-page" },
  orange: { text: "text-orange-700", bar: "bg-orange-600", disc: "bg-orange-600 text-page" },
  white: { text: "text-ink", bar: "bg-white/70", disc: "bg-white text-navy-900" },
} as const;

/**
 * Section shell: one ground, one container, one padding value everywhere.
 *
 * `image` washes a photograph in behind the copy at 12% — texture, not a
 * picture. Three things keep it from becoming decoration that fights the text:
 *
 *   · 9%. It started at 12% and Callum took three points off it by eye. Past
 *     ~15% the stat cards start to sit on shapes rather than on a ground and
 *     the eye reads the roofs instead of the figures — 9% is texture you
 *     notice only once you look for it, which is the point.
 *   · The scrim fades to solid navy at the top and bottom, so the band still
 *     meets its neighbours on a clean edge rather than a torn photograph.
 *   · `alt=""` and `aria-hidden`. It carries no information; a screen reader
 *     announcing "aerial view of a housing estate" here would be noise.
 *
 * It works on EITHER ground now: the scrim follows `light`, so it fades to
 * cream on a light band and to navy on a dark one. It was navy-only for a
 * while, and dropping that navy scrim onto cream is what darkened the top and
 * bottom of the section — the version Callum rejected on the homepage. If the
 * scrim is ever hardcoded again, this comes back with it.
 */
function Band({
  id,
  light,
  image,
  children,
}: {
  id: string;
  light?: boolean;
  image?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "relative isolate border-t border-rule",
        id === "about-heading" && "page-intro",
        light ? "section-light" : "bg-page",
        image && "overflow-hidden",
      )}
    >
      {image ? (
        <>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1600}
            height={640}
            className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-[0.10]"
            srcSet={variantSrcSet(image)}
            sizes={SIZES_HALF_FROM_TABLET}
          />
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 bg-linear-to-b",
              light
                ? "from-[var(--color-mist-bg)] via-transparent to-[var(--color-mist-bg)]"
                : "from-navy-900 via-transparent to-navy-900",
            )}
          />
        </>
      ) : null}
      <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-16">{children}</div>
    </section>
  );
}

/** Small eyebrow over a large heading — the old page's section head. */
function Head({
  eyebrow,
  title,
  id,
  tone = "teal",
  hero,
}: {
  eyebrow: string;
  title: string;
  id?: string;
  tone?: "teal" | "rust";
  hero?: boolean;
}) {
  const Tag = hero ? "h1" : "h2";
  return (
    <>
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
    </>
  );
}

/** Sub-head inside a band. */
function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="heading-tight mt-10 text-balance text-[clamp(1.25rem,2.2vw,1.5rem)] font-bold text-ink">
      {children}
    </h3>
  );
}

/**
 * A section's whole copy: one or two SHORT lines, in place of a lead sentence
 * plus a two-paragraph body.
 *
 * The first line is the claim and runs large and semibold. Anything after it is
 * a step down — smaller, regular weight, a narrower measure. That size drop is
 * doing the work: a reader takes the first line at a glance and only reads on
 * if they want the detail, which is not true of two paragraphs set identically.
 *
 * ⚠️ The measures are deliberately tight (52ch / 58ch, against the usual 62ch).
 * Long lines are the other half of why the old copy read as heavy — the eye
 * loses the start of the next line somewhere past ~65 characters.
 */
function Summary({
  lines,
  tone,
  centre,
}: {
  lines: Seg[][];
  tone: "rust" | "teal";
  centre?: boolean;
}) {
  return (
    <div className={cn("mt-5 flex flex-col gap-3", centre && "items-center")}>
      {lines.map((parts, i) => (
        <p
          key={i}
          className={cn(
            i === 0
              ? /* The claim. Scales with the viewport so it still reads as the
                   loudest thing under the heading on a large screen. The 20px
                   floor was where orange-700 on the cream stopped counting as
                   large text; wave 295 lifted that (5.78:1, any size), so the
                   floor is now typographic. */
                "max-w-[48ch] text-[clamp(1.25rem,2.1vw,1.5rem)] font-semibold leading-[1.35] text-ink"
              : "max-w-[56ch] text-[16.5px] leading-[1.6] text-ink-muted",
            centre && "text-center",
          )}
        >
          <Rich parts={parts} tone={tone} small={i > 0} />
        </p>
      ))}
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      {/* ── 1 · Who We Are + the team ── navy ────────────────────────────── */}
      <Band id="about-heading">
        <div className="relative">
          <Reveal>
            <Head
              eyebrow={whoWeAre.eyebrow}
              title={whoWeAre.title}
              id="about-heading"
              tone="teal"
              hero
            />
            <Summary lines={summaries["whoWeAre"]!} tone="teal" />
          </Reveal>

          <div className="mt-9">
            <p className="eyebrow tracking-[0.14em] text-teal-600">{teamTitle}</p>
            <ul
              aria-label="Leadership team"
              className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            >
              {team.map((member, i) => (
                <Reveal key={member.name} index={i} as="li" className="h-full">
                  <DirectorCard director={member} variant="vertical" />
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal index={2} className="mt-[18px]">
            <aside
              aria-labelledby="leadership-capability-heading"
              className={cn(
                "section-light relative min-h-[326px] overflow-hidden rounded-[20px] bg-cream-card",
                "border border-white/60 shadow-[0_22px_52px_color-mix(in_srgb,var(--brand-ink)_23%,transparent)]",
              )}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[5px] bg-[linear-gradient(90deg,var(--color-orange-600)_0_18%,var(--color-teal-400)_18%_100%)]"
              />
              <img
                src="/images/ai-team/collective-capability-team.png"
                alt="Three illustrated members of the Impact Investment Group team"
                width={935}
                height={559}
                loading="lazy"
                className="pointer-events-none absolute bottom-[-6px] left-3 w-[min(300px,28%)] select-none object-contain drop-shadow-[0_16px_16px_color-mix(in_srgb,var(--brand-ink)_16%,transparent)] max-lg:w-[270px] max-lg:max-w-[78%]"
                srcSet={variantSrcSet("/images/ai-team/collective-capability-team.png")}
                sizes={SIZES_CARD_ILLUSTRATION}
              />
              {/* ⚠ THE SIDE-BY-SIDE ARM STARTS AT 1024, NOT AT 768.

                  At exactly 768 this card gave 29 per cent of its width to the
                  illustration's padding and another 190px to the heading
                  column, which left 257px for the four impacts, and the `<ol>`
                  inside then split THAT in two: columns of 128px, a text
                  column of 48px, and four `<h3>` headings 13 to 36px wider
                  than the box holding them. Measured by wave 414b's heading
                  and measure assertions, which are the first thing on this
                  site to read a tablet as a width rather than as a small
                  desktop. The stacked arm that 390 already uses is right up to
                  1024; nothing at 1024 and above moves. */}
              <div className="grid min-h-[326px] grid-cols-[190px_minmax(0,1fr)] gap-6 py-[30px] pl-[calc(29%+12px)] pr-7 max-lg:grid-cols-1 max-lg:gap-0 max-lg:pb-[175px] max-lg:pl-[22px] max-lg:pr-[22px]">
                <div className="flex flex-col justify-center border-r border-[color-mix(in_oklab,var(--color-navy-900)_13%,transparent)] pr-6 max-lg:border-b max-lg:border-r-0 max-lg:pb-5 max-lg:pr-0">
                  <p className="eyebrow tracking-[0.14em] text-teal-600">
                    {leadershipCapability.eyebrow}
                  </p>
                  <h2
                    id="leadership-capability-heading"
                    className="heading-tight mt-2 font-heading text-[clamp(24px,3vw,34px)] font-bold text-navy-900"
                  >
                    {leadershipCapability.title}
                  </h2>
                  <p className="mt-4 font-heading text-[48px] font-extrabold leading-[0.9] tracking-[-0.04em] text-teal-600">
                    {leadershipCapability.experience}
                  </p>
                  <p className="mt-2 text-[13px] font-semibold leading-snug text-navy-900">
                    {leadershipCapability.experienceLabel}
                  </p>
                </div>

                <ol className="grid content-center sm:grid-cols-2">
                  {leadershipCapability.impacts.map((impact, i) => (
                    <li
                      key={impact.title}
                      className={cn(
                        "grid min-h-[104px] grid-cols-[32px_minmax(0,1fr)] gap-3 border-b border-[color-mix(in_oklab,var(--color-navy-900)_13%,transparent)] px-[18px] py-[18px]",
                        "sm:odd:border-r sm:[&:nth-child(n+3)]:border-b-0",
                        "max-sm:min-h-0 max-sm:px-0 max-sm:last:border-b-0",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-8 place-items-center rounded-full border border-teal-600/30 font-mono text-[10px] max-lg:text-[12px] font-semibold text-teal-600"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-heading text-[15px] font-bold leading-tight text-navy-900">
                          {impact.title}
                        </h3>
                        <p className="mt-1 text-[12px] max-lg:text-[15px] leading-[1.45] max-lg:leading-[1.6] text-slate-ink">
                          {impact.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </Reveal>
        </div>
      </Band>

      {/* ── 2 · Why We Exist + the figures ── navy ───────────────────────── */}
      {/* ── 2 · Why We Exist ── navy ── THE LADDER ────────────────────────
       *
       * Four sourced figures as four full-width rows rather than four cards:
       * value left, meaning centre, source right. Every figure, every kind
       * label and every source link survives — a card just spent its width on
       * a number that needed a third of it.
       */}
      <Band id="why-heading" light image="/images/why-estate-aerial.webp">
        <Head eyebrow={whyWeExist.eyebrow} title={whyWeExist.title} id="why-heading" tone="rust" />
        <Summary lines={summaries["whyWeExist"]!} tone="rust" />

        <SubHead>{problemHeading}</SubHead>
        {/* ⚠ THE LEDGER IS A WHITE PLATE, AND IT HAS TO BE.
         *
         * This band carries a photograph behind it at 10%, and where the
         * photograph is dark the cream ground goes with it: measured off
         * docs/screenshots/wave412/about-1280.png at the wave 412 head, the
         * ground behind these rows read (225, 221, 212), luminance 0.7247,
         * not the flat cream's 0.884. teal-600 on that is 3.87:1, and the
         * source links are 11px. The band's own eyebrow, numerals and body
         * copy all cleared their floors; only the small teal did not.
         *
         * Wave 295's ruling, which wave 412 restated: where a pairing fails
         * THE SURFACE MOVES. So the ledger sits on white, where teal-600 is
         * 5.25:1, and the photograph keeps the band around it. */}
        <ul className="mt-5 rounded-[var(--radius-panel)] border border-rule bg-page px-5 shadow-[var(--shadow-card)] sm:px-7">
          {problemFigures.map((figure, i) => {
            const accent = ACCENT[figureAccents[i % figureAccents.length]!];
            return (
              <Reveal
                key={figure.id}
                index={i}
                as="li"
                className="border-b border-rule last:border-b-0"
              >
                <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:gap-7">
                  {/* Fluid, not fixed: "176,130" and "£102m / yr" are very
                      different lengths, and a fixed column either clips the
                      long one or leaves a hole after the short one. */}
                  <p
                    className={cn(
                      "shrink-0 font-heading text-[clamp(1.75rem,3.4vw,2.5rem)] font-extrabold leading-none tracking-[-0.035em] sm:w-[clamp(9rem,16vw,13rem)]",
                      accent.text,
                    )}
                  >
                    {figure.value}
                  </p>
                  <div className="min-w-0 flex-1">
                    <p className={cn("eyebrow", accent.text)}>{figure.kind}</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink">{figure.label}</p>
                  </div>
                  {/* A figure without its source does not go on this page. */}
                  <a
                    href={figure.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-semibold leading-relaxed text-teal-600 transition-colors duration-200 hover:text-ink sm:max-w-[17rem]"
                  >
                    <span>Source: {figure.source}</span>
                    <ArrowUpRight aria-hidden="true" className="mt-px size-3 shrink-0" />
                  </a>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Band>

      {/*
       * ── 3 · What We Do + the chain ── cream ────────────────────────────
       *
       * Five things on the whole band: eyebrow, title, the statement, three
       * cards, one notice. The sub-head ("Three companies, one accountable
       * chain.") and the descriptive summary line that used to sit between the
       * title and the cards are both GONE — the three claims say it better than
       * a sentence about the three claims did.
       *
       * The cards lead with the claim and credit the company underneath. There
       * is no arrow between them any more and no numbered disc: the left rule,
       * the claim and the chip carry it, and the ordered list still gives the
       * sequence to a screen reader.
       */}
      {/* ── 3 · What We Do ── navy ── THE TRIO ────────────────────────────
       *
       * ⚠️ THIS BAND USED TO BE CREAM. About now runs cream → navy → navy.
       * The two dark bands do not merge — Band draws a border-t on every
       * section — but the alternation is gone. Putting `light` back on this
       * Band is the whole of the fix if that reads badly.
       */}
      <Band id="what-heading">
        <Head eyebrow={whatWeDo.eyebrow} title={whatWeDo.title} id="what-heading" />
        <p className="mt-4 max-w-[44ch] text-[clamp(1.375rem,2.4vw,1.625rem)] font-semibold leading-[1.32] text-ink">
          Three companies. <strong className="font-bold text-orange-700">One chain.</strong> No gap
          for a person to fall through.
        </p>

        <ol className="mt-8 grid items-stretch gap-4 md:grid-cols-3">
          {accountableChain.map((step, i) => {
            const accent = chainAccents[i % chainAccents.length]!;
            /* The step numeral is an 11px eyebrow, so it is text and takes
               orange-700 (5.78:1 on the cream). The chip BORDER beside it
               stays orange-500 at 45%: a rule is a graphic and answers to
               3:1. */
            const line = accent === "orange" ? "text-orange-700" : "text-teal-600";
            // Outlined, not washed. A 10.5px word on a 16% wash of its
            // own colour measured 3.52:1; on the card behind it, 4.67:1.
            const chip =
              accent === "orange"
                ? "border border-orange-500/45 text-orange-700"
                : "border border-teal-600/45 text-teal-600";
            return (
              <Reveal key={step.id} index={i} as="li" className="h-full">
                {/* pb-[104px] reserves the character's corner. Without it the
                    chip and the artwork fight for the same 100px. */}
                <div
                  className={cn(
                    "panel panel-deep relative flex h-full flex-col overflow-hidden p-6 pb-[104px]",
                    accent === "orange" ? "border-orange-500/40" : "border-teal-600/40",
                  )}
                >
                  <p className={cn("eyebrow", line)}>{`0${i + 1}`}</p>
                  <h4 className="heading-tight mt-1.5 max-w-[16ch] font-heading text-[clamp(1.125rem,1.7vw,1.3125rem)] font-extrabold tracking-[-0.015em] text-ink">
                    {step.claim}
                  </h4>
                  <p className="mt-2.5 max-w-[32ch] text-[12.5px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                    {step.detail}
                  </p>
                  <p
                    className={cn(
                      "mt-3 w-fit rounded-full px-3 py-1.5 font-heading text-[10.5px] max-lg:text-[12px] font-extrabold uppercase tracking-[0.1em]",
                      chip,
                    )}
                  >
                    {step.name}
                  </p>
                  <img
                    src={CAST[i % CAST.length]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={281}
                    height={560}
                    className="pointer-events-none absolute -bottom-2 -right-4 h-[136px] w-auto"
                  />
                </div>
              </Reveal>
            );
          })}
        </ol>

        {/* The compliance notice. It is a NOTICE, not body copy — the shield,
            the tinted strip and the bolded negatives are all there so it reads
            as one. See content/about.ts for what may and may not be cut. */}
        <div className="mt-7 flex items-start gap-3 rounded-[var(--radius-panel)] border border-rule bg-page/40 p-4">
          <ShieldAlert
            aria-hidden="true"
            className="mt-px size-[17px] shrink-0 text-ink-muted"
            strokeWidth={1.8}
          />
          <p className="max-w-[104ch] text-[12.5px] max-lg:text-[15px] leading-relaxed text-ink-muted">
            <Emphasise text={chainNotice} terms={chainNoticeEmphasis} />
          </p>
        </div>
      </Band>

      {/*
       * ── 4 · Why Partner + the close ── navy ────────────────────────────
       *
       * The three beats ARE the heading here. "Why Partner With Us?" has been
       * demoted into the eyebrow and the strapline promoted to display size,
       * because this is the last thing on the page before the footer and a
       * closing section should make one loud claim rather than ask a question
       * and then answer it quietly.
       *
       * Middle beat in orange, outer two in white. One accent in a stack of
       * three is a rhythm; three would just be an orange block.
       *
       * ⚠️ THE HEADING IS STILL AN <h2>, and it is still the three beats joined
       * back into the original sentence for anything that reads the document
       * rather than looks at it — `sr-only` carries "Why Partner With Us?" so
       * the outline of the page has not changed just because the type has.
       *
       * Two actions, not three. "Contact Us" was the middle of three and is in
       * both the nav and the footer; with three side by side none of them read
       * as the primary.
       */}
    </div>
  );
}
