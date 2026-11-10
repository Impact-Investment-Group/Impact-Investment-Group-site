import { BuddyCharacter } from "@/components/buddy/buddy-character";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { problemHero, problemSections } from "@/content/problem";
import { variantSrcSet } from "@/lib/responsive-image";
import "./editorial-friendly.css";

export const Route = createFileRoute("/the-problem")({
  component: TheProblemPage,
  head: () => ({
    meta: [
      { title: "The Problem — Impact Investment Group" },
      { name: "description", content: problemHero.description },
      { property: "og:title", content: "The Problem — Impact Investment Group" },
      { property: "og:description", content: problemHero.description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/the-problem" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/the-problem" }],
  }),
});

function TheProblemPage() {
  return (
    <div className="friendly-editorial friendly-problem">
      <section className="page-intro friendly-hero" aria-labelledby="problem-heading">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <div>
            <h1
              id="problem-heading"
              className="font-heading text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight text-ink"
            >
              {problemHero.title}
            </h1>
            <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-ink-muted">
              {problemHero.description}
            </p>
            <a href="#scale-heading" className="friendly-explore-link">
              See how it works <ArrowRight aria-hidden="true" className="size-5" />
            </a>
          </div>
          <div className="friendly-problem-photo">
            <img
              src="/images/hero-ground-street.webp"
              srcSet={variantSrcSet("/images/hero-ground-street.webp")}
              sizes="(min-width: 1024px) 540px, calc(100vw - 40px)"
              alt=""
              aria-hidden="true"
              width={1600}
              height={900}
              loading="eager"
            />
          </div>
        </div>
      </section>
      <div className="friendly-evidence-sections mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        {problemSections.map((section, index) => {
          return (
            <section
              key={section.id}
              aria-labelledby={section.id + "-heading"}
              className="friendly-evidence-stage"
              data-stage={section.id}
            >
              <div className="friendly-evidence-intro">
                <span className="friendly-evidence-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <h2
                  id={section.id + "-heading"}
                  className="font-heading text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight text-ink"
                >
                  {section.eyebrow}
                </h2>
                <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-ink-muted">
                  {section.id === "scale"
                    ? "English local-authority housing registers are at their highest level since 2014."
                    : section.lead}
                </p>
                {section.character && section.id !== "cost" ? (
                  <BuddyCharacter
                    form={section.id === "scale" ? "property" : "support"}
                    className="friendly-evidence-guide"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <table className="friendly-evidence-table w-full text-left">
                  <caption className="sr-only">{section.eyebrow}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="pb-3 pr-6 text-xs font-semibold text-ink-muted">
                        Published measure
                      </th>
                      <th
                        scope="col"
                        className="pb-3 text-right text-xs font-semibold text-ink-muted"
                      >
                        Figure
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row) => (
                      <tr key={row.label}>
                        <th
                          scope="row"
                          className="text-[15px] font-normal leading-relaxed text-ink-muted"
                        >
                          {row.label}
                        </th>
                        <td className="text-right align-middle font-heading font-semibold tabular-nums text-teal-600">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {section.source ? (
                  <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-ink-muted">
                    {section.source}
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
        <div className="py-8">
          <Link
            to="/solutions"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline decoration-rule underline-offset-4 hover:decoration-teal-600"
          >
            See the solution <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
