/** Shared timing and bounded, non-repeating idle direction. No DOM or clock state. */
export const TORNADO_DURATION_SECONDS = 3.2;
export const TORNADO_REVEAL_START = 0.60;
export const TORNADO_RETARGET_UNTIL = 0.56;
export const TORNADO_TIMING = Object.freeze({
  seconds: TORNADO_DURATION_SECONDS,
  concealStart: 0.27,
  concealEnd: 0.46,
  retargetUntil: TORNADO_RETARGET_UNTIL,
  revealStart: TORNADO_REVEAL_START,
  revealEnd: 0.92,
});

/** Integral of a smooth angular-velocity envelope: eight real turns, no phase reset. */
export function sampleTornadoSpin(progress) {
  const t = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const ramp = .30, total = 1 - ramp;
  const integral = u => u * u * u - .5 * u * u * u * u;
  let area, speed;
  if (t < ramp) {
    const u = t / ramp;
    area = ramp * integral(u); speed = u * u * (3 - 2 * u);
  } else if (t > 1 - ramp) {
    const u = (1 - t) / ramp;
    area = total - ramp * integral(u); speed = u * u * (3 - 2 * u);
  } else { area = t - ramp / 2; speed = 1; }
  return { angle: Math.PI * 16 * area / total, velocity: Math.PI * 16 * speed / total };
}

const choices = [
  [1, 5, 6, 7, 8, 9, 11, 12, 13, 18, 19, 22, 23, 24, 25, 26],
  [1, 5, 6, 7, 8, 11, 12, 13, 14, 17, 18, 19, 24, 25, 26],
  [1, 5, 8, 9, 10, 11, 12, 13, 19, 21, 22, 24, 25, 26],
];
const faces = { 1: 2, 5: 3, 6: 3, 7: 3, 8: 2, 9: 6, 10: 7, 11: 2, 12: 6,
  13: 3, 14: 10, 17: 4, 18: 9, 19: 12, 21: 7, 22: 3, 23: 3, 24: 6, 25: 2, 26: 6 };
const lengths = { 1: 2.5, 8: 1.7, 9: 2.7, 11: 3.2, 12: 3.6, 13: 3.4, 17: 3.2,
  24: 4.3, 25: 3.8, 26: 3.7 };

export function createIdleDirector(random = Math.random) {
  const recent = [];
  const bags = [[], [], []];
  let rest = true;
  let lastStyle = 0;
  const unit = () => {
    const value = Number(random());
    return Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0.5;
  };
  function refill(form) {
    const bag = [...choices[form]];
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(unit() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    bags[form] = bag;
  }
  return {
    next(form = 0) {
      form = Number.isInteger(form) && form >= 0 && form < 3 ? form : 0;
      if (rest) {
        rest = false;
        return { action: 0, expression: form === 2 ? 7 : 2, seconds: 1.2 + unit() * 2, style: 0 };
      }
      rest = true;
      if (!bags[form].length) refill(form);
      let index = bags[form].findIndex((action) => !recent.includes(action));
      if (index < 0) {
        refill(form);
        index = bags[form].findIndex((action) => !recent.includes(action));
      }
      const [action] = bags[form].splice(index < 0 ? 0 : index, 1);
      recent.push(action);
      if (recent.length > 4) recent.shift();
      // Alternate treatments independently from the pose bag, including calm rests.
      let style = Math.floor(unit() * 3);
      if (style === lastStyle) style = (style + 1 + Math.floor(unit() * 2)) % 3;
      lastStyle = style;
      return { action, expression: faces[action] ?? 2,
        seconds: (lengths[action] ?? 2.7) + unit() * 0.6, style };
    },
  };
}
