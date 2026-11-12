import { useEffect, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { LogoMarquee } from "@/components/ui/logo-marquee";
import { authorityCarousel } from "@/content/authority-carousel";
import { councilsEyebrow, councilsStatement } from "@/content/trust";
import "./council-panel.css";

/** The original slim logo strip, with the complete UK council roster. */
export function CouncilPanel() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    setInteractive(true);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  const motionLabel = reducedMotion ? "Logo animation is off" : paused ? "Resume logos" : "Pause logos";

  return (
    <section
      aria-labelledby="commissioning-councils"
      className="council-panel border-y border-rule bg-page py-6 sm:py-7"
      data-council-interactive={interactive ? "true" : "false"}
      style={{
        "--council-loop-duration": `${(authorityCarousel.length / 18) * 60}s`,
        "--council-touch-duration": `${(authorityCarousel.length / 18) * 90}s`,
      } as CSSProperties}
    >
      <h2 id="commissioning-councils" className="sr-only">{councilsEyebrow}</h2>
      <p className="px-5 text-center sm:px-8">
        <span className="eyebrow tracking-[0.14em] text-teal-600">{councilsStatement}</span>
      </p>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-4 sm:px-8">
        <div id="council-logo-preview" className="min-w-0" data-council-paused={paused ? "true" : "false"}>
          <LogoMarquee
            items={authorityCarousel}
            label="All UK local authorities"
            focusable
            progressiveImages
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            plateClassName="h-16 w-[136px] overflow-hidden sm:h-[68px] sm:w-[148px]"
            imgClassName="size-full"
          />
        </div>
        <button
          type="button"
          aria-label={motionLabel}
          title={motionLabel}
          aria-controls="council-logo-preview"
          disabled={!interactive || reducedMotion}
          onClick={() => setPaused((value) => !value)}
          className="council-motion-toggle inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-rule bg-page text-ink-muted transition-colors hover:border-teal-600 hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 disabled:cursor-default disabled:opacity-50"
        >
          {paused && !reducedMotion ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}
