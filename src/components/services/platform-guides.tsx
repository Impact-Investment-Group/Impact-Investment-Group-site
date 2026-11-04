import * as React from "react";
import { Link } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Expand,
  ExternalLink,
  Monitor,
  X,
} from "lucide-react";
import { platformGuides, type PlatformGuide } from "@/content/platform-guides";
import "./platform-guides.css";

const platformOrigin = "https://app.impactinvestmentgroup.co.uk";
const firstGuide = platformGuides[0];
const quickRoles = [
  { id: "investor", label: "Investor" },
  { id: "management-agent", label: "Housing Management Agent" },
  { id: "care-provider", label: "Care Provider" },
];

interface GuideScreen {
  key: string;
  label: string;
  alt: string;
}

const managementScreens: GuideScreen[] = [
  {
    key: "management-agent-dashboard",
    label: "Dashboard",
    alt: "The Management Agent dashboard with demonstration housing records",
  },
  {
    key: "management-agent",
    label: "Properties",
    alt: "The Management Agent properties workspace with demonstration housing records",
  },
  {
    key: "management-agent-contacts",
    label: "Contacts",
    alt: "The Management Agent contacts workspace with demonstration records",
  },
  {
    key: "management-agent-maintenance",
    label: "Maintenance",
    alt: "The Management Agent maintenance workspace with demonstration jobs",
  },
  {
    key: "management-agent-compliance",
    label: "Compliance",
    alt: "The Management Agent compliance workspace with demonstration records",
  },
  {
    key: "management-agent-calendar",
    label: "Calendar",
    alt: "The Management Agent calendar with demonstration scheduled work",
  },
];
const managementStepScreens = [
  "management-agent-dashboard",
  "management-agent",
  "management-agent-contacts",
  "management-agent-maintenance",
  "management-agent-calendar",
];

function initialScreen(guide: PlatformGuide) {
  return guide.id === "management-agent" ? managementStepScreens[0] : guide.screenshot.key;
}

function guideFromHash(hash: string) {
  if (!hash.startsWith("#role-")) return null;
  return platformGuides.find((guide) => `#role-${guide.id}` === hash) ?? null;
}

function ScreenshotViewer({ guide, screen }: { guide: PlatformGuide; screen: GuideScreen }) {
  const [open, setOpen] = React.useState(false);
  const src = `/images/platform-guides/${screen.key}.webp`;

  React.useEffect(() => {
    setOpen(false);
  }, [guide.id]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <figure className="platform-guides__capture">
        <div className="platform-guides__capture-heading">
          <span>
            <Monitor size={17} aria-hidden="true" />
            {screen.label}
          </span>
          <span className="platform-guides__preview-label">Interface preview</span>
        </div>
        <DialogPrimitive.Trigger asChild>
          <button
            type="button"
            className="platform-guides__image-button"
            aria-label={`View larger ${guide.label} screenshot`}
            data-testid="platform-guide-screenshot"
          >
            <img
              src={src}
              alt={screen.alt}
              width={1300}
              height={820}
              loading="lazy"
              decoding="async"
            />
            <span className="platform-guides__enlarge">
              <Expand size={16} aria-hidden="true" />
              View larger
            </span>
          </button>
        </DialogPrimitive.Trigger>
        <figcaption>{guide.screenshot.caption}</figcaption>
      </figure>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="platform-guides__dialog-overlay" />
        <DialogPrimitive.Content className="platform-guides__dialog">
          <div className="platform-guides__dialog-heading">
            <div>
              <DialogPrimitive.Title className="platform-guides__dialog-title">
                {guide.label}: {screen.label}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="platform-guides__dialog-description">
                {guide.screenshot.caption}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="platform-guides__close" aria-label="Close screenshot">
              <X size={22} aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div
            className="platform-guides__dialog-viewport"
            role="region"
            aria-label="Full-size platform screenshot"
            tabIndex={0}
          >
            <img src={src} alt={screen.alt} width={1300} height={820} />
          </div>
          <p className="platform-guides__dialog-hint">Scroll to explore the full-size image.</p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function PlatformGuides() {
  const [roleId, setRoleId] = React.useState(firstGuide.id);
  const [activeStep, setActiveStep] = React.useState(0);
  const [screenKey, setScreenKey] = React.useState(initialScreen(firstGuide));
  const sectionRef = React.useRef<HTMLElement>(null);
  const guide = platformGuides.find((item) => item.id === roleId) ?? firstGuide;
  const step = guide.steps[activeStep] ?? guide.steps[0];
  const screens: GuideScreen[] =
    guide.id === "management-agent"
      ? managementScreens
      : [
          {
            key: guide.screenshot.key,
            label: guide.kind === "partner" ? "Connected workspace" : "Workspace overview",
            alt: guide.screenshot.alt,
          },
        ];
  const screen = screens.find((item) => item.key === screenKey) ?? screens[0];

  const activateRole = React.useCallback((next: PlatformGuide) => {
    setRoleId(next.id);
    setActiveStep(0);
    setScreenKey(initialScreen(next));
  }, []);

  React.useEffect(() => {
    let scrollFrame = 0;
    const readHash = () => {
      const next = guideFromHash(window.location.hash);
      if (!next) return;
      activateRole(next);
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      });
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
    };
  }, [activateRole]);

  function chooseRole(id: string) {
    const next = platformGuides.find((item) => item.id === id);
    if (!next) return;
    activateRole(next);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}#role-${next.id}`,
    );
  }

  function chooseStep(index: number) {
    const next = Math.max(0, Math.min(index, guide.steps.length - 1));
    setActiveStep(next);
    if (guide.id === "management-agent") setScreenKey(managementStepScreens[next]);
  }

  return (
    <section
      id="platform-guides"
      className="platform-guides"
      aria-labelledby="platform-guides-heading"
      ref={sectionRef}
      data-testid="platform-guides"
    >
      <div className="platform-guides__intro">
        <div>
          <p className="platform-guides__eyebrow">Explore the platform</p>
          <h2 id="platform-guides-heading">See your side of the platform.</h2>
          <p className="platform-guides__lead">
            Choose a role. Explore the real interface. Follow the steps.
          </p>
        </div>
        <div className="platform-guides__role-field">
          <label htmlFor="platform-guide-role">Choose your role</label>
          <div className="platform-guides__select-wrap">
            <select
              id="platform-guide-role"
              value={roleId}
              onChange={(event) => chooseRole(event.target.value)}
            >
              <optgroup label="Platform workspaces">
                {platformGuides
                  .filter((item) => item.kind === "platform")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Partner pathways">
                {platformGuides
                  .filter((item) => item.kind === "partner")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </optgroup>
            </select>
            <ChevronDown size={19} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="platform-guides__quick-roles" role="group" aria-label="Explore a role">
        {quickRoles.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={roleId === item.id}
            aria-controls="platform-guide-workspace"
            onClick={() => chooseRole(item.id)}
          >
            {item.label}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>

      <article
        id={`role-${guide.id}`}
        className="platform-guides__shell"
        aria-labelledby="platform-guide-title"
        data-role={guide.id}
        data-kind={guide.kind}
      >
        <div id="platform-guide-workspace" className="platform-guides__workspace">
          <div className="platform-guides__role-summary" key={guide.id}>
            <p className="platform-guides__type">
              {guide.kind === "platform" ? "Platform workspace" : "Partner pathway"}
            </p>
            <h3 id="platform-guide-title">{guide.label}</h3>
            <p className="platform-guides__summary">{guide.summary}</p>
            <ul className="platform-guides__features">
              {guide.features.map((feature) => (
                <li key={feature}>
                  <Check size={16} aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {guide.kind === "platform" ? (
              <a className="platform-guides__text-link" href={guide.entryHref}>
                Open the platform
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            ) : (
              <Link className="platform-guides__text-link" to="/contact">
                Talk to our team
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="platform-guides__visual">
            <ScreenshotViewer guide={guide} screen={screen} />
            {screens.length > 1 ? (
              <div
                className="platform-guides__screens"
                role="group"
                aria-label="Management Agent screens"
              >
                {screens.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={screen.key === item.key}
                    onClick={() => setScreenKey(item.key)}
                    aria-controls="platform-guide-workspace"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="platform-guides__walkthrough">
          <div className="platform-guides__walkthrough-heading">
            <h4>
              {guide.kind === "platform"
                ? "Your step-by-step guide"
                : "Your partnership, step by step"}
            </h4>
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="platform-guides__counter"
            >
              <span className="sr-only">{guide.label}: </span>Step {activeStep + 1} of{" "}
              {guide.steps.length}
            </p>
          </div>
          <nav
            className="platform-guides__step-nav"
            aria-label={`${guide.label} walkthrough steps`}
          >
            <ol>
              {guide.steps.map((item, index) => (
                <li key={item.title}>
                  <button
                    type="button"
                    aria-current={activeStep === index ? "step" : undefined}
                    aria-controls="platform-guide-step"
                    onClick={() => chooseStep(index)}
                  >
                    <span className="platform-guides__step-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div
            id="platform-guide-step"
            className="platform-guides__step-panel"
            role="region"
            aria-labelledby="platform-guide-step-title"
          >
            <div className="platform-guides__step-story" key={`${guide.id}-${activeStep}`}>
              <p className="platform-guides__step-kicker" aria-hidden="true">
                {String(activeStep + 1).padStart(2, "0")}
              </p>
              <div>
                <h5 id="platform-guide-step-title">{step.title}</h5>
                <p>{step.description}</p>
                {guide.kind === "platform" && step.route ? (
                  <a className="platform-guides__text-link" href={platformOrigin + step.route}>
                    Open this step in the platform
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="platform-guides__step-controls">
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => chooseStep(activeStep - 1)}
                aria-controls="platform-guide-step"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                disabled={activeStep === guide.steps.length - 1}
                onClick={() => chooseStep(activeStep + 1)}
                aria-controls="platform-guide-step"
              >
                Next
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="platform-guides__footer">
          <Link to="/contact" className="platform-guides__contact">
            {guide.kind === "partner" ? "Talk to our team" : "Talk us through your needs"}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          {guide.partnerHref ? (
            <a className="platform-guides__text-link" href={guide.partnerHref}>
              Explore this partnership
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </article>
    </section>
  );
}
