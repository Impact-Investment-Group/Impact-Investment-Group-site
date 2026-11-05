import { variantSrcSet } from "@/lib/responsive-image";
import { cn } from "@/lib/utils";

/**
 * The live header, mobile drawer and footer use the user's latest logo of
 * 5 November 2026, preserving its supplied artwork and colours. Excess transparent
 * outer space is trimmed for the existing header dimensions. Responsive
 * lossless WebP copies preserve alpha and use a versioned filename.
 *
 * The light logo is 2023 by 326, approximately 6.21:1. Existing heights give
 * a 211px phone/drawer logo, 273px tablet/wide-desktop logo and 223px logo
 * between 1280 and 1439px. The footer scales down to its column. The sizes
 * hints deliberately round these widths up to the existing small bounds.
 *
 * All current mounts explicitly use on-cream. The historical reverse artwork
 * remains available for an explicitly requested dark-background variant.
 */

const LOCKUP = {
  "on-navy": "/images/brand/logo-lockup-reverse.webp",
  "on-cream": "/images/brand/logo-lockup-20261105-v3.webp",
} as const;

const MARK = {
  "on-navy": "/images/brand/logo-mark-reverse.webp",
  "on-cream": "/images/brand/logo-mark.webp",
} as const;

/**
 * What a screen reader says for the logo, on every mount: the bar's link, the
 * phone menu and the footer (Callum, 28 Sep 2026, wave 502). The platform's
 * brand link says the same words.
 */
export const LOGO_HOME_NAME = "Impact Investment Group, home";

export type LogoVariant = keyof typeof LOCKUP;

/** Where the lockup sits, which decides its height. See the sizing note. */
export type LogoSize = "bar" | "panel" | "footer";

const SIZE: Record<LogoSize, { className: string; sizes: string }> = {
  // `xl:max-[1440px]:h-9` rather than `xl:h-9 min-[1440px]:h-11`: Tailwind 4
  // emits an arbitrary `min-[...]` rule BEFORE the named breakpoints, so the
  // second form left the bar at 36px at 1440 too. A band that closes is the
  // form whose order cannot matter.
  bar: {
    className: "h-[34px] w-auto sm:h-11 xl:max-[1440px]:h-9",
    sizes: "(min-width: 1440px) 285px, (min-width: 1280px) 233px, (min-width: 640px) 285px, 220px",
  },
  panel: { className: "h-[34px] w-auto", sizes: "220px" },
  footer: { className: "h-auto w-auto max-h-11 max-w-full", sizes: "285px" },
};

export function Logo({
  className,
  variant = "on-navy",
  size = "bar",
}: {
  className?: string;
  variant?: LogoVariant;
  size?: LogoSize;
}) {
  return (
    <span className={className}>
      {/*
       * alt="" and aria-hidden, with the name carried by the sr-only span
       * below instead. The lockup is the company name set as a picture: if
       * the <img> carried it too, every link wrapping this logo would announce
       * the name twice.
       */}
      <img
        src={LOCKUP[variant]}
        srcSet={variantSrcSet(LOCKUP[variant])}
        sizes={SIZE[size].sizes}
        loading="eager"
        fetchPriority="high"
        alt=""
        aria-hidden="true"
        width={variant === "on-cream" ? 2023 : 2006}
        height={variant === "on-cream" ? 326 : 310}
        className={SIZE[size].className}
      />
      <span className="sr-only">{LOGO_HOME_NAME}</span>
    </span>
  );
}

/**
 * The ring and house without the wordmark, for a slot too small for the
 * lockup at 28px tall: a favicon-sized slot or a badge. Nothing renders it
 * since wave 493.
 * Same two colourways and the same rule about which ground takes which.
 */
export function LogoMark({
  className,
  variant = "on-navy",
}: {
  className?: string;
  variant?: LogoVariant;
}) {
  return (
    <img
      src={MARK[variant]}
      srcSet={variantSrcSet(MARK[variant])}
      sizes="36px"
      loading="eager"
      fetchPriority="high"
      alt=""
      aria-hidden="true"
      width={254}
      height={264}
      className={cn("h-9 w-auto", className)}
    />
  );
}
