import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ArrowDownRight, ChevronDown } from "lucide-react";

type SectionLink = { id: string; label: string };
const sections: Record<string, SectionLink[]> = {
  "/about": [
    { id: "about-heading", label: "About us" },
    { id: "why-heading", label: "Why we exist" },
    { id: "charity-impact", label: "Giving back" },
    { id: "what-heading", label: "What we do" },
  ],
  "/platform": [
    { id: "services-heading", label: "Overview" },
    { id: "platform-guides", label: "Your role" },
    { id: "steps-heading", label: "How it connects" },
    { id: "services-more-heading", label: "More about sourcing" },
  ],
  "/the-problem": [
    { id: "scale-heading", label: "The scale" },
    { id: "cost-heading", label: "The cost" },
    { id: "opportunity-heading", label: "The opportunity" },
  ],
  "/solutions": [
    { id: "solution-heading", label: "Overview" },
    { id: "layers-heading", label: "How it connects" },
    { id: "product-heading", label: "The platform" },
  ],
  "/legal": [
    { id: "company-heading", label: "The company" },
    { id: "registrations-heading", label: "Registrations" },
    { id: "documents-heading", label: "Documents" },
    { id: "contacts-heading", label: "Contacts" },
  ],
};
const partnerSections: SectionLink[] = [
  { id: "role-heading", label: "Your role" },
  { id: "platform-heading", label: "Your journey" },
  { id: "network-heading", label: "Your network" },
];

/** Real fragment links still work before hydration and with JavaScript off. */
export function PageOutline() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const path = pathname.replace(/\/+$/, "") || "/";
  const links = path.startsWith("/partner-with-") ? partnerSections : sections[path];
  if (!links) return null;
  return <Outline key={pathname} links={links} />;
}

function Outline({ links }: { links: SectionLink[] }) {
  const [active, setActive] = useState(links[0].id);
  const list = useRef<HTMLUListElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let positions: Array<{ id: string; top: number }> = [];
    let boundary = 150;
    let lastActive = "";
    const update = () => {
      frame = 0;
      const position = window.scrollY + boundary + 80;
      let current = links[0].id;
      for (const heading of positions) {
        if (heading.top <= position) current = heading.id;
      }
      if (current !== lastActive) {
        lastActive = current;
        setActive(current);
      }
    };
    // Geometry changes with layout, not with the document's scroll position.
    const measure = () => {
      cancelAnimationFrame(frame);
      const rail = list.current?.closest<HTMLElement>(".page-outline");
      boundary = rail ? (parseFloat(getComputedStyle(rail).top) || 0) + rail.offsetHeight : 150;
      const y = window.scrollY;
      positions = links.flatMap((link) => {
        const heading = document.getElementById(link.id);
        return heading ? [{ id: link.id, top: heading.getBoundingClientRect().top + y }] : [];
      });
      update();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    const rail = list.current?.closest(".page-outline");
    if (rail) observer.observe(rail);
    measure();
    document.addEventListener("animationend", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      document.removeEventListener("animationend", measure);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
    };
  }, [links]);

  useEffect(() => {
    const rail = list.current;
    const current = rail?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!rail || !current) return;
    // Move only the rail, never the document or a focused input.
    const left = current.offsetLeft - rail.offsetLeft;
    if (left < rail.scrollLeft || left + current.offsetWidth > rail.scrollLeft + rail.clientWidth) {
      rail.scrollTo({ left: Math.max(0, left - 12), behavior: "instant" });
    }
  }, [active]);

  return (
    <nav className="page-outline" aria-label="On this page">
      <div className="page-outline__inner">
        <details ref={menu} className="page-outline__mobile">
          <summary>
            <span>On this page</span>
            <strong>{links.find((link) => link.id === active)?.label}</strong>
            <ChevronDown aria-hidden="true" size={16} />
          </summary>
          <ul>
            {links.map((link, index) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  aria-current={active === link.id ? "location" : undefined}
                  onClick={() => {
                    if (menu.current) menu.current.open = false;
                    const heading = document.getElementById(link.id);
                    if (heading) {
                      heading.tabIndex = -1;
                      heading.focus({ preventScroll: true });
                    }
                  }}
                >
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </details>
        <span className="page-outline__label">
          <ArrowDownRight aria-hidden="true" size={15} /> On this page
        </span>
        <ul ref={list} className="page-outline__links">
          {links.map((link, index) => (
            <li key={link.id}>
              <a href={`#${link.id}`} aria-current={active === link.id ? "location" : undefined}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function ReadingProgress() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    let end = 1;
    const update = () => {
      frame = 0;
      const progress = Math.max(0, Math.min(1, window.scrollY / end));
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const measure = () => {
      end = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      schedule();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
    };
  }, [pathname]);
  return <div ref={bar} className="reading-progress" aria-hidden="true" />;
}
