import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BuddySlot } from "@/components/buddy/buddy-slot";
import {
  dealLayers,
  dealLayersKicker,
  layerOwners,
  layerOwnersKicker,
  lookingForHome,
  productPitch,
  solutionHero,
} from "@/content/solutions";
import { intrinsic, variantSrcSet } from "@/lib/responsive-image";
import "./editorial-friendly.css";
import "@/components/editorial/story-lead.css";

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
    <div className="friendly-layer-explorer mt-8" data-buddy-topic={layer.number === "04" ? "support" : layer.number === "05" ? "investment" : "property"}>
      <div
        role="tablist"
        aria-label="Deal layers"
        aria-orientation="vertical"
        className="friendly-layer-tabs"
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
              "friendly-layer-tab flex min-h-14 w-full items-center gap-4 text-left text-base",
              active === index ? "font-semibold text-teal-600" : "text-ink-muted hover:text-ink",
            )}
          >
            <span className="friendly-layer-number font-mono text-xs" aria-hidden="true">
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
        className="friendly-layer-panel"
      >
        <div className="friendly-layer-scene">
          <div key={layer.number} className="friendly-stage-enter min-w-0">
            <h3 className="font-heading text-3xl font-semibold text-ink">{layer.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-ink-muted">{layer.detail}</p>
            <h4 id="owners-heading" className="mt-7 text-sm font-semibold text-ink">
              Who is responsible
            </h4>
            <dl className="friendly-layer-owners mt-3">
              {owners.people.map((person) => (
                <div
                  key={person.role}
                  className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1"
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
          <div className="friendly-house-stage" aria-hidden="true">
            <span className="friendly-house-stage-number">{layer.number}</span>
            <img
              src="/images/solution/house.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={453}
              height={1100}
              className="friendly-layer-house"
              srcSet={variantSrcSet("/images/solution/house.webp")}
              sizes="(min-width: 1024px) 180px, 110px"
            />
          </div>
        </div>
        <div className="friendly-layer-footer mt-7 flex items-center gap-5">
          <img
            src="/images/solution/hub.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={846}
            height={620}
            className="h-20 w-24 shrink-0 object-contain"
            srcSet={variantSrcSet("/images/solution/hub.webp")}
            sizes="80px"
          />
          <p className="max-w-[62ch] text-sm leading-relaxed text-ink-muted">{layerOwnersKicker}</p>
        </div>
        <div className="friendly-layer-controls">
          <p className="text-sm font-semibold text-teal-600" aria-live="polite">
            Step {active + 1} of {dealLayers.length}
          </p>
          <div className="friendly-stage-controls">
            <button
              type="button"
              aria-label="Previous step"
              onClick={() => setActive((active + dealLayers.length - 1) % dealLayers.length)}
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next step"
              onClick={() => setActive((active + 1) % dealLayers.length)}
            >
              <ArrowRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionsPage() {
  return (
    <div className="friendly-editorial friendly-solutions" data-buddy-topic="property">
      <section aria-labelledby="solution-heading" className="story-lead story-lead--solution wave-section story-from-white story-mist">
        <div className="story-shell">
          <div className="story-copy">
            <p className="story-kicker">{solutionHero.eyebrow}</p>
            <h1 id="solution-heading" className="story-title">It takes a partnership to make a home.</h1>
            <p className="story-intro">
              A council knows where a home is needed. A landlord may have the right property.
              We bring them together with investors, housing associations and support providers.
            </p>
            <div className="story-links">
              <a href="#layers-heading">See how it works <ArrowRight aria-hidden="true" /></a>
              <Link to="/partners">Meet the partners <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="story-solution-visual">
            <img
              className="story-photo"
              src="/images/solution-street-blueprint.webp"
              srcSet={variantSrcSet("/images/solution-street-blueprint.webp")}
              sizes="(min-width: 1200px) 540px, (min-width: 800px) 45vw, 100vw"
              width={intrinsic("/images/solution-street-blueprint.webp")?.width}
              height={intrinsic("/images/solution-street-blueprint.webp")?.height}
              alt="An architectural drawing of a street blends into a photograph of its homes."
            />
            <div className="story-solution-buddy" aria-hidden="true">
              <BuddySlot form="property" action="wave" className="aspect-4/3" />
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="layers-heading" className="friendly-section wave-section story-from-mist story-white">
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
      <section aria-labelledby="product-heading" className="friendly-section wave-section story-from-white story-mint">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:py-20">
          <div>
            <h2
              id="product-heading"
              className="max-w-[24ch] font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-tight text-ink"
            >
              {productPitch.headA} {productPitch.headB}.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">{productPitch.lead}</p>
            <dl className="friendly-product-tools mt-7">
              {productPitch.items.map((item) => (
                <div key={item.title} className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]">
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
          <div className="friendly-product-portrait">
            <div className="friendly-product-guides">
              <BuddySlot form="investment" action="explain" className="aspect-4/3" />
            </div>
          </div>
        </div>
      </section>
      <section aria-label="Looking for a home" className="solution-home-help wave-section story-from-mint story-white" data-buddy-topic="support">
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
