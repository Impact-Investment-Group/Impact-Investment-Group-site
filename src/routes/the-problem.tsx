import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { problemHero, problemSections } from "@/content/problem";
import { variantSrcSet } from "@/lib/responsive-image";

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

const PORTRAIT: Record<string, { src: string; w: number; h: number }> = {
  "petra-point": { src: "/images/ai-team/petra-point.webp", w: 338, h: 560 },
  "peter-present": { src: "/images/ai-team/peter-present.webp", w: 281, h: 560 },
  "pippa-point": { src: "/images/ai-team/pippa-point.webp", w: 345, h: 560 },
};

function TheProblemPage() {
  return (
    <div>
      <section className="page-intro" aria-labelledby="problem-heading">
        <div className="mx-auto grid w-full max-w-[1200px] gap-7 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-20">
          <h1
            id="problem-heading"
            className="font-heading text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight text-ink"
          >
            {problemHero.title}
          </h1>
          <p className="max-w-[65ch] text-lg leading-relaxed text-ink-muted lg:pt-2">
            {problemHero.description}
          </p>
        </div>
      </section>
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        {problemSections.map((section) => {
          const portrait = section.character ? PORTRAIT[section.character] : undefined;
          return (
            <section
              key={section.id}
              aria-labelledby={section.id + "-heading"}
              className="grid gap-7 border-t border-rule py-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16 lg:py-16"
            >
              <div>
                <h2
                  id={section.id + "-heading"}
                  className="font-heading text-2xl font-semibold text-ink"
                >
                  {section.eyebrow}
                </h2>
                <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-ink-muted">
                  {section.id === "scale"
                    ? "English local-authority housing registers are at their highest level since 2014."
                    : section.lead}
                </p>
                {portrait ? (
                  <img
                    src={portrait.src}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={portrait.w}
                    height={portrait.h}
                    className="mt-6 hidden h-28 w-auto object-contain lg:block"
                    srcSet={variantSrcSet(portrait.src)}
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">{section.eyebrow}</caption>
                  <thead>
                    <tr className="border-b border-rule">
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
                      <tr key={row.label} className="border-b border-rule">
                        <th
                          scope="row"
                          className="py-5 pr-5 text-[15px] font-normal leading-relaxed text-ink-muted"
                        >
                          {row.label}
                        </th>
                        <td className="py-5 text-right align-top font-heading text-xl font-semibold tabular-nums text-teal-600">
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
        <div className="border-t border-rule py-8">
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
