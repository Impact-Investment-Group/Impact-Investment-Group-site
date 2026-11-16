import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { BuddySlot } from "./buddy-slot";
import { buddyTopicForPath, isBuddyTopic, type BuddyTopic } from "@/content/buddy";

type Detail = { node: HTMLElement; label: string; value: string; note: string; form: BuddyTopic };
export const PAGE_INSPECTION_EVENT = "iig:inspect-page";
const readable = (node: HTMLElement) => node.isConnected && node.getClientRects().length > 0 &&
  !node.closest('nav, form, [aria-hidden="true"], [hidden], [inert], [data-buddy-chat]') &&
  getComputedStyle(node).visibility !== "hidden";
const words = (node: Element) => node.textContent?.replace(/\s+/g, " ").trim() ?? "";
const noteOf = (node: HTMLElement) => node.tagName === "DD" ? Array.from(node.parentElement?.querySelectorAll<HTMLElement>("dd") ?? [])
  .filter(item => item !== node && readable(item)).map(words).join(" ").slice(0, 400) : "";
const labelOf = (node: HTMLElement) => node.tagName === "DD"
  ? node.parentElement?.querySelector("dt")?.textContent?.trim() ?? "On this page" : "On this page";
const formOf = (node: HTMLElement, pathname: string): BuddyTopic => {
  const topic = node.closest<HTMLElement>("[data-buddy-topic]")?.dataset.buddyTopic;
  return isBuddyTopic(topic) ? topic : buddyTopicForPath(pathname);
};

/** Only published page text, never form values, hidden tabs or assistant replies. */
export function pageDetails(pathname: string): Detail[] {
  const main = document.querySelector("main");
  if (!main) return [];
  const candidates = Array.from(main.querySelectorAll<HTMLElement>("dl dd, [data-buddy-detail], h2"));
  const seen = new Set<string>();
  return candidates.filter(readable).flatMap(node => {
    const value = words(node);
    if (!value || value.length > 150 || seen.has(value)) return [];
    const isFigure = node.tagName === "DD";
    if (isFigure && !/[0-9£%]/.test(value)) return [];
    seen.add(value);
    const note = noteOf(node);
    return [{ node, label: labelOf(node), value, note, form: formOf(node, pathname) }];
  }).sort((a, b) => {
    const middle = innerHeight / 2;
    return Math.abs(a.node.getBoundingClientRect().top - middle) - Math.abs(b.node.getBoundingClientRect().top - middle);
  }).slice(0, 12);
}

/** A reading aid attached to the page, with a destination for the existing actor. */
export function BuddyPageInspector() {
  const { pathname } = useLocation();
  const [details, setDetails] = useState<Detail[]>([]);
  const [index, setIndex] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  const detail = details[index];
  const dismiss = () => {
    setDetails([]);
    const returnTo = document.querySelector<HTMLElement>('[data-buddy-launcher]') ?? opener.current;
    if (returnTo?.isConnected) returnTo.focus({ preventScroll: true });
  };

  useEffect(() => { setDetails([]); }, [pathname]);
  useEffect(() => {
    const begin = () => { opener.current = document.activeElement as HTMLElement; setIndex(0); setDetails(pageDetails(pathname)); };
    window.addEventListener(PAGE_INSPECTION_EVENT, begin);
    return () => window.removeEventListener(PAGE_INSPECTION_EVENT, begin);
  }, [pathname]);

  useEffect(() => {
    if (!detail || !card.current || !ring.current) return;
    let frame = 0;
    const position = () => {
      frame = 0;
      if (!readable(detail.node) || words(detail.node) !== detail.value || noteOf(detail.node) !== detail.note ||
        labelOf(detail.node) !== detail.label || formOf(detail.node, pathname) !== detail.form) { setDetails([]); return; }
      const box = detail.node.getBoundingClientRect();
      const panel = card.current!;
      const outline = ring.current!;
      const width = Math.min(420, innerWidth - 24);
      panel.style.width = `${width}px`;
      panel.style.maxHeight = `${Math.max(1, innerHeight - 24)}px`;
      const left = Math.max(12, Math.min(innerWidth - width - 12, box.left));
      const below = box.bottom + 16;
      const top = below + panel.offsetHeight < innerHeight - 12 ? below : Math.max(76, box.top - panel.offsetHeight - 16);
      panel.style.transform = `translate3d(${left}px,${Math.min(top, Math.max(12, innerHeight - panel.offsetHeight - 12))}px,0)`;
      outline.style.transform = `translate3d(${box.left}px,${box.top}px,0)`;
      outline.style.width = `${box.width}px`;
      outline.style.height = `${box.height}px`;
      window.dispatchEvent(new Event("iig:buddy-slots"));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(position); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    const interrupted = () => setDetails([]);
    const target = detail.node.getBoundingClientRect();
    if (target.top < 80 || target.bottom > innerHeight - 60) detail.node.scrollIntoView({ block: "center", behavior: "instant" });
    position();
    close.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(detail.node); observer.observe(card.current);
    const mutations = new MutationObserver(schedule);
    const main = detail.node.closest("main");
    if (main) mutations.observe(main, { subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["hidden", "aria-hidden", "inert", "class", "style", "data-buddy-topic"] });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("keydown", key);
    window.addEventListener("iig:open-buddy", interrupted);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); mutations.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("keydown", key);
      window.removeEventListener("iig:open-buddy", interrupted);
    };
  }, [detail, pathname]);

  if (!detail) return null;
  return <>
    <div ref={ring} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-40 rounded-xl outline-2 outline-offset-4 outline-teal-600" />
    <div ref={card} data-buddy-page-inspector role="region" aria-label="Buddy's page detail" className="fixed left-0 top-0 z-50 max-h-96 overflow-y-auto rounded-2xl border border-rule bg-page p-4 text-ink shadow-xl">
      <div className="flex items-start gap-3">
        <div className="w-28 shrink-0 sm:w-36"><BuddySlot kind="inspect" form={detail.form} action="explain" /></div>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="text-xs font-semibold text-teal-600">{detail.label}</p>
          <p className="mt-2 break-words font-heading text-2xl font-bold leading-tight sm:text-3xl">{detail.value}</p>
          {detail.note && <p className="mt-2 text-xs leading-relaxed text-ink-muted">{detail.note}</p>}
        </div>
        <button ref={close} type="button" onClick={dismiss} aria-label="Close page detail" className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-page-alt focus-visible:outline-2 focus-visible:outline-teal-600"><X aria-hidden="true" className="size-4" /></button>
      </div>
      {details.length > 1 && <button type="button" onClick={() => setIndex(value => (value + 1) % details.length)} className="ml-auto mt-2 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-teal-600 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-teal-600">Next detail <ArrowRight aria-hidden="true" className="size-4" /></button>}
    </div>
  </>;
}
