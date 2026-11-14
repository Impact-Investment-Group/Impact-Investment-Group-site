import { LogoMarquee } from "@/components/ui/logo-marquee";
import { authorityCarousel } from "@/content/authority-carousel";
import { councilsEyebrow, councilsStatement } from "@/content/trust";

/** The original slim logo strip, with the complete UK council roster. */
export function CouncilPanel() {
  return (
    <section
      data-buddy-topic="property"
      aria-labelledby="commissioning-councils"
      className="council-panel border-y border-rule bg-page py-6 sm:py-7"
    >
      <h2 id="commissioning-councils" className="sr-only">{councilsEyebrow}</h2>
      <p className="px-5 text-center sm:px-8">
        <span className="eyebrow tracking-[0.14em] text-teal-600">{councilsStatement}</span>
      </p>
      <div className="mt-5 min-w-0 px-4 sm:px-8">
        <div id="council-logo-preview" className="min-w-0">
          <LogoMarquee
            items={authorityCarousel}
            label="All UK local authorities"
            focusable
            progressiveImages
            durationSeconds={(authorityCarousel.length / 18) * 60}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            plateClassName="h-16 w-[136px] overflow-hidden sm:h-[68px] sm:w-[148px]"
            imgClassName="size-full"
          />
        </div>
      </div>
    </section>
  );
}
