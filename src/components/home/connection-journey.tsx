import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Landmark,
  Network,
  HeartHandshake,
  RotateCcw,
} from "lucide-react";
import { partnerProfiles } from "@/content/partners";
import { purposeCopy, solutionCopy } from "@/content/home";
import { variantSrcSet } from "@/lib/responsive-image";

const stages = [
  {
    id: "need",
    label: "Housing need",
    Icon: Landmark,
    role: "local-authority",
    photo: "/images/human-insight.jpg",
    alt: "A woman looking thoughtfully out of a window in natural daylight",
    title: solutionCopy.stages[0]!.name,
    points: [solutionCopy.stages[0]!.points[0]!.text],
    people: ["Local authorities", "Housing associations"],
  },
  {
    id: "property",
    label: "Property",
    Icon: Home,
    role: "landlord",
    photo: "/images/hero-homes.webp",
    alt: "A relaxed key handover outside a brick terraced home",
    title: solutionCopy.stages[0]!.points[1]!.text,
    points: [solutionCopy.stages[1]!.points[2]!.text],
    people: ["Property owners", "Developers", "Investors"],
  },
  {
    id: "partners",
    label: "Partners",
    Icon: Network,
    role: "broker",
    photo: "/images/human-meeting.jpg",
    alt: "Colleagues talking around a laptop",
    title: solutionCopy.stages[1]!.name,
    points: [solutionCopy.stages[1]!.points[0]!.text, solutionCopy.stages[1]!.points[1]!.text],
    people: ["Housing associations", "Care & support providers"],
  },
  {
    id: "home",
    label: "A supported home",
    Icon: HeartHandshake,
    role: "resident",
    photo: "/images/hero-support.webp",
    alt: "A carer and an older woman sharing a moment at home",
    title: "Transforming Lives",
    points: purposeCopy.closing,
    people: ["Residents", "Care & support providers"],
  },
] as const;

/** An explanation of the model, with no simulated property matches or outcomes. */
export function ConnectionJourney() {
  const [active, setActive] = React.useState(0);
  const [replay, setReplay] = React.useState(0);
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const stage = stages[active] ?? stages[0];
  const profile = partnerProfiles.find((item) => item.id === stage.role)!;
  function select(index: number, focus = false) {
    setActive(index);
    if (focus) tabs.current[index]?.focus();
  }
  return (
    <section className="connection-section" aria-labelledby="connection-heading">
      <div className="connection-intro">
        <p className="eyebrow text-teal-600">How the connection works</p>
        <h2 id="connection-heading" tabIndex={-1}>
          From housing need to a place to call home
        </h2>
      </div>
      <div className="connection-board" data-stage={stage.id}>
        <div className="connection-brand">
          <img
            src="/images/brand/logo-lockup.webp"
            alt="Impact Investment Group"
            width={2006}
            height={310}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="connection-route" aria-hidden="true">
          <svg key={stage.id} viewBox="0 0 1000 70" preserveAspectRatio="none">
            <path d="M 500 0 V 25 Q 500 45 480 45 H 125 M 500 25 Q 500 45 520 45 H 875 M125 45 V70 M375 45 V70 M625 45 V70 M875 45 V70" />
          </svg>
        </div>
        <div role="tablist" aria-label="How the connection works" className="connection-tabs">
          {stages.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`connection-tab-${item.id}`}
              aria-controls="connection-detail"
              aria-selected={active === index}
              tabIndex={active === index ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % stages.length
                    : event.key === "ArrowLeft"
                      ? (index + stages.length - 1) % stages.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? stages.length - 1
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  select(next, true);
                }
              }}
            >
              <span className="connection-step-icon">
                <item.Icon aria-hidden="true" strokeWidth={1.5} />
                <span>{index + 1}</span>
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          Step {active + 1} of {stages.length}: {stage.label}
        </p>
        <div
          id="connection-detail"
          role="tabpanel"
          aria-labelledby={`connection-tab-${stage.id}`}
          tabIndex={0}
          className="connection-detail"
        >
          <div className="connection-picture">
            <img
              key={stage.photo}
              src={stage.photo}
              srcSet={variantSrcSet(stage.photo)}
              sizes="(min-width: 1200px) 540px, (min-width: 800px) 45vw, 90vw"
              width={1280}
              height={1024}
              alt={stage.alt}
              loading="lazy"
              decoding="async"
            />
            <div className="connection-people">
              {stage.people.map((person) => (
                <span key={person}>{person}</span>
              ))}
            </div>
          </div>
          <div className="connection-story" key={`${stage.id}-${replay}`}>
            <span className="connection-count">
              Step {active + 1} of {stages.length}
            </span>
            <h3>{stage.title}</h3>
            <p>{profile.summary}</p>
            <ul>
              {stage.points.map((point) => (
                <li key={point}>
                  <span aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Link to={profile.path} className="connection-stage-link">
              Explore this stage <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
        <div className="connection-bottom">
          <div className="connection-progress" aria-hidden="true">
            {stages.map((item, index) => (
              <span key={item.id} data-complete={index <= active} />
            ))}
          </div>
          <div className="connection-navigation">
            <button
              type="button"
              aria-label="Previous step"
              disabled={active === 0}
              onClick={() => select(active - 1)}
            >
              <ArrowLeft aria-hidden="true" size={17} />
            </button>
            {active === stages.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  select(0);
                  setReplay((value) => value + 1);
                }}
              >
                Replay the journey <RotateCcw aria-hidden="true" size={17} />
              </button>
            ) : (
              <button type="button" onClick={() => select(active + 1)}>
                Next step <ArrowRight aria-hidden="true" size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
