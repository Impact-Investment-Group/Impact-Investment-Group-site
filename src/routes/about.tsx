import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ShieldAlert } from "lucide-react";
import { DirectorCard } from "@/components/about/director-card";
import { CharityImpact } from "@/components/charity/charity-impact";
import {
  accountableChain,
  chainNotice,
  chainNoticeEmphasis,
  leadershipCapability,
  problemFigures,
  problemHeading,
  summaries,
  team,
  teamTitle,
  whatWeDo,
  whoWeAre,
  whyWeExist,
  type Seg,
} from "@/content/about";
import { variantSrcSet } from "@/lib/responsive-image";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Us — Impact Investment Group" },
      {
        name: "description",
        content:
          "Meet the team connecting investors, landlords and developers with councils, housing associations and care and support organisations across the UK.",
      },
      { property: "og:title", content: "About Us — Impact Investment Group" },
      {
        property: "og:description",
        content:
          "Meet our team, understand why we exist and see how our housing, investment, care and support network works.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function Emphasise({ text, terms }: { text: string; terms: string[] }) {
  const pattern = terms
    .filter((t) => text.includes(t))
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!pattern) return <>{text}</>;
  return (
    <>
      {text.split(new RegExp(`(${pattern})`, "g")).map((chunk, i) =>
        terms.includes(chunk) ? (
          <strong key={i} className="font-semibold text-ink">
            {chunk}
          </strong>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </>
  );
}

const CAST = [
  "/images/ai-team/petra-point.webp",
  "/images/ai-team/peter-present.webp",
  "/images/ai-team/pippa-present.webp",
] as const;

function Summary({ lines }: { lines: Seg[][] }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink-muted">
      {lines.map((parts, index) => (
        <p key={index}>
          {parts.map((part) => (typeof part === "string" ? part : part.t)).join("")}
        </p>
      ))}
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <section aria-labelledby="about-heading" className="page-intro">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <h1
              id="about-heading"
              className="font-heading text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight text-ink"
            >
              {whoWeAre.title}
            </h1>
            <Summary lines={summaries.whoWeAre!} />
          </div>
          <h2 className="mt-12 font-heading text-2xl font-semibold text-ink">{teamTitle}</h2>
          <ul
            aria-label="Leadership team"
            className="mt-6 grid gap-x-7 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {team.map((member) => (
              <li key={member.name}>
                <DirectorCard director={member} variant="vertical" />
              </li>
            ))}
          </ul>
          <aside
            aria-labelledby="leadership-capability-heading"
            className="mt-12 grid gap-8 border-t border-rule pt-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16"
          >
            <div>
              <h2
                id="leadership-capability-heading"
                className="font-heading text-2xl font-semibold text-ink"
              >
                {leadershipCapability.title}
              </h2>
              <p className="mt-4 max-w-[27ch] text-sm leading-relaxed text-ink-muted">
                <strong className="mr-1 font-heading text-2xl font-semibold text-teal-600">
                  {leadershipCapability.experience}
                </strong>
                {leadershipCapability.experienceLabel}
              </p>
              <img
                src="/images/ai-team/collective-capability-team.png"
                alt=""
                aria-hidden="true"
                width={935}
                height={559}
                loading="lazy"
                className="mt-5 hidden w-40 object-contain lg:block"
                srcSet={variantSrcSet("/images/ai-team/collective-capability-team.png")}
                sizes="160px"
              />
            </div>
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {leadershipCapability.impacts.map((impact) => (
                <div key={impact.title}>
                  <dt className="font-semibold text-ink">{impact.title}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{impact.body}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>
      <section aria-labelledby="why-heading" className="border-t border-rule bg-page-alt">
        <div className="mx-auto grid w-full max-w-[1200px] gap-9 px-5 py-14 sm:px-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-14 lg:py-20">
          <div>
            <h2
              id="why-heading"
              className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-ink"
            >
              {whyWeExist.title}
            </h2>
            <div className="mt-5">
              <Summary lines={summaries.whyWeExist!} />
            </div>
            <img
              src="/images/why-estate-aerial.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={1600}
              height={900}
              className="mt-7 aspect-[16/10] w-full rounded-md object-cover"
              srcSet={variantSrcSet("/images/why-estate-aerial.webp")}
              sizes="(min-width: 1024px) 320px, calc(100vw - 40px)"
            />
            <Link
              to="/the-problem"
              className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline decoration-rule underline-offset-4 hover:decoration-teal-600"
            >
              See the full evidence
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div>
            <h3 className="max-w-[40ch] font-heading text-xl font-semibold leading-relaxed text-ink">
              {problemHeading}
            </h3>
            <dl className="mt-5 border-t border-rule">
              {problemFigures.map((figure) => (
                <div key={figure.id} className="border-b border-rule py-5">
                  <dt className="text-base leading-relaxed text-ink">{figure.label}</dt>
                  <dd className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <strong className="font-heading text-2xl font-semibold tabular-nums text-teal-600">
                      {figure.value}
                    </strong>
                    <span className="text-xs text-ink-muted">{figure.kind}</span>
                  </dd>
                  <dd className="mt-2">
                    <a
                      href={figure.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-11 items-start gap-2 py-2 text-sm leading-relaxed text-teal-600 underline decoration-rule underline-offset-4 hover:decoration-teal-600"
                    >
                      <span>Source: {figure.source}</span>
                      <ArrowUpRight aria-hidden="true" className="mt-1 size-3.5 shrink-0" />
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <CharityImpact />
      <section aria-labelledby="what-heading" className="border-t border-rule">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
          <h2
            id="what-heading"
            className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-ink"
          >
            {whatWeDo.title}
          </h2>
          <ol className="mt-8 border-t border-rule">
            {accountableChain.map((step, index) => (
              <li
                key={step.id}
                className="grid items-center gap-4 border-b border-rule py-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_64px] sm:gap-8"
              >
                <h3 className="max-w-[22ch] font-heading text-xl font-semibold text-ink">
                  {step.name}
                </h3>
                <div>
                  <p className="text-base font-medium text-ink">{step.claim}</p>
                  <p className="mt-2 max-w-[55ch] text-base leading-relaxed text-ink-muted">
                    {step.detail}
                  </p>
                </div>
                <img
                  src={CAST[index]}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  width={281}
                  height={560}
                  className="hidden h-28 w-full object-contain sm:block"
                />
              </li>
            ))}
          </ol>
          <div className="mt-8 flex items-start gap-3 border-l-2 border-rule pl-4">
            <ShieldAlert aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink-muted" />
            <p className="max-w-[100ch] text-sm leading-relaxed text-ink-muted">
              <Emphasise text={chainNotice} terms={chainNoticeEmphasis} />
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
