import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Landmark, Mail, ScrollText, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import {
  companyRecord,
  companyRecordFields,
  legalLinks,
  legalMailboxes,
  legalPageEyebrow,
  legalPageLead,
  legalPageTitle,
  mailboxesNote,
  policiesNote,
} from "@/content/legal";
import { trustRegistrations } from "@/content/site";

/**
 * /legal, the company block the footer's `Legal` link opens.
 *
 * A PAGE, NOT A PANEL, and the reason is the build: this site prerenders to
 * static HTML for GitHub Pages, so a page is a real URL a council, a solicitor
 * or a reader can bookmark, quote in a complaint and reach with JavaScript
 * off. A disclosure panel that only exists once React has hydrated is a
 * disclosure that some readers do not get. It is added to the prerender list
 * in `vite.config.ts`.
 *
 * ⚠ AND TO `sitemap[.]xml.ts`, WHICH DOES NOT CURRENTLY SHIP. That route is a
 * server handler, and the static build sets `nitro: false`, so no sitemap.xml
 * is emitted at all and `robots.txt` names none. Its `BASE_URL` is also still
 * "", so every `<loc>` would be relative and invalid if it did ship. That is a
 * pre-existing defect, not this wave's, and the entry is added so that /legal
 * is in it the day somebody fixes the route. See the wave 298 report.
 *
 * ⚠ EVERY VALUE ON THIS PAGE COMES FROM A REGISTER, NOT FROM COPY.
 * The company fields are read off Companies House (see content/legal.ts for
 * the source URL, the date it was read and the note on how the register splits
 * the address); the ICO and PRS references and the insurance position come
 * from `trustRegistrations`, which the footer already prints. Nothing here may
 * be softened, rounded or filled in with a placeholder: if a value cannot be
 * evidenced it is left off the page and raised in the wave report instead.
 *
 * ⚠ NO CLAIM OF AUTHORISATION OR EXEMPTION belongs on this page. The company's
 * regulatory position is stated once, in the footer notice, and it says what
 * the company is NOT. Listing registrations is not the same as claiming a
 * regulator has approved anything, and this page must never read as if it is.
 */

/*
 * ⚠ TITLED AFTER THE REGISTERED COMPANY, AND ALONE ON THE SITE IN THAT. Every
 * other page ends "Impact Investment Group" (wave 507; they ended "The Impact
 * Investment Platform" before it). This is the one page whose whole job is to
 * establish that the legal entity is Impact Investment Group UK Limited, so it
 * carries the full registered name rather than the trading one. The
 * separator is a middot rather than the dash the other titles use because this
 * project's canon forbids the em dash in anything newly written.
 */
const title = "Legal and company information · Impact Investment Group UK Limited";
const description =
  "Registered company name, number, registered office and jurisdiction for Impact Investment Group UK Limited, with its public registrations and the documents that govern its services.";

/*
 * ⚠ ABSOLUTE, NOT ROOT-RELATIVE. A canonical URL and an og:url are only
 * meaningful as absolute URLs: `/legal` in a `rel="canonical"` is resolved
 * against whatever origin happens to be serving the markup, so a preview
 * deployment or a scraper's cache can end up declaring itself canonical, and
 * `og:url` is read out of context by crawlers that have no base to resolve
 * against at all.
 *
 * The origin is this repo's `public/CNAME`, which is what GitHub Pages serves
 * from. If the domain moves, that file and this constant move together.
 *
 * Every other route on this site still emits root-relative values here. That
 * is the same defect and it is not this wave's to fix; a small follow-up
 * should lift this constant somewhere shared and use it everywhere.
 */
const siteOrigin = "https://impactinvestmentgroup.co.uk";
const canonical = `${siteOrigin}/legal`;

export const Route = createFileRoute("/legal")({
  component: LegalPage,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: canonical }],
  }),
});

function SectionIcon({ children }: { children: React.ReactNode }) {
  /* 24px glyph in a 60px ring, per the icon system. Ring is the cream-ground
     value; the stroke is navy and the accent is teal, because everything on
     this page is verification, not action. */
  return (
    <span className="grid size-[60px] shrink-0 place-items-center rounded-full border border-rule text-teal-600">
      {children}
    </span>
  );
}

function LegalPage() {
  const documents = legalLinks.filter((item) => item.external);

  /*
   * A FRAGMENT, NOT <main>. `__root.tsx` already renders
   * <main id="main"> around every route, so a page that opens its own
   * <main> nests one landmark inside another: axe reports
   * landmark-no-duplicate-main, landmark-unique and
   * landmark-main-is-top-level, and a screen-reader user gets two
   * "main" regions to choose between. The site's older routes do wrap
   * themselves this way and are not this wave's to change; a new page
   * does not have to inherit it.
   */
  return (
    <div className="legal-page">
      <section aria-labelledby="legal-heading" className="page-intro legal-intro">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-8 pt-14 sm:px-8 lg:pt-20">
          <Reveal>
            {/* teal-600 (4.7:1 on the cream), NOT the orange-700 the other cream
                heroes use. An eyebrow is 12px semibold, which is not large
                text, so it needs 4.5:1 and orange-700 gives 4.1:1. The brand
                kit already says eyebrows on cream are teal; axe caught this
                page not following it. */}
            <p className="eyebrow tracking-[0.14em] text-teal-600">{legalPageEyebrow}</p>
            <h1
              id="legal-heading"
              className="heading-tight mt-3 max-w-[14ch] text-balance text-[clamp(2.125rem,5.4vw,3.75rem)] font-extrabold tracking-[-0.03em] text-ink"
            >
              {legalPageTitle}
            </h1>
            <p className="measure mt-5 text-[17px] leading-relaxed text-ink-muted">
              {legalPageLead}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── The company ──────────────────────────────────────────────────── */}
      <section aria-labelledby="company-heading" className="section-light">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-14 sm:px-8">
          <Reveal className="panel p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <SectionIcon>
                <Landmark aria-hidden="true" className="size-6" strokeWidth={1.6} />
              </SectionIcon>
              <h2 id="company-heading" className="font-heading text-[26px] font-bold text-ink">
                The company
              </h2>
            </div>

            <dl className="mt-7 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {companyRecordFields.map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <dt className="eyebrow text-ink-muted">{field.label}</dt>
                  <dd className="font-heading text-[17px] font-semibold leading-snug text-ink">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* The verify link is the point of the block. It is a real anchor
                with a visible label, not an icon: it is how a reader proves the
                four values above without taking our word for any of them. */}
            <p className="mt-7 text-[13px] max-lg:text-[15px] leading-relaxed text-ink-muted">
              Read from the Companies House public register on {companyRecord.verifiedOn}.{" "}
              <a
                href={companyRecord.registerHref}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-baseline gap-1 font-semibold text-teal-600 underline underline-offset-4 transition-colors duration-200 hover:text-ink max-lg:min-h-11 max-lg:items-center"
              >
                {companyRecord.registerLabel}
                <ArrowUpRight aria-hidden="true" className="size-3.5 self-center" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Registrations ────────────────────────────────────────────────── */}
      <section aria-labelledby="registrations-heading" className="section-light">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-14 sm:px-8">
          <Reveal>
            <div className="flex items-center gap-4">
              <SectionIcon>
                <ShieldCheck aria-hidden="true" className="size-6" strokeWidth={1.6} />
              </SectionIcon>
              <h2
                id="registrations-heading"
                className="font-heading text-[26px] font-bold text-ink"
              >
                Registrations and cover
              </h2>
            </div>
            {/* ⚠ THE THIRD CARD IS THE BROKER'S FCA NUMBER, NOT THIS COMPANY'S.
                An earlier draft said only "each of these is checkable on the
                register that issues it", which on a card headed
                "FCA broker FRN 305402" reads as this company being on the FCA
                register, on the same page whose footer says it is not. The
                second sentence exists to close that reading and must not be
                dropped while that card is here. */}
            <p className="measure mt-4 text-[15px] leading-relaxed text-ink-muted">
              Each of these is checkable on the register that issues it, and a listing is not an
              approval of anything the company does. The FCA reference below belongs to the
              insurance broker, not to this company.
            </p>
          </Reveal>

          <ul className="mt-7 grid gap-4 md:grid-cols-3">
            {trustRegistrations.map((reg, index) => (
              <Reveal key={reg.id} index={index} as="li" className="panel flex flex-col gap-2 p-5">
                <p className="eyebrow text-ink-muted">{reg.category}</p>
                <p className="font-heading text-[17px] font-semibold text-ink">{reg.label}</p>
                <p className="font-mono text-[13px] text-ink-muted">{reg.reference}</p>
                {reg.details?.map((detail) => (
                  <p
                    key={detail}
                    className="text-[12px] max-lg:text-[15px] leading-snug max-lg:leading-[1.6] text-ink-muted"
                  >
                    {detail}
                  </p>
                ))}
                <a
                  href={reg.verifyHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-auto inline-flex min-h-11 items-center gap-1 pt-2 text-[13px] font-semibold text-teal-600 underline underline-offset-4 transition-colors duration-200 hover:text-ink"
                >
                  {reg.verifyLabel}
                  <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The documents ────────────────────────────────────────────────── */}
      <section aria-labelledby="documents-heading" className="section-light">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-14 sm:px-8">
          <Reveal>
            <div className="flex items-center gap-4">
              <SectionIcon>
                <ScrollText aria-hidden="true" className="size-6" strokeWidth={1.6} />
              </SectionIcon>
              <h2 id="documents-heading" className="font-heading text-[26px] font-bold text-ink">
                The documents
              </h2>
            </div>
            <p className="measure mt-4 text-[15px] leading-relaxed text-ink-muted">
              {policiesNote}
            </p>
          </Reveal>

          <ul className="mt-7 grid gap-4 md:grid-cols-3">
            {documents.map((doc, index) => (
              <Reveal
                key={doc.label}
                index={index}
                as="li"
                className="panel legal-document flex flex-col gap-3 p-6"
              >
                <p className="font-heading text-[17px] font-semibold text-ink">{doc.label}</p>
                <p className="text-[15px] leading-relaxed text-ink-muted">{doc.description}</p>
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-auto inline-flex min-h-11 items-center gap-1 pt-2 text-[13px] font-semibold text-teal-600 underline underline-offset-4 transition-colors duration-200 hover:text-ink"
                >
                  Read the {doc.label}
                  <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Contacts ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="contacts-heading" className="section-light">
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-16 sm:px-8">
          <Reveal className="panel p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <SectionIcon>
                <Mail aria-hidden="true" className="size-6" strokeWidth={1.6} />
              </SectionIcon>
              <h2 id="contacts-heading" className="font-heading text-[26px] font-bold text-ink">
                Contacting the company
              </h2>
            </div>

            <dl className="mt-7 grid gap-x-10 gap-y-5 sm:grid-cols-3">
              {legalMailboxes.map((box) => (
                <div key={box.address} className="flex flex-col gap-1">
                  <dt className="eyebrow text-ink-muted">{box.purpose}</dt>
                  <dd>
                    <a
                      href={`mailto:${box.address}`}
                      className="inline-flex min-h-11 items-center break-all font-heading text-[15px] font-semibold text-ink underline underline-offset-4 transition-colors duration-200 hover:text-teal-600"
                    >
                      {box.address}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-[13px] max-lg:text-[15px] leading-relaxed text-ink-muted">
              {mailboxesNote} Post can be sent to the registered office above. To ask a question
              about this site rather than about the company,{" "}
              <Link
                to="/contact"
                className="font-semibold text-teal-600 underline underline-offset-4 transition-colors duration-200 hover:text-ink"
              >
                use the contact form
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
