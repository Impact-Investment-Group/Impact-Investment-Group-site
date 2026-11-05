import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const arrivals = [
  "h2",
  ".home-demand-stats > div",
  ".charity-impact__commitment",
  ".friendly-solution-photo",
  ".friendly-product-portrait",
  ".partner-craft-directory__stage",
  ".faq-conversation-mark",
  ".pricing-paper",
].join(",");

/** A single observer per page. Content stays visible before, during and without JS. */
export function SiteMotion() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const main = document.getElementById("main");
    if (!main || typeof IntersectionObserver === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nodes = new Set<HTMLElement>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const node = entry.target as HTMLElement;
        node.dataset.arrival = reduced.matches || document.hidden ? "static" : "entered";
        observer.unobserve(node);
      }
    }, { threshold: 0.15 });

    const register = () => {
      main.querySelectorAll<HTMLElement>(arrivals).forEach((node, index) => {
        if (nodes.has(node) || node.closest(".reveal, .section-dark, [role=dialog]") ||
          (node.matches("h2") && node.closest(".pricing-paper"))) return;
        nodes.add(node);
        const rect = node.getBoundingClientRect();
        // Existing first-screen content never jumps or fades at hydration.
        const staticNow = reduced.matches || (rect.top < innerHeight && rect.bottom > 0);
        node.dataset.arrival = staticNow ? "static" : "waiting";
        node.style.setProperty("--arrival-delay", `${(index % 3) * 45}ms`);
        if (!staticNow) observer.observe(node);
      });
    };
    register();
    // Covers a lazy route resolving after its pathname changes. No scroll listener.
    const additions = new MutationObserver((records) => {
      if (records.some((record) => Array.from(record.addedNodes).some((node) =>
        node instanceof Element && (node.matches(arrivals) || node.querySelector(arrivals)),
      ))) register();
    });
    additions.observe(main, { childList: true, subtree: true });
    const onMotionChange = () => {
      if (!reduced.matches) return;
      observer.disconnect();
      nodes.forEach((node) => { node.dataset.arrival = "static"; });
    };
    reduced.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      additions.disconnect();
      reduced.removeEventListener("change", onMotionChange);
      nodes.forEach((node) => {
        delete node.dataset.arrival;
        node.style.removeProperty("--arrival-delay");
      });
    };
  }, [pathname]);
  return null;
}
