import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { RoleIcon } from "@/components/register/role-icon";
import { registerRoles } from "@/content/audiences";
import { registerAsDivider } from "@/content/register";
import { cn } from "@/lib/utils";
import { SIZES_HERO_GROUND, variantSrcSet } from "@/lib/responsive-image";

/** Three daylight photographs, paired captions and role-based registration links.
 * On smaller screens, native swipe and labelled controls share the same lane.
 */

const headlines = [
  { id: "homes", text: "Providing Homes", orange: false },
  { id: "support", text: "Delivering Support", orange: true },
  { id: "lives", text: "Transforming Lives", orange: false },
] as const;

/**
 * One size for all three headlines, in `cqw` — a percentage of the panel,
 * whose width is the photograph's width. Sizing each line to fill its own
 * column instead makes the short one visibly larger than the other two, which
 * reads as a mistake rather than as alignment.
 *
 * So the size is set by the widest string and the other two centre under
 * their pictures. Derived from Barlow 800's own advance widths, read off
 * `@fontsource/barlow/files/barlow-latin-800-normal.woff2` at 1000 upem, plus
 * the -0.02em tracking that CSS applies after every character, the last one
 * included:
 *
 *   Providing Homes     7.554em − 15 × 0.02 = 7.254em  → spans 86% of its column
 *   Delivering Support  8.344em − 18 × 0.02 = 7.984em  → spans 95%
 *   Transforming Lives  8.753em − 18 × 0.02 = 8.393em  → the binding one, 100%
 *
 * 100 / 8.393 = 11.91, less 0.5% for sub-pixel rounding. This is the largest
 * common size that fits; anything above it overflows "Transforming Lives".
 * Barlow applies no kerning to any pair in these three strings — checked
 * against its GPOS table, all three total zero — so the fit is exact rather
 * than approximate.
 *
 * If the copy ever changes, re-measure the longest line. Do not nudge by eye.
 */
const HEADLINE_FILL_CQW = 11.85;

/**
 * Served from /public, not imported as modules: the originals were Lovable
 * asset descriptors whose URLs only resolve inside Lovable's hosting, so they
 * rendered as broken images everywhere else.
 *
 * All three are 1280×1024 — exactly the 5:4 the frames are set to, so
 * object-cover never actually crops anything at any viewport. They are the
 * page's LCP, hence fetchPriority high and no lazy loading.
 *
 * 5:4 landscape is not a free choice. In the site's 1440px container the three
 * slots are 445px wide, and what is left of a screen once the headlines, the
 * Register as rule and the ten tiles are accounted for is a little under 380px.
 * 5:4 is the tallest standard ratio that both fills the row and keeps the
 * section inside one screen. The earlier 4:5 portrait set needed 556px of
 * height for the same width, which is why the band had to shrink away from the
 * page edges to fit.
 *
 * Supplied as 1536×1024 and centre-cropped 128px each side. WebP q90 rather
 * than PNG: 4.4 MB became 0.62 MB. The superseded `hero-{1,2,3}-*.png` files
 * in public/images are no longer referenced.
 */
const photos = [
  {
    id: "homes",
    src: "/images/hero-homes.webp",
    width: 1280,
    height: 1024,
    alt: "A woman handing a set of keys to a man outside a brick terrace in daylight",
  },
  {
    id: "support",
    src: "/images/hero-support.webp",
    width: 1280,
    height: 1024,
    alt: "A carer in uniform resting a hand on the shoulder of an older woman in a bright living room",
  },
  {
    id: "lives",
    src: "/images/hero-lives.webp",
    width: 1280,
    height: 1024,
    alt: "A family of four smiling together outside the navy front door of their red-brick home",
  },
] as const;

/**
 * Photograph and headline travel together, so the caption can never drift out
 * of step with the image above it. Matched on the shared id rather than on
 * array position — the two lists are edited independently.
 */
const panels = photos.map((photo) => ({
  ...photo,
  headline: headlines.find((line) => line.id === photo.id) ?? headlines[0],
}));

/* WAVE 838: the co-sourcer tile is drawn on /register only (`pickerOnly`), so
   this strip stays the ten the grid was cut for. */
const heroRoles = registerRoles.filter((role) => !role.pickerOnly);

export function HomeHero() {
  /**
   * Whether the photograph lane is a scrolling strip at this width.
   *
   * It is the media query `.hero-band` uses, read once after mount and kept
   * in step with it, and it exists for ONE attribute that CSS cannot set: the
   * lane's `tabIndex`. Defaulted to false so the prerendered markup is the
   * desktop grid's and nothing can mismatch at hydration; a keyboard visitor
   * on a phone gets the tab stop as soon as the bundle lands, and before that
   * the lane still scrolls with a finger, which is the input a phone has.
   */
  const bandRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollable, setScrollable] = React.useState(false);
  const [activePanel, setActivePanel] = React.useState(0);

  const goToPanel = (index: number) => {
    const band = bandRef.current;
    const panel = band?.children[index] as HTMLElement | undefined;
    const first = band?.firstElementChild as HTMLElement | undefined;
    if (!band || !panel || !first) return;
    band.scrollTo({
      left: panel.offsetLeft - first.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  React.useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const read = () => {
      const first = band.firstElementChild as HTMLElement | null;
      if (!first) return;
      let nearest = 0;
      let distance = Infinity;
      Array.from(band.children).forEach((child, index) => {
        const delta = Math.abs(
          (child as HTMLElement).offsetLeft - first.offsetLeft - band.scrollLeft,
        );
        if (delta < distance) {
          distance = delta;
          nearest = index;
        }
      });
      setActivePanel(nearest);
    };
    band.addEventListener("scroll", read, { passive: true });
    const observer = new ResizeObserver(read);
    observer.observe(band);
    read();
    return () => {
      band.removeEventListener("scroll", read);
      observer.disconnect();
    };
  }, []);
  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const read = () => setScrollable(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex flex-col justify-center overflow-hidden bg-page md:min-h-[calc(100svh_-_77px)]"
    >
      {/* The street, ghosted. Decorative only: it carries no information the
          copy does not, so it is empty-alt and hidden from the tree.

          WAVE 412: the veil over it is white now, not navy.

          WAVE 421: AND IT IS VISIBLE. Callum, 19 September, looking at the
          live site: "Can you add the faded hero image to the background of
          the hero section ... and instead of making it navy faded maybe make
          it faded through orange a little, but still keep the background
          itself white." It was already there at seven per cent under a white
          scrim at 72 to 86, which is a blank. The photograph's own opacity
          and the two layers that warm it both live in .hero-ground and
          .hero-ground-photo in styles.css, together with the measurements
          that chose them.

          z-0 rather than -z-10: a negative index would put it behind the
          section's own background and it would never be seen. The content
          wrappers below therefore have to be positioned to paint over it. */}
      <div
        aria-hidden="true"
        className="hero-ground-layer pointer-events-none absolute inset-0 z-0"
      >
        {/* WAVE 413: eager, because it is in the first viewport on every
            screen, and LOW priority, because it is a ground behind the
            headline rather than one of the three photographs. High priority on
            all four would have put the ground in the same queue as the
            pictures the hero actually exists to show. Still true at wave
            421's opacity: raising a decorative layer's strength does not
            promote it past the content it sits behind. */}
        <img
          /* Named for the gate. `scripts/wave421-hero-and-footer.py` has to
             find this one image on a page full of images, and it used to be
             identified by its opacity class, which is the one thing about it
             wave 421 changes. A data attribute is stable across a retune. */
          data-hero-wash=""
          src="/images/hero-ground-street.webp"
          loading="eager"
          fetchPriority="low"
          width={1672}
          height={941}
          alt=""
          decoding="async"
          className="hero-ground-photo size-full object-cover object-[60%_45%]"
          /* ⚠ WITHOUT THE 1672px ORIGINAL, AND THAT IS A CORRECTNESS
             GUARD RATHER THAN A SAVING. This ground never needs its full
             width at any density, and with the source out of the candidate
             list no arithmetic error in `sizes` can select it: the worst a
             future mistake can do here is serve the 960px step to a screen
             that could have used more. Three passes of this wave each fixed
             one density band and each time the wrong file was the same file.
             See SIZES_HERO_GROUND in src/lib/responsive-image.ts. 421c. */
          srcSet={variantSrcSet("/images/hero-ground-street.webp", {
            withOriginal: false,
          })}
          sizes={SIZES_HERO_GROUND}
        />
        <div className="hero-ground absolute inset-0" />
      </div>

      <h1 id="hero-heading" className="sr-only">
        Providing homes, delivering support, transforming lives
      </h1>

      {/* Row 1 — three photographs, each captioned with its own headline.
          Landscape at every width, and 5:4 is the photographs' own ratio, so
          nothing is ever cropped. From 768px the band is sized off the
          viewport's height rather than the page's width — see .hero-band —
          so the whole section lands inside the first screen. */}
      <div className="hero-shell relative z-10 mx-auto w-full max-w-[1440px] px-5 pt-8 sm:px-8">
        {/* WAVE 414: below 768px this is a horizontal snap strip rather than a
            stack. See `.hero-band` in styles.css for the measurement that
            chose it and for why the scrollbar is hidden.

            THE TAB STOP AND THE NAME. A scroll container that cannot be
            scrolled from the keyboard is axe's `scrollable-region-focusable`,
            serious, so the lane takes `tabIndex` below 768 and nowhere else:
            at 768 and above it is a three-column grid with nothing to scroll
            and a tab stop on it would be a stop that does nothing. The name
            is the hero's own `sr-only` h1, which already says all three lines
            of the sentence the three photographs make, so no string is added
            here. */}
        <div
          id="hero-photographs"
          ref={bandRef}
          role="group"
          aria-labelledby="hero-heading"
          tabIndex={scrollable ? 0 : undefined}
          onKeyDown={(event) => {
            if (!scrollable) return;
            const next =
              event.key === "ArrowRight"
                ? Math.min(activePanel + 1, panels.length - 1)
                : event.key === "ArrowLeft"
                  ? Math.max(activePanel - 1, 0)
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? panels.length - 1
                      : null;
            if (next !== null) {
              event.preventDefault();
              goToPanel(next);
            }
          }}
          className="hero-band grid grid-cols-1 gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 md:grid-cols-3"
        >
          {panels.map((panel) => (
            <figure key={panel.id} className="hero-panel flex flex-col">
              {/* WAVE 413: `loading="eager"` stated rather than left to the
                  default. These three are the largest thing above the fold on
                  the home page and the LCP candidate; `fetchpriority="high"`
                  was already here and now says what it is paired with. Their
                  width and height were already present, so the band reserves
                  its space before a byte of image arrives. */}
              <img
                src={panel.src}
                srcSet={variantSrcSet(panel.src)}
                loading="eager"
                fetchPriority="high"
                alt={panel.alt}
                width={panel.width}
                height={panel.height}
                sizes="(min-width: 768px) 30vw, 88vw"
                className="aspect-[5/4] w-full rounded-xl border border-rule object-cover"
              />
              {/* Sized to the panel, so the longest line spans its photograph
                  exactly and the other two centre under theirs. nowrap is safe
                  here in a way it never was at a fixed size: the size is
                  derived from the widest string's own width, so no line can
                  outgrow its column at any viewport. */}
              <figcaption
                style={{ fontSize: `${HEADLINE_FILL_CQW}cqw` }}
                className={cn(
                  "whitespace-nowrap pt-4 text-center font-heading font-extrabold leading-tight tracking-[-0.02em]",
                  /* The site's one orange, the same one that fills the
                     wait-list button. It is set over the ghosted street, so
                     the street gave way rather than the orange: see
                     .hero-ground for the photograph's opacity and the wash
                     that had to come with it.

                     It stays orange-500 and does not step down to 700 the way
                     the nav label did, because this is the largest text on the
                     site (11.85cqw, never under 40px on a desktop viewport)
                     and large text answers to 3:1. 500 on white is 4.23:1.
                     Providing Homes uses navy ink. Transforming Lives uses
                     the existing teal text token, matching Israel's sample.

                     ⚠ WAVE 421 MOVED THE GROUND UNDER THIS WORD and those
                     two figures are no longer the ones that bind. The ground
                     is a warm haze now, not flat white, so it is measured off
                     the rendered pixels by scripts/wave421-hero-and-footer.py
                     rather than quoted from the table: 3.48:1 at 1280 and
                     3.57:1 at 390, against the 3:1 floor a 46px headline
                     answers to. Re-measure rather than assume if the opacity
                     or the tint moves again. */
                  panel.id === "lives"
                    ? "text-teal-600"
                    : panel.headline.orange ? "text-orange-700" : "text-ink",
                )}
              >
                {panel.headline.text}
              </figcaption>
            </figure>
          ))}
        </div>
        <div
          role="group"
          className="mt-3 flex items-center justify-center gap-3 md:hidden"
          aria-label="Photograph controls"
        >
          <button
            type="button"
            aria-label="Previous photograph"
            aria-controls="hero-photographs"
            disabled={activePanel === 0}
            onClick={() => goToPanel(activePanel - 1)}
            className="grid size-11 place-items-center rounded-full border border-rule bg-page text-ink transition-colors hover:border-teal-600 hover:bg-secondary disabled:cursor-default disabled:opacity-40"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          {panels.map((panel, index) => (
            <button
              key={panel.id}
              type="button"
              aria-label={`Show ${panel.headline.text.toLowerCase()}`}
              aria-controls="hero-photographs"
              aria-pressed={activePanel === index}
              onClick={() => goToPanel(index)}
              className="grid size-11 place-items-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-2 rounded-full transition-all motion-reduce:transition-none",
                  activePanel === index ? "w-6 bg-teal-600" : "w-2 bg-ink-muted/40",
                )}
              />
            </button>
          ))}
          <button
            type="button"
            aria-label="Next photograph"
            aria-controls="hero-photographs"
            disabled={activePanel === panels.length - 1}
            onClick={() => goToPanel(activePanel + 1)}
            className="grid size-11 place-items-center rounded-full border border-rule bg-page text-ink transition-colors hover:border-teal-600 hover:bg-secondary disabled:cursor-default disabled:opacity-40"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-6 sm:px-8">
        {/* Row 2, the wait-list divider. The rules are non-text marks, so they
            keep orange-500 at 4.01:1 on the navy. */}
        <div className="hero-waitlist mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-orange-500 sm:w-[90px]" />
          <p id="register-as" className="text-center text-[15px] font-normal leading-snug text-ink">
            {registerAsDivider}
          </p>
          <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-orange-500 sm:w-[90px]" />
        </div>

        {/* Row 3 — ten role cards. The card itself is now just the icon and
            the role: the detail line sits outside it, beneath, so the tile
            stays compact. It is tied back to the link with aria-describedby,
            otherwise moving it out of the anchor would strip that context
            from anyone navigating by link. */}
        <ul aria-labelledby="register-as" className="hero-role-grid mt-5 items-stretch gap-3">
          {heroRoles.map((role) => {
            const detailId = `hero-role-${role.id}-detail`;
            const className =
              /*
               * WAVE 412: the ten role tiles are the page's call to action and
               * they are now friendly tiles rather than wire outlines. White
               * card, hairline rule, the card shadow, and a 2px lift into the
               * deeper shadow on hover and on focus alike, so a keyboard gets
               * the same answer a mouse does.
               */
              "flex w-full min-h-11 flex-col items-center gap-2.5 rounded-xl border border-rule bg-page px-2.5 py-3 text-center shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/70 hover:shadow-[var(--shadow-card-hover)] focus-visible:-translate-y-0.5 focus-visible:shadow-[var(--shadow-card-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";
            const body = (
              <>
                <RoleIcon roleId={role.id} />
                {/* Two lines reserved: "Housing Association" wraps where the
                    shorter roles do not, and every card in the row has to end
                    at the same height so the detail lines share a baseline. */}
                <span className="flex min-h-[2.6em] items-center text-[14px] font-semibold leading-snug text-ink">
                  {role.label}
                </span>
              </>
            );
            return (
              <li key={role.id} className="flex flex-col">
                {/* Wave 295: the tiles used to scatter, nine into anchors on
                    /solutions and the resident's into the contact form. They
                    now all land on the same shape of page, the one that asks
                    this role its own questions. The label above the tile is
                    the promise; that page is the promise kept. */}
                <Link
                  to="/register/$role"
                  params={{ role: role.id }}
                  aria-describedby={detailId}
                  className={className}
                >
                  {body}
                </Link>
                <span
                  id={detailId}
                  className="mt-2 px-1 text-center text-[13px] max-lg:text-[15px] font-normal leading-[1.4] max-lg:leading-[1.6] text-ink-muted"
                >
                  {role.detail}
                </span>
              </li>
            );
          })}
        </ul>

        {/*
         * Data provenance, at the foot of the hero rather than the top.
         *
         * It went here and not beside the header because the gap between the
         * header and the photographs is 32px â€” a credit line in it collides
         * with the wait-list button directly above. At the foot it closes
         * the section, sits on the fold, and competes with nothing.
         *
         * WAVE 415: ZOOPLA'S OWN PURPLE, NOT THE SITE'S NAVY. Zoopla's file
         * is white-on-purple and the site carried their reversed, white-on-
         * transparent mark, which on a white page is an empty rectangle.
         * Wave 412 filled that alpha mask with the site's ink token as an
         * honest stand-in; wave 415 fills it with Zoopla's own published
         * brand purple, sampled off the "Powered by Zoopla" ribbon on the
         * platform's listing card and asked for by Callum on 19 Sep 2026.
         * Made by scripts/wave415-zoopla-purple.py and committed; the hex
         * lives in that generator and in no component and no token, because
         * it is a third party's brand colour baked into a third party's
         * artwork rather than a colour of this palette.
         *
         * 415b: IT DRAWS AT FULL STRENGTH, AND IT HAS TO. Wave 415 drew it
         * at `opacity-90`, so the page rendered a 90 per cent TINT of the
         * purple and not the purple: the modal pixel measured (141, 90, 243)
         * where the file carries (128, 70, 242). Callum asked for the same
         * colour as the ribbon on the platform's match card, and a tint is
         * not the same colour, so the opacity is gone. The mark now renders
         * its own pixels, modal and darkest alike. Every ratio quoted for
         * this mark names WHICH READING it is, since the modal pixel and the
         * darkest pixel of a tinted mark differ.
         *
         * ⚠ WAVE 421 MOVED THE GROUND UNDER IT and the 5.15:1 that used to
         * be quoted here was a reading against flat white. The hero's ground
         * is a warm haze now: the ring around this mark reads
         * rgb(249, 244, 242) and Zoopla's purple on it is 4.65:1 modal,
         * 4.72:1 darkest, against the 3:1 SC 1.4.11 asks of a graphic.
         * Measured off the rendered pixels at 390, where the mark's own box
         * has ground in it to read; at 1280 the mark fills its box and the
         * ground has to be taken from the ring, which is the same haze.
         *
         * It is still a DERIVED one-colour rendering of a one-colour mark;
         * Zoopla's own positive colourway should replace it when Callum can
         * ask for the real file.
         *
         * THE AGREEMENT THAT BACKS THIS CLAIM sits with the backend team â€”
         * it is a Zoopla data agreement for the platform, and the line was
         * added on their instruction (Callum, Aug 2026). Recording it here
         * because this is a claim about a commercial relationship carrying
         * a third party's trademark, and the next person to read this file
         * will otherwise have to go and ask.
         *
         * Still worth doing once: check Zoopla's brand guidelines for the
         * reversed mark, minimum size and clear space. Deleting this block
         * is the whole of the rollback.
         */}
        <p className="mt-6 flex items-center justify-center gap-2.5">
          {/* ⚠ WAVE 421: ink-muted, NOT ink-soft, AND THE GROUND IS WHY.
              ink-soft is 4.87:1 on flat white, which is what this line used
              to sit on and it passed with 0.37 to spare. The warm hero ground
              of this wave costs it 0.45, and the gate measured it at 4.42:1
              at 1280 and 4.46:1 at 390: a fail on both, off the rendered
              pixels rather than off any table.

              THE INK MOVED AND NOT THE GROUND, and that is not a breach of
              wave 295's ruling: that ruling protects the ORANGE, whose one
              shade may not be lightened to pass. This is the site's own
              neutral scale, where CLAUDE.md already says ink-soft is for
              white cards and FAILS as body copy on the cream, and the ground
              under this line is now nearer the cream than the white. Wave 412
              made exactly this move in the footer for exactly this reason.
              ink-muted reads 6.32:1 at 1280 and 6.38:1 at 390, both
              measured off the rendered pixels by that gate. (421b,
              rel421 MINOR 1: this line used to say 6.44:1, which is a
              figure no run produced and no ground in this hero yields
              with this ink. Quote the gate or quote nothing.) */}
          <span className="font-heading text-[10px] max-lg:text-[12px] font-bold uppercase tracking-[0.16em] text-ink-muted">
            Powered by
          </span>
          {/* WAVE 414 (rel413b MIN-5): eager, like the other three
              above-the-fold images. The hero is fitted to land inside the
              first screen from 768px and this line closes it, so the mark is
              in the first viewport at every width the site is read at; wave
              413's own probe (b) lists it among the first-viewport washes,
              which is how the re-checker found it. `lazy` on something the
              browser can already see only delays it.

              415b: IT IS NO LONGER IN PROBE (B)'S WASH LIST, because that
              list is every first-viewport element carrying an opacity under
              1 and this one is at 1 now. No check was dropped to get there:
              the opacity went for a COLOUR reason, and full strength is the
              state the wash list was forgiving it for not being. The probe
              still walks it, still asserts it is not INVISIBLE and still
              asserts nothing animates it above its resting value; it simply
              no longer needs forgiving. */}
          <img
            src="/images/brand/zoopla-ink.webp"
            loading="eager"
            fetchPriority="low"
            alt="Zoopla"
            width={548}
            height={120}
            className="h-[18px] w-auto"
          />
        </p>
      </div>
    </section>
  );
}
