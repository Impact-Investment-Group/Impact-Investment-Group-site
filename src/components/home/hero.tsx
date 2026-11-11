import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { RoleIcon } from "@/components/register/role-icon";
import { registerRoles, registerAsDivider } from "@/content/audiences";
import { cn } from "@/lib/utils";
import { SIZES_HERO_GROUND, variantSrcSet } from "@/lib/responsive-image";
import { ZooplaDiscovery } from "./zoopla-discovery";

const headlines = [
  { id: "homes", text: "Providing Homes", orange: false },
  { id: "support", text: "Delivering Support", orange: true },
  { id: "lives", text: "Transforming Lives", orange: false },
] as const;

const HEADLINE_FILL_CQW = 11.85;

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

const panels = photos.map((photo) => ({
  ...photo,
  headline: headlines.find((line) => line.id === photo.id) ?? headlines[0],
}));

const heroRoles = registerRoles.filter((role) => !role.pickerOnly);

export function HomeHero() {
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
    let frame = 0;
    let offsets: number[] = [];
    let previous = -1;
    const read = () => {
      frame = 0;
      let nearest = 0;
      let distance = Infinity;
      const left = band.scrollLeft;
      offsets.forEach((offset, index) => {
        const delta = Math.abs(offset - left);
        if (delta < distance) {
          distance = delta;
          nearest = index;
        }
      });
      if (nearest !== previous) {
        previous = nearest;
        setActivePanel(nearest);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const measure = () => {
      const first = band.firstElementChild as HTMLElement | null;
      if (!first) return;
      const start = first.offsetLeft;
      offsets = Array.from(band.children, (child) => (child as HTMLElement).offsetLeft - start);
      schedule();
    };
    band.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(band);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      band.removeEventListener("scroll", schedule);
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
      <div
        aria-hidden="true"
        className="hero-ground-layer pointer-events-none absolute inset-0 z-0"
      >
        <img
          data-hero-wash=""
          src="/images/hero-ground-street.webp"
          loading="eager"
          fetchPriority="low"
          width={1672}
          height={941}
          alt=""
          decoding="async"
          className="hero-ground-photo size-full object-cover object-[60%_45%]"

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

      <div className="hero-shell relative z-10 mx-auto w-full max-w-[1440px] px-5 pt-8 sm:px-8">
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
              <img
                src={panel.src}
                srcSet={variantSrcSet(panel.src)}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                alt={panel.alt}
                width={panel.width}
                height={panel.height}
                sizes="(min-width: 768px) 30vw, 88vw"
                className="aspect-[5/4] w-full rounded-xl border border-rule object-cover"
              />

              <figcaption
                style={{ fontSize: `${HEADLINE_FILL_CQW}cqw` }}
                className={cn(
                  "whitespace-nowrap pt-4 text-center font-heading font-extrabold leading-tight tracking-[-0.02em]",

                  panel.id === "lives"
                    ? "text-teal-600"
                    : panel.headline.orange
                      ? "text-orange-700"
                      : "text-ink",
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
        <div className="hero-waitlist mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-orange-500 sm:w-[90px]" />
          <p id="register-as" className="text-center text-[15px] font-normal leading-snug text-ink">
            {registerAsDivider}
          </p>
          <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-orange-500 sm:w-[90px]" />
        </div>

        <ul aria-labelledby="register-as" className="hero-role-grid mt-5">
          {heroRoles.map((role) => (
            <li key={role.id}>
              <Link
                to="/register/$role"
                params={{ role: role.id }}
                aria-labelledby={`hero-role-${role.id}-label`}
                aria-describedby={`hero-role-${role.id}-detail`}
                className="hero-role-link group flex h-full items-start gap-3 border-b border-rule px-2 py-4 text-left transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <RoleIcon roleId={role.id} />
                <span className="min-w-0 flex-1">
                  <span
                    id={`hero-role-${role.id}-label`}
                    className="block text-sm font-semibold leading-snug text-ink group-hover:text-teal-600"
                  >
                    {role.label}
                  </span>
                  <span
                    id={`hero-role-${role.id}-detail`}
                    className="mt-1 block text-[13px] leading-relaxed text-ink-muted"
                  >
                    {role.detail}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1 size-3.5 shrink-0 text-teal-600 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>

        <ZooplaDiscovery />
      </div>
    </section>
  );
}
