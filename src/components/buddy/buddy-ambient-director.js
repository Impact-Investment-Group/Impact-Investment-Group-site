/** Occasional, shuffled companion scenes. No DOM, timers or conversation state. */
export function createAmbientDirector(random = Math.random) {
  const kinds = ["build", "dance", "peek", "stretch", "polish"];
  const lengths = { build: 9.4, dance: 4.8, peek: 4.6, stretch: 4.2, polish: 6.6 };
  const recent = [];
  const performances = Object.fromEntries(kinds.map(kind => [kind, { last: -1, visits: [0, 0, 0] }]));
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
      // Remember the last performance of each scene as well as the global last
      // variant. A return visit must reveal a different authored performance.
      const history = performances[kind];
      const eligible = [0, 1, 2].filter(value => value !== lastVariant && value !== history.last);
      const minimum = Math.min(...eligible.map(value => history.visits[value]));
      const fresh = eligible.filter(value => history.visits[value] === minimum);
      const variant = fresh[Math.floor(unit() * fresh.length)];
      history.last = variant; history.visits[variant] += 1;
      lastVariant = variant;
      const restSeconds = first ? 8 + unit() * 6 : 10 + unit() * 10;
      first = false;
      return { kind, variant, seconds: lengths[kind], restSeconds };
    },
  };
}
