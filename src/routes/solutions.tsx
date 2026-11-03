import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PreReleaseBadge } from "@/components/ui/pre-release-badge";
import { cn } from "@/lib/utils";
import { closingBeats, closingStrapline, registerRoute } from "@/content/site";
import {
  dealLayers,
  dealLayersKicker,
  layerOwners,
  layerOwnersKicker,
  lookingForHome,
  productPitch,
  solutionClose,
  solutionHero,
} from "@/content/solutions";
import { SIZES_FULL_BLEED, SIZES_THIRD_FROM_TABLET, variantSrcSet } from "@/lib/responsive-image";

/**
 * /solutions — five sections.
 *
 *   1 · The statement        cream, street photo at 12%
 *   2 · Five layers          navy,  exploded house
 *   3 · Who owns which       cream, hub diagram + spine
 *   4 · The product          navy,  the three analysts
 *   5 · Close                cream, the site-wide strapline
 *
 * ── WHAT THIS REPLACED ────────────────────────────────────────────────────
 *
 * Eight near-identical role sections — one per organisation, each with a
 * promise, three bullets and a mocked-up portal window. All eight roles still
 * appear; they are the verb lines in section three. The portals are gone: they
 * were invented interface screenshots, and /platform now shows the real thing.
 *
 * ── THREE THINGS THAT ARE NOT ARBITRARY ───────────────────────────────────
 *
 * THE HOUSE IS A RHYME, NOT A DIAGRAM. Five slabs beside five rows, and that is
 * all. There are deliberately no connector lines between them, because the roof
 * is not "the brief" and drawing a line would claim that it is.
 *
 * SECTION 3 IS A SPINE, NOT A GRID. "The home" has four owners and the other
 * layers have one or two. A five-column grid advertises that imbalance; a spine
 * absorbs it.
 *
 * THE CLOSE IS THE SHARED ONE. Same beats, same accent on the middle beat, same
 * two actions as /about, /platform and /the-problem — from `closingBeats` in
 * content/site.ts. This page is not special.
 */

export const Route = createFileRoute("/solutions")({
  component: SolutionsPage,
  head: () => ({
    meta: [
      { title: "The Solution — Impact Investment Group" },
      { name: "description", content: solutionHero.lead },
      { property: "og:title", content: "The Solution — Impact Investment Group" },
      { property: "og:description", content: solutionHero.lead },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/solutions" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/solutions" }],
  }),
});

function SolutionsPage() {
  return (
    <div>
      {/* ── 1 · The statement ── cream ─────────────────────────────────────
          The street photograph sits at 12% and fades to solid cream before the
          copy starts, so nothing is read against a busy part of the image. */}
      <section
        aria-labelledby="solution-heading"
        className="page-intro section-light relative isolate overflow-hidden"
      >
        {/* WAVE 413b: eager. The statement's own ground, in the first
          viewport, so deferring it until layout puts it behind the words it
          sits under rather than under them. */}
        <img
          src="/images/solution-street-blueprint.webp"
          loading="eager"
          alt=""
          aria-hidden="true"
          width={1600}
          height={900}
          className="pointer-events-none absolute inset-0 -z-20 size-full object-cover opacity-[0.12]"
          srcSet={variantSrcSet("/images/solution-street-blueprint.webp")}
          sizes={SIZES_FULL_BLEED}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-[var(--color-mist-bg)]/80 via-[var(--color-mist-bg)]/25 to-[var(--color-mist-bg)]"
        />
        <div className="mx-auto w-full max-w-[1200px] px-5 py-20 sm:px-8">
          <Reveal>
            <p className="eyebrow tracking-[0.14em] text-orange-700">{solutionHero.eyebrow}</p>
            <h1
              id="solution-heading"
              className="heading-tight mt-3.5 max-w-[15ch] font-heading text-[clamp(2.5rem,7.6vw,6rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-ink"
            >
              {solutionHero.headA}{" "}
              {/* orange-700, not orange-500: on the cream the brighter orange is
                  3.76:1 and `.section-light` rewrites it to navy ink anyway. */}
              <span className="text-orange-700">{solutionHero.headB}</span>
            </h1>
            <p className="mt-5 max-w-[56ch] text-[19px] leading-relaxed text-ink-muted">
              {solutionHero.lead}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 2 · Five layers ── navy ───────────────────────────────────────── */}
      <section aria-labelledby="layers-heading" className="border-t border-rule bg-page">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-11 sm:px-8">
          <p className="eyebrow tracking-[0.14em] text-teal-600">How a deal is built</p>
          <h2
            id="layers-heading"
            className="heading-tight mt-2.5 max-w-[22ch] text-balance text-[clamp(1.625rem,3.8vw,2.75rem)] font-extrabold tracking-[-0.02em] text-ink"
          >
            A workable deal has <span className="text-orange-700">five layers</span>. We keep them
            connected.
          </h2>

          <div className="mt-4 grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_200px]">
            <div>
              <ol>
                {dealLayers.map((layer, i) => (
                  <Reveal key={layer.number} index={i} as="li">
                    {/* Keep the sequence aligned on phones; stagger only when there is room. */}
                    <div
                      className="mt-3 flex items-center gap-4 rounded-xl border border-rule border-l-[3px] border-l-teal-600 bg-secondary/60 px-4 py-4 sm:ml-[var(--layer-offset)]"
                      style={{ "--layer-offset": `${i * 20}px` } as CSSProperties}
                    >
                      <span className="font-heading text-[20px] font-extrabold text-teal-600">
                        {layer.number}
                      </span>
                      <span>
                        <span className="block font-heading text-[18px] font-extrabold text-ink">
                          {layer.title}
                        </span>
                        <span className="mt-1 block text-[15px] leading-relaxed text-ink-muted">
                          {layer.detail}
                        </span>
                      </span>
                    </div>
                  </Reveal>
                ))}
              </ol>
              <p className="mt-5 max-w-[52ch] font-heading text-[19px] font-bold text-ink">
                {dealLayersKicker}
              </p>
            </div>

            {/* Decorative. The list beside it says everything this says. */}
            <img
              src="/images/solution/house.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={453}
              height={1100}
              className="hidden w-full lg:block"
              srcSet={variantSrcSet("/images/solution/house.webp")}
              sizes={SIZES_THIRD_FROM_TABLET}
            />
          </div>
        </div>
      </section>

      {/* ── 3 · Who owns which layer ── cream ─────────────────────────────── */}
      <section aria-labelledby="owners-heading" className="section-light border-t border-rule">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8">
          <p className="eyebrow tracking-[0.14em] text-orange-700">Who touches which layer</p>
          <h2
            id="owners-heading"
            className="heading-tight mt-2.5 max-w-[24ch] text-balance text-[clamp(1.625rem,3.8vw,2.75rem)] font-extrabold tracking-[-0.02em] text-ink"
          >
            Eight partners. <span className="text-orange-700">Clear responsibilities.</span>
          </h2>

          <div className="mt-6 grid items-center gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
            <img
              src="/images/solution/hub.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={846}
              height={620}
              className="hidden w-full lg:block"
              srcSet={variantSrcSet("/images/solution/hub.webp")}
              sizes={SIZES_THIRD_FROM_TABLET}
            />

            <div>
              <ol>
                {layerOwners.map((row, i) => {
                  const last = i === layerOwners.length - 1;
                  return (
                    <Reveal key={row.layer} index={i} as="li">
                      <div
                        className={cn("grid grid-cols-[56px_1fr] gap-[22px]", !last && "pb-[18px]")}
                      >
                        <div className="relative text-center">
                          <span className="grid size-11 place-items-center rounded-full bg-teal-600 font-heading text-[15px] font-extrabold text-page">
                            {row.number}
                          </span>
                          {/* The thread between the discs. Decorative — the
                              ordered list carries the sequence. */}
                          {!last ? (
                            <span
                              aria-hidden="true"
                              className="absolute -bottom-[18px] left-1/2 top-12 w-0.5 -translate-x-1/2 bg-linear-to-b from-teal-600/40 to-teal-600/10"
                            />
                          ) : null}
                        </div>
                        <div className="pt-[5px]">
                          <p className="eyebrow tracking-[0.14em] text-orange-700">{row.layer}</p>
                          <div className="mt-2.5 flex flex-wrap">
                            {row.people.map((p) => (
                              /* ⚠ WAVE 490, PHONE RULE 7: THE PILL WRAPS WHOLE.
                                 `inline-flex` with `align-items: baseline` and
                                 no wrap put the role and the verb on one flex
                                 line for ever, so when "Care & Support
                                 Providers" ran out of room it wrapped inside
                                 its own `b` and left the verb sitting on the
                                 first baseline beside it, in a column of its
                                 own with a justified-looking gap between:
                                 68px tall at 360 and 390 against 43 for every
                                 other pill on the page.

                                 `flex-wrap` lets the verb drop UNDER the role
                                 instead, and `whitespace-nowrap` keeps
                                 "deliver it" together when it lands there.
                                 `gap-x-[7px]` and not `gap-x-2`, because the
                                 horizontal gap is the one the desktop uses
                                 and the desktop does not move: at 1280 every
                                 pill fits on one line, nothing wraps, and the
                                 rendering is the one wave 443 shipped. */
                              <span
                                key={p.role}
                                className="mb-2 mr-2 inline-flex flex-wrap items-baseline gap-x-[7px] gap-y-0.5 rounded-full border border-[color-mix(in_oklab,var(--color-navy-900)_14%,transparent)] bg-white px-[15px] py-2 shadow-[0_1px_2px_color-mix(in_srgb,var(--brand-ink)_5%,transparent)]"
                              >
                                <b className="font-heading text-[15px] font-extrabold text-navy-900">
                                  {p.role}
                                </b>
                                <span className="whitespace-nowrap text-[14px] font-semibold text-orange-700">
                                  {p.verb}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </ol>
              <p className="mt-5 max-w-[56ch] text-[14px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                {layerOwnersKicker}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · The product ── navy ───────────────────────────────────────── */}
      <section aria-labelledby="product-heading" className="border-t border-rule bg-page">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-9 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="eyebrow tracking-[0.14em] text-teal-600">{productPitch.eyebrow}</p>
            <h2
              id="product-heading"
              className="heading-tight mt-3 max-w-[20ch] text-balance text-[clamp(1.75rem,4.4vw,3.125rem)] font-extrabold tracking-[-0.02em] text-ink"
            >
              {productPitch.headA} <span className="text-orange-700">{productPitch.headB}</span>.
            </h2>
            <p className="mt-3.5 text-[17px] leading-relaxed text-ink-muted">{productPitch.lead}</p>

            <ul className="mt-6 flex flex-col gap-5 sm:flex-row sm:gap-6">
              {productPitch.items.map((item) => (
                <li key={item.title} className="flex-1 border-t-2 border-teal-600 pt-3">
                  <p className="font-heading text-[16.5px] font-extrabold text-ink">{item.title}</p>
                  <p className="mt-1.5 text-[13px] max-lg:text-[15px] leading-snug text-ink-muted">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>

            {/* Filled, not outlined, with a glow ring. White on teal-600 is
                5.25:1 — the brighter teal would drop it below AA. */}
            <div className="mt-7">
              <Link
                to="/platform"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-600 bg-teal-600 px-6 py-3 font-heading text-[15px] font-bold text-page shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-teal-400)_18%,transparent),0_12px_30px_-10px_color-mix(in_oklab,var(--color-teal-400)_60%,transparent)] transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                {productPitch.cta}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <img
            src="/images/solution/trio.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={829}
            height={620}
            className="hidden w-full drop-shadow-[0_20px_34px_color-mix(in_srgb,var(--brand-ink)_40%,transparent)] lg:block"
            srcSet={variantSrcSet("/images/solution/trio.webp")}
            sizes={SIZES_THIRD_FROM_TABLET}
          />
        </div>
      </section>

      {/* ── The safeguarding signpost ─────────────────────────────────────
          Not marketing. Someone who needs housing has landed on a page selling
          property to investors, and this is their route out. It stays. */}
      <section aria-label="Looking for a home" className="border-t border-rule bg-page">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-4 text-center sm:px-8">
          <p className="mx-auto max-w-[96ch] text-[13px] max-lg:text-[15px] leading-relaxed text-ink-muted">
            {lookingForHome.body}{" "}
            <Link
              to="/contact"
              search={{ enquiry: lookingForHome.enquiry, type: lookingForHome.enquiry }}
              className="font-bold text-teal-600 underline-offset-2 hover:underline max-lg:inline-flex max-lg:min-h-11 max-lg:items-center"
            >
              {lookingForHome.action} →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
