import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  dealLayers,
  dealLayersKicker,
  layerOwners,
  layerOwnersKicker,
  lookingForHome,
  productPitch,
  solutionHero,
} from "@/content/solutions";
import { SIZES_FULL_BLEED, SIZES_THIRD_FROM_TABLET, variantSrcSet } from "@/lib/responsive-image";

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

const partnerLinks: Record<string, string> = {
  "Local Authorities": "/partner-with-local-authority",
  "Estate Agents": "/partner-with-broker",
  Landlords: "/partner-with-landlord",
  Developers: "/partner-with-developer",
  "Housing Associations": "/partner-with-housing-association",
  Investors: "/partner-with-investor",
  "Care & Support Providers": "/partners",
};

function LayerExplorer() {
  const [active, setActive] = React.useState(0);
  const buttons = React.useRef<Array<HTMLButtonElement | null>>([]);
  const layer = dealLayers[active]!;
  const owners = layerOwners.find((item) => item.number === layer.number)!;
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      <div
        role="tablist"
        aria-label="Deal layers"
        aria-orientation="vertical"
        className="border-t border-rule"
      >
        {dealLayers.map((item, index) => (
          <button
            key={item.number}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            id={"layer-tab-" + item.number}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls="layer-detail"
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowDown"
                  ? (index + 1) % dealLayers.length
                  : event.key === "ArrowUp"
                    ? (index - 1 + dealLayers.length) % dealLayers.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? dealLayers.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                setActive(next);
                buttons.current[next]?.focus();
              }
            }}
            className={cn(
              "flex min-h-14 w-full items-center gap-4 border-b border-rule py-4 pl-3 pr-2 text-left text-base transition-colors",
              active === index
                ? "bg-secondary font-semibold text-teal-600"
                : "text-ink-muted hover:bg-page-alt hover:text-ink",
            )}
          >
            <span className="font-mono text-xs" aria-hidden="true">
              {item.number}
            </span>
            <span className="flex-1">{item.title}</span>
            {active === index ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      <div
        id="layer-detail"
        role="tabpanel"
        aria-labelledby={"layer-tab-" + layer.number}
        tabIndex={0}
      >
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_120px]">
          <div>
            <h3 className="font-heading text-3xl font-semibold text-ink">{layer.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-ink-muted">{layer.detail}</p>
            <h4 id="owners-heading" className="mt-7 text-sm font-semibold text-ink">
              Who is responsible
            </h4>
            <dl className="mt-2 border-t border-rule">
              {owners.people.map((person) => (
                <div
                  key={person.role}
                  className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-b border-rule py-3"
                >
                  <dt className="font-medium text-ink">
                    {partnerLinks[person.role] ? (
                      <Link
                        to={partnerLinks[person.role]}
                        className="inline-flex min-h-11 items-center gap-2 text-teal-600 underline decoration-rule underline-offset-4 hover:decoration-teal-600"
                      >
                        {person.role}
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    ) : (
                      person.role
                    )}
                  </dt>
                  <dd className="text-sm text-ink-muted">{person.verb}</dd>
                </div>
              ))}
            </dl>
          </div>
          <img
            src="/images/solution/house.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={453}
            height={1100}
            className="hidden w-full object-contain sm:block"
            srcSet={variantSrcSet("/images/solution/house.webp")}
            sizes="120px"
          />
        </div>
        <div className="mt-7 flex items-center gap-5 border-t border-rule pt-5">
          <img
            src="/images/solution/hub.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={846}
            height={620}
            className="hidden h-16 w-20 object-contain sm:block"
            srcSet={variantSrcSet("/images/solution/hub.webp")}
            sizes="80px"
          />
          <p className="max-w-[62ch] text-sm leading-relaxed text-ink-muted">{layerOwnersKicker}</p>
        </div>
      </div>
    </div>
  );
}

function SolutionsPage() {
  return (
    <div>
      <section
        aria-labelledby="solution-heading"
        className="page-intro relative isolate overflow-hidden"
      >
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
          className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-page/80 via-page/25 to-page"
        />
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <p className="text-sm font-semibold text-teal-600">{solutionHero.eyebrow}</p>
            <h1
              id="solution-heading"
              className="mt-4 max-w-[18ch] font-heading text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.08] text-ink"
            >
              {solutionHero.headA} {solutionHero.headB}
            </h1>
          </div>
          <p className="max-w-[52ch] text-lg leading-relaxed text-ink-muted lg:self-end lg:pb-2">
            {solutionHero.lead}
          </p>
        </div>
      </section>
      <section aria-labelledby="layers-heading" className="border-t border-rule">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
          <h2
            id="layers-heading"
            className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-ink"
          >
            Five layers. Clear responsibilities.
          </h2>
          <p className="mt-4 max-w-[70ch] text-base leading-relaxed text-ink-muted">
            {dealLayersKicker}
          </p>
          <p className="mt-3 text-sm text-teal-600">Select a layer to see who is involved.</p>
          <LayerExplorer />
        </div>
      </section>
      <section aria-labelledby="product-heading" className="border-t border-rule bg-page-alt">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:py-20">
          <div>
            <h2
              id="product-heading"
              className="max-w-[24ch] font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-tight text-ink"
            >
              {productPitch.headA} {productPitch.headB}.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">{productPitch.lead}</p>
            <dl className="mt-7 border-t border-rule">
              {productPitch.items.map((item) => (
                <div
                  key={item.title}
                  className="grid gap-2 border-b border-rule py-4 sm:grid-cols-[160px_minmax(0,1fr)]"
                >
                  <dt className="font-semibold text-ink">{item.title}</dt>
                  <dd className="text-base leading-relaxed text-ink-muted">{item.detail}</dd>
                </div>
              ))}
            </dl>
            <Link
              to="/platform"
              className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline decoration-rule underline-offset-4 hover:decoration-teal-600"
            >
              {productPitch.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <img
            src="/images/solution/trio.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={829}
            height={620}
            className="hidden w-full object-contain lg:block"
            srcSet={variantSrcSet("/images/solution/trio.webp")}
            sizes={SIZES_THIRD_FROM_TABLET}
          />
        </div>
      </section>
      <section aria-label="Looking for a home" className="border-t border-rule">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-6 sm:px-8">
          <p className="max-w-[95ch] text-sm leading-relaxed text-ink-muted">
            {lookingForHome.body}{" "}
            <Link
              to="/contact"
              search={{ enquiry: lookingForHome.enquiry, type: lookingForHome.enquiry }}
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline underline-offset-4"
            >
              {lookingForHome.action}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
