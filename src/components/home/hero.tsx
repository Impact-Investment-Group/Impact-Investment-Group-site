import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { RoleIcon } from "@/components/register/role-icon";
import { registerRoles, registerAsDivider } from "@/content/audiences";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { variantSrcSet } from "@/lib/responsive-image";
import { ZooplaDiscovery } from "./zoopla-discovery";

const photos = [
  {
    id: "homes",
    caption: "Providing Homes",
    src: "/images/hero-homes.webp",
    width: 1280,
    height: 1024,
    alt: "A woman handing a set of keys to a man outside a brick terrace in daylight",
  },
  {
    id: "support",
    caption: "Delivering Support",
    src: "/images/hero-support.webp",
    width: 1280,
    height: 1024,
    alt: "A carer in uniform resting a hand on the shoulder of an older woman in a bright living room",
  },
  {
    id: "lives",
    caption: "Transforming Lives",
    src: "/images/hero-lives.webp",
    width: 1280,
    height: 1024,
    alt: "A family of four smiling together outside the navy front door of their red-brick home",
  },
] as const;

const heroRoles = registerRoles.filter((role) => !role.pickerOnly);

export function HomeHero() {
  const bandRef = React.useRef<HTMLDivElement | null>(null);
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
  return (
    <section data-buddy-topic="property" aria-labelledby="hero-heading" className="home-opening">
      <div className="home-opening__inner">
        <div className="home-opening__copy">
          <h1 id="hero-heading">
            Ending homelessness, <span>together.</span>
          </h1>
          <p>
            We’ve built a way for property investors, housing associations and local support teams
            to turn suitable properties into homes for people facing homelessness across the UK.
          </p>
          <div className="home-opening__actions">
            <Button variant="primary" asChild>
              <Link to="/partner-with-investor">For property investors</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/partner-with-resident">Find housing support</Link>
            </Button>
          </div>
        </div>
        <div className="home-opening__gallery">
          <div
            id="hero-photographs"
            className="hero-band"
            ref={bandRef}
            role="group"
            aria-label="Providing homes, delivering support, transforming lives"
            tabIndex={0}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? Math.min(activePanel + 1, photos.length - 1)
                  : event.key === "ArrowLeft"
                    ? Math.max(activePanel - 1, 0)
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? photos.length - 1
                        : null;
              if (next !== null) {
                event.preventDefault();
                goToPanel(next);
              }
            }}
          >
            {photos.map((photo, index) => (
              <figure key={photo.id} className="hero-panel" aria-hidden={index !== activePanel}>
                <img
                  src={photo.src}
                  srcSet={variantSrcSet(photo.src)}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="(min-width: 1440px) 680px, (min-width: 850px) 49vw, 94vw"
                />
                <figcaption
                  className={cn(
                    photo.id === "lives"
                      ? "text-teal-600"
                      : photo.id === "support"
                        ? "text-orange-700"
                        : "text-ink",
                  )}
                >
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>
          <div role="group" className="home-opening__controls" aria-label="Photograph controls">
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
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                aria-label={`Show ${photo.caption.toLowerCase()}`}
                aria-controls="hero-photographs"
                aria-pressed={activePanel === index}
                onClick={() => goToPanel(index)}
                className="home-opening__dot grid min-h-11 place-items-center rounded-full"
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
              disabled={activePanel === photos.length - 1}
              onClick={() => goToPanel(activePanel + 1)}
              className="grid size-11 place-items-center rounded-full border border-rule bg-page text-ink transition-colors hover:border-teal-600 hover:bg-secondary disabled:cursor-default disabled:opacity-40"
            >
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeRoleDirectory() {
  return (
    <section aria-labelledby="register-as" className="wave-section home-role-directory">
      <div className="home-content-width">
        <h2 id="register-as">{registerAsDivider}</h2>
        <ul aria-labelledby="register-as" className="hero-role-grid mt-6">
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
