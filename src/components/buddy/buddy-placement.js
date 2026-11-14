/** Pure destination selection, shared by the DOM coordinator and CI tests. */
export function selectBuddyDestination(slots, current, viewport) {
  const chat = slots.find(slot => slot.kind === "chat" && slot.width > 0 && slot.height > 0 && slot.bottom > 0 && slot.top < viewport.height);
  if (chat) return chat;
  const corner = slots.find(slot => slot.kind === "corner" && slot.width > 0 && slot.height > 0);
  // Removing the corner slot is the existing user's Minimize choice.
  if (!corner) return null;
  const eligible = slots.filter(slot => {
    if (slot.kind !== "page" || slot.width < 40 || slot.height < 40) return false;
    const visibleWidth = Math.max(0, Math.min(slot.right, viewport.width) - Math.max(0, slot.left));
    const visibleHeight = Math.max(0, Math.min(slot.bottom, viewport.height - 24) - Math.max(80, slot.top));
    return visibleWidth * visibleHeight >= slot.width * slot.height * .65 &&
      slot.top + slot.height / 2 > viewport.height * .17 && slot.top + slot.height / 2 < viewport.height * .8;
  });
  const distance = slot => Math.abs(slot.top + slot.height / 2 - viewport.height * .46);
  eligible.sort((a, b) => distance(a) - distance(b));
  const candidate = eligible[0];
  const previous = eligible.find(slot => slot.id === current);
  // A small scroll must not bounce the actor between neighbouring illustrations.
  return previous && (!candidate || distance(previous) < distance(candidate) + 72) ? previous : candidate ?? corner;
}

export function buddyDestinationRect(slot) {
  const size = Math.min(slot.width, slot.height, 288);
  return { x: slot.left + (slot.width - size) / 2, y: slot.top + (slot.height - size) / 2, size };
}

/** Time-based following preserves the displayed position when a destination changes. */
export function followBuddyDestination(current, target, seconds, reducedMotion = false) {
  if (!current || reducedMotion) return { ...target };
  const progress = 1 - Math.exp(-Math.max(0, Math.min(.08, seconds)) * 11);
  return Object.fromEntries(["x", "y", "size"].map(key => [key,
    Math.abs(target[key] - current[key]) < .12 ? target[key] : current[key] + (target[key] - current[key]) * progress,
  ]));
}
