import type { BuddyDestinationRect } from "./buddy-placement.js";

type Rect = { left: number; top: number; right: number; bottom: number };
export type BuddyCornerRect = BuddyDestinationRect & { roomForAmbient: boolean };

const excluded = "[data-buddy-actor], [data-buddy-widget], [data-buddy-slot], [hidden], [inert], .sr-only, .visually-hidden, script, style, noscript, template";
const controls = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
const offsets = [0, 24, 48, 72, 96];
const intersects = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const square = ({ x, y, size }: BuddyDestinationRect): Rect => ({ left: x, top: y, right: x + size, bottom: y + size });

/** Measure only when page layout or scrolling changes, never on animation ticks.
 * Keep the corner's right edge and choose the largest locally clear placement.
 */
export function safeBuddyCorner(preferred: BuddyDestinationRect): BuddyCornerRect {
  const right = Math.min(window.innerWidth - 8, preferred.x + preferred.size);
  const bottom = Math.min(window.innerHeight - 8, preferred.y + preferred.size);
  const header = document.querySelector(".site-header")?.getBoundingClientRect();
  const top = Math.max(80, header && header.bottom > 0 ? header.bottom + 8 : 0);
  const search: Rect = { left: Math.max(0, right - preferred.size * 1.5 - 6), right: right + 6,
    top: Math.max(top, bottom - preferred.size - 102), bottom: Math.min(window.innerHeight, bottom + preferred.size / 16 + 6) };
  const obstacles: Rect[] = [];
  const visibility = new WeakMap<Element, boolean>();

  function visible(element: Element): boolean {
    const known = visibility.get(element);
    if (known !== undefined) return known;
    const style = window.getComputedStyle(element);
    const result = style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse" &&
      Number(style.opacity) !== 0 && (!element.parentElement || visible(element.parentElement));
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

  const clear = (rect: Rect) => rect.left >= 0 && rect.top >= top && rect.right <= window.innerWidth &&
    rect.bottom <= window.innerHeight && !obstacles.some(obstacle => intersects(rect, obstacle));
  const overlap = (rect: Rect) => obstacles.reduce((total, obstacle) => total +
    Math.max(0, Math.min(rect.right, obstacle.right) - Math.max(rect.left, obstacle.left)) *
    Math.max(0, Math.min(rect.bottom, obstacle.bottom) - Math.max(rect.top, obstacle.top)), 0);
  const finish = (rect: BuddyDestinationRect): BuddyCornerRect => ({ ...rect,
    roomForAmbient: clear({ left: rect.x - rect.size / 2,
      right: rect.x + rect.size, top: rect.y - rect.size / 16, bottom: rect.y + rect.size * 17 / 16 }) });
  const sizes: number[] = [];
  for (let size = preferred.size; size > 72; size -= 16) sizes.push(size);
  sizes.push(Math.min(72, preferred.size));
  let fallback = { x: right - sizes.at(-1)!, y: Math.max(top, bottom - sizes.at(-1)!), size: sizes.at(-1)! };
  let leastOverlap = Infinity;
  for (const size of sizes) {
    for (const offset of offsets) {
      const candidate = { x: right - size, y: bottom - size - offset, size };
      if (candidate.x < 0 || candidate.y < top) continue;
      const bounds = square(candidate);
      if (clear(bounds)) return finish(candidate);
      if (size === sizes.at(-1)) {
        const covered = overlap(bounds);
        if (covered < leastOverlap) { leastOverlap = covered; fallback = candidate; }
      }
    }
  }
  return { ...fallback, roomForAmbient: false };
}
