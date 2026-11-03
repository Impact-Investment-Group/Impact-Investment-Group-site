import { Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import {
  ArrowRight, Building2, CircleDollarSign, Handshake, HardHat,
  HeartHandshake, Home, Landmark, Network, Search, User, UserRoundCheck,
  Users, type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { registerRoles } from "@/content/audiences";
import { partnerProfiles } from "@/content/partners";
import "./partner-ecosystem.css";

const icons: Record<string, LucideIcon> = {
  Building2, CircleDollarSign, Handshake, HardHat, HeartHandshake,
  Home, Landmark, Search, User, UserRoundCheck, Users,
};

// Public role labels and destinations stay in the existing content sources.
const connections = [
  { id: "local-authority", caption: "Local housing needs", x: 13, y: 10 },
  { id: "social-worker", caption: "Referrals and choices", x: 13, y: 28 },
  { id: "housing-association", caption: "Homes and tenancies", x: 13, y: 46 },
  { id: "care-provider", caption: "Specialist care", x: 13, y: 64 },
  { id: "support-provider", caption: "Practical support", x: 13, y: 82 },
  { id: "investor", caption: "Capital for suitable homes", x: 87, y: 10 },
  { id: "landlord", caption: "Existing homes", x: 87, y: 28 },
  { id: "developer", caption: "Sites and development", x: 87, y: 46 },
  { id: "broker", caption: "Opportunities and introductions", x: 87, y: 64 },
  { id: "resident", caption: "Needs and preferences", x: 87, y: 82 },
  { id: "co-sourcer", caption: null, x: 50, y: 91 },
];

export function PartnerEcosystem() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section id="ecosystem-map" aria-labelledby="ecosystem-map-heading" className="scroll-mt-24 bg-page">
      <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 sm:px-8 lg:pt-20">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="eyebrow text-teal-600">One connected ecosystem</p>
          <h2 id="ecosystem-map-heading" className="mt-3 font-heading text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Your place in the ecosystem
          </h2>
          <p className="mx-auto mt-4 max-w-[60ch] text-base leading-relaxed text-ink-muted sm:text-lg">
            Explore how each role connects with Impact Investment Group. Select a role to see how you can work together.
          </p>
        </div>

        <div className="partner-ecosystem mt-8" role="group" aria-label="Interactive role ecosystem">
          <svg className="partner-ecosystem__lines" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
            {connections.map(({ id, x, y }) => (
              <path
                key={id}
                data-connection={id}
                data-active={activeId === id}
                d={`M 500 285.2 C ${x === 50 ? 500 : x < 50 ? 310 : 690} 285.2, ${x * 10} ${y * 6.2}, ${x * 10} ${y * 6.2}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="partner-ecosystem__centre">
            <Network aria-hidden="true" />
            <p>Impact<br />Investment<br />Group</p>
          </div>

          {connections.map(({ id, caption, x, y }) => {
            const role = registerRoles.find((item) => item.id === id)!;
            const profile = partnerProfiles.find((item) => item.id === id);
            const Icon = icons[role.icon] ?? Network;
            return (
              <Dialog key={id} onOpenChange={(open) => setActiveId(open ? id : null)}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="partner-ecosystem__role"
                    data-role={id}
                    style={{ "--node-x": `${x}%`, "--node-y": `${y}%` } as CSSProperties}
                    onPointerEnter={() => setActiveId(id)}
                    onPointerLeave={() => setActiveId(null)}
                    onFocus={() => setActiveId(id)}
                    onBlur={() => setActiveId(null)}
                  >
                    <Icon aria-hidden="true" />
                    <span className="partner-ecosystem__label">{role.label}</span>
                    <span className="partner-ecosystem__caption">{caption ?? role.detail}</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-h-[85dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl bg-page p-6 sm:max-w-[560px] sm:p-8 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center [&>button]:opacity-100">
                  <div className="flex items-center gap-3 pr-14 text-teal-600">
                    <Icon aria-hidden="true" className="size-7 shrink-0" />
                    <DialogTitle className="min-w-0 font-heading text-2xl font-bold leading-tight text-ink">
                      {profile?.label ?? role.label}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-base leading-relaxed text-ink-muted">
                    {profile?.summary ?? role.detail}
                  </DialogDescription>
                  {profile ? (
                    <div className="rounded-xl border border-rule bg-white p-5">
                      <h3 className="font-heading text-lg font-bold text-ink">How you work with IIG</h3>
                      <ol className="mt-4 space-y-4">
                        {profile.platformSteps.map((step, index) => (
                          <li key={step} className="flex gap-3 text-base leading-relaxed text-ink-muted">
                            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-teal-600">{index + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  <Button variant="primary" asChild>
                    {profile ? (
                      <Link to={profile.path}>Explore this role</Link>
                    ) : (
                      <a href={role.href}>Join as a co-sourcer</a>
                    )}
                  </Button>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
        <div className="mt-5 text-center">
          <a href="#ecosystem" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
            Browse the partner directory <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
