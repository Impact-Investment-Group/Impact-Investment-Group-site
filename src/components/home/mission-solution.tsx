import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  challengeCopy,
  impactProof,
  purposeCopy,
  purposeStats,
  purposeStatsNote,
  solutionCopy,
} from "@/content/home";
import { variantSrcSet } from "@/lib/responsive-image";
import { cn } from "@/lib/utils";

const views = [
  { id: "need", label: "The housing need" },
  { id: "response", label: "Our response" },
];
const shown = ["waiting-lists", "temporary-accommodation", "asset-requirement"];

/** Evidence and response share visible, keyboard-operable navigation. */
export function MissionSolution() {
  const [active, setActive] = React.useState(0);
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const hero = purposeStats.find((stat) => stat.id === "children-ta")!;
  const stats = shown.map((id) => purposeStats.find((stat) => stat.id === id)!);
  function onTabKey(event: React.KeyboardEvent, index: number) {
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? views.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % views.length
            : event.key === "ArrowLeft"
              ? (index + views.length - 1) % views.length
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }
  return (
    <section aria-labelledby="mission-heading" className="mission-editorial mission-friendly">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-teal-600">{purposeCopy.eyebrow}</p>
            <h2
              id="mission-heading"
              className="mt-3 max-w-[25ch] font-heading text-[clamp(1.9rem,3.5vw,3rem)] font-bold leading-[1.08] tracking-[-0.025em] text-ink"
            >
              {purposeCopy.title.split(purposeCopy.emphasis)[0]}
              <span className="text-orange-700">{purposeCopy.emphasis}</span>
              {purposeCopy.title.split(purposeCopy.emphasis)[1]}
            </h2>
          </div>
          <div className="max-w-[45ch] text-xl leading-relaxed text-ink lg:pt-8">
            {purposeCopy.closing.map((line) => (
              <p key={line} className="mt-3 font-medium">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div role="tablist" aria-label="Our mission" className="mission-friendly-tabs mt-9">
          {views.map((view, index) => (
            <button
              key={view.id}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`mission-tab-${view.id}`}
              aria-controls={`mission-panel-${view.id}`}
              aria-selected={active === index}
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onTabKey(event, index)}
              className={cn(
                "min-h-12 border-b-2 px-1 pb-3 pt-2 text-sm font-semibold transition-colors hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 sm:text-base",
                active === index
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-ink-muted",
              )}
            >
              {view.label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id="mission-panel-need"
          aria-labelledby="mission-tab-need"
          hidden={active !== 0}
          tabIndex={0}
          className="mission-panel pt-8 focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          <div className="mission-friendly-columns grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
            <div>
              <h3 className="font-heading text-2xl font-bold leading-tight text-ink">
                {challengeCopy.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {challengeCopy.points.slice(0, 3).map((point) => (
                  <li
                    key={point.text}
                    className="flex gap-3 text-base leading-relaxed text-ink-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-3 size-1.5 shrink-0 rounded-full bg-orange-600"
                    />
                    {point.text}
                  </li>
                ))}
              </ul>
              <Link
                to="/the-problem"
                className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline-offset-4 hover:underline"
              >
                See the full picture <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <img
                src="/images/why-estate-aerial.webp"
                srcSet={variantSrcSet("/images/why-estate-aerial.webp")}
                sizes="(min-width: 1024px) 45vw, 90vw"
                width={1600}
                height={640}
                alt="An aerial view of homes and gardens in a UK neighbourhood"
                loading="lazy"
                className="mt-6 aspect-[5/2] w-full rounded-3xl object-cover"
              />
            </div>
            <div>
              <dl className="mission-friendly-evidence">
                <div className="border-b border-rule pb-6">
                  <dt className="text-sm font-medium text-ink">{hero.label}</dt>
                  <dd className="mt-2 font-heading text-[clamp(3.4rem,6vw,5rem)] font-bold leading-none tracking-[-0.04em] text-orange-700">
                    {hero.value}
                  </dd>
                  <dd className="mt-3 text-sm leading-relaxed text-ink-muted">{hero.basis}</dd>
                </div>
                {stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="grid grid-cols-[minmax(100px,.75fr)_1fr] gap-x-4 border-b border-rule py-4"
                  >
                    <dt className="col-start-2 text-sm font-medium leading-relaxed text-ink">
                      {stat.label}
                    </dt>
                    <dd className="col-start-1 row-start-1 font-heading text-2xl font-bold leading-tight text-ink">
                      {stat.value}
                    </dd>
                    <dd className="col-start-2 mt-1 text-xs leading-relaxed text-ink-muted">
                      {stat.basis}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 max-w-[55ch] text-xs leading-relaxed text-ink-muted">
                {purposeStatsNote}
              </p>
            </div>
          </div>
        </div>
        <div
          role="tabpanel"
          id="mission-panel-response"
          aria-labelledby="mission-tab-response"
          hidden={active !== 1}
          tabIndex={0}
          className="mission-panel pt-8 focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          <div className="mission-friendly-columns grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
            <div>
              <h3 className="font-heading text-2xl font-bold leading-tight text-ink">
                {solutionCopy.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">{solutionCopy.lead}</p>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {solutionCopy.assertion}
              </p>
              <Link
                to="/solutions"
                className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline-offset-4 hover:underline"
              >
                Read how it works <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <div className="mt-6 border-l-2 border-teal-600 pl-5">
                <p className="text-sm font-semibold text-ink">{impactProof.eyebrow}</p>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-ink">
                  <strong className="font-heading text-3xl">
                    {impactProof.multiplier.from.figure}
                  </strong>{" "}
                  {impactProof.multiplier.from.label}
                  <ArrowRight aria-hidden="true" className="mx-1 size-4 self-center" />
                  <strong className="font-heading text-3xl">
                    {impactProof.multiplier.to.figure}
                  </strong>{" "}
                  {impactProof.multiplier.to.label}
                </p>
                <p className="mt-3 max-w-[50ch] text-sm leading-relaxed text-ink-muted">
                  {impactProof.multiplier.disclaimer}
                </p>
              </div>
            </div>
            <ol className="mission-friendly-stages">
              {solutionCopy.stages.map((stage) => (
                <li
                  key={stage.id}
                  className="grid grid-cols-[2rem_1fr] gap-4 border-b border-rule py-5"
                >
                  <span className="pt-1 font-mono text-sm text-teal-600">{stage.number}</span>
                  <div>
                    <h4 className="font-heading text-xl font-bold text-ink">{stage.name}</h4>
                    <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-muted">
                      {stage.points.map((point) => (
                        <li key={point.text}>{point.text}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
              <li className="flex items-center justify-between gap-4 pt-4">
                <Link
                  to="/partners"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-600 underline-offset-4 hover:underline"
                >
                  Explore the partner ecosystem <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <img
                  src="/images/ai-team/trio-wave.webp"
                  srcSet={variantSrcSet("/images/ai-team/trio-wave.webp")}
                  sizes="240px"
                  width={934}
                  height={558}
                  alt=""
                  loading="lazy"
                  className="w-44 shrink-0 sm:w-56"
                />
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
