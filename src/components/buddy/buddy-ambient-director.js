/** Occasional, shuffled companion scenes. No DOM, timers or conversation state. */
export function createAmbientDirector(random = Math.random) {
  const kinds = ["build", "dance", "peek", "stretch", "polish"];
  const lengths = { build: 9.4, dance: 4.8, peek: 4.6, stretch: 4.2, polish: 6.6 };
  const recent = [];
  let bag = [];
  let first = true;
  let lastVariant = -1;
  const unit = () => {
    const value = Number(random());
    return Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0.5;
  };
  return {
    next() {
      if (!bag.length) {
        bag = [...kinds];
        for (let i = bag.length - 1; i > 0; i -= 1) {
          const j = Math.floor(unit() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
      }
      const index = bag.findIndex(kind => !recent.includes(kind));
      const [kind] = bag.splice(index < 0 ? 0 : index, 1);
      recent.push(kind);
      if (recent.length > 2) recent.shift();
      let variant = Math.floor(unit() * 3);
      if (variant === lastVariant) variant = (variant + 1) % 3;
      lastVariant = variant;
      const restSeconds = first ? 8 + unit() * 6 : 10 + unit() * 10;
      first = false;
      return { kind, variant, seconds: lengths[kind], restSeconds };
    },
  };
}
