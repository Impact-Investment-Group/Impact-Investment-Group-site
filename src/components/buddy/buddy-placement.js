/** Pure destination selection, shared by the DOM coordinator and CI tests. */
import { BUDDY_SIDE_PADDING } from "./buddy-canvas-frame.js";

/** Keep a readable character in nearby whitespace; do not solve a crowded
 * page by shrinking him to an icon or placing him over its text. */
export function findBuddyCorner(preferred, viewport, obstacles, previous) {
  const padding = BUDDY_SIDE_PADDING;
  const edge = Math.min(viewport.width - 8, preferred.x + preferred.size);
  const bottom = Math.min(viewport.height - 8, preferred.y + preferred.size);
  const top = viewport.top ?? 80;
  const minimum = Math.min(preferred.size, preferred.size <= 112 ? 96 : viewport.width < 640 ? 160 : 192);
  const sizes = [];
  for (let size = preferred.size; size > minimum; size -= 16) sizes.push(size);
  sizes.push(minimum);
  const clear = (rect) => rect.left >= 8 && rect.top >= top && rect.right <= viewport.width - 8 &&
    rect.bottom <= viewport.height - 8 && !obstacles.some(box => rect.left < box.right && rect.right > box.left && rect.top < box.bottom && rect.bottom > box.top);
  // Keep an already safe resting place through small scroll/layout changes.
  // Changing the order of equally clear candidates must not make him dart.
  if (previous && previous.size >= preferred.size - 16 && previous.size <= preferred.size &&
    previous.y >= bottom - previous.size - 240 && previous.y <= bottom - previous.size &&
    previous.x >= edge - previous.size * (1 + padding) - 96 && previous.x <= edge - previous.size * (1 + padding) &&
    clear({ left: previous.x - previous.size * padding, right: previous.x + previous.size * (1 + padding), top: previous.y, bottom: previous.y + previous.size })) {
    const { x, y, size } = previous;
    return { x, y, size, clear: true, roomForAmbient: clear({ left: x - size * (0.5 + padding),
      right: x + size * (1 + padding), top: y - size / 16, bottom: y + size * 17 / 16 }) };
  }
  let ordinary;
  for (const size of sizes) for (let rise = 0; rise <= 240; rise += 24) for (let shift = 0; shift <= 96; shift += 24) {
    const rect = { x: edge - size * (1 + padding) - shift, y: bottom - size - rise, size };
    if (!clear({ left: rect.x - size * padding, right: rect.x + size * (1 + padding), top: rect.y, bottom: rect.y + size })) continue;
    const candidate = { ...rect, clear: true, roomForAmbient: clear({ left: rect.x - size * (0.5 + padding),
      right: rect.x + size * (1 + padding), top: rect.y - size / 16, bottom: rect.y + size * 17 / 16 }) };
    if (candidate.roomForAmbient) return candidate;
    ordinary ??= candidate;
  }
  if (ordinary) return ordinary;
  return { x: edge - minimum * (1 + padding), y: Math.max(top, bottom - minimum), size: minimum, clear: false, roomForAmbient: false };
}

export function selectBuddyDestination(slots, current, viewport) {
  const chat = slots.find(slot => slot.kind === "chat" && slot.width > 0 && slot.height > 0 && slot.bottom > 0 && slot.top < viewport.height);
  if (chat) return chat;
  const corner = slots.find(slot => slot.kind === "corner" && slot.width > 0 && slot.height > 0);
  // Removing the corner slot is the existing user's Minimize choice.
  if (!corner) return null;
  const inspection = slots.find(slot => slot.kind === "inspect" && slot.width > 0 && slot.height > 0 && slot.bottom > 0 && slot.top < viewport.height);
  if (inspection) return inspection;
  const eligible = slots.filter(slot => {
    if (slot.kind !== "page" || slot.width < 40 || slot.height < 40) return false;
    const visibleWidth = Math.max(0, Math.min(slot.right, viewport.width) - Math.max(0, slot.left));
    const visibleHeight = Math.max(0, Math.min(slot.bottom, viewport.height - 24) - Math.max(80, slot.top));
    const threshold = slot.id === current ? .45 : .65;
    return visibleWidth * visibleHeight >= slot.width * slot.height * threshold &&
      slot.top + slot.height / 2 > viewport.height * .17 && slot.top + slot.height / 2 < viewport.height * .8;
  });
  const distance = slot => Math.abs(slot.top + slot.height / 2 - viewport.height * .46);
  eligible.sort((a, b) => distance(a) - distance(b));
  const candidate = eligible[0];
  const previous = eligible.find(slot => slot.id === current);
  // A small scroll must not bounce the actor between neighbouring illustrations.
  return previous && (!candidate || distance(previous) < distance(candidate) + 72) ? previous : candidate ?? corner;
}

export function buddyDestinationRect(slot, viewportWidth) {
  const paddedPage = slot.kind === "page" && Number.isFinite(viewportWidth);
  const limit = paddedPage ? Math.max(1, (viewportWidth - 16) / 1.25) : 288;
  const size = Math.min(slot.width, slot.height, 288, limit);
  let x = slot.left + (slot.width - size) / 2;
  if (paddedPage) x = Math.max(8 + size / 8, Math.min(viewportWidth - 8 - size * 9 / 8, x));
  return { x, y: slot.top + (slot.height - size) / 2, size };
}

/** Critically damped flight carries velocity through interruptions and retargets. */
export function followBuddyDestination(current, target, seconds, reducedMotion = false) {
  if (!current || reducedMotion) return { ...target };
  const dt = Math.max(0, Math.min(.08, Number.isFinite(seconds) ? seconds : 0));
  const result = { velocity: {} };
  for (const key of ["x", "y", "size"]) {
    // Softer acceleration and a slightly slower scale change make a move read
    // as continuous flight, including retargets while the reader scrolls.
    const frequency = key === "size" ? 7 : 8;
    const decay = Math.exp(-frequency * dt);
    const distance = current[key] - target[key];
    const velocity = current.velocity?.[key] ?? 0;
    const impulse = velocity + frequency * distance;
    result[key] = target[key] + (distance + impulse * dt) * decay;
    result.velocity[key] = (velocity - frequency * impulse * dt) * decay;
    if (Math.abs(result[key] - target[key]) < .08 && Math.abs(result.velocity[key]) < .5) {
      result[key] = target[key];
      result.velocity[key] = 0;
    }
  }
  return result;
}
