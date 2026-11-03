import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDown,
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
import { Reveal } from "@/components/ui/reveal";
import { partnerProfiles, type PartnerProfile } from "@/content/partners";
import { cn } from "@/lib/utils";
import { PartnerEcosystem } from "./partner-ecosystem";
import { SIZES_FULL_BLEED, intrinsic, variantSrcSet } from "@/lib/responsive-image";

const iconMap: Record<string, LucideIcon> = {
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

const roleDetails: Record<string, { description: string; icon: string }> = {
  "local-authority": {
    description: "Identifies local need and coordinates the response.",
    icon: "from-teal-300 to-teal-600 text-navy-950",
  },
  "social-worker": {
    description: "Assesses, advocates and keeps the person visible.",
    icon: "from-orange-300 to-orange-600 text-navy-950",
  },
  broker: {
    description: "Connects evidenced demand with credible opportunities.",
    icon: "from-sky-300 to-sky-600 text-navy-950",
  },
  investor: {
    description: "Provides responsible capital for suitable homes.",
    icon: "from-amber-300 to-orange-600 text-navy-950",
  },
  landlord: {
    description: "Makes existing homes available where they are needed.",
    icon: "from-emerald-300 to-teal-600 text-navy-950",
  },
  developer: {
    description: "Creates, converts or adapts suitable property.",
    icon: "from-yellow-300 to-amber-500 text-navy-950",
  },
  "housing-association": {
    description: "Provides the housing and tenancy structure.",
    icon: "from-blue-300 to-sky-600 text-navy-950",
  },
  "care-provider": {
    description: "Delivers specialist or regulated care.",
    icon: "from-rose-300 to-orange-500 text-navy-950",
  },
  "support-provider": {
    description: "Builds stability, skills and independence.",
    icon: "from-lime-300 to-teal-500 text-navy-950",
  },
  resident: {
    description: "A suitable home, the right support and a stronger future.",
    icon: "from-orange-300 to-orange-600 text-navy-950",
  },
};

const ecosystemStages = [
  {
    number: "01",
    label: "Need, assessment and direction",
    roles: ["local-authority", "social-worker"],
    columns: "sm:grid-cols-2",
    node: "bg-teal-600",
  },
  {
    number: "02",
    label: "Property, capital and connections",
    roles: ["broker", "investor", "landlord", "developer"],
    columns: "sm:grid-cols-2 lg:grid-cols-4",
    node: "bg-orange-600",
  },
  {
    number: "03",
    label: "Housing, care and support delivery",
    roles: ["housing-association", "care-provider", "support-provider"],
    columns: "sm:grid-cols-3",
    node: "bg-teal-600",
  },
  {
    number: "04",
    label: "The person and the outcome",
    roles: ["resident"],
    columns: "mx-auto max-w-[650px]",
    node: "bg-orange-600",
  },
] as const;

function getProfile(id: string) {
  return partnerProfiles.find((profile) => profile.id === id)!;
}

function RoleIcon({ profile }: { profile: PartnerProfile }) {
  const Icon = iconMap[profile.icon] ?? Network;
  return <Icon aria-hidden="true" className="size-7" strokeWidth={1.8} />;
}

function FlowConnector() {
  return (
    <div aria-hidden="true" className="flex h-12 items-center justify-center">
      <ArrowDown className="size-5 text-ink-muted" strokeWidth={1.8} />
    </div>
  );
}

function PartnerCard({ profile, outcome = false }: { profile: PartnerProfile; outcome?: boolean }) {
  const detail = roleDetails[profile.id] ?? roleDetails["broker"]!;

  return (
    <Link
      to={profile.path}
      className={cn(
        "group relative flex min-h-[175px] flex-col items-start rounded-2xl border border-rule bg-white p-5 text-left shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-200 hover:border-teal-600/50 hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 motion-safe:hover:-translate-y-1",
        outcome ? "border-orange-500/40 text-ink" : "text-ink",
      )}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-xl",
          profile.stage === "property" || outcome
            ? "bg-tint-orange text-orange-700"
            : "bg-secondary text-teal-600",
        )}
      >
        <RoleIcon profile={profile} />
      </span>

      <h3 className="mt-4 pr-4 font-heading text-lg font-bold leading-tight">{profile.label}</h3>
      <p className={cn("mt-2 max-w-[36ch] text-sm leading-relaxed", "text-ink-muted")}>
        {detail.description}
      </p>

      <span
        className={cn(
          "absolute right-4 top-5 grid size-8 place-items-center rounded-full text-teal-600 transition-colors group-hover:bg-secondary group-focus-visible:bg-secondary",
        )}
      >
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </span>
    </Link>
  );
}

export function PartnersHub() {
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase("en-GB");
  const matches = partnerProfiles.filter((profile) =>
    `${profile.label} ${profile.summary} ${roleDetails[profile.id]?.description ?? ""}`
      .toLocaleLowerCase("en-GB")
      .includes(search),
  );
  const visibleStages = ecosystemStages
    .map((stage) => ({
      ...stage,
      roles: stage.roles.filter((id) => matches.some((profile) => profile.id === id)),
    }))
    .filter((stage) => stage.roles.length > 0);

  return (
    <div className="partner-hub">
      <section className="page-intro section-light relative isolate overflow-hidden">
        {/* WAVE 413b: eager. The hub's opening band, in the first viewport
          from lg up, where it is the only image on the screen. */}
        <img
          src="/images/ecosystem-band.jpg"
          loading="eager"
          alt=""
          className="absolute inset-y-0 right-0 -z-10 hidden h-full w-[60%] object-cover opacity-70 mix-blend-multiply [mask-image:linear-gradient(to_left,black_35%,transparent_100%)] lg:block"
          srcSet={variantSrcSet("/images/ecosystem-band.jpg")}
          sizes={SIZES_FULL_BLEED}
          width={intrinsic("/images/ecosystem-band.jpg")?.width}
          height={intrinsic("/images/ecosystem-band.jpg")?.height}
        />
        <div className="mx-auto flex min-h-[500px] w-full max-w-[1200px] items-center px-5 py-12 sm:px-8 lg:py-14">
          <Reveal className="max-w-[760px]">
            <div className="inline-flex items-center gap-3">
              <span aria-hidden="true" className="h-0.5 w-9 bg-orange-700" />
              <p className="eyebrow tracking-[0.16em] text-ink">
                Connected roles. Shared purpose.
              </p>
            </div>
            <h1 className="heading-tight mt-5 max-w-[12ch] text-balance text-[clamp(2.75rem,6vw,5.35rem)] font-extrabold leading-[0.94] tracking-[-0.04em] text-navy-900">
              Every role. <span className="text-orange-700">One connected journey.</span>
            </h1>
            <p className="mt-6 max-w-[48ch] border-l-4 border-orange-700 pl-4 text-[17px] font-semibold leading-relaxed text-navy-800 sm:text-[19px]">
              Working together to turn housing need into the right home, with people at
              the centre.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="primary" asChild>
                <a href="#ecosystem-map">Explore the ecosystem</a>
              </Button>
              <Button variant="secondary" asChild withArrow={false}>
                <Link to="/contact" search={{ enquiry: "partner", type: "partner" }}>
                  Become a partner
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <PartnerEcosystem />

      <section id="ecosystem" aria-labelledby="ecosystem-heading" className="scroll-mt-20 bg-page">
        <div className="mx-auto w-full max-w-[1080px] px-5 py-14 sm:px-8 lg:py-20">
          <Reveal className="mx-auto max-w-[760px] text-center">
            <p className="eyebrow tracking-[0.14em] text-teal-600">One connected ecosystem</p>
            <h2
              id="ecosystem-heading"
              className="heading-tight mx-auto mt-3 text-balance text-[clamp(2.2rem,4.6vw,3.8rem)] font-extrabold leading-[0.98] text-ink"
            >
              <span className="block">Ten partners.</span>
              <span className="block text-orange-700 sm:whitespace-nowrap">
                One connected outcome.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-[58ch] text-[16px] leading-relaxed text-ink-muted sm:text-[18px]">
              See how each role moves a housing need towards a suitable home. Select any partner to
              explore its part.
            </p>
          </Reveal>

          <div className="mx-auto mt-8 max-w-[640px] rounded-2xl border border-rule bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
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
                className="min-h-12 w-full rounded-xl border border-rule bg-page py-3 pl-11 pr-12 text-base text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-search-cancel-button]:appearance-none"
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
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-2 text-sm text-ink-muted"
            >
              {search
                ? `${matches.length} of ${partnerProfiles.length} roles`
                : `All ${partnerProfiles.length} roles`}
            </p>
          </div>

          <div id="partner-results" className="mx-auto mt-10 max-w-[960px]">
            {visibleStages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-rule bg-page-alt px-6 py-10 text-center">
                <p className="text-base font-semibold text-ink">No matching roles</p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-3 min-h-11 rounded-lg px-4 text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-teal-600"
                >
                  Show all partners
                </button>
              </div>
            ) : null}
            {visibleStages.map((stage, stageIndex) => {
              const outcome = stage.roles[0] === "resident";

              return (
                <div key={stage.number}>
                  <Reveal index={stageIndex}>
                    <div className="mb-4 flex items-center justify-center gap-3 text-center">
                      <span
                        className={cn(
                          /* White, not navy. The numeral sits on a teal-600
                             or orange-500 fill: navy on teal-600 is 3.75:1
                             and fails at 10px, where white on it is 5.25:1.
                             `text-page` rather than `text-white` so the light
                             remap's substring rule cannot repaint it while the
                             unconverted files still rely on that rule. */
                          "grid size-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold text-page",
                          stage.node,
                        )}
                      >
                        {stage.number}
                      </span>
                      <h3 className="font-heading text-[17px] font-extrabold text-ink sm:text-[18px]">
                        {stage.label}
                      </h3>
                    </div>

                    <div className={cn("grid gap-3", stage.columns)}>
                      {stage.roles.map((roleId) => (
                        <PartnerCard key={roleId} profile={getProfile(roleId)} outcome={outcome} />
                      ))}
                    </div>
                  </Reveal>

                  {stageIndex < visibleStages.length - 1 ? <FlowConnector /> : null}
                </div>
              );
            })}
          </div>

          <Reveal className="mx-auto mt-10 max-w-[820px] border-t border-rule pt-8">
            <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <p className="font-heading text-[20px] font-extrabold text-ink">
                  Select any partner to explore its role.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
                  <span className="inline-flex items-center gap-2 text-[11px] max-lg:text-[15px] text-ink-muted">
                    <i className="size-2 rounded-full bg-teal-600" /> Need and delivery
                  </span>
                  <span className="inline-flex items-center gap-2 text-[11px] max-lg:text-[15px] text-ink-muted">
                    <i className="size-2 rounded-full bg-orange-500" /> Property and capital
                  </span>
                  <span className="inline-flex items-center gap-2 text-[11px] max-lg:text-[15px] text-ink-muted">
                    <i className="size-2 rounded-full bg-page" /> Person and outcome
                  </span>
                </div>
              </div>
              <Button variant="primary" asChild>
                <Link to="/contact" search={{ enquiry: "partner", type: "partner" }}>
                  Talk to the team
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
