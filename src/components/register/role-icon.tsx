import type { LucideIcon } from "lucide-react";

import { iconByName, type RegisteredIconName } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";

/**
 * The role glyph, drawn identically in the hero and on /register.
 *
 * ⚠️ THIS MAP USED TO LIVE INSIDE hero.tsx. Wave 295 gave the wait list its
 * own picker page showing the same ten roles, and two copies of this map would
 * have drifted the first time anybody changed an icon: the hero would show a
 * landlord a house and the picker would show them something else, on two pages
 * one click apart. It is one map now, in one place.
 *
 * The treatment is the brand's: a 24px Lucide glyph, stroke 1.6, with EXACTLY
 * ONE detail element in the accent colour and never two. `accent` is that one
 * element; `baseOrange` is for the roles whose whole glyph is the accent (the
 * handshake), where there is nothing to pick out of it.
 *
 * WAVE 412 CHANGED WHAT IS BEHIND THE GLYPH, NOT THE GLYPH. It used to be a
 * 1.5px white hairline ring on navy; on a white page a white ring is nothing
 * at all, and a hairline ring is the coldest mark a light page can carry. It
 * is now a soft 12% orange disc, the same plate the human icons take
 * everywhere else on the site. The stroke follows the brand rule onto the new
 * ground: navy ink rather than white, with the one accent still orange.
 *
 * The accents are orange because every one of them is a person, a heart or a
 * hand. Teal belongs to data, and there is no data in a role tile.
 */
export const roleIcons: Record<
  string,
  { base: RegisteredIconName; accent?: RegisteredIconName; baseOrange?: boolean }
> = {
  investor: { base: "HandCoins", accent: "PoundSterling" },
  landlord: { base: "House" },
  developer: { base: "HardHat" },
  "housing-association": { base: "House", accent: "Users" },
  "local-authority": { base: "Landmark", accent: "Flag" },
  "care-provider": { base: "HandHeart", accent: "Heart" },
  "support-provider": { base: "UsersRound" },
  "social-worker": { base: "UserRound", accent: "Heart" },
  broker: { base: "Handshake", baseOrange: true },
  /* WAVE 838: the co-sourcer finds homes for the group; a search glyph with the
     house as its one accent. */
  "co-sourcer": { base: "Search", accent: "House" },
  resident: { base: "UserRound" },
};

/** Resolves a Lucide name to its component, falling back rather than throwing.
 *  WAVE 414: through `@/lib/icon-registry`, so the bundle carries the glyphs
 *  the site names rather than the whole library. */
export const icon = (name?: RegisteredIconName): LucideIcon => iconByName(name);

/**
 * The disc is 48px in the hero, where ten of them share one row, and 60px on
 * the picker, where the tile is the whole page and the brand spec's 60px fits.
 */
export function RoleIcon({ roleId, size = "sm" }: { roleId: string; size?: "sm" | "lg" }) {
  const spec = roleIcons[roleId] ?? { base: "Circle" as const };
  const Base = icon(spec.base);
  const Accent = spec.accent ? icon(spec.accent) : null;
  const large = size === "lg";

  return (
    <span
      aria-hidden="true"
      className={cn(
        /* `role-plate` is the hook for wave 413's one-step deepening: 12% to
           18% of the same orange when the tile around it is hovered or
           focused, so the plate says "this whole tile" rather than leaving the
           lift to carry it alone. Measured in styles.css. */
        "role-plate relative grid shrink-0 place-items-center rounded-full bg-tint-orange",
        large ? "size-[60px]" : "size-12",
      )}
    >
      <Base
        size={large ? 26 : 24}
        strokeWidth={1.6}
        /* orange-600 rather than 500 where the whole glyph is the
            accent: on the orange tint, 600 is 4.60:1 against white and 4.11:1
            against the cream, where 500 is 3.9 and 3.5. Both clear the 3:1 a
            graphic answers to; 600 clears it on the cream too, which is where
            these tiles actually sit. */
        className={spec.baseOrange ? "text-orange-600" : "text-ink"}
      />
      {Accent ? (
        <Accent
          size={large ? 13 : 12}
          strokeWidth={2}
          className={cn(
            "absolute text-orange-600",
            large ? "bottom-1.5 right-1.5" : "bottom-1 right-1",
          )}
        />
      ) : null}
    </span>
  );
}
