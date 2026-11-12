import { useEffect, useState } from "react";
import { buddyTopicForPath, isBuddyTopic, type BuddyTopic } from "@/content/buddy";

/** Explicit page semantics only: no text inspection, scroll handler or RAF loop. */
export function useBuddyPageContext(pathname: string): BuddyTopic {
  const [topic, setTopic] = useState<BuddyTopic>(() => buddyTopicForPath(pathname));

  useEffect(() => {
    const main = document.querySelector("main");
    const fallback = buddyTopicForPath(pathname);
    setTopic(fallback);
    if (!main || !window.IntersectionObserver) return;
    let targets = new Set<HTMLElement>();
    let observer: IntersectionObserver;
    let timer: number | undefined;
    let candidate: BuddyTopic | undefined;

    const choose = (): BuddyTopic => {
      const centre = window.innerHeight / 2;
      const band = window.innerHeight * .15;
      let best: { element: HTMLElement; topic: BuddyTopic; distance: number; height: number } | undefined;
      for (const element of targets) {
        const value = element.dataset["buddyTopic"];
        if (!isBuddyTopic(value) || element.closest("[hidden], [inert], [aria-hidden='true']") || !element.getClientRects().length) continue;
        const box = element.getBoundingClientRect();
        if (box.bottom <= centre - band || box.top >= centre + band || box.right <= 0 || box.left >= window.innerWidth || getComputedStyle(element).visibility !== "visible") continue;
        const distance = Math.max(box.top - centre, centre - box.bottom, 0);
        // A focused child (e.g. the financial figure) overrides its broad
        // section only when it reaches the reading band.
        if (!best || best.element.contains(element) || (!element.contains(best.element) &&
          (distance < best.distance || (distance === best.distance && box.height < best.height)))) {
          best = { element, topic: value, distance, height: box.height };
        }
      }
      return best?.topic ?? fallback;
    };
    const update = () => {
      if (document.hidden) {
        window.clearTimeout(timer);
        candidate = undefined;
        return;
      }
      const next = choose();
      if (next === candidate) return;
      candidate = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const settled = choose();
        if (settled === candidate) setTopic(settled);
        else { candidate = undefined; update(); }
      }, 350);
    };
    const scan = () => {
      const next = new Set(main.querySelectorAll<HTMLElement>("[data-buddy-topic]"));
      for (const element of targets) if (!next.has(element)) observer.unobserve(element);
      for (const element of next) if (!targets.has(element)) observer.observe(element);
      targets = next;
      update();
    };
    const observe = () => {
      observer?.disconnect();
      // Pixel margins keep the reading band relative to viewport HEIGHT.
      const inset = Math.round(window.innerHeight * .35);
      observer = new IntersectionObserver(update, { rootMargin: `-${inset}px 0px -${inset}px 0px`, threshold: [0, .01, .5, 1] });
      for (const element of targets) observer.observe(element);
      update();
    };
    observe();
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-buddy-topic", "hidden", "aria-hidden", "open"] });
    window.addEventListener("resize", observe);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", observe);
      document.removeEventListener("visibilitychange", update);
    };
  }, [pathname]);

  return topic;
}
