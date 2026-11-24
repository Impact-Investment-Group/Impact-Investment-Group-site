import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, House, Users } from "lucide-react";
import { BuddySlot } from "@/components/buddy/buddy-slot";
import { impactSources, nationFigures, problemHero, problemSections } from "@/content/problem";
import { variantSrcSet } from "@/lib/responsive-image";
import "./impact-evidence.css";

const pageTitle = "Homelessness, housing and our impact | Impact Investment Group";

export const Route = createFileRoute("/the-problem")({
  component: TheProblemPage,
  head: () => ({
    meta: [
      { title: pageTitle },
      { name: "description", content: problemHero.description },
      { property: "og:title", content: pageTitle },
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
    <div className="impact-evidence" data-buddy-topic="property">
      <section className="impact-evidence-hero" aria-labelledby="problem-heading">
        <div className="impact-evidence-wrap impact-evidence-hero-grid">
          <div>
            <p className="impact-kicker">The housing challenge</p>
            <h1 id="problem-heading">{problemHero.title}</h1>
            <p className="impact-intro">{problemHero.description}</p>
            <a className="impact-action" href="#uk-impact">
              Explore the figures <ArrowDown aria-hidden="true" size={18} />
            </a>
          </div>
          <figure>
            <img
              src="/images/hero-ground-street.webp"
              srcSet={variantSrcSet("/images/hero-ground-street.webp")}
              sizes="(min-width: 1000px) 550px, (min-width: 760px) 48vw, 92vw"
              width={1600}
              height={900}
              alt=""
              loading="eager"
            />
          </figure>
        </div>
      </section>

      <section
        id="uk-impact"
        className="impact-evidence-wrap impact-spacing"
        aria-labelledby="uk-heading"
      >
        <h2 id="uk-heading">People need homes. Homes need to fit.</h2>
        <div className="impact-pair">
          <article className="impact-fact">
            <Users aria-hidden="true" />
            <strong>430,000+</strong>
            <h3>People facing homelessness across the UK</h3>
            <p>
              This UK estimate was cited at the launch of the Homewards Homelessness Data Lab in
              June 2026. The four nations record homelessness differently.
            </p>
            <a className="impact-source" href={impactSources.need}>
              LandAid’s account of the Data Lab launch
            </a>
          </article>
          <article className="impact-fact">
            <House aria-hidden="true" />
            <strong>~758,000</strong>
            <h3>Homes on the UK market</h3>
            <p>
              Chris Watkin counted homes offered for sale on 1 November 2026. A listing tells us
              little about vacancies or who could live there.
            </p>
            <a className="impact-source" href={impactSources.market}>
              UK Property Market Stats, November 2026
            </a>
          </article>
        </div>
        <p className="impact-bridge">
          One household might need a wheelchair-accessible flat. Another might need three bedrooms
          close to school. Matching a home means checking its location, condition, price and the
          support available nearby.
        </p>
      </section>

      <section id="four-nations" className="impact-figures-band" aria-labelledby="nations-heading">
        <div className="impact-evidence-wrap impact-aside-layout">
          <div>
            <p className="impact-kicker">Across the four nations</p>
            <h2 id="nations-heading">Waiting for a settled home</h2>
            <p>
              These households were living in temporary accommodation on 31 March 2026, or 1 April
              in Northern Ireland. Each nation's housing laws determine who appears in its figures.
            </p>
            <a className="impact-source" href={impactSources.definitions}>
              How the Office for National Statistics compares the figures
            </a>
          </div>
          <div>
            <table className="impact-nations-table">
              <caption className="sr-only">
                Temporary accommodation and empty homes, by UK nation
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nation</th>
                  <th scope="col">Households in temporary accommodation</th>
                  <th scope="col">Homes recorded empty in 2025</th>
                </tr>
              </thead>
              <tbody>
                {nationFigures.map((row) => (
                  <tr key={row.nation}>
                    <th scope="row">
                      <a
                        className="impact-source"
                        href={row.source}
                        aria-label={`${row.nation} temporary accommodation source`}
                      >
                        {row.nation}
                      </a>
                    </th>
                    <td>{row.households}</td>
                    <td>{row.emptyHomes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="impact-note">
              In Great Britain, councils counted homes empty for over six months. Northern Ireland
              used domestic rates records with a different definition. Owners may still be
              renovating, selling or administering an estate.
            </p>
            <a className="impact-source" href={impactSources.vacancies}>
              Government Statistical Service vacancy figures and definitions
            </a>
          </div>
        </div>
      </section>

      <section
        id="costed-plan"
        className="impact-evidence-wrap impact-spacing"
        aria-labelledby="plan-heading"
      >
        <h2 id="plan-heading">What would ending homelessness cost?</h2>
        <div className="impact-aside-layout impact-plan">
          <div>
            <strong className="impact-feature-number">~£19.3bn</strong>
            <p>
              Modelled additional cost of Crisis's plan for Great Britain, 2018 to 2041, discounted
              to 2017 prices.
            </p>
            <a className="impact-source" href={impactSources.plan}>
              Read the Crisis and PwC cost model
            </a>
          </div>
          <div>
            <h3>From a costed plan to a local home</h3>
            <p>
              Crisis asked PwC to cost a package including prevention, emergency help, rehousing and
              ongoing support. A current UK figure would also need updated costs and evidence from
              Northern Ireland.
            </p>
            <p>
              Property investors can fund purchases and building work. In the separate Everyone In
              Social Investment Pilot, public and social investment helped secure 528 properties by
              March 2025. A national investor funding share has yet to be established.
            </p>
            <a className="impact-source" href={impactSources.pilot}>
              Read the independent pilot evaluation
            </a>
            <Link to="/partner-with-investor" hash="your-impact" className="impact-action">
              Work out your contribution <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <div className="impact-history">
        <div className="impact-evidence-wrap">
          {problemSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              data-stage={section.id}
              data-buddy-topic={section.buddyTopic}
              className="impact-aside-layout impact-archive-section"
              aria-labelledby={section.id + "-heading"}
            >
              <div>
                <h2 id={section.id + "-heading"}>{section.title}</h2>
                <p>{section.lead}</p>
                <details className="impact-earlier">
                  <summary>Earlier figures</summary>
                  <p>{section.earlier.label}</p>
                  <a className="impact-source" href={section.earlier.source}>
                    Read the earlier release
                  </a>
                </details>
                {section.buddyTopic !== "support" && (
                  <BuddySlot
                    form={section.buddyTopic}
                    action="explain"
                    expression="thoughtful"
                    className="mt-4 w-32 max-w-full"
                  />
                )}
              </div>
              <dl className="impact-ledger">
                {section.rows.map((row) => (
                  <div key={row.label}>
                    <dt>
                      <a href={row.source} className="impact-source">
                        {row.label}
                      </a>
                    </dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <Link to="/solutions" className="impact-action">
            Learn how our partnerships work <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
