import { anatomy, blend, clamp, ease, limb, pose } from "./buddy-engine.js";

export const PLAY_DURATIONS = Object.freeze({ ball: 7.2, build: 8.4, home: 0, door: 4.8, dance: 5.6 });
export const PROPS_RECTS = Object.freeze({
  house: Object.freeze([49, 49, 481, 479]),
  door: Object.freeze([638, 95, 267, 435]),
  hammer: Object.freeze([1109, 68, 305, 467]),
  brick: Object.freeze([82, 688, 394, 225]),
  ball: Object.freeze([579, 606, 361, 365]),
  dust: Object.freeze([1025, 621, 457, 341]),
});

const TAU = Math.PI * 2;
const mix = (a, b, t) => a + (b - a) * t;
const phase = (t, start, end) => ease(clamp((t - start) / (end - start)));
const palette = { navy: "#14366A", teal: "#258D8A", orange: "#E15E31", cream: "#F9F8F3" };
const house = { x: 128, bottom: 157, width: 238, height: 238 * 479 / 481 };

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU);
  ctx.fill();
}

function fallback(ctx, name, x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = palette.orange;
  if (name === "ball") {
    ellipse(ctx, w / 2, h / 2, w / 2, h / 2, palette.teal);
    ctx.strokeStyle = palette.orange;
    ctx.lineWidth = Math.max(1, w / 8);
    ctx.beginPath();
    ctx.moveTo(w * .2, h * .16);
    ctx.bezierCurveTo(w * .9, h * .2, w * .1, h * .8, w * .8, h * .84);
    ctx.stroke();
  } else if (name === "dust") {
    for (let i = 0; i < 5; i += 1) ellipse(ctx, w * (.16 + i * .16), h * (.55 + Math.sin(i) * .1), w * .19, h * .3, palette.cream);
  } else if (name === "house") {
    ctx.fillStyle = palette.cream;
    ctx.fillRect(w * .1, h * .35, w * .8, h * .65);
    ctx.fillStyle = palette.navy;
    ctx.beginPath(); ctx.moveTo(0, h * .4); ctx.lineTo(w / 2, 0); ctx.lineTo(w, h * .4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = palette.teal;
    ctx.fillRect(w * .19, h * .47, w * .2, h * .2);
    ctx.fillRect(w * .64, h * .47, w * .2, h * .2);
    ctx.fillStyle = "#F6C76A";
    ctx.fillRect(w * 180 / 481, h * 280 / 479, w * 123 / 481, h * 192 / 479);
  } else if (name === "hammer") {
    ctx.fillStyle = palette.teal; ctx.fillRect(w * .38, h * .2, w * .26, h * .8);
    ctx.fillStyle = palette.navy; ctx.fillRect(0, 0, w, h * .28);
  } else {
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = palette.teal;
    if (name === "door") {
      ctx.fillRect(w * .14, h * .13, w * .7, h * .34);
      ellipse(ctx, w * .86, h * .56, w * .06, w * .06, palette.navy);
    } else {
      ellipse(ctx, w * .28, h * .2, w * .12, h * .09, "#A8471B");
      ellipse(ctx, w * .72, h * .2, w * .12, h * .09, "#A8471B");
    }
  }
  ctx.restore();
}

function sprite(ctx, atlas, name, x, y, width, height, alpha = 1) {
  if (alpha <= 0 || width <= 0 || height <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  if (atlas) ctx.drawImage(atlas, ...PROPS_RECTS[name], x, y, width, height);
  else fallback(ctx, name, x, y, width, height);
  ctx.restore();
}

function shadow(ctx, x, y, width, opacity = .14) {
  ellipse(ctx, x, y, width, 5, `rgba(20,54,106,${opacity})`);
}

function handPoint(form, value, x, y, size) {
  const n = anatomy[form];
  const right = limb(n.shoulders[1], [value.rx, value.ry], n.limbs, 1, [value.rex, value.rey]);
  const vx = right.w[0] + 12, vy = right.w[1] - 26;
  return {
    x: x + value.x * size + (Math.cos(value.rot) * vx - Math.sin(value.rot) * vy) * size * value.sx,
    y: y + value.y * size + (Math.sin(value.rot) * vx + Math.cos(value.rot) * vy) * size * value.sy,
  };
}

function arc(start, end, progress, height) {
  const u = clamp(progress);
  return { x: mix(start.x, end.x, u), y: mix(start.y, end.y, u) - Math.sin(Math.PI * u) * height };
}

function ballSprite(ctx, atlas, x, y, radius, rotation = 0, squash = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  ctx.scale(1 + squash * .12, 1 - squash * .15);
  sprite(ctx, atlas, "ball", -radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

function sparkle(ctx, x, y, size, opacity, colour = palette.orange) {
  if (opacity <= 0 || size <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(opacity); ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x, y - size); ctx.quadraticCurveTo(x + size * .2, y - size * .2, x + size, y);
  ctx.quadraticCurveTo(x + size * .2, y + size * .2, x, y + size);
  ctx.quadraticCurveTo(x - size * .2, y + size * .2, x - size, y);
  ctx.quadraticCurveTo(x - size * .2, y - size * .2, x, y - size);
  ctx.fill(); ctx.restore();
}

function dust(ctx, atlas, t, start, x, y, width = 180) {
  const u = clamp((t - start) / 1.35);
  if (t <= start || u >= 1) return;
  const opacity = Math.sin(Math.PI * u) * .9;
  const spread = width * (.5 + u * .65);
  sprite(ctx, atlas, "dust", x - spread / 2, y - 60 - u * 35, spread, spread * 341 / 457, opacity);
  for (let i = 0; i < 5; i += 1) {
    const angle = i * 1.7;
    sparkle(ctx, x + Math.cos(angle) * (25 + u * 80), y - 30 - u * 90 + Math.sin(angle) * 25,
      2 + Math.sin(u * Math.PI) * 4, opacity * .8, i % 2 ? palette.teal : palette.orange);
  }
}

function doorway() {
  const s = house.width / 481;
  return { x: house.x - house.width / 2 + 180 * s,
    y: house.bottom - house.height + 280 * s, width: 123 * s, height: 192 * s };
}

function drawHouse(ctx, atlas, openness = 0, glow = 0, alpha = 1, roofLift = 0) {
  const left = house.x - house.width / 2, top = house.bottom - house.height;
  ctx.save(); ctx.globalAlpha *= clamp(alpha);
  shadow(ctx, house.x, house.bottom + 7, house.width * .43);
  if (roofLift && atlas) {
    // Separate crops of the same supplied house, with an overlap beneath the roof.
    const r = PROPS_RECTS.house, split = 246, s = house.width / r[2];
    ctx.drawImage(atlas, r[0], r[1] + split - 4, r[2], r[3] - split + 4,
      left, top + (split - 4) * s, house.width, (r[3] - split + 4) * s);
    ctx.drawImage(atlas, r[0], r[1], r[2], split, left, top - roofLift, house.width, split * s);
  } else sprite(ctx, atlas, "house", left, top, house.width, house.height);
  const d = doorway();
  // Cover the atlas's lit opening while closed; the independent supplied door
  // swings around its left hinge instead of fading between unrelated pictures.
  ctx.fillStyle = "#17334B"; ctx.fillRect(d.x, d.y, d.width, d.height);
  if (openness > 0) {
    const light = ctx.createLinearGradient(d.x, d.y, d.x + d.width, d.y + d.height);
    light.addColorStop(0, "#F6B854"); light.addColorStop(1, "#FFF5CF");
    ctx.fillStyle = light; ctx.fillRect(d.x, d.y, d.width, d.height);
    ctx.save(); ctx.globalAlpha *= openness * (.18 + glow * .14);
    const beam = ctx.createLinearGradient(d.x, d.y + d.height, d.x - 65, 192);
    beam.addColorStop(0, "#FFD88C"); beam.addColorStop(1, "rgba(255,216,140,0)");
    ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(d.x, d.y + d.height);
    ctx.lineTo(d.x + d.width, d.y + d.height); ctx.lineTo(d.x + d.width + 60, 197);
    ctx.lineTo(d.x - 90, 197); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha *= openness * .22;
    const halo = ctx.createRadialGradient(d.x + d.width / 2, d.y + d.height / 2, 8,
      d.x + d.width / 2, d.y + d.height / 2, 90);
    halo.addColorStop(0, "#FFE4A1"); halo.addColorStop(1, "rgba(255,228,161,0)");
    ctx.fillStyle = halo; ctx.fillRect(d.x - 60, d.y - 35, d.width + 120, d.height + 80); ctx.restore();
  }
  const angle = openness * 1.40;
  ctx.save(); ctx.translate(d.x, d.y);
  ctx.transform(Math.cos(angle), -.08 * Math.sin(angle), 0, 1, 0, 0);
  sprite(ctx, atlas, "door", 0, 0, d.width, d.height);
  ctx.restore(); ctx.restore();
}

function drawBall(ctx, rig, atlas, form, t, variant) {
  const x = -100, y = 8, size = .84;
  const value = pose(form, 27, .55, 1, 6);
  const active = phase(t, 0, .55) * (1 - phase(t, 6.7, 7.2));
  value.rot += Math.sin(t * 2.4) * .035 * active;
  value.y -= Math.sin(t * 3.1) * 3 * active;
  const hand = handPoint(form, value, x, y, size);
  const floor = 139, first = { x: 189 - variant * 16, y: floor }, second = { x: 85, y: floor }, third = { x: 5, y: floor };
  let ball = hand, held = true;
  if (t >= .55 && t < 1.9) { held = false; ball = arc(hand, first, (t - .55) / 1.35, 178 + variant * 13); }
  else if (t >= 1.9 && t < 3.1) { held = false; ball = arc(first, second, (t - 1.9) / 1.2, 119 + variant * 9); }
  else if (t >= 3.1 && t < 4.2) { held = false; ball = arc(second, third, (t - 3.1) / 1.1, 75 + variant * 7); }
  else if (t >= 4.2 && t < 5.2) { held = false; ball = arc(third, hand, (t - 4.2), 90); }
  else if (t >= 5.8 && t < 6.5) { held = false; ball = arc(hand, hand, (t - 5.8) / .7, 67); }
  value.gazeX = clamp((ball.x - x) / 35, -6, 6); value.gazeY = clamp((ball.y - y) / 40, -4, 4);
  shadow(ctx, x, 163, 58);
  shadow(ctx, ball.x, 164, 13 + clamp((ball.y + 150) / 289) * 10, .07 + clamp((ball.y + 150) / 289) * .08);
  rig.draw(ctx, form, value, x, y, size, 1, held ? { beforeHands(local, { right }) {
    ballSprite(local, atlas, right.w[0] + 12, right.w[1] - 26, 28, t * 4.8);
  } } : undefined);
  if (!held) ballSprite(ctx, atlas, ball.x, ball.y, 28 * size, t * 4.8,
    Math.max(0, 1 - Math.min(...[1.9, 3.1, 4.2].map((hit) => Math.abs(t - hit))) / .1));
  if (t > 5.15 && t < 5.65) sparkle(ctx, hand.x + 29, hand.y - 25, 8 * Math.sin((t - 5.15) / .5 * Math.PI), 1);
}

function drawBuild(ctx, rig, atlas, form, t) {
  if (t >= PLAY_DURATIONS.build) { drawClosedHome(ctx, rig, atlas, form); return; }
  const x = -132, y = 20, size = .75;
  const rest = pose(form, 0, .6, 0, 2);
  const working = pose(form, 28, t * .6, 1, 4);
  const value = blend(rest, working, phase(t, 0, .55) * (1 - phase(t, 5.4, 6.1)));
  const finish = phase(t, 6.3, 7.2);
  const complete = blend(value, pose(form, 19, .55, 0, 12), finish);
  shadow(ctx, x, 165, 52);
  const houseReveal = phase(t, 5.4, 6.4);
  const blocksAlpha = 1 - phase(t, 5.45, 6.1);
  for (let index = 0; index < 16; index += 1) {
    const start = .7 + index * .22, u = clamp((t - start) / .5);
    if (t < start || blocksAlpha <= 0) continue;
    const row = Math.floor(index / 4), col = index % 4;
    const targetX = house.x - 96 + col * 48, targetY = 132 - row * 25;
    const landing = ease(u), arcY = -Math.sin(Math.PI * u) * 24;
    const bx = mix(-32, targetX, landing), by = mix(42, targetY, landing) - (1 - landing) * 20 + arcY;
    ctx.save(); ctx.translate(bx + 23, by + 13); ctx.rotate((1 - landing) * -.55);
    const squish = Math.sin(clamp((u - .8) / .2) * Math.PI) * .08;
    ctx.scale(1 + squish, 1 - squish);
    sprite(ctx, atlas, "brick", -23, -13, 46, 26, blocksAlpha); ctx.restore();
  }
  if (houseReveal > 0) drawHouse(ctx, atlas, 0, 0, houseReveal, (1 - phase(t, 5.75, 6.45)) * 82);
  rig.draw(ctx, form, complete, x, y, size, 1, t < 6.15 ? { beforeHands(local, { right }) {
    local.save(); local.globalAlpha *= 1 - phase(t, 5.35, 6.05);
    local.translate(right.w[0], right.w[1]);
    // Keep the handle locked to the fist while the authored wrist drives the strike.
    local.rotate(complete.ra + .75);
    sprite(local, atlas, "hammer", -24, -66, 49, 75);
    local.restore();
  } } : undefined);
  dust(ctx, atlas, t, 5.3, house.x, 115, 250);
  dust(ctx, atlas, t, 6.0, house.x, 35, 155);
  const shine = t > 6.65 && t < 8.1 ? Math.sin((t - 6.65) / 1.45 * Math.PI) : 0;
  for (let i = 0; i < 3; i += 1) sparkle(ctx, house.x - 85 + i * 80, -90 - (i % 2) * 22, 8 * shine, shine);
}

function drawClosedHome(ctx, rig, atlas, form) {
  shadow(ctx, -132, 165, 52);
  drawHouse(ctx, atlas, 0, 0);
  rig.draw(ctx, form, pose(form, 19, .55, 0, 12), -132, 20, .75);
}

function drawDoor(ctx, rig, atlas, form, t, isHome) {
  // Build completion, home and the initial door frame share one exact drawing.
  if (isHome || t <= .25) { drawClosedHome(ctx, rig, atlas, form); return; }
  const open = phase(t, .7, 2.45), curiosity = phase(t, .25, 1.1);
  const peek = blend(pose(form, 19, .55, 0, 12), pose(form, 13, Math.min(t, 2.3) * .6, 0, 3), curiosity);
  const welcome = blend(peek, pose(form, 1, Math.min(t, 3.8), 0, 2), phase(t, 2.1, 2.8));
  const final = blend(welcome, pose(form, 5, .55, 0, 2), phase(t, 3.8, PLAY_DURATIONS.door));
  final.gazeX = mix(final.gazeX, 5, curiosity);
  shadow(ctx, -132, 165, 52);
  drawHouse(ctx, atlas, open, Math.sin(Math.min(t, 3.8) * 2) * .5 + .5);
  rig.draw(ctx, form, final, -132, 20, .75);
  const twinkle = t > 1.6 && t < 3.2 ? Math.sin((t - 1.6) / 1.6 * Math.PI) : 0;
  const d = doorway();
  sparkle(ctx, d.x + d.width + 12, d.y + 12, twinkle * 6, twinkle, "#F6C76A");
}

function drawDance(ctx, rig, atlas, form, t, variant) {
  const initial = pose(form, 0, .55, 0, 2), finish = pose(form, 19, .55, 0, 12);
  const action = [24, 26, 9][variant], style = [1, 2, 1][variant];
  const energetic = pose(form, action, t * (variant === 1 ? .9 : 1), style, 6);
  let value = blend(initial, energetic, phase(t, 0, .65));
  if (t > 3.5) value = blend(value, pose(form, 11, (t - 3.5) * 1.1, 0, 2), phase(t, 3.5, 4.25));
  value = blend(value, finish, phase(t, 4.6, PLAY_DURATIONS.dance));
  shadow(ctx, value.x * .9, 171, 65);
  for (let i = 0; i < 12; i += 1) {
    const u = clamp((t - .7 - (i % 3) * .12) / 2.9);
    if (!u || u >= 1) continue;
    const angle = i * 2.39996, radius = 55 + u * 155;
    sparkle(ctx, Math.cos(angle) * radius, -40 + Math.sin(angle) * radius * .7 + u * u * 60,
      2.5 + (i % 3), Math.sin(Math.PI * u) * .8, Object.values(palette)[i % 3]);
  }
  rig.draw(ctx, form, value, 0, 7, .95);
  // The approved ball is a small final stage prop, rather than another mascot.
  const ballIn = phase(t, 4.4, 5.25);
  if (ballIn > 0) ballSprite(ctx, atlas, 130, 150 - Math.sin(ballIn * Math.PI) * 35, 20 * ballIn, -ballIn * 2);
}

/** Pure scene painting in a 600 x 440 logical stage centred on x/y.
 * The caller owns RAF, clearRect, pause, visibility and interaction. Sampling
 * after duration is a stable final image; the function never schedules work.
 */
export function drawPlayScene(ctx, rig, propsAtlas, form, kind, seconds, x, y, scale, variant = 0) {
  form = Number.isInteger(form) && form >= 0 && form < 3 ? form : 0;
  kind = Object.hasOwn(PLAY_DURATIONS, kind) ? kind : "home";
  const duration = PLAY_DURATIONS[kind];
  const t = Math.min(duration, Math.max(0, Number.isFinite(seconds) ? seconds : 0));
  variant = ((Math.trunc(Number.isFinite(variant) ? variant : 0) % 3) + 3) % 3;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(scale) || scale <= 0) return;
  ctx.save();
  try {
    ctx.translate(x, y); ctx.scale(scale, scale);
    if (kind === "ball") drawBall(ctx, rig, propsAtlas, form, t, variant);
    else if (kind === "build") drawBuild(ctx, rig, propsAtlas, form, t);
    else if (kind === "door" || kind === "home") drawDoor(ctx, rig, propsAtlas, form, t, kind === "home");
    else drawDance(ctx, rig, propsAtlas, form, t, variant);
  } finally { ctx.restore(); }
}
