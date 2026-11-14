import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { LogoCredit } from "@/content/trust";
import { intrinsic } from "@/lib/responsive-image";
import { useVisibleMotion } from "@/hooks/use-visible-motion";

/**
 * A continuous logo lane, restyled from the production site's
 * `CommissioningStrip`. The scroll behaviour is that component's, not an
 * approximation — see `.logo-marquee` in styles.css for the half-gap
 * correction the loop depends on, the hover/focus pause that WCAG 2.2.2
 * requires, and the reduced-motion fallback.
 *
 * The lane itself is aria-hidden decorative motion; the names ride alongside
 * as a real visually-hidden list, so assistive tech gets the content rather
 * than a wall of unreachable images.
 *
 * `plateClassName` exists because the two places this is used want different
 * plate geometry, not different behaviour: the council panel runs fixed-size
 * plates against pre-normalised artwork, where anything else would reintroduce
 * the ragged row the normalisation was done to fix.
 */
export function LogoMarquee({
  items,
  label,
  className,
  plateClassName,
  imgClassName,
  focusable = false,
  progressiveImages = false,
  durationSeconds = 40,
}: {
  items: (LogoCredit & { artwork?: { w: number; h: number }; blurb?: string })[];
  /** Accessible name for the list of credits behind the lane. */
  label: string;
  className?: string;
  /** Overrides the plate box. Defaults to the original height-driven plate. */
  plateClassName?: string;
  /** Overrides how the artwork sits inside the plate. */
  imgClassName?: string;
  /** Allow keyboard scrolling when this lane uses a reduced-motion overflow view. */
  focusable?: boolean;
  /** Decode upcoming images before transform-driven motion brings them into view. */
  progressiveImages?: boolean;
  /** Keep the lane's reading speed consistent as its catalogue grows. */
  durationSeconds?: number;
}) {
  // Duplicated once so the translate loops seamlessly. Keys carry the index
  // because every logo appears twice.
  const lane = [...items, ...items];
  const { ref, playing } = useVisibleMotion<HTMLDivElement>();
  const [interactive, setInteractive] = useState(false);

  useEffect(() => { setInteractive(true); }, []);

  useEffect(() => {
    if (!progressiveImages || !ref.current) return;
    const images = ref.current.querySelectorAll<HTMLImageElement>("img");
    if (typeof IntersectionObserver === "undefined") {
      images.forEach((image) => { image.loading = "eager"; });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLImageElement).loading = "eager";
        observer.unobserve(entry.target);
      }
    }, { root: ref.current, rootMargin: "0px 1200px", threshold: 0 });
    images.forEach((image) => observer.observe(image));
    return () => observer.disconnect();
  }, [progressiveImages, items, ref]);

  return (
    <div
      ref={ref}
      data-motion={playing ? "running" : "paused"}
      data-interactive={interactive ? "true" : "false"}
      className={cn("logo-marquee", className)}
      style={{ "--marquee-duration": `${durationSeconds}s`, "--marquee-touch-duration": `${durationSeconds * 1.5}s` } as CSSProperties}
      tabIndex={focusable ? 0 : undefined}
      role={focusable ? "region" : undefined}
      aria-label={focusable ? label : undefined}
      onPointerDown={focusable ? event => {
        if (event.pointerType !== "mouse") event.currentTarget.focus({ preventScroll: true });
      } : undefined}
      onBlur={focusable ? event => {
        // Native reading mode can reach the far end of a long catalogue.
        // Reset that scroll offset before the transform-driven loop returns.
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          event.currentTarget.scrollLeft = 0;
        }
      } : undefined}
    >
      <div className="logo-marquee__track" aria-hidden="true">
        {lane.map((item, i) => (
          <span
            key={`${item.name}-${i}`}
            // The second lane exists only to make the loop seamless. Under
            // reduced motion the track wraps instead of scrolling, so the
            // clone is hidden or every council would appear twice.
            {...(i >= items.length ? { "data-clone": "true" } : null)}
            title={item.blurb ? `${item.name}: ${item.blurb}` : item.name}
            className={cn(
              /* The hairline is wave 412's, and it is what keeps a white
                 plate a plate. The lane used to run on a navy band, where
                 white alone was the whole separation; on the light page the
                 plate and the ground are the same colour and a crest would
                 otherwise float in nothing. */
              "inline-flex shrink-0 items-center justify-center rounded-lg border border-rule bg-white",
              plateClassName ?? "h-14 px-3 py-3",
            )}
          >
            {/* Long catalogues use the observer above to eagerly decode nearby
                images before they slide in. Default short lanes retain the
                original eager-loading behavior documented below.

                ⚠ WAVE 490: `eager`, AND THAT IS NOT AN OPTIMISATION IN
                REVERSE. Chrome decides `loading="lazy"` off an element's
                LAYOUT position and knows nothing about the transform that is
                moving it. This track is 3,082px wide at 390 inside a 390px
                window, so 32 of its 36 tiles are parked outside the viewport
                for ever: measured on 25 September 2026, 4 of 36 were ever
                requested at 390 and 8 of 41 images had decoded after three
                seconds of standing on the strip. What a phone showed was a
                row of empty white plates gliding past with a crest popping
                into one now and then.

                `fetchpriority="low"` is the other half: these are decoration,
                but decoration that has to be there, so they are fetched
                without competing with the hero photographs for the first
                screen. Eighteen distinct crests at 4.1KB each is 74KB, and
                the lane renders each of them twice against one URL, so the
                browser makes eighteen requests and not thirty-six.

                ⚠ WAVE 490b: AND THEY STAY `low`, WHICH WAS MEASURED BOTH WAYS.
                On a cold slow 4G load scrolled to the strip on the first frame
                its stylesheet applies (about 1.4s after navigation), 0 of the
                4 crests on screen at 390 and 0 of the 3 at 360 have decoded
                1.5s later, and they land by +3.25s at 390 and +2.75s at 360.
                That was measured at 360 and 390 only: at 1280 the page went
                back to the top when it hydrated and took the strip off screen
                before the crests landed, so the 1280 cold landing time is
                unmeasured (docs/wave490/gate.txt, the two item1 councils cold
                @ 1280 lines). The first nine at `high` do decode inside
                the 1.5s, and Lighthouse mobile, five runs each, then puts the
                home page's LCP (the hero photograph) at 6,654ms against 6,353
                at `low`: 300ms of the first screen for everyone, bought for
                the visitor who scrolls 3,000px inside 1.4s. The trade goes to
                the first screen. Once the page has loaded, the crests on
                screen are decoded within 1.5s of the strip arriving; the cold
                case is a finding in docs/WAVE490_REPORT.md, item 1.

                AND THE PLATE IS THE SPAN, NOT THE IMAGE, which is what keeps
                this inside the `ImageFade` invariant. A tile that has not
                decoded shows the white plate and its hairline with nothing in
                it; the image fades in on top. Nothing is hidden in the markup
                and nothing waits at opacity 0 for JavaScript. */}
            {item.logo && <img
              src={item.logo}
              alt=""
              loading={progressiveImages ? "lazy" : "eager"}
              fetchPriority="low"
              decoding="async"
              className={cn("object-contain", imgClassName ?? "h-full w-auto max-w-[9rem]")}
              width={item.artwork?.w ?? intrinsic(item.logo)?.width}
              height={item.artwork?.h ?? intrinsic(item.logo)?.height}
            />}
            {!item.logo && <span className="whitespace-normal text-center text-sm font-semibold leading-tight text-ink">{item.name}</span>}
          </span>
        ))}
      </div>

      {/* The marquee is decoration; this is the content. */}
      <ul className="sr-only">
        <li>{label}</li>
        {items.map((item) => (
          <li key={item.name}>{item.name}{item.blurb ? `: ${item.blurb}` : ""}</li>
        ))}
      </ul>
    </div>
  );
}
