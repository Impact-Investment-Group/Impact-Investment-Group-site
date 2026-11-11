import { BrainCircuit, HandHeart, Handshake, House, Sparkles, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Director } from "@/content/about";
import { SIZES_PORTRAIT, variantSrcSet } from "@/lib/responsive-image";

/**
 * ⚠ WAVE 414: A MAP, NOT `import * as Icons` AND A STRING LOOKUP.
 *
 * This read `(Icons as Record<string, LucideIcon>)[name]`, and a dynamic
 * index into a namespace import is the one shape a bundler cannot see
 * through: Rollup has to assume any export might be reached, so it keeps them
 * ALL. `lucide-react` shipped as a 596KB chunk on every route of this site,
 * against roughly sixty icons actually drawn anywhere on it, and on the
 * 3.37MB the home page weighed it was the single largest item.
 *
 * Five names are ever looked up here, they are the five in `content/about.ts`,
 * and the fallback is the sixth. A map of six is what the code always meant;
 * the namespace import was a way of not writing it down.
 *
 * If a director gets a new icon, add it here as well as in the content file.
 * That is the cost, and a build that keeps a whole icon library to avoid a
 * six-line map is not worth it.
 */
const DIRECTOR_ICONS: Record<string, LucideIcon> = {
  BrainCircuit,
  HandHeart,
  Handshake,
  House,
  Sparkles,
  UserRound,
};

const icon = (name?: string): LucideIcon => (name && DIRECTOR_ICONS[name]) || UserRound;

/**
 * A person on the team, on a cream card.
 *
 * Renders a real photograph when one is supplied, otherwise the person's
 * initials. Never a stock face — a placeholder head is worse than no head,
 * because a reader assumes it is them.
 *
 * ── Why every colour here is written out longhand ──────────────────────────
 *
 * The card is cream and sits on the cream About page. Every colour is stated
 * longhand rather than left to `.section-light`, because these cards also have
 * to survive being dropped on a navy section — the homepage may yet want them.
 * All of it is measured against the CREAM, which is the harsher of the two
 * grounds. From the contrast
 * table in CLAUDE.md, measured against #f7f1e6:
 *
 *   navy-900    16.8:1  ✓ names
 *   slate-ink    6.2:1  ✓ bio and credential lines
 *   teal-600     4.7:1  ✓ roles
 *   orange-700   5.78:1 ✓ at any size since wave 295 (was 4.1:1)
 *   orange-600   4.75:1 ✓ (was 3.0:1)
 *   orange-500   3.76:1 ✗ icon glyphs and fills only (was 2.3:1)
 *
 * ⚠ WAVE 295 MOVED THREE OF THOSE. The orange became the platform's
 * terracotta and the ramp was re-derived against this cream, so orange is no
 * longer barred from small text here. The roles below stay TEAL anyway: that
 * was a decision about what the card should say, not only about what passes.
 *
 * So no role is set in orange, including Israel's. His seniority is carried by
 * things that are not text and therefore have no contrast floor: the card runs
 * full width, it takes a 4px orange left rule, and his portrait ring, icon and
 * credential markers are orange. Everyone else's are teal. That keeps the
 * hierarchy obvious and the accent legal at the same time.
 *
 * Five shapes, one component:
 *
 *   "portrait"  the tall card — 4:5 photograph at the top, name, role and
 *               credentials beneath. This is the one the About page uses for
 *               Israel, in the slot the AI meeting photograph used to hold.
 *   "row"       horizontal: square photo left, name / role / credential right.
 *               Two of these side by side fit the height of one "portrait",
 *               which is the whole reason the About section now balances.
 *   "vertical"  compact, equal-height profile used by the responsive team
 *               line-up. It deliberately omits the longer biography so every
 *               leader holds the same visual hierarchy.
 *   "lead"      the older full-width bar. Kept — /about no longer uses it, but
 *               it is the only shape that renders the bio inline.
 *   "member"    the older compact centred card.
 *
 * The hierarchy is size, width and accent. Nobody is shrunk to make the lead
 * look bigger, which is what makes it read as seniority rather than a ranking.
 */
export function DirectorCard({
  director,
  variant = "lead",
  className,
}: {
  director: Director;
  variant?: "lead" | "member" | "portrait" | "row" | "vertical";
  className?: string;
}) {
  const orange = director.accent === "orange";
  const Icon = icon(director.icon);

  if (variant === "vertical") {
    return (
      <article className={cn("grid grid-cols-[88px_minmax(0,1fr)] gap-5 sm:block", className)}>
        {director.portrait ? (
          <img
            src={director.portrait}
            alt={director.name + ", " + director.role}
            loading="lazy"
            width={440}
            height={440}
            className="size-20 rounded-full object-cover grayscale sm:size-24"
            srcSet={variantSrcSet(director.portrait)}
            sizes={SIZES_PORTRAIT}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-20 place-items-center rounded-full bg-secondary font-heading text-2xl font-semibold text-teal-600 sm:size-24"
          >
            {director.initials}
          </span>
        )}
        <div className="min-w-0 sm:mt-5">
          <h3 className="font-heading text-xl font-semibold leading-tight text-ink">
            {director.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{director.role}</p>
          {director.credentials?.length ? (
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-muted">
              {director.credentials.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    );
  }

  /* ── The tall portrait card ─────────────────────────────────────────────
     Photo at 4:5 with no ring and no crop games: a headshot shot against a
     plain ground needs a frame, not a circle. The name block below carries
     the accent instead — an orange top rule for the director, teal for
     anyone else this shape is ever used for. */
  if (variant === "portrait") {
    return (
      <article
        className={cn(
          "section-light flex h-full flex-col overflow-hidden rounded-2xl bg-cream-card",
          "border border-[color-mix(in_oklab,var(--color-navy-900)_14%,transparent)]",
          "shadow-[0_1px_2px_color-mix(in_srgb,var(--brand-ink)_5%,transparent),0_10px_30px_-18px_color-mix(in_srgb,var(--brand-ink)_25%,transparent)]",
          className,
        )}
      >
        {/* A circle needs a SQUARE source — `portrait` (440x440), not
            `portraitLead` (the 880x1100 crop), which would lose the top of
            the head to the mask. */}
        <div className="flex justify-center px-5 pt-6">
          <img
            src={director.portrait}
            loading="lazy"
            alt={`${director.name}, ${director.role}`}
            width={440}
            height={440}
            className="size-[208px] rounded-full object-cover grayscale ring-4 ring-white"
            srcSet={variantSrcSet(director.portrait)}
            sizes={SIZES_PORTRAIT}
          />
        </div>
        <div className="flex flex-1 flex-col p-5 text-center">
          <span
            aria-hidden="true"
            className={cn(
              "mx-auto h-1 w-10 rounded-full",
              orange ? "bg-orange-600" : "bg-teal-600",
            )}
          />
          <h3 className="mt-3 font-heading text-[19px] font-bold text-navy-900">{director.name}</h3>
          <p className="mt-0.5 text-[12.5px] font-semibold text-teal-600">{director.role}</p>
          {director.bio ? (
            <p className="mb-auto mt-3 text-[13px] max-lg:text-[15px] leading-relaxed text-slate-ink">
              {director.bio}
            </p>
          ) : null}
          {director.credentials?.length ? (
            <ul className="mt-3.5 flex flex-col gap-1.5 border-t border-[color-mix(in_oklab,var(--color-navy-900)_12%,transparent)] pt-3.5 text-left">
              {director.credentials.map((line) => (
                <li
                  key={line}
                  className="flex gap-2 text-[12px] max-lg:text-[15px] leading-[1.45] max-lg:leading-[1.6] text-slate-ink"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-[6px] size-[5px] shrink-0 rounded-full",
                      orange ? "bg-orange-600" : "bg-teal-600",
                    )}
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    );
  }

  /* ── The horizontal row ─────────────────────────────────────────────────
     A rounded square rather than a circle, because these photographs are
     square originals and a circle throws away the shoulders that make a
     headshot read as a person rather than a face. */
  if (variant === "row") {
    return (
      <article
        className={cn(
          "flex items-center gap-3.5 rounded-xl bg-cream-card px-4 py-3.5",
          "border border-[color-mix(in_oklab,var(--color-navy-900)_14%,transparent)]",
          "shadow-[0_1px_2px_color-mix(in_srgb,var(--brand-ink)_4%,transparent)]",
          className,
        )}
      >
        {director.portrait ? (
          <img
            src={director.portrait}
            alt={`${director.name}, ${director.role}`}
            loading="lazy"
            width={440}
            height={440}
            className="size-[60px] shrink-0 rounded-full object-cover grayscale"
            srcSet={variantSrcSet(director.portrait)}
            sizes={SIZES_PORTRAIT}
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-[60px] shrink-0 place-items-center rounded-full bg-white font-heading text-lg font-bold text-navy-900"
          >
            {director.initials}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-heading text-[15px] font-bold text-navy-900">{director.name}</h3>
          <p className="mt-0.5 text-[12.5px] font-semibold text-teal-600">{director.role}</p>
          {director.credentials?.length ? (
            <p className="mt-1 text-[12px] max-lg:text-[15px] leading-snug max-lg:leading-[1.6] text-slate-ink">
              {director.credentials.join(" · ")}
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  const lead = variant === "lead";

  /* Graphics, not text — orange is permitted on cream as a fill or a glyph. */
  const ring = orange ? "ring-orange-600" : "ring-teal-600";
  const glyph = orange ? "text-orange-600" : "text-teal-600";
  const marker = orange ? "bg-orange-600" : "bg-teal-600";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl bg-cream-card",
        /* cream-card (#efe6d6), not the page cream (#f7f1e6): the About page
           is now one continuous cream ground, so a card in the same cream as
           the page behind it would have no edge at all. One step darker plus a
           navy hairline is what makes it read as a card. */
        "border border-[color-mix(in_oklab,var(--color-navy-900)_14%,transparent)]",
        "shadow-[0_1px_2px_color-mix(in_srgb,var(--brand-ink)_5%,transparent),0_10px_30px_-18px_color-mix(in_srgb,var(--brand-ink)_25%,transparent)]",
        orange && "border-l-4 border-l-orange-600",
        lead
          ? "gap-5 p-5 sm:flex-row sm:items-start sm:gap-6"
          : "items-center gap-3 p-4 text-center",
        className,
      )}
    >
      {director.portrait ? (
        <img
          src={director.portrait}
          alt={`${director.name}, ${director.role}`}
          loading="lazy"
          width={224}
          height={224}
          className={cn(
            "shrink-0 rounded-full object-cover grayscale ring-2",
            lead ? "size-20" : "size-14",
            ring,
          )}
          srcSet={variantSrcSet(director.portrait)}
          sizes={SIZES_PORTRAIT}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-white font-heading font-bold text-navy-900 ring-2",
            lead ? "size-20 text-2xl" : "size-14 text-lg",
            ring,
          )}
        >
          {director.initials}
        </span>
      )}

      <div className={cn("min-w-0", !lead && "flex w-full flex-col items-center")}>
        {/* The discipline icon. White disc, navy ring at 18%, and exactly one
            accent — the glyph itself. Never two accents, never a filled shape. */}
        {director.icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "grid place-items-center rounded-full bg-white",
              "border border-[color-mix(in_oklab,var(--color-navy-900)_18%,transparent)]",
              lead ? "mb-3 size-9" : "mb-2.5 size-8",
            )}
          >
            <Icon className={cn(lead ? "size-4" : "size-[15px]", glyph)} strokeWidth={1.5} />
          </span>
        ) : null}

        <h3
          className={cn("font-heading font-bold text-navy-900", lead ? "text-lg" : "text-[14px]")}
        >
          {director.name}
        </h3>
        {/* teal-600 at 4.67:1. Israel's is teal too. Orange would now pass
            here (orange-700 is 5.78:1 since wave 295, where it was 4.1:1 and
            failed at this size), but his card already carries the accent in
            three places that have no contrast floor, so teal it stays. */}
        <p className="mt-0.5 text-[12.5px] font-semibold text-teal-600">{director.role}</p>

        {lead && director.bio ? (
          <p className="mt-3 max-w-[70ch] text-[13px] max-lg:text-[15px] leading-relaxed text-slate-ink">
            {director.bio}
          </p>
        ) : null}

        {director.credentials?.length ? (
          <ul className={cn("mt-3 flex flex-col gap-1", !lead && "items-center")}>
            {director.credentials.map((line) => (
              <li
                key={line}
                className={cn(
                  "flex gap-2 text-[12px] max-lg:text-[15px] leading-[1.45] max-lg:leading-[1.6] text-slate-ink",
                  !lead && "justify-center text-center",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("mt-[6px] size-[5px] shrink-0 rounded-full", marker)}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
