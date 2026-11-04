import { useState } from "react";
import { ArrowRight, ArrowUpRight, Apple, BookOpen, Heart, HeartHandshake } from "lucide-react";
import { charity, charityPledge } from "@/content/charity";
import "./charity-impact.css";

const icons = [Apple, HeartHandshake, BookOpen];

function CharityLogo() {
  return (
    <img
      src="/images/charity/metro-world-child-80.png"
      srcSet="/images/charity/metro-world-child-80.png 1x, /images/charity/metro-world-child-160.png 2x"
      width={80}
      height={80}
      loading="lazy"
      alt={charity.name}
    />
  );
}

export function CharityImpact() {
  const [active, setActive] = useState(0);
  const work = charity.work[active];

  return (
    <section
      id="charity-impact"
      className="charity-impact"
      aria-labelledby="charity-impact-heading"
    >
      <div className="charity-impact__inner">
        <div className="charity-impact__commitment">
          <div className="charity-impact__marks">
            <HeartHandshake size={38} strokeWidth={1.5} aria-hidden="true" />
            <CharityLogo />
          </div>
          <p className="charity-impact__number">
            10<span>%</span>
          </p>
          <p className="charity-impact__number-label">of our profits</p>
          <div className="charity-impact__shares" aria-hidden="true">
            <span className="charity-impact__share-given">
              <Heart size={19} fill="currentColor" />
            </span>
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <p className="charity-impact__recipient">Supporting {charity.name} UK</p>
        </div>

        <div className="charity-impact__story">
          <p className="charity-impact__eyebrow">{charity.eyebrow}</p>
          <h2 id="charity-impact-heading">{charity.heading}</h2>
          <p className="charity-impact__pledge">{charityPledge}</p>
          <p className="charity-impact__introduction">{charity.introduction}</p>

          <div className="charity-impact__work">
            <h3>How Metro World Child helps</h3>
            <div
              className="charity-impact__choices"
              role="group"
              aria-label="How Metro World Child helps"
            >
              {charity.work.map((item, index) => {
                const Icon = icons[index];
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active === index}
                    aria-controls="charity-work-detail"
                    onClick={() => setActive(index)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div
              id="charity-work-detail"
              className="charity-impact__detail"
              role="region"
              aria-labelledby="charity-work-title"
              aria-live="polite"
            >
              <h4 id="charity-work-title">{work.title}</h4>
              <p>{work.body}</p>
              <a href={work.source} target="_blank" rel="noopener noreferrer">
                Explore this work
                <ArrowUpRight size={15} aria-hidden="true" />
                <span className="sr-only">
                  {" "}
                  on Metro World Child's website (opens in a new tab)
                </span>
              </a>
            </div>
          </div>
          <a
            className="charity-impact__action"
            href={charity.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {charity.action}
            <ArrowUpRight size={18} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export function CharityFooter() {
  return (
    <div className="charity-footer" data-charity-footer>
      <CharityLogo />
      <div>
        <p>{charityPledge}</p>
        <a href="/about#charity-impact">
          {charity.footerAction}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
