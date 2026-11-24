import { Link } from "@tanstack/react-router";
import { ArrowRight, HandHeart, House, KeyRound } from "lucide-react";
import { impactSources } from "@/content/problem";

const pathways = [
  {
    icon: House,
    title: "Our vision is a safe home for everyone.",
    body: "People need somewhere they can put down roots. Our aim is for a suitable home and local support to come together when someone needs them.",
    link: "Learn about our vision",
    to: "/about",
    hash: "our-vision",
  },
  {
    icon: KeyRound,
    title: "We deliver homes through partnerships.",
    body: "A local partner identifies the need. We source a property and connect the people who can fund it, lease it and support the people moving in.",
    link: "Learn how we deliver housing",
    to: "/platform",
    hash: "steps-heading",
  },
  {
    icon: HandHeart,
    title: "Together we can make an impact.",
    body: "A landlord can offer a property. An investor can fund the work it needs. A local support team can help someone settle in and make it their home.",
    link: "Learn about our impact",
    to: "/the-problem",
    hash: "uk-impact",
  },
] as const;

export function HomePathways() {
  return (
    <section className="home-pathways" aria-label="Our vision, delivery and impact">
      <div className="home-content-width home-pathways__grid">
        {pathways.map(({ icon: Icon, title, body, link, to, hash }) => (
          <article key={title}>
            <span className="home-pathways__icon" aria-hidden="true">
              <Icon size={28} strokeWidth={1.7} />
            </span>
            <h2>{title}</h2>
            <p>{body}</p>
            <Link className="home-story-link" to={to} hash={hash}>
              {link} <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HomeHousingEvidence() {
  return (
    <section aria-labelledby="home-evidence-heading" className="home-evidence">
      <div className="home-content-width">
        <h2 id="home-evidence-heading">What would it take to end homelessness?</h2>
        <dl className="home-evidence__numbers">
          <div>
            <dt>People facing homelessness in the UK</dt>
            <dd>430,000+</dd>
            <dd>
              Estimate cited at the <a href={impactSources.need}>Homelessness Data Lab launch</a>, June 2026
            </dd>
          </div>
          <div>
            <dt>Homes offered for sale in the UK</dt>
            <dd>~758,000</dd>
            <dd>
              <a href={impactSources.market}>UK Property Market Stats</a>, 1 November 2026
            </dd>
          </div>
          <div>
            <dt>Estimated cost of Crisis’s Great Britain plan</dt>
            <dd>~£19.3bn</dd>
            <dd>
              <a href={impactSources.plan}>PwC for Crisis</a>, 2018 to 2041, at 2017 prices
            </dd>
          </div>
        </dl>
        <p className="home-evidence__context">
          In England,{" "}
          <a href={impactSources.vacancies}>303,185 homes had been empty for over six months</a> on
          6 October 2025. For an investor to bring one back into use, the owner must be willing to
          sell and the home must suit the people and support services in that area.
        </p>
        <div className="home-evidence__links">
          <Link className="home-story-link" to="/the-problem" hash="uk-impact">
            Explore the housing evidence <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link className="home-story-link" to="/partner-with-investor" hash="your-impact">
            See what investors could contribute <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
