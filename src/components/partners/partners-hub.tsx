import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Handshake,
  HardHat,
  HeartHandshake,
  Home,
  Landmark,
  Network,
  Search,
  User,
  UserRoundCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BuddySlot } from "@/components/buddy/buddy-slot";
import { partnerProfiles, type PartnerProfile } from "@/content/partners";
import { intrinsic, variantSrcSet } from "@/lib/responsive-image";
import { PartnerEcosystem } from "./partner-ecosystem";
import "./partner-editorial.css";
import "@/components/editorial/story-lead.css";

const icons: Record<string, LucideIcon> = {
  Building2,
  CircleDollarSign,
  Handshake,
  HardHat,
  HeartHandshake,
  Home,
  Landmark,
  User,
  UserRoundCheck,
  Users,
};

const roleDescriptions: Record<string, string> = {
  "local-authority": "Identifies local need and coordinates the response.",
  "social-worker": "Assesses, advocates and keeps the person visible.",
  broker: "Connects evidenced demand with credible opportunities.",
  investor: "Provides responsible capital for suitable homes.",
  landlord: "Makes existing homes available where they are needed.",
  developer: "Creates, converts or adapts suitable property.",
  "housing-association": "Provides the housing and tenancy structure.",
  "care-provider": "Delivers specialist or regulated care.",
  "support-provider": "Builds stability, skills and independence.",
  resident: "A suitable home, the right support and a stronger future.",
};

const ecosystemStages: Array<{ id: PartnerProfile["stage"]; number: string; label: string }> = [
  { id: "need", number: "01", label: "Need, assessment and direction" },
  { id: "property", number: "02", label: "Property, capital and connections" },
  { id: "delivery", number: "03", label: "Housing, care and support delivery" },
  { id: "outcome", number: "04", label: "The person and the outcome" },
];

export function PartnersHub() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const search = query.trim().toLocaleLowerCase("en-GB");
  const matches = partnerProfiles.filter(
    (profile) =>
      (stage === "all" || profile.stage === stage) &&
      `${profile.label} ${profile.summary} ${roleDescriptions[profile.id] ?? ""}`
        .toLocaleLowerCase("en-GB")
        .includes(search),
  );
  const visibleStages = ecosystemStages
    .map((item) => ({ ...item, profiles: matches.filter((profile) => profile.stage === item.id) }))
    .filter((item) => item.profiles.length > 0);

  return (
    <div className="partner-hub partner-craft">
      <section className="story-lead story-lead--network" aria-labelledby="partners-heading">
        <div className="story-shell">
          <div className="story-copy">
            <p className="story-kicker">Our partners</p>
            <h1 id="partners-heading" className="story-title">Together we can turn housing need into homes.</h1>
            <p className="story-intro">
              A suitable home takes more than a set of keys. Meet the people who bring the
              property, investment, care and support together, and find where you fit.
            </p>
            <div className="story-links">
              <a href="#ecosystem">Find your role <ArrowRight aria-hidden="true" /></a>
              <a href="#ecosystem-map">Explore the ecosystem <ArrowRight aria-hidden="true" /></a>
            </div>
          </div>
          <div className="story-network-visual">
            <img
              className="story-photo"
              src="/images/human-meeting.jpg"
              srcSet={variantSrcSet("/images/human-meeting.jpg")}
              sizes="(min-width: 1200px) 540px, (min-width: 800px) 45vw, 100vw"
              width={intrinsic("/images/human-meeting.jpg")?.width}
              height={intrinsic("/images/human-meeting.jpg")?.height}
              alt="Four people sit around a table in conversation."
            />
            <div className="story-network-buddy">
              <BuddySlot
                form={stage === "need" || stage === "delivery" || stage === "outcome" ? "support" : "property"}
                action={stage === "need" || stage === "delivery" || stage === "outcome" ? "reassure" : "wave"}
                animated
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="ecosystem"
        aria-labelledby="ecosystem-heading"
        className="partner-craft-directory wave-section story-from-white story-mint"
      >
        <div className="partner-craft-container">
          <div className="partner-craft-directory__intro">
            <div>
              <h2 id="ecosystem-heading" className="partner-craft-heading mt-3">
                Which part can you play?
              </h2>
              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-ink-muted">
                Explore the ten roles that connect a housing need with a suitable home.
                Find yours by name or look through the stages below.
              </p>
            </div>
            <div className="partner-craft-directory__controls">
              <label htmlFor="partner-search" className="mb-2 block text-sm font-semibold text-ink">
                Find your role
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-teal-600"
                />
                <input
                  id="partner-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search partners"
                  aria-controls="partner-results"
                  className="min-h-12 w-full rounded-lg border border-rule bg-white py-3 pl-11 pr-12 text-base text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-search-cancel-button]:appearance-none"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Clear partner search"
                    onClick={() => setQuery("")}
                    className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-ink-muted hover:bg-secondary focus-visible:outline-2 focus-visible:outline-teal-600"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                ) : null}
              </div>
              <label
                htmlFor="partner-stage"
                className="mb-2 mt-4 block text-sm font-semibold text-ink"
              >
                Filter by stage
              </label>
              <select
                id="partner-stage"
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                aria-controls="partner-results"
                className="min-h-12 w-full rounded-lg border border-rule bg-white px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <option value="all">All stages</option>
                {ecosystemStages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="mt-3 text-sm text-ink-muted"
              >
                {search || stage !== "all"
                  ? `${matches.length} of ${partnerProfiles.length} roles`
                  : `All ${partnerProfiles.length} roles`}
              </p>
            </div>
          </div>

          <div id="partner-results" className="partner-craft-directory__results">
            {visibleStages.length === 0 ? (
              <div className="border-y border-rule py-10 text-center">
                <p className="text-base font-semibold text-ink">No matching roles</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setStage("all");
                  }}
                  className="mt-3 min-h-11 rounded-lg px-4 text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-teal-600"
                >
                  Show all partners
                </button>
              </div>
            ) : null}
            {visibleStages.map((item) => (
              <div key={item.id} className="partner-craft-directory__stage" data-stage={item.id}>
                <h3 className="partner-craft-directory__stage-title">
                  <span aria-hidden="true">{item.number}</span>
                  {item.label}
                </h3>
                <ul className="partner-craft-directory__roles">
                  {item.profiles.map((profile) => {
                    const Icon = icons[profile.icon] ?? Network;
                    return (
                      <li key={profile.id}>
                        <Link to={profile.path} className="partner-craft-directory__role">
                          <span className="partner-craft-directory__icon">
                            <Icon aria-hidden="true" />
                          </span>
                          <span>
                            <span className="partner-craft-directory__role-name">
                              {profile.label}
                            </span>
                            <span className="partner-craft-directory__role-description">
                              {roleDescriptions[profile.id]}
                            </span>
                          </span>
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-rule pt-7">
            <p className="text-base font-semibold text-ink">Become a partner</p>
            <Button variant="primary" asChild>
              <Link to="/contact" search={{ enquiry: "partner", type: "partner" }}>
                Talk to the team
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <PartnerEcosystem />
    </div>
  );
}
