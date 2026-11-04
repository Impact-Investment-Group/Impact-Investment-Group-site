import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, LifeBuoy, Mail, Phone, Clock } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { PreReleaseBadge } from "@/components/ui/pre-release-badge";
import { charityPledge } from "@/content/charity";
import { partnerProfiles } from "@/content/partners";
import { legalLinks } from "@/content/legal";
import {
  closingBeats,
  contactDetails,
  contactRoutes,
  crisisLines,
  crisisNote,
  footerSiteLinks,
  legalNotice,
  registerRoute,
  siteDescription,
  trustRegistrations,
} from "@/content/site";

/**
 * Footer, halved and then tightened again (~980px → ~500px → ~430px).
 *
 * Nothing has ever been removed from it. Every link, every crisis number,
 * every registration reference and the legal notice are all still here,
 * verbatim. All of the height has come out of spacing and type scale:
 *
 *  - Padding 56/80px → 32/40px → 28/32px, and the three bands became two.
 *  - Link rows lost the 44px minimum on desktop (they keep it on touch, where
 *    it matters) and sit at 13px with 2px between them — ~25px each, still
 *    clear of the 24px target-size minimum. Do not tighten this further.
 *  - The registrations band used to be its own full-width strip with its own
 *    rule. It now sits under the columns as three compact cards, and the
 *    verify link runs inline on the reference line rather than taking a row
 *    of its own — which is what took the last ~20px out of the tallest card.
 *
 * ⚠️ NO RULE BETWEEN THE COLUMNS AND THE REGISTRATIONS. Removed at Callum's
 * request. The two blocks are now separated by whitespace alone, which is why
 * the top block's bottom padding is deliberately smaller than its top padding
 * — the gap between them IS the separator, so it has to stay a single, even
 * space. If you re-pad this symmetrically the two blocks will look welded
 * together.
 */
export function SiteFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const registering = /^\/register(\/|$)/.test(pathname);

  return (
    <footer className="relative isolate">
      {/*
       * THE ARCH. A dome across the top of the footer, so the register funnel
       * and the footer read as one block rising out of the page rather than as
       * two more stacked bands. On the register pages the funnel is not
       * rendered (wave 567, below), so there the dome sits directly above the
       * columns.
       *
       * ⚠ A CURVED DIVIDER HAS TWO COLOURS AND THEY ARE NOT FREE: ITS
       * BACKGROUND MUST BE THE COLOUR OF THE SECTION ABOVE IT AND ITS SHAPE
       * MUST BE THE COLOUR OF THE SECTION BELOW IT. Anything else paints a
       * strip of a third colour across the page. Written here because the
       * next person to change a band's colour will otherwise break this
       * again, which is exactly how it broke the first time.
       *
       * WHAT BROKE. This strip was transparent with a CREAM dome in it, which
       * was correct while every route ended on a white section: white showed
       * in the two top corners, cream in the middle, cream below. Wave 412
       * made five routes end on the cream band instead, and on those the
       * corners showed the WHITE PAGE between two cream bands. That is the
       * "broken white part" in Callum's screenshot of 19 September.
       *
       * HOW IT IS FIXED, and it is fixed structurally rather than by naming a
       * second colour: `.footer-arch` pulls the strip up over the section
       * above it by exactly its own height, so the transparent corners show
       * that section's own ground on every route, whatever it is, with
       * nothing to keep in step. The dome is the FOOTER'S ground, and the
       * footer is white (R421-1).
       *
       * THE HAIRLINE IS NOT DECORATION. Eight of the thirteen routes end on a
       * white section, and there a white dome on a white ground is a curve
       * nobody can see. The 1px `border-rule` stroke is the same hairline the
       * site rules every other section boundary with, so the footer still
       * reads as its own section on every route; on the five cream-ending
       * ones the colour sweep carries it as well. `non-scaling-stroke`
       * because `preserveAspectRatio="none"` stretches this path to any width
       * and would otherwise stretch its stroke with it.
       *
       * ⚠ THE CONTROL POINTS ARE y=-44 AND THEY USED TO BE y=-47. For a cubic
       * from (0,140) to (1440,140) the apex is at (140 + 3a + 3a + 140) / 8,
       * so -47 puts it at y=-0.25: a QUARTER OF A UNIT ABOVE the top of the
       * viewBox. With the fill alone that was invisible, since there was
       * nothing above the edge to lose. With a 1px `non-scaling-stroke`
       * centred on the path it is not: the stroke's upper half was clipped by
       * the strip's `overflow-hidden` across the middle of the arc, and on
       * the eight routes that end white this hairline is the whole boundary,
       * so the thinnest part of it was the middle. -44 puts the apex at y=+2,
       * about one device pixel below the edge at every width this strip
       * takes, which is inside the clip and still reads as an apex on the
       * edge rather than as a wave. BOTH PATHS CARRY THE SAME NUMBER so the
       * stroke stays on the fill's own edge.
       *
       * The second path is the same curve without the closing `Z`, so the
       * stroke draws the arc alone and not the straight bottom edge a closed
       * path would add.
       *
       * -mb-px hides the hairline seam between the strip and the footer body.
       */}
      <div aria-hidden="true" className="footer-arch relative -mb-px w-full overflow-hidden">
        <svg
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <path d="M0 140 C 380 -44 1060 -44 1440 140 Z" fill="var(--color-page)" />
          <path
            d="M0 140 C 380 -44 1060 -44 1440 140"
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/*
       * ⚠ THE FOOTER IS WHITE, NOT CREAM. R421-1, Callum 19 Sep 2026: "switch
       * it to white so it's still curved and stands out as a section, but
       * doesn't have that broken white part." He offered navy as the other
       * way out and the operator chose white, because wave 412 declared
       * exactly TWO navy islands on this site and a navy footer would be a
       * third and the largest block on the page, undoing on the last screen
       * the thing that whole wave was about. The crisis card below stays navy
       * and separates MORE from white than it did from the cream.
       *
       * `bg-page text-ink-muted` rather than `.section-light`, which is the
       * cream band's class and is still the cream band's class everywhere
       * else on the site.
       *
       * THE INK IN HERE WAS RE-MEASURED ON THE NEW WHITE GROUND OFF THE
       * RENDERED PIXELS, in two passes that cover different things and only
       * together cover the footer. `scripts/wave421-hero-and-footer.py` names
       * fifteen pairs by hand, ONE ELEMENT EACH, and asserts them on every
       * page in its list at 1280 and 390: they are the fifteen this wave
       * changed the ground under, not an inventory. `scripts/wave412-
       * screenshots.py` is the inventory: it runs axe over every node of
       * every page and measures every node axe cannot resolve off the shot,
       * which is 275 nodes across 28 shots at this head with none unmeasured.
       * See section 5 of docs/WAVE421_REPORT.md.
       */}
      <div className="bg-page text-ink-muted">
        {/*
         * THE FUNNEL. One copy, at the top of the footer, on every page BUT
         * `/register` and everything under `/register/`. Wave 567, Callum,
         * 7 Oct 2026: it is not rendered there because "the user is already
         * registering on that page". Everywhere else it is exactly as it was.
         *
         * No rule above it and one below: nothing separates it from the page's
         * last section, and the rule underneath groups it with the footer
         * columns, so it reads as the top of the footer rather than a section.
         *
         * whitespace-nowrap per beat is what protects the phrasing — a width
         * cap once broke "Delivering / Support." across two lines. A beat can
         * never split; the line either fits or wraps at a full stop.
         */}
        {registering ? null : (
          <section aria-labelledby="funnel-heading" className="border-b border-rule">
            <div className="mx-auto w-full max-w-[1440px] px-5 pb-8 pt-1 text-center sm:px-8">
              <h2 id="funnel-heading" className="sr-only">
                Register your interest
              </h2>
              <PreReleaseBadge className="justify-center" />
              <p className="mt-3">
                {closingBeats.map((beat, i) => (
                  <span
                    key={beat}
                    aria-hidden="true"
                    className={
                      "heading-tight inline-block whitespace-nowrap font-heading text-[clamp(1.25rem,2.4vw,1.875rem)] font-extrabold leading-[1.2] tracking-[-0.02em] " +
                      (i === 2 ? "text-teal-600" : i === 1 ? "text-orange-700" : "text-ink") +
                      (i < 2 ? " mr-2" : "")
                    }
                  >
                    {beat}
                  </span>
                ))}
              </p>
              <p className="mx-auto mt-2.5 max-w-[58ch] text-[13.5px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                {/* orange-700 is the one orange that carries text on the cream.
                  5.78:1 since wave 295, where it was 4.1:1 and this 13.5px
                  line only passed by being called emphasis. It passes now on
                  its own terms. */}
                <strong className="font-bold text-orange-700">30+ years</strong> across property,
                housing, care and support — not an estate agency, a{" "}
                <strong className="font-bold text-ink">national network</strong>.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button variant="primary" asChild>
                  <Link to={registerRoute.to}>{registerRoute.label}</Link>
                </Button>
                <Button variant="secondary" asChild withArrow={false}>
                  <Link to="/contact" search={{ enquiry: "partner", type: "partner" }}>
                    Become a Partner
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* The commissioning-councils carousel used to sit here as a band
          above these columns. It now runs between Our Mission and the
          demand map in routes/index.tsx — its disclaimer travelled with it
          and must stay wherever it lands. */}
        <div className="mx-auto w-full max-w-[1440px] px-5 pb-6 pt-7 sm:px-8 lg:pb-7 lg:pt-8">
          {/* Column 1 is given the most width so the description settles on four
            lines rather than six — the single biggest saving in this block. */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.62fr)_minmax(0,0.9fr)_minmax(0,1.45fr)_minmax(0,1.05fr)] lg:gap-6">
            {/* ⚠ WAVE 414: FIRST IN THE FOOTER'S MARKUP, AND THEREFORE FIRST
              ON A PHONE.

              Phone rule 4 names this card: "the crisis card comes first in
              the footer". Below 1024px these five columns stack in markup
              order and the crisis card was LAST, under the company
              description, the six site links, the six contact routes and the
              ten partner pages. On a 390px screen that is most of a thousand
              pixels of scroll between a person in trouble and three telephone
              numbers, on the one block of this site that exists for them.

              Moved in the MARKUP rather than with `order`, because `order`
              moves the paint and leaves the reading order, the tab order and
              the screen reader where they were. Desktop is placed back in the
              fifth column with explicit grid coordinates, so nothing at
              1024px and above moves; what changes there is that the card now
              comes first for a keyboard as well, which for this card is not a
              regression.

              The block below is otherwise untouched, including every word of
              wave 412's note about why it is a navy island. */}
            {/* In a crisis: care information, not marketing. Every number and
              the 999 note are untouched; only the padding and type moved.

              WAVE 412 MADE THIS A NAVY ISLAND AND SAID SO. It was already
              painted navy by hand, with arbitrary `bg-[var(--color-navy-900)]`
              values chosen precisely because they do not match the
              `bg-navy-*` substring the light remap looks for. That worked and
              it was a trick. The card now carries `section-dark`, which is the
              site's word for "this plate stays dark on purpose", so the wave
              412 screenshot gate can count the islands on a page and fail if
              a third one appears. `data-accent="teal"` keeps the teal rule
              that the island rule would otherwise paint navy.

              It earns the darkness: this is the one block on the page a
              person in trouble has to find, and on a cream footer nothing
              else would separate from it. It sits in the FOOTER, outside
              <main>, so it does not spend the one island a route is
              allowed. */}
            <section
              aria-labelledby="crisis-heading"
              data-accent="teal"
              className="section-dark flex flex-col gap-2.5 self-start lg:col-start-5 lg:row-start-1 rounded-[var(--radius-panel)] p-4 text-[var(--color-mist-bg)]"
            >
              <h2
                id="crisis-heading"
                className="flex items-center gap-2 eyebrow"
                style={{ color: "#ffffff" }}
              >
                <LifeBuoy aria-hidden="true" className="size-3.5" />
                In a crisis
              </h2>
              <ul className="flex flex-col gap-1.5 text-[13px] text-[var(--color-mist-bg)]">
                {crisisLines.map((line) => (
                  <li key={line.label} className="flex items-baseline justify-between gap-3">
                    <span className="text-[var(--color-mist-bg)]">{line.label}</span>
                    <span className="font-heading font-semibold">{line.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="font-heading text-[13px] font-semibold text-[var(--color-mist-bg)]">
                {crisisNote}
              </p>
            </section>

            {/* Logo + contact */}
            <div className="flex flex-col gap-3">
              <Logo variant="on-cream" size="footer" />
              {/* ink-muted, not ink-soft. This is 12px body copy sitting
                  directly on the cream, where ink-soft is 4.33:1 and fails
                  AA; ink-muted is 6.20:1. Wave 298 recorded this paragraph
                  and its neighbours as a known failure it was not scoped to
                  fix. Wave 412 is scoped to it: the axe run in the gate
                  allows zero serious colour-contrast violations. */}
              <p className="max-w-[74ch] text-[12px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                {siteDescription}
              </p>
              <ul className="flex flex-col gap-1.5 text-[13px] text-ink-muted">
                <li className="flex items-center gap-2">
                  <Mail aria-hidden="true" className="size-3.5 shrink-0 text-teal-600" />
                  <a
                    className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-orange-700 lg:min-h-0"
                    href={`mailto:${contactDetails.email}`}
                  >
                    {contactDetails.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone aria-hidden="true" className="size-3.5 shrink-0 text-teal-600" />
                  <a
                    className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-orange-700 lg:min-h-0"
                    href={`tel:${contactDetails.phone.replace(/\s/g, "")}`}
                  >
                    {contactDetails.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-ink-muted">
                  <Clock aria-hidden="true" className="size-3.5 shrink-0 text-teal-600" />
                  {contactDetails.hours}
                </li>
              </ul>
            </div>

            {/* Site */}
            <nav aria-label="Footer site links" className="flex flex-col gap-2.5">
              <h2 className="eyebrow text-teal-600">Site</h2>
              <ul className="flex flex-col gap-1 text-[13px]">
                {footerSiteLinks.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-ink-muted transition-colors duration-200 hover:text-orange-700 lg:min-h-0 lg:min-w-0 lg:px-0 lg:py-px"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact routes */}
            <nav aria-label="Enquiry routes" className="flex flex-col gap-2.5">
              <h2 className="eyebrow text-teal-600">Contact routes</h2>
              <ul className="flex flex-col gap-1 text-[13px]">
                {contactRoutes.map((item) => (
                  <li key={item.enquiry}>
                    <Link
                      to="/contact"
                      search={{ enquiry: item.enquiry, type: item.enquiry }}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-ink-muted transition-colors duration-200 hover:text-orange-700 lg:min-h-0 lg:min-w-0 lg:px-0 lg:py-px"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Partner routes stay compact in two equal columns: five links on
              each side, followed by the partnership enquiry action. */}
            <nav aria-label="Partner pages" className="flex flex-col gap-2.5">
              <h2 className="eyebrow text-teal-600">Our Partners</h2>
              <ul className="grid grid-flow-col grid-cols-2 grid-rows-5 gap-x-5 gap-y-1 text-[13px]">
                {partnerProfiles.map((partner) => (
                  <li key={partner.id}>
                    <Link
                      to={partner.path}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-ink-muted transition-colors duration-200 hover:text-orange-700 lg:min-h-0 lg:min-w-0 lg:px-0 lg:py-px"
                    >
                      {partner.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                search={{ enquiry: "partner", type: "partner" }}
                className="inline-flex min-h-11 items-center gap-1 font-heading text-[13px] font-semibold text-teal-600 transition-colors duration-200 hover:text-orange-700 lg:min-h-0 lg:py-px"
              >
                Become a Partner
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </nav>
          </div>
        </div>

        {/* Registrations and the legal notice. No rule above this — the block is
          divided from the columns by space only. */}
        <div className="mx-auto w-full max-w-[1440px] px-5 pb-6 sm:px-8">
          <ul className="grid gap-2.5 md:grid-cols-3">
            {trustRegistrations.map((reg) => (
              <li
                key={reg.id}
                className="flex flex-col gap-1 rounded-2xl border border-rule bg-page-alt px-5 py-4 text-left"
              >
                <p className="font-heading text-[13px] font-semibold leading-tight text-ink">
                  {reg.label}
                </p>
                {/* Category, reference and the verify link all on one line. The
                  link used to sit on a row of its own pinned to the bottom of
                  the card; inline it is the same words in ~20px less height.
                  It stays a real anchor with a visible label — it is how a
                  visitor checks the registration is genuine. */}
                <p className="text-[12px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                  <span className="uppercase tracking-[0.1em]">{reg.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono text-ink-muted">{reg.reference}</span>
                  <span aria-hidden="true"> · </span>
                  {/* ⚠ WAVE 490, PHONE RULE 6: THESE THREE ARE TARGETS.

                    414's target audit exempts "a link inside a run of text",
                    which is a rule about a sentence with a link in it, and on
                    a desktop that is exactly what this is: category, reference
                    and the verify link all on one line. Below `lg` the
                    reference line runs at 15px and wraps, and the link ends up
                    ALONE on the last line, where it was a 24px-tall target
                    with nothing else on the row to press. Measured at 390 on
                    every route: 139.4, 180.7 and 278.9 wide by 24 tall.

                    `max-lg:` only, so the desktop line is not pushed apart by
                    a 44px inline box it does not need. The badge's rhythm is
                    kept by taking the height out of the surrounding margins
                    rather than by adding it: the row it sits on grows from 24
                    to 44, and the card's own `gap-0.5` is what absorbs it. */}
                  <a
                    href={reg.verifyHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-baseline gap-0.5 font-semibold text-teal-600 transition-colors duration-200 hover:text-orange-700 max-lg:min-h-11 max-lg:items-center"
                  >
                    {reg.verifyLabel}
                    <ArrowUpRight aria-hidden="true" className="size-3 self-center" />
                  </a>
                </p>
                {/* Published terms verbatim, run inline instead of stacked —
                  same words, fewer lines. */}
                {reg.details?.length ? (
                  <p className="text-[12px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                    {reg.details.join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {/*
           * THE LEGAL LINKS. Four text links, present on every route because
           * this footer is drawn by __root.tsx. Three are the company's
           * published documents on the platform (this site has none of its
           * own); `Legal` is the company block on this site, at /legal.
           *
           * They sit ABOVE the notice, not inside it: a link buried in an
           * 11px grey paragraph is the "technically present" that the CMA
           * guidance on misleading omissions is about. 13px, 44px targets on
           * touch, and they wrap to a second line at 360 rather than
           * scrolling sideways.
           *
           * ⚠ THEY USED TO RESOLVE TO NAVY BY ACCIDENT, and wave 412 made
           * that deliberate. The classes were `text-mist hover:text-white`,
           * and the unlayered remap matched the `text-white` substring at ALL
           * times rather than only on hover, so the links rendered navy-900
           * whatever state they were in and the hover did nothing. They are
           * now `text-ink-muted` (6.20:1 on the cream) with a real
           * `hover:text-orange-700` (5.78:1), so the hover state is a state
           * again. The underline carries the affordance either way.
           *
           * ⚠ THE ORDER IS FIXED and matches the platform's own footer:
           * Terms, Privacy, Disclaimer, Legal. Do not reorder or drop one to
           * save a line. (Wave 298, R298-1.)
           *
           * ⚠ THE REGION IS "Legal and policies", NOT "Legal". One of the
           * links inside it is called Legal, and a nav with the same
           * accessible name announces as "Legal, navigation" immediately
           * before "Legal, link", which gives a screen-reader user no way to
           * tell the container from its contents. The wave 298 gate asserts
           * this exact string on every prerendered page.
           */}
          <nav
            aria-label="Legal and policies"
            className="mt-4 border-t border-rule pt-3.5 sm:mt-5 sm:pt-4"
          >
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-0.5 text-[13px]">
              {legalLinks.map((item) =>
                item.external ? (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 px-2 font-medium text-ink-muted underline underline-offset-4 transition-colors duration-200 hover:text-orange-700 lg:min-h-0 lg:min-w-0 lg:px-0 lg:py-1.5"
                    >
                      {item.label}
                      <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ) : (
                  <li key={item.label}>
                    <Link
                      to={item.href}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-medium text-ink-muted underline underline-offset-4 transition-colors duration-200 hover:text-orange-700 lg:min-h-0 lg:min-w-0 lg:px-0 lg:py-1.5"
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          {/* Wave 576 (10 Oct 2026): the charity pledge sits with the company's
              legal identity, a step above the 11px notice, on every route
              including the register pages. ink on the footer ground. 15px at
              every width by R576-1 (Callum, 12 Oct 2026): the house minimum,
              not the brief's 13px. */}
          <p className="mx-auto mt-3 max-w-[120ch] text-balance text-center text-[15px] font-semibold leading-relaxed text-ink">
            {charityPledge}
          </p>

          {/* ink-muted, 6.20:1 on the cream. This is the same decision wave
              298 made through the remap (`text-mist` resolving to slate-ink)
              said in the class itself, and the other labels wave 298 had to
              leave failing at 4.33:1 went with it in wave 412. */}
          <p className="mx-auto mt-3 max-w-[120ch] text-balance text-center text-[11px] max-lg:text-[15px] leading-relaxed text-ink-muted">
            {legalNotice}
          </p>
        </div>
      </div>
    </footer>
  );
}
