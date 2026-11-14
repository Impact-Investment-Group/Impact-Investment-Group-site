import assert from "node:assert/strict";
import test from "node:test";
import { createAmbientDirector } from "../src/components/buddy/buddy-ambient-director.js";
import { drawAmbientScene, sampleAmbientScene, sampleConstruction, PROPS_RECTS } from "../src/components/buddy/buddy-play.js";

function canvasRecorder() {
  const paints = [], stack = [];
  let state = { globalAlpha: .72, fillStyle: "initial", strokeStyle: "initial", lineWidth: 1, lineCap: "butt" };
  let path = [];
  const finite = (...values) => assert.ok(values.every(Number.isFinite));
  const gradient = type => ({ type, colors: [], addColorStop(offset, color) {
    assert.ok(offset >= 0 && offset <= 1); this.colors.push(color);
  } });
  const ctx = {
    paints,
    save() { stack.push({ ...state }); },
    restore() { assert.ok(stack.length); state = stack.pop(); },
    translate: finite, scale: finite, rotate: finite, transform: finite,
    beginPath() { path = []; }, closePath() {}, clip() {},
    moveTo(...values) { finite(...values); path.push(["move", ...values]); },
    lineTo(...values) { finite(...values); path.push(["line", ...values]); },
    quadraticCurveTo(...values) { finite(...values); path.push(["curve", ...values]); },
    rect(...values) { finite(...values); path.push(["rect", ...values]); },
    ellipse(...values) { finite(...values); assert.ok(values[2] >= 0 && values[3] >= 0); },
    createLinearGradient(...values) { finite(...values); return gradient("linear"); },
    createRadialGradient(...values) { finite(...values); return gradient("radial"); },
    fillRect(...values) { finite(...values); this.paint("fill"); },
    drawImage(image, ...values) { finite(...values); paints.push({ kind: "image", image, values }); },
    fill() { this.paint("fill"); }, stroke() { this.paint("stroke"); },
    paint(kind) {
      assert.ok(state.globalAlpha >= 0 && state.globalAlpha <= .72 + 1e-10);
      paints.push({ kind, style: kind === "stroke" ? state.strokeStyle : state.fillStyle, path: [...path] });
    },
    balanced() { assert.equal(stack.length, 0); assert.equal(state.globalAlpha, .72); },
  };
  for (const key of Object.keys(state)) Object.defineProperty(ctx, key, { get: () => state[key], set: value => { state[key] = value; } });
  return ctx;
}

function constructionPaint(t) {
  const ctx = canvasRecorder();
  drawAmbientScene(ctx, { draw() {} }, {}, 0, "build", t);
  ctx.balanced();
  return ctx.paints;
}

const usesColor = (paint, color) => paint.style?.colors?.includes(color);

test("the constructed house is continuous vector masonry, roof and glazing instead of cropped image layers", () => {
  for (const [time, walls, roof, windows, door] of [
    [.9, 0, 0, 0, 0], [1.2, 1, 0, 0, 0], [2, 3, 0, 0, 0], [3.99, 8, 0, 0, 0],
    [4.6, 8, 1, 0, 0], [5, 8, 1, 1, 0], [5.45, 8, 1, 2, 0], [5.85, 8, 1, 3, 0],
    [6.25, 8, 1, 3, 1], [6.5, 1, 1, 3, 1],
  ]) {
    const paints = constructionPaint(time);
    assert.equal(paints.filter(paint => usesColor(paint, "#D9DDD6")).length, walls, `Masonry at ${time}`);
    assert.equal(paints.filter(paint => paint.style === "#0E294E").length, roof, `Roof at ${time}`);
    assert.equal(paints.filter(paint => usesColor(paint, "#D6F2EF")).length, windows, `Glazing at ${time}`);
    assert.equal(paints.filter(paint => usesColor(paint, "#E77B52")).length, door, `Door at ${time}`);
    for (const name of ["house", "door", "dust"]) {
      assert.ok(!paints.some(paint => paint.kind === "image" && PROPS_RECTS[name].every((value, i) => value === paint.values[i])));
    }
  }
});

test("construction finishes its masonry and fittings before the door opens", () => {
  let previous;
  for (let tick = 0; tick <= 470; tick += 1) {
    const current = sampleConstruction(tick / 60);
    const levels = [...current.courses, current.roof, ...current.windows, current.door, current.doorOpen];
    assert.ok(levels.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
    if (previous) levels.forEach((value, index) => assert.ok(value >= previous[index]));
    if (current.roof > 0) assert.ok(current.courses.every(value => value === 1));
    if (current.doorOpen > 0) {
      assert.equal(current.assembled, true);
      assert.ok(current.windows.every(value => value === 1));
      assert.equal(current.door, 1);
    }
    previous = levels;
  }
  assert.ok(constructionPaint(1.1).some(paint => paint.style?.type === "radial"), "The hammer impact has no drawn dust");
});

test("every construction contact has an authored loaded wrist and recoil on each form", () => {
  for (let form = 0; form < 3; form += 1) {
    for (let course = 0; course < 8; course += 1) {
      const time = 1 + course * .4;
      const wind = sampleAmbientScene(form, "build", time - .105);
      const contact = sampleAmbientScene(form, "build", time);
      const recoil = sampleAmbientScene(form, "build", time + .065);
      assert.ok(wind.pose.la - contact.pose.la > .5, "The hammer did not wind up");
      assert.ok(recoil.pose.la - contact.pose.la > .1, "The hammer did not recover from contact");
      assert.ok(wind.pose.ly < contact.pose.ly - 15);
      assert.equal(contact.pose.lh, 1);
      assert.deepEqual(contact, sampleAmbientScene(form, "build", time, 2), "Variation displaced a workpoint");
    }
  }
});

test("the shuffle performance contains two distinct hand-contact beats", () => {
  for (let form = 0; form < 3; form += 1) {
    for (const time of [1.535, 2.145]) {
      const clap = sampleAmbientScene(form, "dance", time, 0).pose;
      const open = sampleAmbientScene(form, "dance", time - .3, 0).pose;
      assert.ok(Math.abs(clap.rx - clap.lx) < 90);
      assert.ok(Math.abs(open.rx - open.lx) > Math.abs(clap.rx - clap.lx) + 90);
      assert.ok(clap.frontL > .8 && clap.frontR > .8);
    }
  }
});

test("the polish cloth is attached by the same before-hands contract as the tool", () => {
  const ctx = canvasRecorder();
  let attached = 0;
  const rig = { draw(context, form, value, x, y, scale, opacity, attachments) {
    assert.equal(form, 2); assert.ok(value.frontL > 0);
    attachments.beforeHands(context, { left: { w: [-125, 105] } }); attached += 1;
  } };
  drawAmbientScene(ctx, rig, {}, 2, "polish", 2.6, 0, 0, 1, 1);
  assert.equal(attached, 1);
  assert.ok(ctx.paints.some(paint => paint.style === "#B7D2CD" && paint.kind === "stroke"));
  ctx.balanced();
});

test("returning scenes choose a new performance and cover the authored repertoire", () => {
  let seed = 71;
  const director = createAmbientDirector(() => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; });
  const last = new Map(), seen = new Set();
  let previous;
  for (let index = 0; index < 150; index += 1) {
    const step = director.next();
    assert.notEqual(step.variant, previous);
    assert.notEqual(step.variant, last.get(step.kind));
    seen.add(`${step.kind}:${step.variant}`);
    last.set(step.kind, step.variant); previous = step.variant;
  }
  assert.equal(seen.size, 15);
});
