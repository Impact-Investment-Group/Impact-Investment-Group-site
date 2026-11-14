import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, LifeBuoy, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BuddyForm } from "@/components/buddy/buddy-character";
import { BuddySlot } from "@/components/buddy/buddy-slot";
import { Reveal } from "@/components/ui/reveal";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { PartnerProfile } from "@/content/partners";
import { crisisLines, crisisNote } from "@/content/site";
import "./partner-editorial.css";
import { intrinsic, variantSrcSet } from "@/lib/responsive-image";

/**
 * Crisis signposting, drawn only for a profile that carries `crisisSignpost`
 * (today: the resident pathway alone).
 *
 * ⚠ IT IS THE FIRST THING IN <main> AND IT STAYS THERE. Above the hero, not
 * inside it, because "above the fold" has to hold at 360px as well as 1440px
 * and the hero is 610px tall on its own. It is deliberately NOT wrapped in
 * <Reveal>: this is the one block on the site that must be readable before any
 * JavaScript has run and without waiting for an intersection observer.
 *
 * No animation, no orange, no call to action. Orange is the action colour and
 * nothing here is an action we want; the accent is teal, the same treatment
 * the footer's crisis panel uses, so the two read as one piece of care
 * information rather than as a banner and a footnote.
 */
function CrisisSignpost({ signpost }: { signpost: NonNullable<PartnerProfile["crisisSignpost"]> }) {
  return (
    /* ⚠ A REAL <h2>, LABELLING THE REGION, AND THE HEADING ORDER IS
       DELIBERATELY IMPERFECT. This panel sits ABOVE the page's <h1>, so its
       heading is a level 2 before any level 1 exists. That is untidy and it
       is the right trade:

         - Pressing H is how most screen-reader users move through a page.
           A labelled <section> alone is only reachable through the landmarks
           or regions list, which is a deliberate detour. For crisis
           signposting, discoverability beats tidiness.
         - h2-then-h1 is a DECREASE in level, which axe's heading-order rule
           does not flag and which no success criterion forbids. The rule is
           about skipping levels on the way down.
         - aria-labelledby gives the region the heading's text, so the block
           is announced by name in the regions list as well.

       An earlier revision made this a <p> to keep the outline clean and lost
       the heading. If you change it back, know what you are trading away. */
    <section aria-labelledby="crisis-signpost-heading" className="border-b border-teal-600 bg-page">
      <div className="mx-auto grid w-full max-w-[1200px] gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div>
          <h2
            id="crisis-signpost-heading"
            className="flex items-center gap-2.5 font-heading text-[17px] font-bold text-ink"
          >
            <LifeBuoy aria-hidden="true" className="size-5 shrink-0 text-teal-600" />
            {signpost.heading}
          </h2>
          <p className="mt-2.5 max-w-[68ch] text-[14px] leading-relaxed text-ink-muted">
            {signpost.body}
          </p>
        </div>

        <div>
          <ul className="flex flex-col gap-1.5 text-[14px]">
            {crisisLines.map((line) => (
              <li key={line.label} className="flex items-baseline justify-between gap-4">
                <span className="text-ink-muted">{line.label}</span>
                {/* 44px BOTH WAYS, at every width, not just on touch. These
                    are crisis numbers: the person tapping one may be
                    distressed, on a phone, one-handed. The rest of the site
                    drops to lg:min-h-0 on desktop; this does not.

                    min-w-11 is not decoration either. "111" sets a 15px-wide
                    line, so without it the NHS number was a 15 x 44 target.
                    WCAG 2.2 SC 2.5.8 would still pass it on the spacing
                    exception (the rows are 50px apart), and axe did pass it,
                    which is exactly why the width is set explicitly rather
                    than left to the checker: a 15px-wide crisis number is a
                    bad target whether or not it conforms. */}
                <a
                  href={`tel:${line.detail.replace(/\s/g, "")}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-end font-heading font-semibold text-ink underline underline-offset-4 transition-colors duration-200 hover:text-teal-600"
                >
                  {line.detail}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 font-heading text-[14px] font-semibold text-ink">{crisisNote}</p>
        </div>
      </div>
    </section>
  );
}

const stageVisuals: Record<PartnerProfile["stage"], { image: string; label: string }> = {
  need: { image: "/images/human-insight.jpg", label: "Need, assessment and direction" },
  property: {
    image: "/images/solution-street-blueprint.webp",
    label: "Property, capital and delivery",
  },
  delivery: { image: "/images/human-partnership.jpg", label: "Housing, care and support" },
  outcome: { image: "/images/hero-lives.webp", label: "The person and the outcome" },
};

interface PlatformPresentation {
  lead: string;
  accent: string;
  labels: [string, string, string];
  readoutTitles: [string, string, string];
}

const platformPresentations: Record<string, PlatformPresentation> = {
  investor: {
    lead: "See exactly what your capital is",
    accent: "building towards.",
    labels: ["Evidence", "Structure", "Outcome"],
    readoutTitles: ["Start with the need.", "Test the structure.", "Keep the outcome visible."],
  },
  landlord: {
    lead: "See exactly where your property",
    accent: "fits.",
    labels: ["Property", "Fit", "Delivery"],
    readoutTitles: ["Start with the property.", "Check the fit.", "Follow delivery."],
  },
  developer: {
    lead: "See how a housing brief becomes",
    accent: "a completed home.",
    labels: ["Brief", "Plan", "Outcome"],
    readoutTitles: [
      "Start with the brief.",
      "Build the delivery plan.",
      "Keep sight of the outcome.",
    ],
  },
  "housing-association": {
    lead: "Connect need, property and tenancy in",
    accent: "one delivery plan.",
    labels: ["Need", "Tenancy", "Delivery"],
    readoutTitles: ["Confirm the need.", "Shape the housing route.", "Coordinate delivery."],
  },
  "local-authority": {
    lead: "Turn verified local need into",
    accent: "a coordinated response.",
    labels: ["Need", "Response", "Outcome"],
    readoutTitles: ["Define the need.", "Connect the response.", "Keep outcomes visible."],
  },
  "care-provider": {
    lead: "Keep care requirements connected to",
    accent: "the right home.",
    labels: ["Care need", "Home", "Outcome"],
    readoutTitles: ["Start with assessed need.", "Check the home.", "Coordinate the outcome."],
  },
  "support-provider": {
    lead: "Connect practical support from placement to",
    accent: "real progress.",
    labels: ["Support need", "Placement", "Progress"],
    readoutTitles: ["Define the support need.", "Connect the placement.", "Keep progress visible."],
  },
  "social-worker": {
    lead: "Keep the person's needs visible through",
    accent: "every step.",
    labels: ["Assessment", "Coordination", "Review"],
    readoutTitles: ["Start with the person.", "Follow the coordination.", "Review the outcome."],
  },
  broker: {
    lead: "See how each opportunity finds",
    accent: "the right route.",
    labels: ["Opportunity", "Match", "Progress"],
    readoutTitles: ["Open the opportunity.", "Check the match.", "Follow it forward."],
  },
  resident: {
    lead: "See how your needs shape the journey towards",
    accent: "a suitable home.",
    labels: ["My needs", "My home", "My future"],
    readoutTitles: [
      "Start with what matters to me.",
      "Connect the right home.",
      "Keep my future central.",
    ],
  },
};

interface ConnectedNetworkPresentation {
  lead: string;
  accent: string;
  image: string;
  alt: string;
}

const connectedNetworkPresentations: Record<string, ConnectedNetworkPresentation> = {
  investor: {
    lead: "See where capital",
    accent: "connects.",
    image: "/images/partners/connected-network-investor.png",
    alt: "Four connected housing checkpoints with Property Investor expanded in a detailed information drawer.",
  },
  landlord: {
    lead: "See where property",
    accent: "connects.",
    image: "/images/partners/connected-network-landlord.png",
    alt: "Four connected housing checkpoints with Property Landlord expanded in a detailed information drawer.",
  },
  developer: {
    lead: "See where development",
    accent: "connects.",
    image: "/images/partners/connected-network-developer.png",
    alt: "Four connected housing checkpoints with Property Developer expanded in a detailed information drawer.",
  },
  "housing-association": {
    lead: "See where housing delivery",
    accent: "connects.",
    image: "/images/partners/connected-network-housing-association.png",
    alt: "Four connected housing checkpoints with Housing Association expanded in a detailed information drawer.",
  },
  "local-authority": {
    lead: "See where local need",
    accent: "connects.",
    image: "/images/partners/connected-network-local-authority.png",
    alt: "Four connected housing checkpoints with Local Authority expanded in a detailed information drawer.",
  },
  "care-provider": {
    lead: "See where specialist care",
    accent: "connects.",
    image: "/images/partners/connected-network-care-provider.png",
    alt: "Four connected housing checkpoints with Care Provider expanded in a detailed information drawer.",
  },
  "support-provider": {
    lead: "See where practical support",
    accent: "connects.",
    image: "/images/partners/connected-network-support-provider.png",
    alt: "Four connected housing checkpoints with Support Provider expanded in a detailed information drawer.",
  },
  "social-worker": {
    lead: "See where advocacy",
    accent: "connects.",
    image: "/images/partners/connected-network-social-worker.png",
    alt: "Four connected housing checkpoints with Social Worker expanded in a detailed information drawer.",
  },
  broker: {
    lead: "See where introductions",
    accent: "connect.",
    image: "/images/partners/connected-network-broker.png",
    alt: "Four connected housing checkpoints with Property and Housing Broker expanded in a detailed information drawer.",
  },
  resident: {
    lead: "See how the network connects",
    accent: "around you.",
    image: "/images/partners/connected-network-resident.png",
    alt: "Four connected housing checkpoints with Resident, Individual or Family expanded in a detailed information drawer.",
  },
};

function ConnectedNetworkDiagram({ profile }: { profile: PartnerProfile }) {
  /* `noUncheckedIndexedAccess` makes an index read `T | undefined`, so the
     `??` fallback is still `T | undefined` and every use of it downstream was
     an error. The fallback key is a literal that is present in the record by
     construction, hence the assertion; and TS4111 wants a record's own index
     signature read with a bracket rather than a dot. Twenty of the twenty-two
     inherited tsc errors were these two shapes. (Wave 412.) */
  const presentation =
    connectedNetworkPresentations[profile.id] ?? connectedNetworkPresentations["investor"]!;

  return (
    <Reveal className="partner-craft-network-reference">
      <Dialog>
        <figure className="overflow-hidden rounded-3xl border border-rule bg-white shadow-[var(--shadow-card)]">
          <img
            src={presentation.image}
            alt={presentation.alt}
            loading="lazy"
            className="aspect-[16/9] w-full object-contain"
            srcSet={variantSrcSet(presentation.image)}
            sizes="(min-width: 1200px) 570px, (min-width: 900px) 48vw, 100vw"
            width={intrinsic(presentation.image)?.width}
            height={intrinsic(presentation.image)?.height}
          />
          <figcaption className="flex justify-end border-t border-rule px-3 py-2">
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-600 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                <ZoomIn aria-hidden="true" className="size-4" />
                View full diagram
              </button>
            </DialogTrigger>
          </figcaption>
        </figure>
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-[1400px] overflow-auto rounded-2xl bg-page p-4 pt-6 sm:max-w-[1400px] sm:p-6 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center"
        >
          <DialogTitle className="pr-12 text-base text-ink">
            {profile.label}: connected network
          </DialogTitle>
          <div
            className="overflow-auto rounded-xl border border-rule"
            tabIndex={0}
            role="region"
            aria-label="Connected network diagram"
          >
            <img src={presentation.image} alt={presentation.alt} className="w-full min-w-[900px]" />
          </div>
        </DialogContent>
      </Dialog>
    </Reveal>
  );
}

interface RolePresentation {
  eyebrow: string;
  lead: string;
  accent: string;
  guideLabels: [string, string, string, string];
}

const rolePresentations: Record<string, RolePresentation> = {
  investor: {
    eyebrow: "The investor role",
    lead: "Capital with a",
    accent: "clear purpose.",
    guideLabels: ["Fund", "Test", "Connect", "Track"],
  },
  landlord: {
    eyebrow: "The landlord role",
    lead: "Property with a",
    accent: "clear route.",
    guideLabels: ["List", "Check", "Connect", "Track"],
  },
  developer: {
    eyebrow: "The developer role",
    lead: "Delivery shaped by",
    accent: "real need.",
    guideLabels: ["Plan", "Test", "Deliver", "Track"],
  },
  "housing-association": {
    eyebrow: "The housing association role",
    lead: "Housing delivery with",
    accent: "every role connected.",
    guideLabels: ["Need", "Tenancy", "Connect", "Track"],
  },
  "local-authority": {
    eyebrow: "The local authority role",
    lead: "Local need becomes",
    accent: "a coordinated response.",
    guideLabels: ["Need", "Commission", "Connect", "Review"],
  },
  "care-provider": {
    eyebrow: "The care provider role",
    lead: "Care requirements connected to",
    accent: "the right home.",
    guideLabels: ["Assess", "Care", "Connect", "Review"],
  },
  "support-provider": {
    eyebrow: "The support provider role",
    lead: "Practical support connected to",
    accent: "the whole journey.",
    guideLabels: ["Assess", "Support", "Connect", "Progress"],
  },
  "social-worker": {
    eyebrow: "The social worker role",
    lead: "Keep the person visible in",
    accent: "every decision.",
    guideLabels: ["Assess", "Advocate", "Connect", "Review"],
  },
  broker: {
    eyebrow: "The broker role",
    lead: "Bring the right partners to",
    accent: "the same opportunity.",
    guideLabels: ["Find", "Match", "Connect", "Track"],
  },
  resident: {
    eyebrow: "The resident role",
    lead: "Your needs remain at",
    accent: "the centre.",
    guideLabels: ["Need", "Home", "Support", "Outcome"],
  },
};

function partnerBuddyForm(profile: PartnerProfile): BuddyForm {
  if (profile.id === "investor") return "investment";
  if (profile.stage === "property" || profile.id === "housing-association") return "property";
  return "support";
}

function PartnerRoleLedger({ profile }: { profile: PartnerProfile }) {
  const presentation = rolePresentations[profile.id] ?? rolePresentations["investor"]!;

  return (
    <section id="role" aria-labelledby="role-heading" className="bg-page">
      <div className="partner-craft-container partner-craft-ledger">
        <div>
          <p className="eyebrow text-teal-600">01 · {presentation.eyebrow}</p>
          <h2 id="role-heading" className="partner-craft-heading mt-3">
            {presentation.lead} <span className="text-orange-700">{presentation.accent}</span>
          </h2>
          <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-ink-muted">
            {profile.whoTheyAre}
          </p>
          <figure className="partner-craft-guides">
            <div className="partner-craft-guides__art flex items-center justify-center">
              <BuddySlot form={partnerBuddyForm(profile)} action="explain" expression="warm"
                className="w-[250px] max-w-full [&_img]:size-full! [&_img]:left-0!" />
            </div>
            <figcaption>{presentation.guideLabels.join(" · ")}</figcaption>
          </figure>
        </div>
        <ol className="partner-craft-ledger__points">
          {profile.rolePoints.map((point, index) => (
            <li key={point}>
              <span aria-hidden="true">0{index + 1}</span>
              <div>
                <p>{point}</p>
                <span className="partner-craft-ledger__guide-label">
                  {presentation.guideLabels[index]}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PartnerPlatformStack({ profile }: { profile: PartnerProfile }) {
  const [activeStep, setActiveStep] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const presentation = platformPresentations[profile.id] ?? platformPresentations["investor"]!;

  return (
    <section
      id="platform-journey"
      aria-labelledby="platform-heading"
      className="partner-craft-journey-section"
    >
      <div className="partner-craft-container partner-craft-journey">
        <div className="partner-craft-journey__intro">
          <p className="eyebrow text-teal-600">02 · Through the platform</p>
          <h2 id="platform-heading" className="partner-craft-heading mt-3">
            {presentation.lead} <span className="text-orange-700">{presentation.accent}</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink-muted">{profile.platformIntro}</p>
        </div>
        <div className="partner-craft-journey__experience" data-active-step={activeStep}>
          <div
            className="partner-craft-journey__tabs"
            role="tablist"
            aria-label={`${profile.label} platform journey`}
          >
            {profile.platformSteps.map((step, index) => (
              <button
                key={step}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                role="tab"
                id={`journey-tab-${index}`}
                aria-controls="journey-panel"
                type="button"
                tabIndex={activeStep === index ? 0 : -1}
                aria-selected={activeStep === index}
                onClick={() => setActiveStep(index)}
                onKeyDown={(event) => {
                  const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
                  if (!keys.includes(event.key)) return;
                  event.preventDefault();
                  const count = profile.platformSteps.length;
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? count - 1
                        : (index +
                            (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) +
                            count) %
                          count;
                  setActiveStep(next);
                  tabRefs.current[next]?.focus();
                }}
                className="partner-craft-journey__tab"
              >
                <span>0{index + 1}</span>
                <span>{presentation.labels[index]}</span>
              </button>
            ))}
          </div>
          <div
            id="journey-panel"
            role="tabpanel"
            aria-labelledby={`journey-tab-${activeStep}`}
            tabIndex={0}
            className="partner-craft-journey__panel"
          >
            <div className="flex items-center justify-between gap-3 font-mono text-xs text-teal-600">
              <span>Active checkpoint</span>
              <span role="status" aria-live="polite" aria-atomic="true">
                0{activeStep + 1} / 03
              </span>
            </div>
            <div className="partner-craft-journey__story" key={activeStep}>
              <div>
                <p className="font-heading text-2xl font-bold leading-tight text-ink">
                  {presentation.readoutTitles[activeStep]}
                </p>
                <p className="mt-3 text-base leading-relaxed text-ink-muted">
                  {profile.platformSteps[activeStep]}
                </p>
              </div>
              <div className="partner-craft-journey__guide" aria-hidden="true">
                <BuddySlot form={partnerBuddyForm(profile)} action="explain" expression="warm"
                  className="my-auto w-[140px] sm:w-[170px] [&_img]:size-full!" />
              </div>
            </div>
            <div className="partner-craft-journey__controls">
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
                aria-controls="journey-panel"
              >
                <ArrowLeft aria-hidden="true" />
                Previous step
              </button>
              <button
                type="button"
                disabled={activeStep === profile.platformSteps.length - 1}
                onClick={() =>
                  setActiveStep((step) => Math.min(profile.platformSteps.length - 1, step + 1))
                }
                aria-controls="journey-panel"
              >
                Next step
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="partner-craft-journey__outcome text-sm leading-relaxed text-teal-600">
            {profile.whyJoin}
          </p>
        </div>
      </div>
    </section>
  );
}

function PartnerRelationships({ profile }: { profile: PartnerProfile }) {
  const [selected, setSelected] = useState(0);
  const relationship = profile.relationships[selected] ?? profile.relationships[0];

  return (
    <div className="partner-craft-relationships">
      <h3 className="mb-4 font-heading text-xl font-bold text-ink">Who you work with</h3>
      <div
        role="group"
        aria-label="Partner connections"
        className="partner-craft-relationships__choices"
      >
        {profile.relationships.map((item, index) => (
          <button
            key={item.partner}
            type="button"
            className="partner-craft-connection"
            aria-pressed={selected === index}
            aria-controls="partner-relationship-detail"
            onClick={() => setSelected(index)}
          >
            <span className="partner-craft-connection__number" aria-hidden="true">
              0{index + 1}
            </span>
            <span>{item.partner}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        id="partner-relationship-detail"
        role="region"
        aria-label="Selected partner relationship"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={0}
        className="partner-craft-relationship"
      >
        {relationship ? (
          <div key={selected} className="partner-craft-relationship__story">
            <h4>{relationship.partner}</h4>
            <p>{relationship.detail}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PartnerPage({ profile }: { profile: PartnerProfile }) {
  const headingId = `partner-${profile.id}-heading`;
  const visual = stageVisuals[profile.stage];
  const networkPresentation =
    connectedNetworkPresentations[profile.id] ?? connectedNetworkPresentations["investor"]!;

  return (
    <div className="partner-page partner-craft" data-buddy-topic={partnerBuddyForm(profile)}>
      {profile.crisisSignpost ? <CrisisSignpost signpost={profile.crisisSignpost} /> : null}
      <section aria-labelledby={headingId} className="partner-craft-hero section-light">
        <div className="partner-craft-hero__layout">
          <div className="partner-craft-hero__title">
            <Link
              to="/partners"
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-teal-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
            >
              <span aria-hidden="true">←</span> The partner ecosystem
            </Link>
            <p className="eyebrow mt-5 text-teal-600">
              {profile.id === "investor" ? "Investor pathway" : visual.label}
            </p>
            <h1 id={headingId} className="partner-craft-hero__heading">
              {profile.id === "resident" ? (
                <>
                  The person at the <span className="text-orange-700">centre.</span>
                </>
              ) : (
                <>
                  Partner with <span className="text-orange-700">{profile.pluralLabel}.</span>
                </>
              )}
            </h1>
          </div>
          <figure className="partner-craft-hero__media">
            <img
              className="partner-craft-hero__photo"
              src={visual.image}
              srcSet={variantSrcSet(visual.image)}
              sizes={
                profile.stage === "property"
                  ? "(min-width: 1200px) 720px, (min-width: 900px) 62vw, 112vw"
                  : "(min-width: 1200px) 610px, (min-width: 900px) 52vw, 100vw"
              }
              width={intrinsic(visual.image)?.width}
              height={intrinsic(visual.image)?.height}
              loading="eager"
              alt=""
            />
          </figure>
          <div className="partner-craft-hero__support">
            <p className="partner-craft-hero__summary">{profile.summary}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="primary" asChild>
                <a href="#role">Understand the role</a>
              </Button>
              <Button variant="secondary" asChild withArrow={false}>
                <Link to="/partners">See all ten partners</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PartnerRoleLedger profile={profile} />
      <PartnerPlatformStack key={profile.id} profile={profile} />

      <section id="connected-network" aria-labelledby="network-heading" className="bg-page">
        <div className="partner-craft-container py-14 lg:py-16">
          <div className="max-w-[760px]">
            <p className="eyebrow text-teal-600">03 · The connected network</p>
            <h2 id="network-heading" className="partner-craft-heading mt-3">
              {networkPresentation.lead}{" "}
              <span className="text-orange-700">{networkPresentation.accent}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">{profile.impactIntro}</p>
          </div>
          <div className="partner-craft-connections">
            <PartnerRelationships key={profile.id} profile={profile} />
            <ConnectedNetworkDiagram profile={profile} />
          </div>
          <ul className="partner-craft-impact">
            {profile.impactPoints.map((point) => (
              <li key={point}>
                <CheckCircle2 aria-hidden="true" />
                <p>{point}</p>
              </li>
            ))}
          </ul>
          {profile.importantNote ? (
            <div className="mt-8 flex gap-3 border-l-2 border-orange-500 bg-page-alt p-4">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-orange-700" />
              <p className="text-sm leading-relaxed text-ink-muted">{profile.importantNote}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
