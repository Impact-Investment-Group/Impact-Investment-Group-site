const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const brickNames = [
  "Brick_0_0",
  "Brick_0_2",
  "Brick_1_0",
  "Brick_1_2",
  "Brick_2_0",
  "Brick_2_1",
  "Brick_2_2",
  "Brick_3_0",
  "Brick_3_1",
  "Brick_3_2",
];

/** Local offsets for the authored construction meshes, never for the hand rig. */
export function sampleBuddyBuild(seconds) {
  const t = Math.max(0, Math.min(9.4, Number.isFinite(seconds) ? seconds : 0));
  const opacity = 1 - ease((t - 8.6) / 0.8);
  const bricks = brickNames.map((name, index) => {
    const progress = clamp((t - 0.7 - index * 0.32) / 0.62),
      travel = 1 - ease(progress);
    const impact =
      progress > 0.8 ? Math.sin((Math.PI * (progress - 0.8)) / 0.2) : 0;
    return {
      name,
      visible: progress > 0,
      opacity: ease(progress / 0.18) * opacity,
      x: (0.88 + (index % 3) * 0.1) * travel,
      y: 0.18 * travel + 0.48 * Math.sin(Math.PI * progress),
      z: 0.12 * Math.sin(Math.PI * progress),
      tilt: (index % 2 ? 1 : -1) * 0.45 * travel,
      scaleX: 1 + 0.07 * impact,
      scaleY: 1 - 0.1 * impact,
    };
  });
  const roofProgress = clamp((t - 4.5) / 0.85),
    r = roofProgress - 1;
  const roofEase = 1 + 2.2 * r * r * r + 1.2 * r * r;
  const angle = Math.PI * 0.48 * ease((t - 6.15) / 0.85);
  const glow = ease((t - 5.8) / 0.55) * opacity;
  const dust = Array.from({ length: 9 }, (_, index) => {
    const finalPoof = t >= 8.55,
      revealPoof = t >= 4.65;
    const birth = finalPoof
      ? 8.55 + index * 0.025
      : revealPoof
        ? 4.65 + index * 0.035
        : 1.32 + index * 0.3;
    const age = (t - birth) / (finalPoof ? 0.8 : revealPoof ? 1.25 : 0.65);
    const u = clamp(age),
      direction = (index * Math.PI * 2) / 9;
    return {
      name: `Dust_${index}`,
      visible: age > 0 && age < 1 && t < 9.4,
      x: Math.cos(direction) * 0.23 * u,
      y: 0.48 * u,
      z: 0.1 + Math.sin(direction) * 0.12 * u,
      scale: 0.3 + 2.6 * ease(u),
      opacity:
        0.72 *
        ease(u / 0.14) *
        (1 - ease((u - 0.4) / 0.6)) *
        (1 - ease((t - 9.12) / 0.28)),
    };
  });
  return {
    visible: t > 0.7 && t < 9.4,
    opacity,
    bricks,
    dust,
    roof: {
      visible: roofProgress > 0,
      y: 0.65 * (1 - roofEase),
      tilt: 0.08 * Math.sin(Math.PI * roofProgress),
    },
    door: {
      visible: t > 5.4,
      angle,
      x: 0.115 * (Math.cos(angle) - 1),
      z: 0.115 * Math.sin(angle),
      glow,
    },
    window: { visible: t > 4.4, glow: glow * 0.6 },
    hammerVisible: t > 0.3 && t < 5.4,
    finished: t >= 5.4,
  };
}
