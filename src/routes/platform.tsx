import { BuddyCharacter } from "@/components/buddy/buddy-character";
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronDown, Heart, KeyRound, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  aiTeamNote,
  compareUpdated,
  demandFigures,
  differenceHeading,
  differenceLead,
  differenceStory,
  leaseComparison,
  servicesHero,
  steps,
  sustainabilityPrinciples,
  workflow,
  workflowFooter,
} from "@/content/services";
import { cn } from "@/lib/utils";
import "./editorial-friendly.css";
import { PlatformGuides } from "@/components/services/platform-guides";

export const Route = createFileRoute("/platform")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Our Services | Impact Investment Group" },
      {
        name: "description",
        content:
          "Explore the Impact Investment Platform for your role, from property sourcing to housing management CRM, with real screens and step-by-step guides.",
      },
      { property: "og:title", content: "Our Services | Impact Investment Group" },
      {
        property: "og:description",
        content:
          "Property sourcing, housing management and partner workflows. Choose your role to see the platform and learn the next steps.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/platform" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/platform" }],
  }),
});

function Section({
  id,
  title,
  children,
  muted = false,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("friendly-section", muted && "friendly-section-tinted")}
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
        <h2
          id={id}
          className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-tight text-ink"
        >
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function ServiceJourney() {
  const [active, setActive] = React.useState(0);
  const step = steps[active]!;
  return (
    <div className="friendly-journey">
      <ol className="friendly-journey-choices">
        {steps.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={active === index}
              aria-controls="service-journey-detail"
              onClick={() => setActive(index)}
              className="friendly-journey-choice"
            >
              <span className="friendly-step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <img src={item.image} alt="" width={360} height={360} loading="lazy" />
              <span>{item.name}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <div id="service-journey-detail" className="friendly-journey-detail">
        <div aria-live="polite" aria-atomic="true">
          <div key={step.id} className="friendly-stage-enter">
            <p className="text-sm font-semibold text-teal-600">
              Step {active + 1} of {steps.length}
            </p>
            <h3 className="mt-2 font-heading text-3xl font-semibold text-ink">{step.name}</h3>
            <p className="mt-3 max-w-[65ch] text-lg leading-relaxed text-ink-muted">{step.body}</p>
          </div>
        </div>
        <div className="friendly-stage-controls">
          <button
            type="button"
            aria-label="Previous step"
            onClick={() => setActive((active + steps.length - 1) % steps.length)}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next step"
            onClick={() => setActive((active + 1) % steps.length)}
          >
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolExplorer() {
  const [active, setActive] = React.useState(0);
  const tabs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const selected = workflow[active]!;
  const choose = (index: number) => {
    setActive(index);
    tabs.current[index]?.focus();
  };
  return (
    <>
      <div role="tablist" aria-label="Explore the platform tools" className="friendly-tool-tabs mt-8 grid grid-cols-3">
        {workflow.map((step, index) => {
          const Glyph = step.id === "property" ? KeyRound : step.id === "investment" ? PoundSterling : Heart;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              id={"tool-tab-" + step.id}
              ref={(node) => { tabs.current[index] = node; }}
              aria-selected={active === index}
              aria-controls="tool-panel"
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                const next = event.key === "ArrowRight" ? (index + 1) % workflow.length
                  : event.key === "ArrowLeft" ? (index - 1 + workflow.length) % workflow.length
                  : event.key === "Home" ? 0
                  : event.key === "End" ? workflow.length - 1 : null;
                if (next !== null) { event.preventDefault(); choose(next); }
              }}
              className={cn("friendly-tool-tab min-h-16 gap-3 px-2 py-4 text-left text-sm font-semibold sm:px-5 sm:text-base", active === index ? "text-teal-600" : "text-ink-muted hover:text-ink")}
            >
              <Glyph className="size-6 shrink-0" aria-hidden="true" />
              {step.chip}
            </button>
          );
        })}
      </div>
      <div id="tool-panel" role="tabpanel" aria-labelledby={"tool-tab-" + selected.id} tabIndex={0} className="friendly-tool-panel">
        <div className="friendly-tool-scene">
          <div className="friendly-tool-speech max-w-[64ch]" aria-live="polite" aria-atomic="true">
            <h3 className="font-heading text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight text-ink">{selected.claim}</h3>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">{selected.body}</p>
            <a href="#services-preview" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline decoration-rule underline-offset-4 hover:decoration-teal-600">
              View the platform preview <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
          <BuddyCharacter form={selected.id} action="explain" animated className="friendly-tool-guide" />
        </div>
      </div>
      <div className="friendly-tool-note mt-6 grid gap-4 text-sm leading-relaxed text-ink-muted sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <p>{workflowFooter}</p>
        <p>{aiTeamNote}</p>
      </div>
    </>
  );
}

function DifferenceStory() {
  return (
    <>
      <p className="mt-5 max-w-[72ch] text-base leading-relaxed text-ink-muted">{differenceLead}</p>
      <div className="friendly-difference mt-8">
        {differenceStory.map((chapter, index) => (
          <details
            key={chapter.id}
            open={index === differenceStory.length - 1}
            className="group friendly-chapter"
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-start gap-4 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="pt-1 font-mono text-sm text-teal-600" aria-hidden="true">
                {chapter.number}
              </span>
              <h3 className="flex-1 font-heading text-xl font-semibold text-ink">
                {chapter.title}
              </h3>
              <ChevronDown
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-teal-600 group-open:rotate-180"
              />
            </summary>
            <div className="friendly-chapter-body grid gap-5 text-base leading-relaxed text-ink-muted lg:grid-cols-2 lg:gap-12">
              <p>{chapter.body}</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-teal-600">
                {chapter.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
      <dl className="friendly-lease-comparison mt-8 grid gap-4 sm:grid-cols-2">
        {leaseComparison.map((model) => (
          <div key={model.id}>
            <dt className="text-sm font-semibold text-ink">{model.label}</dt>
            <dd className="mt-2 text-base leading-relaxed text-ink-muted">{model.strip}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-10 grid gap-6 border-t border-rule pt-6 sm:grid-cols-3">
        {sustainabilityPrinciples.map((principle) => (
          <li key={principle.id}>
            <h3 className="font-semibold text-ink">{principle.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{principle.detail}</p>
          </li>
        ))}
      </ul>
      <div className="friendly-demand-strip mt-10">
        <dl className="grid gap-6 sm:grid-cols-3">
          {demandFigures.map((figure) => (
            <div key={figure.id}>
              <dt className="text-sm leading-relaxed text-ink-muted">{figure.label}</dt>
              <dd className="mt-2 font-heading text-2xl font-bold text-teal-600">{figure.value}</dd>
              <dd className="mt-2 text-xs leading-relaxed text-ink-muted">{figure.source}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-ink-muted">{compareUpdated}</p>
      </div>
    </>
  );
}

function ServicesPage() {
  return (
    <div className="friendly-editorial friendly-services">
      <section aria-labelledby="services-heading" className="page-intro friendly-hero">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-teal-600">{servicesHero.eyebrow}</p>
              <h1
                id="services-heading"
                className="mt-4 max-w-[15ch] font-heading text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] text-ink"
              >
                See how the platform works for you.
              </h1>
              <BuddyCharacter form="property" action="wave" className="mt-6 w-48 sm:w-56" />
            </div>
            <div className="lg:pt-8">
              <p className="text-xl font-medium leading-relaxed text-ink">
                From finding a property to looking after a home.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                Choose your role to explore the tools you can use, see the real screens and follow a
                simple walkthrough. Housing teams can also explore our housing management customer
                relationship management (CRM) system.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" asChild>
                  <a href="#platform-guides">Find your role</a>
                </Button>
                <Button variant="secondary" asChild withArrow={false}>
                  <Link to="/contact">Talk to our team</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                Explore the walkthroughs here, or talk to us about access for your organisation.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div id="services-preview">
        <PlatformGuides />
      </div>
      <Section id="steps-heading" title="From search to supported home">
        <ServiceJourney />
      </Section>
      <section className="friendly-section friendly-section-tinted">
        <details className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8" data-services-more>
          <summary
            id="services-more-heading"
            className="cursor-pointer font-heading text-2xl font-semibold text-ink"
          >
            More about property sourcing and supported housing
          </summary>
          <h2 id="tools-heading" className="mt-10 font-heading text-2xl font-bold text-ink">
            Explore the platform tools
          </h2>
          <ToolExplorer />
          <h2 id="compare-heading" className="mt-12 font-heading text-2xl font-bold text-ink">
            {differenceHeading}
          </h2>
          <DifferenceStory />
        </details>
      </section>
    </div>
  );
}
