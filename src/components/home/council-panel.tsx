import { useEffect, useState, type ComponentType } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import { LogoMarquee } from "@/components/ui/logo-marquee";
import { authorityPreview } from "@/content/authority-preview";
import { councilsEyebrow, councilsStatement } from "@/content/trust";
import "./council-panel.css";

/** A bounded preview; the complete catalogue is requested only when opened. */
export function CouncilPanel() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [open, setOpen] = useState(false);
  const [Directory, setDirectory] = useState<ComponentType | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    setInteractive(true);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open || Directory) return;
    let current = true;
    setLoadFailed(false);
    void import("./local-authority-directory")
      .then((module) => {
        if (current) setDirectory(() => module.LocalAuthorityDirectory);
      })
      .catch(() => {
        if (current) setLoadFailed(true);
      });
    return () => {
      current = false;
    };
  }, [open, Directory, attempt]);

  const motionLabel =
    reducedMotion || open ? "Logo animation is off" : paused ? "Resume logos" : "Pause logos";

  return (
    <section
      aria-labelledby="commissioning-councils"
      className="council-panel border-y border-rule bg-page py-6 sm:py-7"
    >
      <h2 id="commissioning-councils" className="sr-only">
        {councilsEyebrow}
      </h2>
      <p className="px-5 text-center sm:px-8">
        <span className="eyebrow tracking-[0.14em] text-teal-600">{councilsStatement}</span>
      </p>

      <div className="mx-auto mt-5 grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-4 sm:px-8">
        <div
          id="council-logo-preview"
          className="min-w-0"
          data-council-paused={paused || open ? "true" : "false"}
        >
          <LogoMarquee
            items={authorityPreview}
            label="A selection of local authorities across the UK"
            plateClassName="h-16 w-[136px] overflow-hidden sm:h-[68px] sm:w-[148px]"
            imgClassName="size-full"
          />
        </div>
        <button
          type="button"
          aria-label={motionLabel}
          title={motionLabel}
          aria-controls="council-logo-preview"
          disabled={!interactive || reducedMotion || open}
          onClick={() => setPaused((value) => !value)}
          className="council-motion-toggle inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-rule bg-page text-ink-muted transition-colors hover:border-teal-600 hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 disabled:cursor-default disabled:opacity-50"
        >
          {paused && !open && !reducedMotion ? (
            <Play size={17} aria-hidden="true" />
          ) : (
            <Pause size={17} aria-hidden="true" />
          )}
        </button>
      </div>

      <details
        className="council-directory-disclosure mx-auto mt-3 max-w-6xl px-5 sm:px-8"
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center justify-center gap-2 rounded-full px-4 py-2 text-center text-sm font-semibold text-ink transition-colors hover:bg-cream-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
          View all 382 local authorities
          <ChevronDown className="council-disclosure-icon size-4 shrink-0" aria-hidden="true" />
        </summary>
        <div className="pt-6 pb-2">
          {Directory ? (
            <Directory />
          ) : interactive && open ? (
            <div className="rounded-2xl border border-rule px-5 py-6 text-center">
              <p role="status" className="text-sm leading-relaxed text-ink-muted">
                {loadFailed
                  ? "The directory could not load. Try again or open the complete directory."
                  : "Loading local authorities…"}
              </p>
              {loadFailed ? (
                <button
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-rule px-4 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
                >
                  Try again
                </button>
              ) : null}
              <a
                href="/local-authorities/"
                className="mt-2 flex min-h-11 items-center justify-center text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
              >
                Open the complete directory
              </a>
            </div>
          ) : null}
          <noscript>
            <p className="text-center text-sm leading-relaxed text-ink-muted">
              Browse every local authority in the{" "}
              <a
                href="/local-authorities/"
                className="inline-flex min-h-11 items-center font-semibold text-teal-600 underline underline-offset-4"
              >
                complete UK directory
              </a>
              .
            </p>
          </noscript>
        </div>
      </details>
    </section>
  );
}
