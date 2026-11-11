import { IMAGE_VARIANTS } from "@/lib/image-variants";

/**
 * ── WAVE 414: A PHONE DOES NOT DOWNLOAD A 1600px PICTURE ──────────────────
 *
 * Phone rule 6. Before this, the site had one size of every photograph and a
 * 390px screen fetched all of it: `/partner-with-investor` weighed 2,094 KiB
 * with a single 1,253 KiB network illustration in it, and the home page
 * 1,738 KiB. Measured by Lighthouse mobile against a gzipping server.
 *
 * `scripts/wave414-responsive-images.py` writes the smaller copies and
 * `image-variants.ts` records which ones it actually wrote. This builds the
 * `srcset` from that record rather than from a list of widths somebody keeps
 * in step by hand, which is the difference between a `srcset` and a set of
 * 404s: the script refuses any step that does not come out smaller than its
 * own source, so the steps that exist are not the steps anybody would guess.
 *
 * THE ORIGINAL IS THE LAST CANDIDATE BY DEFAULT, at its own width, so a wide
 * screen still gets the full picture. A browser with no `srcset` support gets
 * one from `src` whatever this returns; nothing here can make an image not
 * load, and that stays true with `withOriginal: false` below.
 *
 * ── WAVE 421c: WHY ONE IMAGE OPTS OUT OF ITS OWN ORIGINAL ─────────────────
 *
 * `withOriginal: false` drops the source from the candidate list and leaves
 * the generated steps. It exists for a picture that NEVER needs its full
 * width at any density, and there is exactly one: the hero's street ground,
 * painted at a fifth of its own strength under a warm haze.
 *
 * It is a CORRECTNESS guard and not an optimisation, which is why it is here
 * rather than expressed as one more careful line of `sizes`. Three passes of
 * this wave each fixed the density band the last reviewer happened to name,
 * and each time the mechanism was the same: `sizes` is in CSS pixels, the
 * browser multiplies by the density, and one band's arithmetic came out over
 * 960. The candidates for that image are 400, 640 and 960 with nothing
 * between 960 and the 1672px source, so every such error selected the source.
 *
 * TAKE THE SOURCE OUT OF THE LIST AND NO ARITHMETIC ERROR IN `sizes` CAN
 * SELECT IT, because it is not a candidate. The worst a future mistake can
 * now do to this image is serve the 960px step to a screen that could have
 * used more, which is a soft picture rather than a 199KB decode on the home
 * page's critical path. The density branches in SIZES_HERO_GROUND stay, and
 * they are the belt: they keep the file the browser picks correct, and this
 * keeps it from ever being the wrong file.
 *
 * ⚠ DO NOT SPREAD THIS TO PHOTOGRAPHS A READER LOOKS AT. The three hero
 * pictures, the partner illustrations and the portraits all keep their
 * originals: a wide screen should have them, and none of them is a wash.
 */
export function variantSrcSet(
  src: string | undefined,
  { withOriginal = true }: { withOriginal?: boolean } = {},
): string | undefined {
  if (!src) return undefined;
  const entry = IMAGE_VARIANTS[src];
  if (!entry) return undefined;
  const dot = src.lastIndexOf(".");
  const stem = dot === -1 ? src : src.slice(0, dot);
  const steps = entry.steps.map((step) => `${stem}-${step}.webp ${step}w`);
  return (withOriginal ? [...steps, `${src} ${entry.width}w`] : steps).join(", ");
}

/**
 * The picture's own pixel dimensions, for the `width` and `height` attributes.
 *
 * The other half of rule 6, and the half a visitor feels rather than pays
 * for. An `<img>` with no `width`/`height` has no aspect ratio until its
 * bytes arrive, so the browser reserves nothing and every line under it jumps
 * when it lands. Measured before this: `/partner-with-investor` scored a
 * cumulative layout shift of 0.149 against Google's 0.1 "good" threshold, and
 * eleven of its images carried no dimensions at all.
 *
 * Read from the generated manifest rather than typed at the call site,
 * because most of these `src` values are expressions (a director's portrait,
 * a partner's illustration, a portal's art) and a literal pair of numbers
 * beside a variable is a pair of numbers that will be wrong.
 */
export function intrinsic(src: string | undefined): { width: number; height: number } | undefined {
  const entry = src ? IMAGE_VARIANTS[src] : undefined;
  return entry ? { width: entry.width, height: entry.height } : undefined;
}

/**
 * A `sizes` for a picture that is as wide as the page's content column.
 *
 * The site's containers are 1200px and 1440px inside 24px gutters, and below
 * 768px every band is one column. Stated as one string rather than written
 * out at each call site, because a `sizes` that is wrong is worse than none:
 * the browser assumes 100vw without it, and 100vw on a 390px screen at 2x
 * asks for 780px, which for a 112px portrait picks a LARGER file than the
 * original would have been.
 */
export const SIZES_FULL_BLEED = "100vw";

/** A picture that fills its column on a phone and shares a row from 768px. */
export const SIZES_HALF_FROM_TABLET = "(min-width: 768px) 50vw, 100vw";

/** One of three across from 768px. */
export const SIZES_THIRD_FROM_TABLET = "(min-width: 768px) 33vw, 100vw";

/**
 * An illustration that sits inside a card rather than running to the gutters.
 *
 * Reserve a smaller image width for artwork inset within a responsive card.
 */
export const SIZES_CARD_ILLUSTRATION = "(min-width: 768px) 50vw, 70vw";

/**
 * The hero's street ground, which is full bleed and no longer invisible.
 *
 * ── WAVE 421: IT WAS "320px" AND THAT WAS A 400px FILE ACROSS 1905px ──────
 *
 * Wave 414 declared this one deliberately smaller than its box, and while the
 * photograph was painted at seven per cent that was right: there was no
 * detail in it to resolve, and 100vw at two device pixels was fetching the
 * 960px copy to draw a ghost nobody could see.
 *
 * Callum asked on 19 September for that ghost to become visible, and the
 * moment it is, "320px" is a 400px source stretched five times across a
 * 1905px hero, which is the softness he could see on the live site before
 * anybody told him what it was. `scripts/wave421-hero-and-footer.py` asserts
 * it: a viewport wider than 640 may not resolve to the 400px step.
 *
 * ── EVERY BRANCH ASKS FOR THE SAME THING: AT MOST 960 DEVICE PIXELS ───────
 *
 * The candidates are 400, 640, 960 and the 1672px original. There is no 1440
 * step, because `scripts/wave414-responsive-images.py` encoded one at 225KB
 * against a 199KB source and refused it by its own rule, so ANY request over
 * 960 device pixels jumps straight to a 1672 by 941 original: seventeen times
 * the pixels of the 400px step this ground used to be, and a decode that is
 * main-thread work. `scripts/wave413-motion.py` budgets zero tasks over 50ms
 * during a full scroll of the home page; with the original in place that
 * probe failed one run in two, with tasks of 67ms, 172ms and 185ms, against
 * a base that is clean five runs out of five.
 *
 * ⚠ `sizes` IS IN CSS PIXELS AND THE BROWSER MULTIPLIES BY THE SCREEN'S
 * DENSITY BEFORE CHOOSING. That is the trap wave 414's note here recorded and
 * then walked into, and this wave walked into it THREE times, each time in a
 * different density band, each time found by the next reviewer:
 *
 *   the 2x band      a single `(min-resolution: 1.5x) 50vw` branch read 50vw
 *                    of 1905 on a 2x desktop and asked for 1905 device
 *                    pixels. Found by this wave's own review sub-agent.
 *   1x to 1.5x       three branches named 1.5x, 2x and 3x and everything
 *                    below 1.5x fell through to the one branch that is not
 *                    divided by its density: 960 CSS pixels at 1.25 is 1200.
 *                    Found by the rel421 verdict.
 *   1.5x to 2x and   the branches WERE divided by a density, but by the BEST
 *   2x to 3x         one in their band rather than the worst: 640 is 960/1.5
 *                    and 480 is 960/2, so 1.99x asked 1274 and 2.99x asked
 *                    1434. Found by the rel421b verdict, which also pointed
 *                    out that the comment here PRINTED 1274 and 1440 under a
 *                    heading that said "at most 960".
 *
 * ⚠ SO THE RULE IS NOW CAP EACH BAND BY ITS OWN UPPER BOUND, and the bands
 * are split wherever that cap would otherwise have to exceed 960. Every
 * figure below is 960 divided by the WORST density the branch can serve,
 * rounded down, and every figure below is under 960:
 *
 *   branch                          band          worst in band   asks
 *   (min-resolution: 288dpi) 320px  3x and up     3x              960
 *   (min-resolution: 240dpi) 320px  2.5x to 3x    2.99x           957
 *   (min-resolution: 192dpi) 384px  2x to 2.5x    2.49x           956
 *   (min-resolution: 168dpi) 480px  1.75x to 2x   1.99x           955
 *   (min-resolution: 144dpi) 544px  1.5x to 1.75x 1.74x           947
 *   (min-resolution: 100dpi) 640px  1.04x to 1.5x 1.49x           954
 *   min(100vw, 960px)               exactly 1x    1x              960
 *
 * AND AT EVERY BAND EDGE, which is where a branch hands over and where an
 * off-by-one would show: 1.5x asks 816, 1.75x asks 840, 2x asks 768, 2.5x
 * asks 800, 2.99x asks 957, 3x asks 960. Every one of them still resolves to
 * the 960px step, so THIS SPLIT MAKES NO MACHINE'S PICTURE SOFTER than the
 * three-branch version it replaces; it only stops four bands asking for a
 * file that no longer exists as a candidate.
 *
 * ⚠ TWO EDGES THIS DOES NOT COVER, NAMED RATHER THAN HIDDEN. 100dpi is
 * 1.0417x, so a custom Windows scaling of 102 or 104 per cent still falls
 * through to the 1x branch and asks 960 times its own ratio; and the 3x
 * branch is unbounded above, so a 4x screen wider than 640 CSS pixels would
 * ask 1280. Neither can select the original on this image any more, because
 * `variantSrcSet(..., { withOriginal: false })` has taken it out of the
 * candidate list, and that is the whole point of doing both halves: the
 * branches are the optimisation and the shorter srcset is the guard.
 *
 * The 1x branch asks for the full viewport rather than half, because there
 * the stretch IS visible; above 1x it asks for half, because this ground is
 * a photograph painted at a FIFTH of its own strength under a warm haze and
 * there is no second device pixel of detail in it to find. A 1.25x desktop
 * therefore asks for 800 device pixels across a 2381 device-pixel box, which
 * is MORE generous than the 960 across 3810 the 2x branch already accepts.
 *
 * ⚠ dpi RATHER THAN x, AND THE REASON IS SAFARI. `min-resolution` in `dpi`
 * has been understood since Chrome 29 and in Firefox since before this site
 * existed; the `x` unit did not reach Firefox until 113. Safari understood
 * neither until 16. A browser that cannot parse the feature treats the
 * condition as false and falls through to the 1x branch, where the density
 * multiplication then picks the original: on Safari 15 and earlier, a 390px
 * phone at 3x asks for 1170 and takes the 199KB file. That is a real cost on
 * a shrinking share of phones and it is the price of not capping the 1x
 * branch so low that a 1x desktop is served a soft picture. Named here rather
 * than left to be discovered.
 *
 * 960 across a 1280 viewport is 0.75 of its box and across 1905 is 0.50. For
 * a photograph at 0.2 under a warm haze that is invisible, and it is a
 * different order of thing from the 0.21 Callum could see. Raise any of these
 * only with the long-task probe in hand, and if a 1440 step ever encodes
 * smaller than its source, prefer it to raising a cap.
 */
export const SIZES_HERO_GROUND = [
  // Every cap is 960 divided by the WORST density its band can serve, so no
  // branch asks for more than 960 device pixels anywhere inside its own band.
  // 421c, rel421b MAJOR 1. The band edges are in the comment above.
  "(min-resolution: 288dpi) min(50vw, 320px)", // 3x and up
  "(min-resolution: 240dpi) min(50vw, 320px)", // 2.5x to 3x
  "(min-resolution: 192dpi) min(50vw, 384px)", // 2x to 2.5x
  "(min-resolution: 168dpi) min(50vw, 480px)", // 1.75x to 2x
  "(min-resolution: 144dpi) min(50vw, 544px)", // 1.5x to 1.75x
  "(min-resolution: 100dpi) min(50vw, 640px)", // just over 1x to 1.5x
  "min(100vw, 960px)", // exactly 1x
].join(", ");

/** A portrait or a small square: never more than a quarter of a phone. */
export const SIZES_PORTRAIT = "(min-width: 1024px) 200px, 30vw";
