import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Heart, House, HandHeart } from "lucide-react";
import { RoleIcon } from "@/components/register/role-icon";
import { registerRoles } from "@/content/audiences";
import { registerAsDivider } from "@/content/register";
import { purposeCopy } from "@/content/home";
import { variantSrcSet, SIZES_HERO_GROUND } from "@/lib/responsive-image";
import "./friendly-home.css";

const panels = [
  {
    id: "homes",
    headline: "Providing Homes",
    src: "/images/hero-homes.webp",
    alt: "A woman handing a set of keys to a man outside a brick terrace",
    Icon: House,
  },
  {
    id: "support",
    headline: "Delivering Support",
    src: "/images/hero-support.webp",
    alt: "A carer in uniform resting a hand on the shoulder of an older woman in a bright living room",
    Icon: HandHeart,
  },
  {
    id: "lives",
    headline: "Transforming Lives",
    src: "/images/hero-lives.webp",
    alt: "A family of four together outside the navy front door of their red-brick home",
    Icon: Heart,
  },
];
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
    const query = window.matchMedia("(min-width: 0px)");
    const read = () => setScrollable(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  return (
    <section aria-labelledby="hero-heading" className="home-welcome">
      <div className="hero-ground-layer" aria-hidden="true">
        <img
          src="/images/hero-ground-street.webp"
          srcSet={variantSrcSet("/images/hero-ground-street.webp", { withOriginal: false })}
          sizes={SIZES_HERO_GROUND}
          alt=""
          width={1920}
          height={640}
          loading="eager"
          fetchPriority="low"
          className="hero-ground-photo"
        />
        <div className="hero-ground" />
      </div>
      <div className="welcome-layout">
        <div className="welcome-message">
          <h1 id="hero-heading">
            <span>Providing Homes</span>
            <span className="text-orange-700">Delivering Support</span>
            <span className="welcome-highlight text-teal-600">Transforming Lives</span>
          </h1>
          <p className="welcome-lead">{purposeCopy.statement}</p>
          <div className="welcome-actions">
            <a className="welcome-primary" href="#connection-heading">
              See how it works <ArrowRight aria-hidden="true" size={18} />
            </a>
            <Link to="/partners" className="welcome-secondary">
              Explore the partners <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <p className="welcome-powered">
            <span>Powered by</span>
            <img
              src="/images/brand/zoopla-ink.webp"
              alt="Zoopla"
              width={548}
              height={120}
              loading="eager"
              fetchPriority="low"
            />
          </p>
        </div>
        <div className="welcome-scene">
          <div className="welcome-scene-halo" aria-hidden="true" />
          <div className="welcome-photo-stack">
            <div
              id="hero-photographs"
              ref={bandRef}
              role="group"
              aria-label="Providing homes, delivering support, transforming lives"
              tabIndex={scrollable ? 0 : undefined}
              className="hero-band"
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? Math.min(activePanel + 1, 2)
                    : event.key === "ArrowLeft"
                      ? Math.max(activePanel - 1, 0)
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 2
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  goToPanel(next);
                }
              }}
            >
              {panels.map((panel) => (
                <figure key={panel.id} className="welcome-photo">
                  <img
                    src={panel.src}
                    srcSet={variantSrcSet(panel.src)}
                    sizes="(min-width: 1440px) 570px, (min-width: 900px) 43vw, 90vw"
                    width={1280}
                    height={1024}
                    alt={panel.alt}
                    loading="eager"
                    fetchPriority="high"
                  />
                  <figcaption
                    className={
                      panel.id === "lives"
                        ? "text-teal-600"
                        : panel.id === "support"
                          ? "text-orange-700"
                          : "text-ink"
                    }
                  >
                    <panel.Icon aria-hidden="true" size={23} strokeWidth={1.6} />
                    {panel.headline}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div role="group" aria-label="Photograph controls" className="welcome-photo-controls">
            <button
              type="button"
              aria-label="Previous photograph"
              aria-controls="hero-photographs"
              disabled={activePanel === 0}
              onClick={() => goToPanel(activePanel - 1)}
            >
              <ArrowLeft aria-hidden="true" size={18} />
            </button>
            <div className="welcome-photo-dots">
              {panels.map((panel, index) => (
                <button
                  key={panel.id}
                  type="button"
                  aria-label={`Show ${panel.headline.toLowerCase()}`}
                  aria-controls="hero-photographs"
                  aria-pressed={activePanel === index}
                  onClick={() => goToPanel(index)}
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Next photograph"
              aria-controls="hero-photographs"
              disabled={activePanel === 2}
              onClick={() => goToPanel(activePanel + 1)}
            >
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="welcome-roles">
        <p id="register-as">{registerAsDivider}</p>
        <ul aria-labelledby="register-as" className="hero-role-grid">
          {heroRoles.map((role) => (
            <li key={role.id}>
              <Link
                to="/register/$role"
                params={{ role: role.id }}
                aria-labelledby={`hero-role-${role.id}-label`}
                aria-describedby={`hero-role-${role.id}-detail`}
                className="hero-role-link"
              >
                <RoleIcon roleId={role.id} />
                <span className="welcome-role-copy">
                  <span id={`hero-role-${role.id}-label`}>{role.label}</span>
                  <span id={`hero-role-${role.id}-detail`}>{role.detail}</span>
                </span>
                <ArrowRight className="welcome-role-arrow" aria-hidden="true" size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
