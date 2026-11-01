import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { RoleIcon } from "@/components/register/role-icon";
import { registerRoles } from "@/content/audiences";
import { cn } from "@/lib/utils";

/**
 * The ten tiles on /register.
 *
 * Same roles and same glyphs as the hero, drawn larger because here they are
 * the page rather than a strip under three photographs. R295-3 is explicit
 * that this page carries the heading, one line of lede and the tiles, and
 * nothing else: a second thing to look at on a chooser is a second thing to
 * hesitate over.
 *
 * The resident route has a centred, illuminated card of its own.
 *
 * WAVE 412: FRIENDLY TILES, NOT OUTLINES. These were translucent navy plates
 * with a hairline. They are now white cards with the site's rule and card
 * shadow, and they LIFT: 2px with the shadow deepening, on hover and on focus
 * alike. The focus arm is the point of the change rather than a bonus, because
 * a chooser that only answers to a mouse is a chooser that answers to half its
 * visitors, and this is the page a resident reaches.
 */
export function RolePicker({ labelledBy }: { labelledBy: string }) {
  return (
    <ul aria-labelledby={labelledBy} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {registerRoles.map((role) => {
        /* WAVE 838: a tile with an `href` (the co-sourcer) is a plain anchor to the
           platform's own sign-up, drawn with the same card; it spans the row at
           the three-column width so the nine partner tiles keep their three rows. */
        const tileClass = cn(
          /* WAVE 413: `press`. Choosing a role SETTLES the tile, 0.98 and
                 back, before the route changes. On a phone the tap is the only
                 feedback there is between pressing a role and the next page
                 arriving, and on a slow connection that gap is long enough for
                 somebody to press a second tile. It answers to Enter and Space
                 as well, because a Link is an anchor and :active fires for
                 both. */
          "press group flex min-h-11 w-full items-center gap-4 rounded-[14px] border bg-page p-5 text-left shadow-[var(--shadow-card)] transition-all duration-200 ease-out",
          "motion-safe:hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] focus-visible:-translate-y-0.5 focus-visible:shadow-[var(--shadow-card-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600",
          role.tone === "route-out"
            ? "registration-resident max-w-[540px] justify-center gap-5 border-teal-600 px-6 py-7 sm:py-8"
            : "border-rule hover:border-orange-500/70",
        );
        const body = (
          <>
            <RoleIcon roleId={role.id} size="lg" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-heading text-[19px] font-semibold leading-snug text-ink">
                {role.label}
              </span>
              <span className="text-[14px] max-lg:text-[15px] leading-[1.6] text-ink-muted">
                {role.detail}
              </span>
            </span>
            {role.id === "resident" && (
              <ArrowUpRight
                aria-hidden="true"
                className="ml-auto size-6 shrink-0 text-teal-600 transition-transform motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1"
              />
            )}
          </>
        );
        return (
          <li
            key={role.id}
            className={cn(
              "flex",
              role.id === "resident" && "relative mt-6 justify-center sm:col-span-2 lg:col-span-3",
              role.href && "sm:col-span-2 lg:col-span-3",
            )}
          >
            {role.href ? (
              <a href={role.href} className={tileClass}>
                {body}
              </a>
            ) : (
              <Link to="/register/$role" params={{ role: role.id }} className={tileClass}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
