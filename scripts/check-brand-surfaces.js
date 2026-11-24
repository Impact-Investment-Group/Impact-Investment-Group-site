() => {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const findings = new Map();
  function outsidePalette(colour) {
    if (cache.has(colour)) return cache.get(colour);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = colour;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    const high = Math.max(r, g, b);
    const delta = high - Math.min(r, g, b);
    let outside = false;
    if (a >= 20 && delta >= 8) {
      const sector = high === r ? (g - b) / delta : high === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
      const hue = (sector * 60 + 360) % 360;
      outside = !(hue >= 6 && hue <= 33 || hue >= 160 && hue <= 235);
    }
    cache.set(colour, outside);
    return outside;
  }
  function inspect(style, target) {
    const colours = [style.backgroundColor, style.color];
    for (const edge of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(style["border" + edge + "Width"]) > 0) colours.push(style["border" + edge + "Color"]);
    }
    if (style.outlineStyle !== "none") colours.push(style.outlineColor);
    if (style.backgroundImage.includes("gradient(")) {
      colours.push(...style.backgroundImage.match(/(?:rgba?|hsla?|oklch|oklab|color)\([^()]+\)/g) || []);
    }
    for (const colour of colours) {
      if (outsidePalette(colour) && !findings.has(colour)) findings.set(colour, target);
    }
  }
  for (const el of document.querySelectorAll("body, body *")) {
    if (!el.getClientRects().length || el instanceof SVGElement) continue;
    const where = el.id ? "#" + el.id : el.tagName + "." + [...el.classList].slice(0, 2).join(".");
    inspect(getComputedStyle(el), where);
    for (const pseudo of ["::before", "::after"]) {
      const style = getComputedStyle(el, pseudo);
      if (style.content !== "none" && style.content !== "normal") inspect(style, where + pseudo);
    }
  }
  return Object.fromEntries(findings);
}
