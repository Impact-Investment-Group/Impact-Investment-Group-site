import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { registerRoute } from "@/content/site";
import {
  aiTeamNote,
  compareUpdated,
  demandFigures,
  differenceHeading,
  differenceLead,
  differenceStory,
  leaseComparison,
  servicesClose,
  servicesHero,
  steps,
  sustainabilityPrinciples,
  workflow,
  workflowFooter,
} from "@/content/services";
import { intrinsic, variantSrcSet } from "@/lib/responsive-image";
import { cn } from "@/lib/utils";
import "./editorial-friendly.css";

export const Route = createFileRoute("/platform")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Our Services — Impact Investment Group" },
      {
        name: "description",
        content:
          "Find it, price it, match it. We source UK residential property, price every home against named public data, and follow it into managed supported housing.",
      },
      { property: "og:title", content: "Our Services — Impact Investment Group" },
      {
        property: "og:description",
        content:
          "The Property Finder, the Demand Map and an AI team that finds, prices and matches every home — one workflow, every figure sourced.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/platform" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/platform" }],
  }),
});

function ProductCapture() {
  /* ⚠ ONE ID, SET BY HAND, AND BOTH THINGS THAT NEED A NAME POINT AT IT.
     Radix names a dialog by wiring `aria-labelledby` to the id it generates
     for its own `Title`. Overriding that id with a literal broke the wiring
     and axe returned `aria-dialog-name`, serious, on the open state: the
     title was there and nothing pointed at it. `useId` gives one stable id
     that the content and the title agree on. */
  const titleId = React.useId();
  const capture = (
    <img
      src={servicesHero.image.src}
      loading="lazy"
      alt={servicesHero.image.alt}
      width={2241}
      height={1207}
      className="w-full"
      srcSet={variantSrcSet(servicesHero.image.src)}
      sizes="(min-width: 1200px) 1136px, calc(100vw - 40px)"
    />
  );

  return (
    <figure className="friendly-capture panel overflow-hidden">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="View larger platform preview"
            className="group relative block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600"
          >
            {capture}
            <span className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-rule bg-page px-4 text-sm font-semibold text-ink shadow-[var(--shadow-card)] transition-colors group-hover:bg-secondary">
              View larger <span aria-hidden="true">↗</span>
            </span>
          </button>
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-labelledby={titleId}
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-page sm:inset-6 sm:rounded-2xl sm:border sm:border-rule"
          >
            <DialogTitle id={titleId} className="sr-only">
              {servicesHero.image.caption}
            </DialogTitle>
            {/* ⚠ A SCROLL CONTAINER NEEDS A TAB STOP, which is what axe
                  returns as `scrollable-region-focusable`, serious, and what
                  the first cut of this dialog shipped. `tabIndex` is the stop.

                  ⚠ AND NO NAME OF ITS OWN (wave 490b). It used to point
                  `aria-labelledby` at the dialog's title, so a screen reader
                  entering the dialog heard the caption once as the dialog's
                  name and again as this group's. The dialog already carries
                  the name; the group inside it is only the thing that
                  scrolls.

                  `touch-action` names the two gestures the box is for: drag it
                  sideways, or pinch it. Without it a drag inside a fixed layer
                  is ambiguous and the browser picks.

                  The width comes from the variants manifest rather than from
                  the two numbers on the figure above, which say 2241 by 1207
                  where the file on disk is 1600 by 862. Opening the capture at
                  a width it does not have would upscale it, which is the one
                  thing this dialog exists to avoid. */}
            <div
              tabIndex={0}
              role="group"
              className="flex-1 overflow-auto [touch-action:pan-x_pan-y_pinch-zoom] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600"
            >
              <img
                src={servicesHero.image.src}
                alt=""
                aria-hidden="true"
                width={intrinsic(servicesHero.image.src)?.width}
                height={intrinsic(servicesHero.image.src)?.height}
                className="h-auto max-w-none"
              />
            </div>
            {/* The one new string this wave authors, and it is the
                  accessible name of an icon-only control, which is the only
                  place the canon allows one. `aria-label` rather than an
                  `sr-only` span so it is an attribute rather than a rendered
                  run of text. */}
            <DialogClose
              aria-label="Close"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-full border border-rule bg-page text-ink shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.6} />
            </DialogClose>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      <figcaption className="px-4 py-2.5 text-center text-[12px] max-lg:text-[13px] text-ink-muted">
        {servicesHero.image.caption}
      </figcaption>
    </figure>
  );
}

const GUIDE_ART = {
  petra: "/images/ai-team/petra-point.webp",
  peter: "/images/ai-team/peter-present.webp",
  pippa: "/images/ai-team/pippa-present.webp",
} as const;

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
  const choose = (index: number) => {
    setActive(index);
    tabs.current[index]?.focus();
  };
  return (
    <>
      <div
        role="tablist"
        aria-label="Explore the platform tools"
        className="friendly-tool-tabs mt-8 grid grid-cols-3"
      >
        {workflow.map((step, index) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            id={"tool-tab-" + step.id}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            aria-selected={active === index}
            aria-controls={"tool-panel-" + step.id}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % workflow.length
                  : event.key === "ArrowLeft"
                    ? (index - 1 + workflow.length) % workflow.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? workflow.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                choose(next);
              }
            }}
            className={cn(
              "friendly-tool-tab min-h-16 px-2 py-4 text-left text-sm font-semibold sm:px-5 sm:text-base",
              active === index ? "text-teal-600" : "text-ink-muted hover:text-ink",
            )}
          >
            <img
              src={step.portrait}
              alt=""
              aria-hidden="true"
              width={120}
              height={120}
              loading="lazy"
              className="friendly-tool-avatar"
            />
            {step.chip}
          </button>
        ))}
      </div>
      {workflow.map((step, index) => (
        <div
          key={step.id}
          id={"tool-panel-" + step.id}
          role="tabpanel"
          aria-labelledby={"tool-tab-" + step.id}
          hidden={active !== index}
          tabIndex={0}
          className="friendly-tool-panel"
        >
          <div className="friendly-tool-scene">
            <div className="friendly-tool-speech max-w-[64ch]">
              <h3 className="font-heading text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight text-ink">
                {step.claim}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-ink-muted">{step.body}</p>
              <a
                href="#services-preview"
                className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline decoration-rule underline-offset-4 hover:decoration-teal-600"
              >
                View the platform preview <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>
            <img
              src={GUIDE_ART[step.id as keyof typeof GUIDE_ART]}
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={347}
              height={560}
              className="friendly-tool-guide"
            />
          </div>
        </div>
      ))}
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
                {servicesHero.title}
              </h1>
              <div className="friendly-hero-guides" aria-hidden="true">
                {workflow.map((guide) => (
                  <img
                    key={guide.id}
                    src={GUIDE_ART[guide.id as keyof typeof GUIDE_ART]}
                    alt=""
                    width={180}
                    height={290}
                  />
                ))}
              </div>
            </div>
            <div className="lg:pt-8">
              <p className="text-xl font-medium leading-relaxed text-ink">{servicesHero.lead}</p>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {servicesHero.summary
                  .map((part) => (typeof part === "string" ? part : part.t))
                  .join("")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" asChild>
                  <Link to={registerRoute.to}>{registerRoute.label}</Link>
                </Button>
                <Button variant="secondary" asChild withArrow={false}>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-ink-muted">{servicesClose.ctaNote}</p>
            </div>
          </div>
          <div id="services-preview" className="mt-10 scroll-mt-40">
            <ProductCapture />
          </div>
        </div>
      </section>
      <Section id="steps-heading" title="From search to supported home">
        <ServiceJourney />
      </Section>
      <Section id="tools-heading" title="Explore the platform tools" muted>
        <ToolExplorer />
      </Section>
      <Section id="compare-heading" title={differenceHeading}>
        <DifferenceStory />
      </Section>
    </div>
  );
}
