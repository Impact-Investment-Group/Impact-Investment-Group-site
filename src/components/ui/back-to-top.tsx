import * as React from "react";
import { ArrowUp } from "lucide-react";

/**
 * Back to top.
 *
 * ── THE JOB ───────────────────────────────────────────────────────────────
 *
 * Several routes on this site are long: /platform, /legal and the ten partner
 * pages all run past four screens, and the navigation is at the top of all of
 * them. Without this, getting back to the menu from the foot of /legal is a
 * scroll of several seconds or a swipe the visitor has to keep repeating. One
 * press is the whole point.
 *
 * ── WHY IT IS NOT ALWAYS THERE ────────────────────────────────────────────
 *
 * It appears after TWO viewports of scroll, and not before. A control that
 * says "back to top" while the top is still on the screen is one more thing in
 * the corner of every page, on every route, for no gain. Two viewports is the
 * point at which the header has been out of sight long enough to be missed.
 *
 * ── WHY IT IS NOT AN ELEMENT WAITING AT OPACITY 0 ─────────────────────────
 *
 * It is not rendered at all until it is wanted. The wave 412 invariant is that
 * nothing on this site is invisible without JavaScript, and the cheapest way
 * to keep it is for the markup not to carry the thing at all: the prerendered
 * HTML has no back-to-top button in it, so there is nothing to be stuck
 * hidden. The fade is an entrance on an element that did not exist a frame
 * ago, which is the only kind of entrance this wave allows.
 *
 * The fade OUT is why there are two pieces of state rather than one: the
 * element has to outlive the decision to remove it for as long as the exit
 * takes, or it would vanish rather than leave.
 */

/** Viewports of scroll before the control is offered. */
const APPEAR_AFTER_VIEWPORTS = 2;
/** Must match --duration-route in styles.css, which times the exit. */
const EXIT_MS = 200;

/**
 * ⚠ WAVE 490, PHONE RULE 3: THE CONTROL IS OFFERED FROM `lg` AND NOT BELOW IT,
 * AND THAT IS A MEASUREMENT RATHER THAN A PREFERENCE.
 *
 * Rule 3 says nothing floats over words: a fixed control's box may meet no
 * text node's box and no other control's box. On this site that is a statement
 * about ARITHMETIC, not about which corner the control is put in.
 *
 * At 390 the page's gutters are 20px and the content column is the other
 * 350px. A 44px circle placed against either gutter therefore covers 44 of
 * those 350px, which is an eighth of every line it lands on. Wave 414 put it
 * against the LEFT gutter, where it covered the first 44px of whatever line
 * was at the foot of the viewport, which is what the wave 490 brief measured
 * and what item 8 was raised about. Putting it back against the RIGHT gutter,
 * which this wave did first, moves it on to the ENDS of those lines instead:
 * measured over eleven routes after two viewports of scroll, 5 intersections
 * at 360, 10 at 390, 7 at 414, 2 at 667x375 and 1 at 768.
 *
 * There is no third position. A phone has no gutter wide enough to hold a
 * 44px target beside a full-width column, and 44px is rule 6's floor, so the
 * control cannot be made smaller either.
 *
 * At 1280 there is room and the same reading is **0 intersections on all ten
 * chromed routes**, which is why the control keeps the desktop unchanged. The
 * breakpoint is `lg`, the width at which the rest of this site switches to its
 * desktop composition: the demand map becomes pressable, the solutions rail
 * becomes a side rail, and the register journey's sticky bands stop sticking.
 *
 * NOT RENDERED rather than hidden with CSS, so there is no tab stop and no
 * markup for a phone to carry. A phone still has the browser's own way back to
 * the top; what it no longer has is a button sitting on the last line it was
 * reading. Section 9 of the report proposes what a phone control would need.
 */
const OFFERED_FROM = "(min-width: 1024px)";

export function BackToTop() {
  const [mounted, setMounted] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [offered, setOffered] = React.useState(false);
  const exitTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const query = window.matchMedia(OFFERED_FROM);
    const read = () => setOffered(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > APPEAR_AFTER_VIEWPORTS * window.innerHeight;
      setShown(past);
      if (past) {
        if (exitTimer.current) {
          clearTimeout(exitTimer.current);
          exitTimer.current = null;
        }
        setMounted(true);
      } else if (!exitTimer.current) {
        exitTimer.current = setTimeout(() => {
          exitTimer.current = null;
          setMounted(false);
        }, EXIT_MS);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  if (!mounted || !offered) return null;

  return (
    <button
      type="button"
      data-state={shown ? "in" : "out"}
      /* The one aria-label this wave adds, and it is on an icon-only control,
         which is the only place the brief allows a new string. Plain words. */
      aria-label="Back to top"
      onClick={() => {
        window.scrollTo({
          top: 0,
          // Under reduced motion a several-thousand-pixel smooth scroll is the
          // single most nauseating thing a page can do, so it is a jump.
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }}
      className="back-to-top press fixed bottom-6 left-5 z-40 grid size-11 place-items-center rounded-full border border-rule bg-page text-ink shadow-[var(--shadow-card)] hover:border-teal-600 hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
    >
      <ArrowUp aria-hidden="true" className="size-5" strokeWidth={1.6} />
    </button>
  );
}
