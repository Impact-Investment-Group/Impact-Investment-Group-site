import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  HardHat,
  HeartHandshake,
  Home,
  Info,
  Landmark,
  LifeBuoy,
  Network,
  User,
  UserRoundCheck,
  Users,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { PartnerProfile } from "@/content/partners";
import { crisisLines, crisisNote } from "@/content/site";
import {
  SIZES_HALF_FROM_TABLET,
  SIZES_PORTRAIT,
  intrinsic,
  variantSrcSet,
} from "@/lib/responsive-image";

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

const stageVisuals: Record<PartnerProfile["stage"], { image: string; label: string }> = {
  need: { image: "/images/human-insight.jpg", label: "Need, assessment and direction" },
  property: {
    image: "/images/solution-street-blueprint.webp",
    label: "Property, capital and delivery",
  },
  delivery: { image: "/images/human-partnership.jpg", label: "Housing, care and support" },
  outcome: { image: "/images/hero-lives.webp", label: "The person and the outcome" },
};

function RoleIcon({
  profile,
  className = "size-7",
}: {
  profile: PartnerProfile;
  className?: string;
}) {
  const Icon = iconMap[profile.icon] ?? Network;
  return <Icon aria-hidden="true" className={className} />;
}

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
    <Reveal className="mt-10">
      <Dialog>
        <figure className="overflow-hidden rounded-3xl border border-rule bg-white shadow-[var(--shadow-card)]">
          <img
            src={presentation.image}
            alt={presentation.alt}
            loading="lazy"
            className="aspect-[16/9] w-full object-contain"
            srcSet={variantSrcSet(presentation.image)}
            sizes="(min-width: 1200px) 1136px, 100vw"
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

const roleGuideImages = [
  "/images/ai-team/petra.webp",
  "/images/ai-team/peter.webp",
  "/images/ai-team/pippa.webp",
  "/images/ai-team/pippa.webp",
] as const;

function PartnerRoleLedger({ profile }: { profile: PartnerProfile }) {
  const presentation = rolePresentations[profile.id] ?? rolePresentations["investor"]!;

  return (
    <section
      id="role"
      aria-labelledby="role-heading"
      className="relative scroll-mt-20 overflow-hidden bg-page"
    >
      <div className="relative mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 lg:py-20">
        <Reveal className="mx-auto max-w-[850px] text-center">
          <p className="eyebrow tracking-[0.14em] text-teal-600">01 · {presentation.eyebrow}</p>
          <h2
            id="role-heading"
            className="heading-tight mt-3 text-balance text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-tight text-ink"
          >
            {presentation.lead} <span className="text-orange-700">{presentation.accent}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[72ch] text-[16px] leading-relaxed text-ink-muted sm:text-[18px]">
            {profile.whoTheyAre}
          </p>
        </Reveal>

        <div className="mt-11 grid items-end gap-8 lg:grid-cols-[1fr_310px] lg:gap-10">
          <div className="grid gap-3">
            {profile.rolePoints.map((point, index) => (
              <Reveal
                key={point}
                index={index}
                className="group grid min-h-[100px] grid-cols-[36px_1fr] items-center gap-4 rounded-2xl border border-rule bg-white px-4 py-5 text-ink shadow-[var(--shadow-card)] sm:grid-cols-[48px_1fr_104px] sm:px-5"
              >
                <span className="self-start pt-1 font-mono text-lg font-semibold text-teal-600">
                  0{index + 1}
                </span>
                <p className="text-base font-medium leading-relaxed">{point}</p>
                <span className="hidden items-center justify-end gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-teal-800 sm:flex">
                  <span className="hidden sm:inline">
                    {presentation.guideLabels[index] ?? "Guide"}
                  </span>
                  <span className="grid size-10 shrink-0 place-items-end overflow-hidden rounded-full border border-rule bg-page">
                    <img
                      src={roleGuideImages[index] ?? roleGuideImages[0]}
                      loading="lazy"
                      alt=""
                      className="h-[115%] w-full object-contain object-bottom"
                    />
                  </span>
                </span>
              </Reveal>
            ))}
          </div>

          <Reveal className="relative mx-auto min-h-[330px] w-full max-w-[340px] lg:min-h-[390px]">
            <img
              src="/images/ai-team/petra.webp"
              loading="lazy"
              alt="Orange property guide"
              className="absolute bottom-0 left-0 z-30 w-[58%] object-contain drop-shadow-[0_22px_24px_rgba(0,0,0,0.34)]"
              srcSet={variantSrcSet("/images/ai-team/petra.webp")}
              sizes={SIZES_PORTRAIT}
              width={intrinsic("/images/ai-team/petra.webp")?.width}
              height={intrinsic("/images/ai-team/petra.webp")?.height}
            />
            <img
              src="/images/ai-team/peter.webp"
              loading="lazy"
              alt="Blue investment guide"
              className="absolute bottom-0 left-[25%] z-20 w-[58%] object-contain drop-shadow-[0_22px_24px_rgba(0,0,0,0.34)]"
              srcSet={variantSrcSet("/images/ai-team/peter.webp")}
              sizes={SIZES_PORTRAIT}
              width={intrinsic("/images/ai-team/peter.webp")?.width}
              height={intrinsic("/images/ai-team/peter.webp")?.height}
            />
            <img
              src="/images/ai-team/pippa.webp"
              loading="lazy"
              alt="Green impact guide"
              className="absolute bottom-0 right-0 z-10 w-[58%] object-contain drop-shadow-[0_22px_24px_rgba(0,0,0,0.34)]"
              srcSet={variantSrcSet("/images/ai-team/pippa.webp")}
              sizes={SIZES_PORTRAIT}
              width={intrinsic("/images/ai-team/pippa.webp")?.width}
              height={intrinsic("/images/ai-team/pippa.webp")?.height}
            />
            <p className="absolute inset-x-0 -bottom-4 z-40 text-center font-mono text-[10px] max-lg:text-[12px] font-semibold uppercase tracking-[0.11em] text-teal-600">
              {presentation.guideLabels.join(" · ")}
            </p>
          </Reveal>
        </div>
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
      className="relative isolate overflow-hidden border-y border-rule bg-page-alt"
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[48%] -z-10 size-[660px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-600/5 blur-[110px]"
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 lg:py-20">
        <Reveal className="mx-auto max-w-[880px] text-center">
          <p className="eyebrow tracking-[0.16em] text-teal-600">02 · Through the platform</p>
          <h2
            id="platform-heading"
            className="heading-tight mx-auto mt-4 max-w-[24ch] text-balance text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-tight text-ink"
          >
            {presentation.lead} <span className="text-orange-700">{presentation.accent}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-[16px] font-semibold leading-relaxed text-ink-muted sm:text-[18px]">
            {profile.platformIntro}
          </p>
        </Reveal>

        <div
          className="relative mx-auto mt-14 max-w-[1020px] sm:mt-16"
          role="tablist"
          aria-label={`${profile.label} platform journey`}
        >
          <div
            aria-hidden="true"
            className="absolute left-7 top-7 h-[calc(100%-3.5rem)] w-0.5 bg-rule sm:hidden"
          >
            <div
              className="w-full bg-teal-600 motion-safe:transition-[height] motion-safe:duration-300"
              style={{ height: `${activeStep * 50}%` }}
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute left-[16.666%] right-[16.666%] top-7 hidden h-0.5 bg-rule sm:block"
          >
            <div
              className="h-full bg-teal-600 motion-safe:transition-[width] motion-safe:duration-300"
              style={{ width: `${activeStep * 50}%` }}
            />
          </div>

          <div className="relative grid gap-6 sm:grid-cols-3 sm:gap-8">
            {profile.platformSteps.map((step, index) => {
              const selected = activeStep === index;

              return (
                <button
                  key={step}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  role="tab"
                  id={`journey-tab-${index}`}
                  aria-controls="journey-panel"
                  type="button"
                  tabIndex={selected ? 0 : -1}
                  aria-selected={selected}
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
                  className="group grid grid-cols-[56px_1fr] items-center gap-4 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 sm:block sm:text-center"
                >
                  <span
                    className={`relative z-10 grid size-14 place-items-center rounded-2xl border font-mono text-sm font-bold transition-colors duration-200 sm:mx-auto sm:mb-5 ${
                      selected
                        ? "border-teal-600 bg-teal-600 text-white shadow-[var(--shadow-card)]"
                        : "border-rule bg-white text-ink group-hover:border-teal-600"
                    }`}
                  >
                    0{index + 1}
                  </span>
                  <span>
                    <span className="block font-heading text-[20px] font-extrabold text-ink">
                      {presentation.labels[index]}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                      {presentation.readoutTitles[index]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Reveal className="mx-auto mt-12 max-w-[720px] sm:mt-14">
          <div
            id="journey-panel"
            role="tabpanel"
            aria-labelledby={`journey-tab-${activeStep}`}
            tabIndex={0}
            className="rounded-2xl border border-rule border-l-4 border-l-teal-600 bg-white px-6 py-6 shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 sm:px-8"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-teal-600">
                Active checkpoint
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-teal-600/30" />
              {/* text-ink-muted, not text-orange-500. Wave 295's retint took
                  orange-500 to #c15f3c, which measures 4.01:1 on navy-800
                  here (release check, 11 Sep 2026), under the 4.5:1 floor
                  this 10px bold text needs (too small to count as WCAG large
                  text). text-ink-muted is the token the body copy two lines below
                  already uses on this same panel: 11.09:1 here, comfortably
                  clear. Orange stays reserved for what still passes: fills,
                  buttons, large headings, light-surface text. If a lighter
                  orange tint is approved for small text on navy, this is the
                  one place to bring it back. */}
              <span className="font-mono text-xs font-bold text-ink-muted">
                0{activeStep + 1} / 03
              </span>
            </div>
            <p className="mt-4 font-heading text-[clamp(1.45rem,2.5vw,2rem)] font-extrabold leading-tight text-ink">
              {presentation.readoutTitles[activeStep]}
            </p>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-ink-muted sm:text-[16px]">
              {profile.platformSteps[activeStep]}
            </p>
          </div>
        </Reveal>

        <p className="mx-auto mt-8 max-w-[760px] text-center text-[13px] max-lg:text-[15px] font-medium text-teal-600">
          {profile.whyJoin}
        </p>
      </div>
    </section>
  );
}

export function PartnerPage({ profile }: { profile: PartnerProfile }) {
  const headingId = `partner-${profile.id}-heading`;
  const isResident = profile.id === "resident";
  const isInvestor = profile.id === "investor";
  const visual = stageVisuals[profile.stage];
  const networkPresentation =
    connectedNetworkPresentations[profile.id] ?? connectedNetworkPresentations["investor"]!;

  return (
    <div className="partner-page">
      {profile.crisisSignpost ? <CrisisSignpost signpost={profile.crisisSignpost} /> : null}

      <section
        aria-labelledby={headingId}
        className={`page-intro section-light relative isolate overflow-hidden border-b border-rule ${
          isInvestor ? "min-h-[540px]" : "min-h-[610px]"
        }`}
      >
        {/* WAVE 413b: eager. This is the hero band's own visual, in the
          first viewport on every screen, and `lazy` on an in-viewport image
          is the documented anti-pattern: the browser defers the fetch until
          layout, so the ground arrives after the text sitting on it. */}
        <img
          src={visual.image}
          loading="eager"
          alt=""
          /* ⚠ WAVE 414: 10% BELOW 640px, NOT 20%, AND THE SURFACE MOVED
            BECAUSE THE PAIR FAILED.

            From 640px this photograph is 68% of the band, on the
            RIGHT, with its mask fading it out before it reaches the
            words. Below 640px it is the full width at 20% and the
            heading, the lede and both buttons sit ON it. Wave 414's
            re-run of the wave 412 gate measured the secondary
            button's teal-600 label at 4.07:1 off the shot's own
            pixels, against a 4.5:1 floor, on a ground of
            rgb(232, 226, 215): the cream with a photograph through
            it. The flat cream is 4.67:1 and the photograph was
            spending more than the 0.17 of a point that leaves.

            Wave 295's ruling is that where a pairing fails the
            SURFACE moves, never the ink, so the photograph gives way
            on the one width where it is behind the text. The 32% the
            wave 413 image-fade probe asserts is the `sm` value and is
            untouched; that probe runs at 1280. */
          className="absolute inset-y-0 right-0 -z-10 hidden h-full w-full object-cover object-center [mask-image:linear-gradient(to_left,black_20%,transparent_95%)] sm:block sm:w-[68%] sm:opacity-32 lg:w-[58%]"
          srcSet={variantSrcSet(visual.image)}
          sizes={SIZES_HALF_FROM_TABLET}
          width={intrinsic(visual.image)?.width}
          height={intrinsic(visual.image)?.height}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,var(--color-mist-bg)_0%,var(--color-mist-bg)_40%,color-mix(in_srgb,var(--bg-tint)_68%,transparent)_72%,color-mix(in_srgb,var(--bg-tint)_26%,transparent)_100%)]"
        />

        <div
          className={`mx-auto flex w-full max-w-[1200px] items-center px-5 sm:px-8 ${
            isInvestor ? "min-h-[540px] py-12" : "min-h-[610px] py-16"
          }`}
        >
          <Reveal className="max-w-[730px]">
            <Link
              to="/partners"
              className="eyebrow inline-flex min-h-11 items-center gap-2 rounded-lg tracking-[0.1em] text-teal-700 transition-colors hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
            >
              <span aria-hidden="true">←</span> The partner ecosystem
            </Link>
            {isInvestor ? (
              <div className="mt-7 inline-flex items-center gap-3">
                <span aria-hidden="true" className="h-0.5 w-9 bg-orange-700" />
                <p className="eyebrow tracking-[0.16em] text-teal-800">Investor pathway</p>
              </div>
            ) : (
              <div className="mt-7 flex items-center gap-3">
                <span className="grid size-11 place-items-center bg-page text-teal-600">
                  <RoleIcon profile={profile} className="size-5" />
                </span>
                <p className="font-mono text-[10px] max-lg:text-[12px] font-semibold uppercase tracking-[0.13em] text-orange-700">
                  {visual.label}
                </p>
              </div>
            )}
            <h1
              id={headingId}
              className={`heading-tight mt-5 max-w-[14ch] text-balance font-extrabold leading-[0.94] tracking-[-0.04em] text-navy-900 ${
                isInvestor
                  ? "text-[clamp(2.8rem,5.8vw,5.2rem)]"
                  : "text-[clamp(2.8rem,6.4vw,5.7rem)]"
              }`}
            >
              {isResident ? (
                <>
                  The person at the <span className="text-orange-700">centre.</span>
                </>
              ) : (
                <>
                  Partner with <span className="text-orange-700">{profile.pluralLabel}.</span>
                </>
              )}
            </h1>
            {/* ⚠ WAVE 414: ON A PHONE THE PHOTOGRAPH IS ABOVE THE WORDS,
                NEVER BEHIND THEM.

                From 640px the picture is a 32% wash on the right of the band,
                masked away before it reaches the text, and that is the
                approved composition. Below 640px there is no right-hand side:
                the wash covered the whole band and the heading, the lede and
                both buttons sat on top of it. Wave 414's re-run of the wave
                412 gate measured the secondary button's teal-600 label at
                4.07:1 off the shot's own pixels against a 4.5:1 floor, and
                taking the wash from 20% to 10% only reached 4.34:1. The flat
                cream is 4.67:1, so there was never enough room under that
                pair for a photograph of any strength.

                So the wash is gone below 640px and the picture is a real
                photograph instead, at full strength, in the brand's own
                treatment: 12px radius, a 1px rule, no scrim, which is what
                `CLAUDE.md` says a photograph on a light ground gets. It sits
                between the heading and the copy, which is the order phone
                rule 4 asks for: the heading, then the picture, then the
                words, then the action.

                `alt=""` and aria-hidden, unchanged from the wash it replaces:
                it is the same decorative image carrying nothing the copy does
                not, and `visual.label` beside the eyebrow already names it. */}
            <img
              src={visual.image}
              srcSet={variantSrcSet(visual.image)}
              sizes="100vw"
              width={intrinsic(visual.image)?.width}
              height={intrinsic(visual.image)?.height}
              loading="eager"
              alt=""
              aria-hidden="true"
              className="mt-6 aspect-[16/10] w-full rounded-xl border border-rule object-cover sm:hidden"
            />
            <p
              className={`mt-6 max-w-[58ch] text-[18px] leading-relaxed sm:text-[20px] ${
                isInvestor
                  ? "border-l-4 border-orange-700 pl-4 font-semibold text-navy-800"
                  : "text-ink-muted"
              }`}
            >
              {profile.summary}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" asChild>
                <a href="#role">Understand the role</a>
              </Button>
              <Button variant="secondary" asChild withArrow={false}>
                <Link to="/partners">See all ten partners</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <PartnerRoleLedger profile={profile} />

      <PartnerPlatformStack key={profile.id} profile={profile} />

      <section
        id="connected-network"
        aria-labelledby="network-heading"
        className="relative overflow-hidden bg-page"
      >
        <div className="relative mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 lg:py-20">
          <Reveal className="mx-auto max-w-[820px] text-center">
            <p className="eyebrow tracking-[0.14em] text-teal-600">03 · The connected network</p>
            <h2
              id="network-heading"
              className="heading-tight mt-3 text-balance text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-tight text-ink"
            >
              {networkPresentation.lead}{" "}
              <span className="text-orange-700">{networkPresentation.accent}</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[68ch] text-[16px] leading-relaxed text-ink-muted">
              {profile.impactIntro}
            </p>
          </Reveal>

          <ConnectedNetworkDiagram profile={profile} />

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {profile.impactPoints.map((point, index) => (
              <Reveal
                key={point}
                index={index}
                className="flex gap-3 rounded-2xl border border-rule bg-white p-5 text-ink shadow-[var(--shadow-card)]"
              >
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-700" />
                <p className="text-base font-medium leading-relaxed text-ink">{point}</p>
              </Reveal>
            ))}
          </div>

          {profile.importantNote ? (
            <Reveal className="mt-8 flex gap-4 rounded-2xl border border-orange-500/30 bg-orange-500/7 p-4">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-orange-500" />
              <p className="text-[12px] max-lg:text-[15px] leading-relaxed text-ink-muted">
                {profile.importantNote}
              </p>
            </Reveal>
          ) : null}
        </div>
      </section>
    </div>
  );
}
