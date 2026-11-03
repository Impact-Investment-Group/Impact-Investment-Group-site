import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowUpRight, Clock, LifeBuoy, Mail, Phone, Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { EnquiryForm } from "@/components/contact/enquiry-form";
import {
  contactHero,
  enquiryRouteIds,
  enquiryRoutes,
  type EnquiryRouteId,
} from "@/content/contact";
import { faq, faqEyebrow, faqHeading } from "@/content/faq";
import { contactDetails, crisisLines, crisisNote } from "@/content/site";
import { cn } from "@/lib/utils";
import { SIZES_CARD_ILLUSTRATION, variantSrcSet } from "@/lib/responsive-image";

/**
 * /contact — three sections.
 *
 *   1 · Talk to us      cream   heading, the direct routes, the trio waving
 *   2 · The form        cream   route chips + form, with the reassurance rail
 *   3 · FAQ             navy    the old site's accordion, verbatim
 *
 * ── WHY THE RAIL EXISTS ───────────────────────────────────────────────────
 *
 * This is the only page on the site where the visitor is trying to DO
 * something rather than read something, so the job is removing doubt, not
 * adding interest. What stops a form being completed is not the layout — it is
 * not knowing who reads it, how long it takes, and what happens next. Those
 * three answers sit in the right-hand column, level with the submit button,
 * because that is where the hesitation happens.
 *
 * ⚠️ THE CRISIS NUMBERS ARE ON THE PAGE, not only in the footer. That is
 * deliberate. The FAQ below openly asks "I'm looking for a home — can this
 * help me?", so people in difficulty do land here, and a number they have to
 * scroll to the footer to find is a number they may not find. They stay
 * duplicated. This is one of the few places where repetition is correct.
 *
 * ── What came off this page, and where it went ────────────────────────────
 *
 * The seven-section version's "Looking for a home", "Registrations" and
 * "Registered office" blocks are all still in the site footer, on every page.
 * The route selector survives as the chip row above the form — every CTA on
 * the site deep-links here with ?enquiry=, so without a control a visitor
 * arriving cold could only ever send a wait-list enquiry.
 *
 * The FAQ is verbatim from the old production site — see content/faq.ts for
 * why those answers are not summarised like the rest of the site's copy.
 */

const searchSchema = z.object({
  enquiry: z.string().optional().catch(undefined),
  type: z.string().optional().catch(undefined),
  role: z.string().optional().catch(undefined),
});

function toRouteId(value: string | undefined): EnquiryRouteId {
  return enquiryRouteIds.includes(value as EnquiryRouteId) ? (value as EnquiryRouteId) : "waitlist";
}

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Contact — Impact Investment Group" },
      {
        name: "description",
        // Interpolated, not typed out. This description carried its own copy of
        // the general address and went stale the day the mailbox changed.
        content: `Tell us what you need and a person replies within one working day. Email ${contactDetails.email} or call ${contactDetails.phone}.`,
      },
      { property: "og:title", content: "Contact — Impact Investment Group" },
      {
        property: "og:description",
        content: "Choose the right enquiry route and speak directly with the team.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

const telHref = (value: string) => `tel:${value.replace(/[^+\d]/g, "")}`;

function ContactPage() {
  const { enquiry, type, role } = Route.useSearch();
  const navigate = useNavigate({ from: "/contact" });
  const selected = toRouteId(type ?? enquiry);

  const select = (id: EnquiryRouteId) => {
    void navigate({ search: { ...{ enquiry: id, type: id }, ...(role ? { role } : {}) } });
  };

  return (
    <div className="contact-page">
      {/* ── 1 · Talk to us ── cream ───────────────────────────────────────
          The trio wave rather than point. On every other page they explain
          something; here they are the greeting, which is why the artwork is
          cropped at the waist and sits small. */}
      <section aria-labelledby="contact-heading" className="section-light">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-2 pt-14 sm:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Reveal>
              <p className="eyebrow tracking-[0.14em] text-orange-700">{contactHero.eyebrow}</p>
              <h1
                id="contact-heading"
                className="heading-tight mt-3 max-w-[16ch] text-balance text-[clamp(2.125rem,5.4vw,3.75rem)] font-extrabold tracking-[-0.03em] text-ink"
              >
                {contactHero.title}
              </h1>
              <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-7">
                <li>
                  <a
                    href={`mailto:${contactDetails.email}`}
                    className="flex min-h-11 items-center gap-2.5 font-heading text-[clamp(1rem,1.7vw,1.25rem)] font-bold text-ink transition-colors duration-200 hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  >
                    <Mail aria-hidden="true" className="size-[18px] shrink-0 text-teal-600" />
                    {contactDetails.email}
                  </a>
                </li>
                <li>
                  <a
                    href={telHref(contactDetails.phone)}
                    className="flex min-h-11 items-center gap-2.5 font-heading text-[clamp(1rem,1.7vw,1.25rem)] font-bold text-ink transition-colors duration-200 hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  >
                    <Phone aria-hidden="true" className="size-[18px] shrink-0 text-teal-600" />
                    {contactDetails.phone}
                  </a>
                </li>
                <li className="flex min-h-11 items-center gap-2.5 text-sm text-ink-muted">
                  <Clock aria-hidden="true" className="size-4 shrink-0 text-teal-600" />
                  {contactDetails.hours}
                </li>
              </ul>
            </Reveal>

            <img
              src="/images/ai-team/trio-wave.webp"
              loading="lazy"
              alt=""
              aria-hidden="true"
              width={934}
              height={558}
              className="hidden w-full lg:block"
              srcSet={variantSrcSet("/images/ai-team/trio-wave.webp")}
              sizes={SIZES_CARD_ILLUSTRATION}
            />
          </div>
        </div>
      </section>

      {/* ── 2 · The form + the rail ── cream, joined to section 1 ────────── */}
      <section id="contact-enquiry" aria-labelledby="enquiry-heading" className="section-light">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-6 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
            {/* ── The rail ───────────────────────────── */}
            {/* ⚠ WAVE 414: FIRST IN THE DOM, AND THAT IS THE WHOLE CHANGE.

                Phone rule 4 is that content order is reading order, and it
                names this card: "the crisis card comes first". Below 1024px
                this grid is one column, and the card was the SECOND item in
                it, which put the three crisis numbers under a full enquiry
                form with eight fields in it. A person in trouble was asked to
                scroll past a procurement form to reach a telephone number.

                Moved in the MARKUP rather than with `order`, because `order`
                moves the paint and leaves the reading order, the tab order
                and the screen reader where they were, which on this card is
                the half that matters. Desktop is placed back where it was
                with explicit grid coordinates, so nothing at 1024px and above
                moves at all; what changes there is that the card now comes
                first for a keyboard and a screen reader too, which for this
                card is not a regression. */}
            <div className="lg:col-start-2 lg:row-start-1">
              {/* Care information, not marketing. Duplicated from the footer on
                  purpose; see the note at the top of this file.

                  WAVE 412: THIS ROUTE'S ONE NAVY ISLAND. Everything else on
                  /contact is cream and white, and this card is the one block a
                  person in trouble has to find on a page otherwise built for
                  procurement enquiries. `data-accent="teal"` gives it the teal
                  rule the footer's copy carries, so the two read as the same
                  card on two pages. */}
              <section
                aria-labelledby="crisis-heading"
                data-accent="teal"
                className="section-dark p-4 lg:mt-7"
              >
                <p className="flex items-center gap-2">
                  <LifeBuoy aria-hidden="true" className="size-4 shrink-0 text-orange-500" />
                  {/* Brand Kit v4 keeps text white on the navy island. */}
                  <span id="crisis-heading" className="eyebrow tracking-[0.14em] text-white">
                    In a crisis
                  </span>
                </p>
                <ul className="mt-2.5 flex flex-col">
                  {crisisLines.map((line) => (
                    <li key={line.label}>
                      <a
                        href={telHref(line.detail)}
                        /* INSIDE AN ISLAND THE CLASSES ARE THE ISLAND'S. Navy
                           rules, mist body, white figure and the teal-400 focus
                           ring: the dark palette, written out, because that is
                           what this plate actually is. Converting these to
                           `border-rule` and `text-ink` would be honest about
                           the site and wrong about the card. */
                        className="flex min-h-11 items-center justify-between gap-3 border-b border-navy-700 text-[13px] text-mist last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                      >
                        {line.label}
                        <span className="font-heading text-[14px] font-bold text-white">
                          {line.detail}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-heading text-[12.5px] font-bold text-white">{crisisNote}</p>
              </section>
            </div>
            <div className="lg:col-start-1 lg:row-start-1">
              {/* Each choice keeps its existing description visible so the
                  visitor can compare the routes before completing the form. */}
              <h2 id="enquiry-heading" className="font-heading text-2xl font-bold text-ink">
                What do you need?
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {enquiryRoutes.map((option) => {
                  const active = option.id === selected;
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        aria-controls="contact-enquiry-form"
                        onClick={() => select(option.id)}
                        className={cn(
                          "group flex h-full min-h-11 w-full cursor-pointer flex-col gap-2 rounded-2xl border p-4 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
                          active
                            ? "border-teal-600 bg-secondary text-ink shadow-[var(--shadow-card)]"
                            : "border-rule bg-page text-ink hover:border-teal-600 hover:bg-secondary/40",
                        )}
                      >
                        <span className="flex w-full items-center justify-between gap-3 font-heading text-base font-bold">
                          {option.label}
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-teal-600 transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
                          />
                        </span>
                        <span className="text-sm leading-relaxed text-ink-muted">
                          {option.subline}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div id="contact-enquiry-form" className="mt-6">
                <EnquiryForm route={selected} prefilledRole={role} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 · FAQ ── white, after two cream sections ────────────────────── */}
      <section aria-labelledby="faq-heading" className="border-t border-rule bg-page">
        <div className="mx-auto w-full max-w-[900px] px-5 py-14 sm:px-8 lg:py-16">
          <p className="eyebrow tracking-[0.14em] text-teal-600">{faqEyebrow}</p>
          <h2
            id="faq-heading"
            className="heading-tight mt-2.5 text-balance text-[clamp(1.5rem,2.8vw,2rem)] font-extrabold tracking-[-0.02em] text-ink"
          >
            {faqHeading}
          </h2>

          {/* Native <details>, not a JS accordion: it works before hydration,
              it is keyboard and screen-reader correct for free, and the browser
              finds text inside a closed one when the user searches the page. */}
          <div className="mt-7 flex flex-col gap-2.5">
            {faq.map((item, i) => (
              <Reveal key={item.id} index={i}>
                {/* A white row with a hairline and the card shadow, deepening
                    when it opens. On the dark site the open state was a step
                    up in navy; on a white page the equivalent is a step up in
                    lift, because there is nowhere lighter to go. */}
                <details className="group rounded-[var(--radius-panel)] border border-rule bg-page shadow-[var(--shadow-card)] transition-shadow duration-200 open:shadow-[var(--shadow-card-hover)]">
                  <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-4 rounded-[var(--radius-panel)] p-5 font-heading text-lg font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-teal-600 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                      strokeWidth={2}
                    />
                  </summary>
                  <div className="flex max-w-[75ch] flex-col gap-3 px-5 pb-5">
                    {item.a.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-relaxed text-ink-muted">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
