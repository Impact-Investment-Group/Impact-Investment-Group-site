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

function neutral(form) { return pose(form, 0, .6, 0, 2); }
function actor(value, x = 440, y = 220, scale = 1) { return { pose: value, x, y, scale }; }
function calm(value) { return { ...value, x: 0, y: 0, rot: 0, yaw: 0, sx: 1, sy: 1 }; }
function normalForm(form) { return Number.isInteger(form) && form >= 0 && form < 3 ? form : 0; }

function localHammerPoint(form, value) {
  const n = anatomy[form];
  const arm = limb(n.shoulders[0], [value.lx, value.ly], n.limbs, -1, [value.lex, value.ley]);
  const angle = value.la - .75;
  return { x: arm.w[0] + 5 * Math.cos(angle) + 62 * Math.sin(angle),
    y: arm.w[1] + 5 * Math.sin(angle) - 62 * Math.cos(angle) };
}

function hammerPoint(form, frame) {
  const p = frame.pose, h = localHammerPoint(form, p), c = Math.cos(p.rot), s = Math.sin(p.rot);
  return { x: frame.x + (p.x + (h.x * c - h.y * s) * p.sx * (.065 + .935 * Math.abs(Math.cos(p.yaw)))) * frame.scale,
    y: frame.y + (p.y + (h.x * s + h.y * c) * p.sy) * frame.scale };
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
    ...workFrames(form),
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
    if (variant === 1) { value.yaw = TAU * phase(t, 1.2, 2.3); value.y -= Math.sin(Math.PI * phase(t, 1.2, 2.3)) * 26; }
    if (variant === 2) {
      const pointing = blend(pose(form, 6, work, 1, 6), pose(form, 7, work, 1, 6), phase(t, 1.8, 2.6));
      value = blend(value, pointing, .55 * Math.sin(Math.PI * clamp(work / 3.2)));
    }
    value = blend(value, pose(form, 11, .7, 0, 2), phase(t, 3.35, 4));
  } else if (kind === "peek") {
    const excursion = phase(t, .45, 1.8) * (1 - phase(t, 2.85, duration));
    value = pose(form, 13, work * .7, 0, 3);
    value.gazeX = (-7 + variant * 2) * excursion; value.gazeY = [0, -5, 5][variant] * excursion;
    value.rot -= excursion * [.16, .10, .22][variant];
    x -= [126, 96, 144][variant] * excursion; y += [18, -22, 30][variant] * excursion; size -= .14 * excursion;
    value = blend(value, pose(form, [1, 18, 8][variant], .7, 0, 2), phase(t, 2.35, 3.05) * (1 - leave));
  } else if (kind === "stretch") {
    value = pose(form, 25, Math.min(work, 2.6), 1, 2);
    const hop = Math.sin(Math.PI * phase(t, 2.25, 3.25));
    value.y -= hop * [30, 20, 36][variant]; value.x += hop * [0, -24, 18][variant]; value.sy += hop * .035;
    value.rot += hop * [0, -.08, .08][variant];
    value = blend(value, pose(form, [11, 19, 21][variant], .55, 0, 2), phase(t, 2.9, 3.5));
  } else {
    const approach = phase(t, .4, 1.4), retreat = phase(t, 4.8, duration);
    const visit = approach * (1 - retreat), wipe = phase(t, 1.6, 2) * (1 - phase(t, 3.4, 3.9));
    value = blend(pose(form, 16, .6, 0, 3), pose(form, 28, work, 0, 4), wipe);
    value.gazeX = -5;
    const direction = variant === 1 ? -1 : 1, radius = variant === 2 ? 10 : 7;
    const cleaning = { ...value, lx: -125 + Math.sin(work * 10) * radius * direction, ly: 105 + Math.cos(work * 10) * radius,
      lex: -143, ley: 58, lh: 0, frontL: 1 };
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

function polygon(ctx, points) { points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
function ellipse(ctx, x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
function sprite(ctx, atlas, name, x, y, w, h, opacity = 1) {
  if (opacity <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(opacity);
  if (atlas) ctx.drawImage(atlas, ...PROPS_RECTS[name], x, y, w, h);
  else if (name === "dust") {
    for (let i = 0; i < 5; i += 1) ellipse(ctx, x + w * (.15 + .17 * i), y + h * .53, w * .18, h * .32, "#F9F8F3");
  } else if (name === "hammer") {
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
  sprite(ctx, atlas, "dust", clamp(x - w / 2, 8, AMBIENT_BOUNDS.width - w - 8), y - w * .37 - u * 15, w, w * 341 / 457, opacity);
}

function inHouse(ctx, draw) {
  ctx.save(); ctx.translate(houseLeft, houseTop); ctx.scale(houseScale, houseScale);
  try { draw(); } finally { ctx.restore(); }
}

function sourceHouse(ctx, atlas) {
  if (atlas) ctx.drawImage(atlas, ...PROPS_RECTS.house, 0, 0, 481, 479);
  else { ctx.fillStyle = "#F9F8F3"; ctx.fillRect(35, 210, 411, 269); ctx.fillStyle = "#14366A"; ctx.beginPath(); polygon(ctx, [[0, 240], [226, 0], [481, 240]]); ctx.fill(); }
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
    sourceHouse(ctx, atlas);
  });
}

function housePart(ctx, atlas, rect, progress, roofPart = false) {
  if (progress <= 0) return;
  inHouse(ctx, () => {
    ctx.translate(0, -(1 - progress) * (roofPart ? 112 : 28));
    ctx.beginPath();
    if (roofPart) { polygon(ctx, roof); ctx.rect(...roofChimney); }
    else ctx.rect(...rect);
    ctx.clip(); sourceHouse(ctx, atlas);
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
  sprite(ctx, atlas, "door", 0, 0, d.w, d.h);
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
  if (kind === "build" && t < 6.40) {
    courseTimes.forEach((start, i) => wallCourse(ctx, atlas, i, phase(t, start, start + .18), hammerPoint(form, workFrames(form)[i]).x));
    housePart(ctx, atlas, null, phase(t, 4.22, 4.48), true);
    windows.forEach((rect, i) => housePart(ctx, atlas, rect, phase(t, fixtureTimes[i], fixtureTimes[i] + .18)));
    housePart(ctx, atlas, doorFrame, phase(t, 6.0, 6.20));
    doorway(ctx, atlas, 0, phase(t, 6.0, 6.20));
  } else {
    const arrive = kind === "polish" ? phase(t, .35, 1) : 1;
    ctx.save(); ctx.globalAlpha *= arrive; inHouse(ctx, () => sourceHouse(ctx, atlas));
    doorway(ctx, atlas, phase(t, kind === "build" ? 6.75 : 4, kind === "build" ? 7.45 : 4.7)); ctx.restore();
  }
  ctx.restore();
  if (kind === "build") {
    workFrames(form).forEach((frame, i) => {
      if (i === 8) return;
      const point = hammerPoint(form, frame);
      cloud(ctx, atlas, t, frame.time - .01, point.x, point.y, i < 8 ? 62 : 80, .48);
    });
    // Multi-puff dust conceals the switch from assembled source regions to the
    // complete exact artwork. It never substitutes unrelated toy bricks.
    cloud(ctx, atlas, t, 6.03, 143, 309, 345, 1.0);
    cloud(ctx, atlas, t, 6.15, 140, 217, 250, .9);
  } else cloud(ctx, atlas, t, .2, 149, 295, 300, 1.0);
  for (let i = 0; i < 3; i += 1) {
    const start = kind === "build" ? 6.65 : 3.5;
    sparkle(ctx, 66 + i * 91, 202 + (i % 2) * 88, Math.sin(Math.PI * clamp((t - start - i * .12) / .75)));
  }
  cloud(ctx, atlas, t, duration - 1.4, 147, 309, 310, 1.1);
}

function drawActor(ctx, rig, atlas, form, frame, hammerOpacity, groundOpacity) {
  ctx.save(); ctx.globalAlpha *= groundOpacity;
  ellipse(ctx, frame.x, 397, 46 * frame.scale, 4 * frame.scale, "rgba(20,54,106,.10)"); ctx.restore();
  rig.draw(ctx, form, frame.pose, frame.x, frame.y, frame.scale, 1, hammerOpacity > 0 ? {
    beforeHands(local, { left }) {
      local.save(); local.translate(...left.w); local.rotate(frame.pose.la - .75); local.scale(-1, 1);
      sprite(local, atlas, "hammer", -28, -75, 56, 86, hammerOpacity); local.restore();
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
    drawActor(ctx, rig, propsAtlas, form, frame, hammer, phase(t, 0, .4) * (1 - phase(t, AMBIENT_DURATIONS[kind] - .4, AMBIENT_DURATIONS[kind])));
  } finally { ctx.restore(); }
}

// Compatibility for an old deferred import during a release; no ball branch.
export const PLAY_DURATIONS = AMBIENT_DURATIONS;
export function drawPlayScene(ctx, rig, atlas, form, kind, seconds, x, y, scale, variant = 0) {
  drawAmbientScene(ctx, rig, atlas, form, kind, seconds, x - 440 * scale, y - 220 * scale, scale, variant);
}
