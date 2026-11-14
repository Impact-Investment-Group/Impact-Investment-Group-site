import { anatomy, blend, clamp, ease, limb, pose } from "./buddy-engine.js";

/** Pure ambient choreography. One clock and one actor; no controls, timers or AI calls. */
export const AMBIENT_BOUNDS = Object.freeze({ width: 640, height: 440, anchorX: 440, anchorY: 220 });
export const AMBIENT_DURATIONS = Object.freeze({ build: 9.4, dance: 4.8, peek: 4.6, stretch: 4.2, polish: 6.6 });
export const PROPS_RECTS = Object.freeze({
  house: Object.freeze([49, 49, 481, 479]), door: Object.freeze([638, 95, 267, 435]),
  hammer: Object.freeze([1109, 68, 305, 467]), dust: Object.freeze([1025, 621, 457, 341]),
});
const TAU = Math.PI * 2;
const mix = (a, b, t) => a + (b - a) * t;
const phase = (t, start, end) => ease((t - start) / (end - start));
const house = { x: 150, bottom: 386, width: 230, height: 230 * 479 / 481 };
const houseScale = house.width / 481;
const houseLeft = house.x - house.width / 2, houseTop = house.bottom - house.height;
// Complete frames, not isolated glass. Every mask keeps the source perspective.
const windows = [[183, 126, 119, 124], [55, 286, 111, 127], [315, 286, 111, 127]];
const doorFrame = [160, 263, 166, 216];
const roof = [[0, 203], [209, 11], [227, 0], [244, 9], [481, 204], [481, 227], [461, 242], [226, 86], [33, 242], [0, 225]];
const roofChimney = [313, 0, 97, 115];
const wallOutline = [[35, 221], [226, 72], [446, 221], [446, 479], [35, 479]];
const courseEdges = [479, 430, 383, 336, 289, 242, 195, 148, 90];
const courseTimes = Array.from({ length: 8 }, (_, i) => 1 + i * .4);
const fixtureTimes = [4.78, 5.2, 5.6, 6.0];
const workFrameCache = [];
const strikeFrameCache = [];
const pulse = (t, start, end) => Math.sin(Math.PI * clamp((t - start) / (end - start)));

function neutral(form) { return pose(form, 0, .6, 0, 2); }
function actor(value, x = 440, y = 220, scale = 1) { return { pose: value, x, y, scale }; }
function calm(value) { return { ...value, x: 0, y: 0, rot: 0, yaw: 0, sx: 1, sy: 1 }; }
function normalForm(form) { return Number.isInteger(form) && form >= 0 && form < 3 ? form : 0; }

function heldLeft(form, value) {
  const n = anatomy[form];
  const arm = limb(n.shoulders[0], [value.lx, value.ly], n.limbs, -1, [value.lex, value.ley]);
  const projected = Math.atan2(arm.w[1] - arm.c[1], (arm.w[0] - arm.c[0]) * Math.cos(value.yaw)) + Math.PI / 2;
  const angle = value.la + Math.atan2(Math.sin(projected - arm.angle), Math.cos(projected - arm.angle));
  return { arm, angle };
}

function localHammerPoint(form, value) {
  const held = heldLeft(form, value), arm = held.arm, angle = held.angle - .75;
  return { x: arm.w[0] * Math.cos(value.yaw) + 5 * Math.cos(angle) + 62 * Math.sin(angle),
    y: arm.w[1] + 5 * Math.sin(angle) - 62 * Math.cos(angle) };
}

function hammerPoint(form, frame) {
  const p = frame.pose, h = localHammerPoint(form, p), c = Math.cos(p.rot), s = Math.sin(p.rot);
  return { x: frame.x + (p.x + h.x * p.sx * c - h.y * p.sy * s) * frame.scale,
    y: frame.y + (p.y + h.x * p.sx * s + h.y * p.sy * c) * frame.scale };
}

function strike(form, x, y, lift) {
  const right = calm(blend(neutral(form), pose(form, 28, .55, 0, 4), clamp(lift)));
  // A single left-held tool lets Buddy work on the near wall from its right,
  // including the high gable, without clamping the actor away from the contact.
  const value = { ...right, lx: -right.rx, ly: right.ry, lex: -right.rex, ley: right.rey, la: -right.ra,
    rx: -right.lx, ry: right.ly, rex: -right.lex, rey: right.ley, ra: -right.la,
    lh: 1, rh: right.lh, oldLH: -1, oldRH: -1, handMix: 1, frontL: 1, frontR: 0 };
  value.gazeX = -4; value.gazeY = mix(4, -4, lift);
  const h = localHammerPoint(form, value), size = .60;
  return actor(value, x - h.x * size, y - h.y * size, size);
}

function workFrames(form) {
  if (workFrameCache[form]) return workFrameCache[form];
  const masonryX = [94, 246, 246, 246, 207, 207, 207, 150];
  const frames = courseTimes.map((time, i) => ({ time,
    ...strike(form, masonryX[i], houseTop + (courseEdges[i] + courseEdges[i + 1]) * houseScale / 2, i / 7) }));
  frames.push({ time: 4.12, ...actor(pose(form, 22, .4, 1, 9), 116, 203, .58) });
  frames.push({ time: 4.48, ...strike(form, 247, 266, 1) });
  const points = [[150, 250], [91, 335], [217, 335], [151, 324]];
  points.forEach(([x, y], i) => frames.push({ time: fixtureTimes[i], ...strike(form, x, y, clamp((365 - y) / 145)) }));
  workFrameCache[form] = frames.map(frame => Object.freeze({ ...frame, pose: Object.freeze(frame.pose) }));
  return workFrameCache[form];
}

function strikeFrames(form) {
  if (strikeFrameCache[form]) return strikeFrameCache[form];
  // The tool reaches exactly the recorded contact between a loaded wrist and
  // its recoil. Movement across the house happens between these short beats.
  strikeFrameCache[form] = workFrames(form).flatMap((frame, index) => {
    if (index === 8) return [frame];
    const wind = { ...frame.pose, lx: frame.pose.lx + 11, ly: frame.pose.ly - 20,
      la: frame.pose.la + .64, rot: .045, sy: .96, gazeY: -3 };
    const recoil = { ...frame.pose, lx: frame.pose.lx + 3, ly: frame.pose.ly - 5,
      la: frame.pose.la + .16, rot: -.025, sy: .98, eye: .85 };
    return [{ ...frame, time: frame.time - .105, pose: wind }, frame,
      { ...frame, time: frame.time + .065, pose: recoil }];
  });
  return strikeFrameCache[form];
}

function track(nodes, t, running = false) {
  if (t <= nodes[0].time) return { ...nodes[0], pose: { ...nodes[0].pose } };
  for (let i = 1; i < nodes.length; i += 1) {
    const b = nodes[i], a = nodes[i - 1];
    if (t > b.time) continue;
    const u = clamp((t - a.time) / (b.time - a.time)), v = ease(u), arc = Math.sin(Math.PI * u);
    const value = blend(a.pose, b.pose, v), distance = Math.abs(b.x - a.x);
    if (running && distance > 22) {
      value.rot += Math.sign(b.x - a.x) * arc * .20;
      value.sy -= arc * .045; value.sx += arc * .035;
      if (Math.abs(Math.atan2(Math.sin(b.pose.la - a.pose.la), Math.cos(b.pose.la - a.pose.la))) < .8) value.la += arc * .18;
      if (distance > 150) value.yaw = TAU * v;
    }
    return actor(value, mix(a.x, b.x, v), mix(a.y, b.y, v) - (running ? arc * Math.min(23, distance * .10) : 0), mix(a.scale, b.scale, v));
  }
  const last = nodes[nodes.length - 1];
  return { ...last, pose: { ...last.pose } };
}

function buildActor(form, t, source, target, variant) {
  const anticipation = calm(blend(source, pose(form, 18, .4, 1, 9), .55));
  anticipation.rot = .10; anticipation.sy = .93;
  const nodes = [{ time: 0, ...actor(source) }, { time: .36, ...actor(anticipation, 449, 228, .97) },
    ...strikeFrames(form),
    { time: 6.55, ...actor(pose(form, [16, 3, 13][variant], .55, 0, 3), 332, 252, .70) },
    { time: 7.05, ...actor(pose(form, 13, .55, 0, 3), 322, 252, .70) },
    { time: 7.55, ...actor(pose(form, [1, 5, 9][variant], .55, 0, 2), 343, 248, .72) },
    { time: 8.20, ...actor(pose(form, [19, 11, 21][variant], .55, 0, 12), 351, 246, .74) },
    { time: AMBIENT_DURATIONS.build, ...actor(target) }];
  return track(nodes, t, true);
}

function gestureActor(form, kind, t, variant, source, target) {
  const duration = AMBIENT_DURATIONS[kind], enter = phase(t, 0, .6), leave = phase(t, duration - .8, duration);
  let value, x = 440, y = 220, size = 1;
  const work = Math.max(0, t - .6);
  if (kind === "dance") {
    value = pose(form, [24, 26, 9][variant], work, variant === 1 ? 2 : 1, 6);
    if (variant === 0) {
      const clap = Math.max(pulse(t, 1.32, 1.75), pulse(t, 1.93, 2.36));
      const joined = { ...value, lx: -25, rx: 25, ly: 32, ry: 32, lex: -99, rex: 99,
        ley: 76, rey: 76, la: .62, ra: -.62, lh: 4, rh: 4, frontL: 1, frontR: 1 };
      value = blend(value, joined, clap * .92);
      value.x += Math.sin(work * 5) * 13 * pulse(t, .6, 3.4);
      value.y -= clap * 9;
    }
    if (variant === 1) {
      const turn = phase(t, 1.2, 2.3), prepare = pulse(t, .7, 1.2);
      value.rot -= prepare * .12; value.sy -= prepare * .055;
      const tucked = { ...value, lx: -70, rx: 70, ly: 25, ry: 25, frontL: 1, frontR: 1,
        lh: 5, rh: 5, la: -.4, ra: .4 };
      value = blend(value, tucked, pulse(t, 1.1, 2.45));
      value.yaw = TAU * turn; value.y -= Math.sin(Math.PI * turn) * 26;
      value.x += Math.sin(Math.PI * turn) * 19;
      value = blend(value, pose(form, 19, .6, 0, 12), phase(t, 2.55, 3.1));
    }
    if (variant === 2) {
      const pointing = blend(pose(form, 6, work, 1, 6), pose(form, 7, work, 1, 6), phase(t, 1.8, 2.6));
      value = blend(value, pointing, .55 * Math.sin(Math.PI * clamp(work / 3.2)));
      value.x += Math.sin(work * 3.8) * 16 * pulse(t, .6, 3.4);
      value.y -= Math.max(pulse(t, 1.0, 1.65), pulse(t, 2.05, 2.7)) * 15;
      value.rot += Math.sin(work * 3.8 - .35) * .075;
    }
    value = blend(value, pose(form, 11, .7, 0, 2), phase(t, 3.35, 4));
  } else if (kind === "peek") {
    const excursion = phase(t, .45, 1.8) * (1 - phase(t, 2.85, duration));
    value = pose(form, 13, work * .7, 0, 3);
    value.gazeX = (-7 + variant * 2) * excursion; value.gazeY = [0, -5, 5][variant] * excursion;
    value.rot -= excursion * [.16, .10, .22][variant];
    x -= [126, 96, 144][variant] * excursion; y += [18, -22, 30][variant] * excursion; size -= .14 * excursion;
    // Each visit has a beginning, a response and a resolution, rather than one
    // looping pose: scan and wave; listen and nod; notice and reassure.
    value = blend(value, pose(form, [16, 2, 10][variant], work * .5, 0, [3, 7, 7][variant]),
      phase(t, 1.45, 2.05) * (1 - phase(t, 2.55, 3.15)));
    value = blend(value, pose(form, [1, 8, 21][variant], Math.max(0, t - 2.6), 0, 2), phase(t, 2.6, 3.2) * (1 - leave));
  } else if (kind === "stretch") {
    value = pose(form, 25, Math.min(work, 2.6), 1, 2);
    const hop = Math.sin(Math.PI * phase(t, 2.25, 3.25));
    value.y -= hop * [30, 20, 36][variant]; value.x += hop * [0, -24, 18][variant]; value.sy += hop * .035;
    value.rot += hop * [0, -.08, .08][variant];
    value.rot += pulse(t, .65, 2.25) * [0, -.16, .16][variant];
    value.gazeY -= pulse(t, .6, 1.9) * 3;
    value = blend(value, pose(form, [11, 19, 21][variant], .55, 0, 2), phase(t, 2.9, 3.5));
  } else {
    const approach = phase(t, .4, 1.4), retreat = phase(t, 4.8, duration);
    const visit = approach * (1 - retreat), wipe = phase(t, 1.6, 2) * (1 - phase(t, 3.4, 3.9));
    value = blend(pose(form, 16, .6, 0, 3), pose(form, 28, work, 0, 4), wipe);
    value.gazeX = -5;
    const direction = variant === 1 ? -1 : 1, radius = variant === 2 ? 10 : 7;
    const cleaning = { ...value, lx: -125 + Math.sin(work * (variant === 2 ? 6 : 10)) * radius * direction,
      ly: 105 + Math.cos(work * (variant === 1 ? 20 : 10)) * radius,
      lex: -143, ley: 58, lh: 4, frontL: 1 };
    const n = anatomy[form], arm = limb(n.shoulders[0], [cleaning.lx, cleaning.ly], n.limbs, -1, [cleaning.lex, cleaning.ley]);
    cleaning.la = arm.angle - .12;
    value = blend(value, cleaning, wipe);
    value = blend(value, pose(form, [19, 1, 11][variant], .6, 0, 12), phase(t, 3.8, 4.5));
    x = mix(440, 306, visit); y = mix(220, 253, visit); size = mix(1, .70, visit);
  }
  value = blend(source, value, enter);
  value = blend(value, target, leave);
  return actor(value, mix(x, 440, leave), mix(y, 220, leave), mix(size, 1, leave));
}

export function sampleAmbientScene(form, kind, seconds, variant = 0, sourcePose, targetPose) {
  form = normalForm(form); kind = Object.hasOwn(AMBIENT_DURATIONS, kind) ? kind : "stretch";
  const duration = AMBIENT_DURATIONS[kind], t = clamp(Number.isFinite(seconds) ? seconds : 0, 0, duration);
  variant = ((Math.trunc(Number.isFinite(variant) ? variant : 0) % 3) + 3) % 3;
  const source = sourcePose || neutral(form), target = targetPose || neutral(form);
  if (t === 0 || t === duration) return { ...actor({ ...(t === 0 ? source : target) }), complete: t === duration };
  const frame = kind === "build" ? buildActor(form, t, source, target, variant) : gestureActor(form, kind, t, variant, source, target);
  if (kind === "build") {
    const grip = phase(t, .10, .25) * (1 - phase(t, 6.5, 6.8));
    if (grip > 0) frame.pose = blend(frame.pose, { ...frame.pose, lh: 1 }, grip);
  }
  return { pose: frame.pose, x: frame.x, y: frame.y, scale: frame.scale, complete: false };
}

export function sampleConstruction(seconds) {
  const t = Number.isFinite(seconds) ? seconds : 0;
  return {
    courses: courseTimes.map(start => phase(t, start, start + .18)),
    roof: phase(t, 4.22, 4.48),
    windows: fixtureTimes.slice(0, 3).map(start => phase(t, start, start + .18)),
    door: phase(t, 6, 6.2), doorOpen: phase(t, 6.75, 7.45), assembled: t >= 6.4,
  };
}

function polygon(ctx, points) { points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
function ellipse(ctx, x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
function rounded(ctx, x, y, w, h, radius, fill) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y); ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius); ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath(); ctx.fill();
}
function gradient(ctx, x, y, w, h, from, to) {
  const fill = ctx.createLinearGradient(x, y, x + w, y + h);
  fill.addColorStop(0, from); fill.addColorStop(1, to); return fill;
}
function dust(ctx, x, y, w, h, age = .5) {
  // Expanding, independently rotating puffs have a soft lit rim and a shaded
  // underside. They remain continuous vector forms at every display scale.
  for (let i = 0; i < 7; i += 1) {
    const a = i * 2.399 + age * (i % 2 ? .6 : -.6), spread = .17 + age * .16;
    const px = x + w * (.5 + Math.cos(a) * spread), py = y + h * (.53 + Math.sin(a) * .23);
    const radius = w * (.13 + (i % 3) * .017) * (1 - age * .2);
    const fill = ctx.createRadialGradient(px - radius * .3, py - radius * .35, radius * .08, px, py, radius);
    fill.addColorStop(0, "#FFFFFF"); fill.addColorStop(.72, "#F9F8F3"); fill.addColorStop(1, "rgba(213,218,213,0)");
    ellipse(ctx, px, py, radius, radius * .78, fill);
  }
}
function sprite(ctx, atlas, name, x, y, w, h, opacity = 1) {
  if (opacity <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(opacity);
  if (name === "dust") dust(ctx, x, y, w, h);
  else if (atlas) ctx.drawImage(atlas, ...PROPS_RECTS[name], x, y, w, h);
  else if (name === "hammer") {
    ctx.fillStyle = "#258D8A"; ctx.fillRect(x + w * .4, y + h * .2, w * .2, h * .8);
    ctx.fillStyle = "#14366A"; ctx.fillRect(x, y, w, h * .25);
  } else { ctx.fillStyle = "#E15E31"; ctx.fillRect(x, y, w, h); }
  ctx.restore();
}

function sparkle(ctx, x, y, amount) {
  if (amount <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(amount); ctx.fillStyle = "#F6C76A";
  ctx.beginPath(); polygon(ctx, [[x, y - 9], [x + 2, y - 2], [x + 9, y], [x + 2, y + 2], [x, y + 9], [x - 2, y + 2], [x - 9, y], [x - 2, y - 2]]); ctx.fill(); ctx.restore();
}

function cloud(ctx, atlas, t, start, x, y, width = 120, seconds = .55) {
  const u = (t - start) / seconds;
  if (u <= 0 || u >= 1) return;
  const opacity = Math.sin(Math.PI * u), w = width * (.55 + u * .65);
  ctx.save(); ctx.globalAlpha *= opacity;
  dust(ctx, clamp(x - w / 2, 8, AMBIENT_BOUNDS.width - w - 8), y - w * .37 - u * 15, w, w * 341 / 457, u);
  ctx.restore();
}

function inHouse(ctx, draw) {
  ctx.save(); ctx.translate(houseLeft, houseTop); ctx.scale(houseScale, houseScale);
  try { draw(); } finally { ctx.restore(); }
}

function sourceHouse(ctx, part = "all") {
  // One masonry surface, clipped into courses as Buddy works. There are no
  // disconnected brick sprites or a different finished-house image to swap in.
  if (part === "all" || typeof part === "number") {
    ctx.save(); ctx.beginPath(); polygon(ctx, wallOutline); ctx.clip();
    ctx.fillStyle = gradient(ctx, 35, 180, 411, 299, "#F9F8F3", "#D9DDD6"); ctx.fillRect(35, 72, 411, 407);
    ctx.strokeStyle = "rgba(111,126,133,.20)"; ctx.lineWidth = 2;
    for (let row = 0; row < 11; row += 1) {
      const y = 170 + row * 30;
      if (typeof part === "number" && (y + 30 < courseEdges[part + 1] || y > courseEdges[part])) continue;
      ctx.beginPath(); ctx.moveTo(35, y); ctx.lineTo(446, y);
      for (let x = 35 + (row % 2) * 34; x < 446; x += 68) { ctx.moveTo(x, y); ctx.lineTo(x, y + 30); }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(20,54,106,.11)"; ctx.beginPath(); polygon(ctx, [[410,189],[446,221],[446,479],[410,479]]); ctx.fill();
    ctx.restore();
    rounded(ctx, 25, 465, 431, 14, 4, "#CDD6D2");
  }
  // Slate roof, beveled eaves and chimney share the original approved outline.
  if (part === "all" || part === "roof") {
    rounded(ctx, 317, 14, 79, 115, 3, "#D1D9D4");
    ctx.fillStyle = "#B4C1BF"; ctx.fillRect(378, 14, 18, 115);
    rounded(ctx, 308, 0, 97, 22, 4, "#24486F");
    ctx.fillStyle = gradient(ctx, 0, 0, 190, 242, "#335C85", "#14366A"); ctx.beginPath(); polygon(ctx, roof); ctx.fill();
    ctx.strokeStyle = "#72939F"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 207); ctx.lineTo(226, 12); ctx.lineTo(470, 210); ctx.stroke();
    ctx.strokeStyle = "#0E294E"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(33, 236); ctx.lineTo(226, 80); ctx.lineTo(461, 236); ctx.stroke();
  }
  for (const rect of windows) {
    if (part !== "all" && part !== rect) continue;
    const [x, y, w, h] = rect;
    rounded(ctx, x + 3, y + 5, w, h, 5, "rgba(20,54,106,.15)");
    rounded(ctx, x, y, w, h, 5, "#FDFDFB");
    rounded(ctx, x + 8, y + 8, w - 16, h - 18, 2, "#24516A");
    rounded(ctx, x + 13, y + 13, w - 26, h - 28, 1,
      gradient(ctx, x, y, w, h, "#D6F2EF", "#77B3BA"));
    ctx.fillStyle = "rgba(255,255,255,.48)"; ctx.beginPath(); polygon(ctx, [[x+14,y+14],[x+w-14,y+14],[x+14,y+h-16]]); ctx.fill();
    ctx.fillStyle = "#FDFDFB"; ctx.fillRect(x + w / 2 - 3, y + 8, 6, h - 18); ctx.fillRect(x + 8, y + h * .47, w - 16, 5);
    rounded(ctx, x - 4, y + h - 7, w + 8, 12, 3, "#EEF0E8");
  }
  if (part === "all" || part === doorFrame) {
    rounded(ctx, ...doorFrame, 5, "#FDFDFB");
    rounded(ctx, 174, 276, 138, 203, 2, "#24445F");
  }
}

function doorPanel(ctx, w, h) {
  rounded(ctx, 0, 0, w, h, 2, gradient(ctx, 0, 0, w, h, "#E77B52", "#C45330"));
  for (const [y, height] of [[h * .08, h * .36], [h * .53, h * .37]]) {
    rounded(ctx, w * .15, y, w * .70, height, 1, "#AF462B");
    rounded(ctx, w * .18, y + h * .012, w * .64, height - h * .024, 1, "#DF7048");
  }
  ellipse(ctx, w * .82, h * .49, w * .044, w * .044, "#17334B");
  ellipse(ctx, w * .81, h * .484, w * .015, w * .015, "#F9F8F3");
}

function wallCourse(ctx, atlas, row, reveal, impactX) {
  if (reveal <= 0) return;
  inHouse(ctx, () => {
    ctx.beginPath(); polygon(ctx, wallOutline); ctx.clip();
    // Exclude each complete frame independently: adjacent frame shadows can
    // overlap, and one combined even-odd path would refill their intersection.
    for (const rect of [...windows, doorFrame]) {
      ctx.beginPath(); ctx.rect(0, 0, 481, 479); ctx.rect(...rect); ctx.clip("evenodd");
    }
    const bottom = courseEdges[row], top = courseEdges[row + 1], origin = (impactX - houseLeft) / houseScale;
    ctx.beginPath(); ctx.rect(origin - 481 * reveal, top, 962 * reveal, bottom - top + .4); ctx.clip();
    sourceHouse(ctx, row);
  });
}

function housePart(ctx, atlas, rect, progress, roofPart = false) {
  if (progress <= 0) return;
  inHouse(ctx, () => {
    const settle = Math.sin(progress * Math.PI * 2) * (1 - progress);
    ctx.translate(0, -(1 - progress) * (roofPart ? 112 : 28) + settle * (roofPart ? 12 : 5));
    ctx.beginPath();
    if (roofPart) { polygon(ctx, roof); ctx.rect(...roofChimney); }
    else ctx.rect(...rect);
    ctx.clip(); sourceHouse(ctx, roofPart ? "roof" : rect);
  });
}

function doorway(ctx, atlas, open, opacity = 1) {
  if (opacity <= 0) return;
  const d = { x: houseLeft + 180 * houseScale, y: houseTop + 280 * houseScale, w: 123 * houseScale, h: 192 * houseScale };
  ctx.save(); ctx.globalAlpha *= opacity;
  ctx.fillStyle = "#17334B"; ctx.fillRect(d.x, d.y, d.w, d.h);
  if (open > 0) {
    const light = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y + d.h);
    light.addColorStop(0, "#F6B854"); light.addColorStop(1, "#FFF5CF");
    ctx.fillStyle = light; ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.save(); ctx.globalAlpha *= open * .24;
    const beam = ctx.createLinearGradient(d.x, d.y + d.h, d.x, 426);
    beam.addColorStop(0, "#FFD88C"); beam.addColorStop(1, "rgba(255,216,140,0)");
    ctx.fillStyle = beam; ctx.beginPath(); polygon(ctx, [[d.x, d.y + d.h], [d.x + d.w, d.y + d.h], [d.x + d.w + 58, 426], [d.x - 50, 426]]); ctx.fill(); ctx.restore();
  }
  ctx.translate(d.x, d.y); ctx.transform(Math.cos(open * 1.42), -.08 * Math.sin(open * 1.42), 0, 1, 0, 0);
  doorPanel(ctx, d.w, d.h);
  ctx.restore();
}

function houseScene(ctx, atlas, form, kind, t) {
  const duration = AMBIENT_DURATIONS[kind], exit = 1 - phase(t, duration - 1.25, duration - .35);
  if (exit <= 0) return;
  ctx.save(); ctx.globalAlpha *= exit;
  const shadowArrival = phase(t, kind === "build" ? .75 : .2, kind === "build" ? 1.1 : .8);
  ctx.save(); ctx.globalAlpha *= shadowArrival;
  ellipse(ctx, house.x, house.bottom + 7, 100, 6, "rgba(20,54,106,.10)");
  ctx.restore();
  if (kind === "build" && t < 1.2) {
    ctx.save(); ctx.globalAlpha *= .32 * pulse(t, .25, 1.2);
    inHouse(ctx, () => {
      ctx.strokeStyle = "#258D8A"; ctx.lineWidth = 3;
      ctx.beginPath(); polygon(ctx, wallOutline); ctx.stroke();
      ctx.beginPath(); polygon(ctx, roof); ctx.stroke();
    });
    ctx.restore();
  }
  const construction = sampleConstruction(t);
  if (kind === "build" && !construction.assembled) {
    construction.courses.forEach((level, i) => wallCourse(ctx, atlas, i, level, hammerPoint(form, workFrames(form)[i]).x));
    housePart(ctx, atlas, null, construction.roof, true);
    windows.forEach((rect, i) => housePart(ctx, atlas, rect, construction.windows[i]));
    housePart(ctx, atlas, doorFrame, construction.door);
    doorway(ctx, atlas, 0, construction.door);
  } else {
    const arrive = kind === "polish" ? phase(t, .35, 1) : 1;
    ctx.save(); ctx.globalAlpha *= arrive; inHouse(ctx, () => sourceHouse(ctx));
    doorway(ctx, atlas, kind === "build" ? construction.doorOpen : phase(t, 4, 4.7)); ctx.restore();
  }
  ctx.restore();
  if (kind === "build") {
    workFrames(form).forEach((frame, i) => {
      if (i === 8) return;
      const point = hammerPoint(form, frame);
      cloud(ctx, atlas, t, frame.time - .01, point.x, point.y, i < 8 ? 62 : 80, .48);
      const impact = (t - frame.time) / .20;
      if (impact > 0 && impact < 1) {
        ctx.save(); ctx.globalAlpha *= (1 - impact) * .7; ctx.strokeStyle = "#258D8A";
        ctx.lineWidth = 1.8; ctx.lineCap = "round";
        for (let ray = 0; ray < 5; ray += 1) {
          const angle = ray * TAU / 5 - .5, inner = 5 + impact * 15, outer = inner + 8 * (1 - impact);
          ctx.beginPath(); ctx.moveTo(point.x + Math.cos(angle) * inner, point.y + Math.sin(angle) * inner);
          ctx.lineTo(point.x + Math.cos(angle) * outer, point.y + Math.sin(angle) * outer); ctx.stroke();
        }
        ctx.restore();
      }
    });
    // The finishing cloud opens into the same fully assembled vector house.
    cloud(ctx, atlas, t, 6.03, 143, 309, 345, 1.0);
    cloud(ctx, atlas, t, 6.15, 140, 217, 250, .9);
  } else cloud(ctx, atlas, t, .2, 149, 295, 300, 1.0);
  for (let i = 0; i < 3; i += 1) {
    const start = kind === "build" ? 6.65 : 3.5;
    sparkle(ctx, 66 + i * 91, 202 + (i % 2) * 88, Math.sin(Math.PI * clamp((t - start - i * .12) / .75)));
  }
  cloud(ctx, atlas, t, duration - 1.4, 147, 309, 310, 1.1);
}

function drawActor(ctx, rig, atlas, form, frame, hammerOpacity, groundOpacity, clothOpacity = 0) {
  ctx.save(); ctx.globalAlpha *= groundOpacity;
  ellipse(ctx, frame.x, 397, 46 * frame.scale, 4 * frame.scale, "rgba(20,54,106,.10)"); ctx.restore();
  rig.draw(ctx, form, frame.pose, frame.x, frame.y, frame.scale, 1, hammerOpacity > 0 || clothOpacity > 0 ? {
    beforeHands(local, { left }) {
      local.save(); local.translate(...left.w);
      const angle = heldLeft(form, frame.pose).angle;
      if (hammerOpacity > 0) {
        local.rotate(angle - .75); local.scale(-1, 1);
        sprite(local, atlas, "hammer", -28, -75, 56, 86, hammerOpacity);
      } else {
        local.rotate(angle); local.globalAlpha *= clothOpacity;
        local.fillStyle = "#F9F8F3"; local.beginPath(); polygon(local, [[-21,-16],[18,-11],[25,13],[-23,18]]); local.fill();
        local.strokeStyle = "#B7D2CD"; local.lineWidth = 2; local.beginPath();
        local.moveTo(-16, -11); local.quadraticCurveTo(-3, 0, 17, 10); local.stroke();
      }
      local.restore();
    },
  } : undefined);
}

export function drawAmbientScene(ctx, rig, propsAtlas, form, kind, seconds, originX = 0, originY = 0, scale = 1, variant = 0, sourcePose, targetPose) {
  if (![originX, originY, scale].every(Number.isFinite) || scale <= 0) return;
  form = normalForm(form); kind = Object.hasOwn(AMBIENT_DURATIONS, kind) ? kind : "stretch";
  const t = clamp(Number.isFinite(seconds) ? seconds : 0, 0, AMBIENT_DURATIONS[kind]);
  const frame = sampleAmbientScene(form, kind, t, variant, sourcePose, targetPose);
  ctx.save();
  try {
    ctx.translate(originX, originY); ctx.scale(scale, scale);
    if (kind === "build" || kind === "polish") houseScene(ctx, propsAtlas, form, kind, t);
    const hammer = kind === "build" ? phase(t, .25, .65) * (1 - phase(t, 6.05, 6.5)) : 0;
    if (kind === "build" && t > .4 && t < 6.2) {
      const prior = sampleAmbientScene(form, kind, Math.max(0, t - .07), variant, sourcePose, targetPose);
      const speed = Math.hypot(frame.x - prior.x, frame.y - prior.y);
      const tip = hammerPoint(form, frame), oldTip = hammerPoint(form, prior);
      const toolSpeed = Math.hypot(tip.x - oldTip.x, tip.y - oldTip.y);
      if (toolSpeed > 6) {
        ctx.save(); ctx.globalAlpha *= clamp(toolSpeed / 70) * .45;
        ctx.strokeStyle = "#81BCBA"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(oldTip.x, oldTip.y);
        ctx.quadraticCurveTo((tip.x + oldTip.x) / 2 + 6, Math.min(tip.y, oldTip.y) - 12, tip.x, tip.y); ctx.stroke(); ctx.restore();
      }
      if (speed > 7) {
        ctx.save(); ctx.globalAlpha *= clamp(speed / 100) * .28; ctx.strokeStyle = "#258D8A"; ctx.lineCap = "round";
        for (const offset of [-15, 12]) {
          ctx.lineWidth = offset < 0 ? 4 : 2; ctx.beginPath(); ctx.moveTo(prior.x, prior.y + offset);
          ctx.quadraticCurveTo(mix(prior.x, frame.x, .5), Math.min(prior.y, frame.y) + offset - 7, frame.x, frame.y + offset); ctx.stroke();
        }
        ctx.restore();
        sprite(ctx, propsAtlas, "dust", prior.x - 28, prior.y + 79 * prior.scale, 61, 45, clamp(speed / 90) * .44);
      }
    }
    const cloth = kind === "polish" ? phase(t, 1.55, 1.9) * (1 - phase(t, 3.4, 3.9)) : 0;
    drawActor(ctx, rig, propsAtlas, form, frame, hammer, phase(t, 0, .4) * (1 - phase(t, AMBIENT_DURATIONS[kind] - .4, AMBIENT_DURATIONS[kind])), cloth);
  } finally { ctx.restore(); }
}

// Compatibility for an old deferred import during a release; no ball branch.
export const PLAY_DURATIONS = AMBIENT_DURATIONS;
export function drawPlayScene(ctx, rig, atlas, form, kind, seconds, x, y, scale, variant = 0) {
  drawAmbientScene(ctx, rig, atlas, form, kind, seconds, x - 440 * scale, y - 220 * scale, scale, variant);
}
