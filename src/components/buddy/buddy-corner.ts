import { findBuddyCorner, type BuddyDestinationRect } from "./buddy-placement.js";

type Rect = { left: number; top: number; right: number; bottom: number };
export type BuddyCornerRect = BuddyDestinationRect & { clear: boolean; roomForAmbient: boolean };

const excluded = "[data-buddy-actor], [data-buddy-widget], [data-buddy-slot], [hidden], [inert], .sr-only, .visually-hidden, script, style, noscript, template";
const controls = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
const intersects = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Measure only when page layout or scrolling changes, never on animation ticks.
 * Search a bounded area above/left of the corner without covering reading lines.
 */
export function safeBuddyCorner(preferred: BuddyDestinationRect, previous?: BuddyDestinationRect): BuddyCornerRect {
  const right = Math.min(window.innerWidth - 8, preferred.x + preferred.size);
  const bottom = Math.min(window.innerHeight - 8, preferred.y + preferred.size);
  const header = document.querySelector(".site-header")?.getBoundingClientRect();
  const top = Math.max(80, header && header.bottom > 0 ? header.bottom + 8 : 0);
  const search: Rect = { left: Math.max(0, right - preferred.size * 1.75 - 102), right: right + 6,
    top: Math.max(top, bottom - preferred.size * 17 / 16 - 246), bottom: Math.min(window.innerHeight, bottom + preferred.size / 16 + 6) };
  const obstacles: Rect[] = [];
  const visibility = new WeakMap<Element, boolean>();

  function visible(element: Element): boolean {
    const known = visibility.get(element);
    if (known !== undefined) return known;
    const style = window.getComputedStyle(element);
    // An opacity entrance can start between measurements. Reserve its laid-out
    // text and controls before the first visible animation frame.
    const result = style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse" &&
      (!element.parentElement || visible(element.parentElement));
    visibility.set(element, result);
    return result;
  }

  function add(rect: DOMRect) {
    if (rect.width < 1 || rect.height < 1 || !intersects(rect, search)) return;
    obstacles.push({ left: rect.left - 6, top: rect.top - 6, right: rect.right + 6, bottom: rect.bottom + 6 });
  }

  // Text ranges avoid treating an entire wide paragraph as occupied when its
  // actual lines leave whitespace on the right. Hidden accessible lists do not
  // reserve space, while visibly painted aria-hidden carousel names still do.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let text: Node | null;
  while ((text = walker.nextNode())) {
    const parent = text.parentElement;
    if (!parent || !text.textContent?.trim() || parent.closest(excluded)) continue;
    if (!Array.from(parent.getClientRects()).some(rect => intersects(rect, search)) || !visible(parent)) continue;
    range.selectNodeContents(text);
    Array.from(range.getClientRects()).forEach(add);
  }
  document.querySelectorAll(controls).forEach(control => {
    if (control.closest(excluded) || !visible(control)) return;
    Array.from(control.getClientRects()).forEach(add);
  });

  return findBuddyCorner(preferred, { width: window.innerWidth, height: window.innerHeight, top }, obstacles, previous);
}
