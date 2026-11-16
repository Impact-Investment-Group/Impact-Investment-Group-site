/** Fit the held glass and the character together inside an inspection slot.
 * The ordinary actor keeps its full scale; only this reading-aid composition
 * reserves room for the authored hand, handle and circular aperture. */
export function frameBuddyInspection(renderer, { form, size, width, height, inspect }) {
  const margin = Math.max(4, Math.min(width, height) / 32);
  let fittedSize = size;
  let bounds;
  let fittedInspect;
  // Perspective changes slightly with scale. Re-measure the actual projected
  // socket rather than assuming a scaled screen-space offset is exact.
  for (let pass = 0; pass < 3; pass++) {
    fittedInspect = { ...inspect, radius: inspect.radius * fittedSize / 256 };
    const { lens } = renderer.metrics({ form, size: fittedSize, inspect: fittedInspect });
    const radius = lens.radius * 1.25; // Include the outer ring, not just the glass.
    bounds = {
      left: Math.min(-fittedSize / 2, lens.x - radius),
      right: Math.max(fittedSize / 2, lens.x + radius),
      top: Math.min(-fittedSize / 2, lens.y - radius),
      bottom: Math.max(fittedSize / 2, lens.y + radius),
    };
    const ratio = Math.min(1,
      (width - margin * 2) / (bounds.right - bounds.left),
      (height - margin * 2) / (bounds.bottom - bounds.top));
    if (ratio >= 0.999 || pass === 2) break;
    fittedSize *= Math.max(0.1, ratio);
  }
  return {
    size: fittedSize,
    x: width / 2 - (bounds.left + bounds.right) / 2,
    y: height / 2 - (bounds.top + bounds.bottom) / 2,
    inspect: fittedInspect,
  };
}
