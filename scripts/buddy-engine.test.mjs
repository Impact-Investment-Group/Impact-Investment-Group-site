import assert from "node:assert/strict";
import test from "node:test";
import { Character, blend, names, pose } from "../src/components/buddy/buddy-engine.js";

const radians = (degrees) => (degrees * Math.PI) / 180;
const angularDistance = (a, b) => Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));

// Exercise Character.draw's actual hand dispatch without a browser or rasterizer.
// Stubbing hand() records the rotation the real renderer would receive.
class RecordingCharacter extends Character {
  constructor() {
    super({});
    this.drawnHands = [];
  }
  arm() {}
  sprite() {}
  face() {}
  hand(_context, _x, _y, angle, kind, mirrored) {
    this.drawnHands.push({ angle, kind, side: mirrored ? "left" : "right" });
  }
}

function drawnAngles(form, value) {
  const character = new RecordingCharacter();
  const context = {
    globalAlpha: 1,
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
  };
  character.draw(context, form, value, 0, 0);
  return Object.fromEntries(character.drawnHands.map(({ side, angle }) => [side, angle]));
}

for (const [form, label] of ["key", "pound", "heart"].entries()) {
  test(`${label}: one foreground arm cannot rotate the opposite lowered hand`, () => {
    const idle = pose(form, 0, 0.55);
    const original = drawnAngles(form, idle);
    const rightForward = drawnAngles(form, { ...idle, frontR: 1 });
    const leftForward = drawnAngles(form, { ...idle, frontL: 1 });
    assert.ok(angularDistance(original.left, rightForward.left) < 1e-9, "Right arm snapped the left wrist");
    assert.ok(angularDistance(original.right, leftForward.right) < 1e-9, "Left arm snapped the right wrist");
  });

  test(`${label}: lowered hand remains continuous through Think and Search blends`, () => {
    const idle = pose(form, 0, 0.55);
    for (const action of [3, 16]) {
      const target = pose(form, action, 0.55);
      const start = drawnAngles(form, idle).left;
      let previous = start;
      for (let frame = 1; frame <= 45; frame += 1) {
        const current = drawnAngles(form, blend(idle, target, frame / 45)).left;
        assert.ok(
          angularDistance(previous, current) < radians(5),
          `${names[action]} snapped the lowered wrist at blend frame ${frame}`,
        );
        previous = current;
      }
      assert.ok(angularDistance(start, previous) < radians(5), `${names[action]} moved the inactive wrist`);
    }
  });
}

test("wrist and body rotations cross the 180-degree seam along the short arc", () => {
  for (const direction of [1, -1]) {
    const from = {
      ...pose(0, 0, 0),
      la: radians(179 * direction),
      ra: radians(179 * direction),
      rot: radians(179 * direction),
    };
    const to = {
      ...from,
      la: radians(-179 * direction),
      ra: radians(-179 * direction),
      rot: radians(-179 * direction),
    };
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const current = blend(from, to, progress);
      for (const key of ["la", "ra", "rot"]) {
        const expected = radians((179 + 2 * progress) * direction);
        assert.ok(
          angularDistance(current[key], expected) < 1e-9,
          `${key} took a long rotation at ${progress}`,
        );
      }
    }
  }
});

test("all forms and movement styles have finite, temporally continuous poses including Dance", () => {
  assert.equal(names[24], "Dance", "The new dance must not renumber existing movement states");
  for (let form = 0; form < 3; form += 1) {
    for (let style = 0; style < 3; style += 1) {
      for (let action = 0; action < names.length; action += 1) {
        let previous;
        for (let frame = 0; frame <= 600; frame += 1) {
          const current = pose(form, action, frame / 60, style);
          const label = `form ${form}, ${names[action]}, style ${style}, frame ${frame}`;
          assert.ok(Object.values(current).every(Number.isFinite), `Non-finite pose: ${label}`);
          if (previous) {
            for (const key of ["la", "ra"]) {
              // Allows the expressive wave while rejecting abrupt elbow/wrist branch flips.
              assert.ok(
                angularDistance(previous[key], current[key]) < radians(8),
                `${key} snapped: ${label}`,
              );
            }
          }
          previous = current;
        }
      }
    }
  }
});

// Keep the actual wind paths, body, face, arms and hand dispatch in these tests.
// The canvas records paint order and rejects invalid numbers rather than drawing
// pixels; browser visual checks remain responsible for the finished appearance.
function transitionCanvas() {
  const initial = {
    globalAlpha: 0.63, fillStyle: "initial fill", strokeStyle: "initial stroke",
    lineWidth: 3, lineCap: "butt", lineJoin: "miter",
    transform: [1, 0, 0, 1, 7, 11],
  };
  let state = structuredClone(initial);
  const stack = [];
  const paints = [];
  const finite = (...values) => assert.ok(values.every(Number.isFinite), `Invalid canvas coordinates: ${values}`);
  const multiply = (next) => {
    finite(...next);
    const [a, b, c, d, e, f] = state.transform;
    const [g, h, i, j, k, l] = next;
    state.transform = [a*g+c*h, b*g+d*h, a*i+c*j, b*i+d*j, a*k+c*l+e, b*k+d*l+f];
    finite(...state.transform);
  };
  const context = {
    layer: "outside",
    paints,
    save() { stack.push({ ...state, transform: [...state.transform] }); },
    restore() { assert.ok(stack.length, "Unbalanced canvas restore"); state = stack.pop(); },
    translate(x, y) { multiply([1, 0, 0, 1, x, y]); },
    scale(x, y) { multiply([x, 0, 0, y, 0, 0]); },
    rotate(angle) { finite(angle); multiply([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]); },
    beginPath() {}, closePath() {},
    moveTo: finite, lineTo: finite, quadraticCurveTo: finite, bezierCurveTo: finite,
    ellipse(x, y, rx, ry, rotation, start, end) {
      finite(x, y, rx, ry, rotation, start, end);
      assert.ok(rx >= 0 && ry >= 0, "Negative ellipse radius");
    },
    createLinearGradient(...points) {
      finite(...points);
      return { addColorStop(offset) { assert.ok(Number.isFinite(offset) && offset >= 0 && offset <= 1); } };
    },
    paint(kind) {
      assert.ok(state.globalAlpha >= 0 && state.globalAlpha <= initial.globalAlpha + 1e-12, "Paint ignored inherited opacity");
      paints.push({ layer: this.layer, kind, alpha: state.globalAlpha });
    },
    fill() { this.paint("fill"); },
    stroke() { this.paint("stroke"); },
    drawImage(_image, ...coordinates) { finite(...coordinates); this.paint("image"); },
    assertRestored() {
      assert.equal(stack.length, 0, "Unclosed canvas save");
      assert.deepEqual(state, initial, "Transition leaked canvas state to the next frame");
    },
  };
  for (const property of ["globalAlpha", "fillStyle", "strokeStyle", "lineWidth", "lineCap", "lineJoin"]) {
    Object.defineProperty(context, property, {
      get: () => state[property],
      set: value => {
        if (property === "globalAlpha") assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
        if (property === "lineWidth") assert.ok(Number.isFinite(value) && value > 0);
        state[property] = value;
      },
    });
  }
  return context;
}

class TransitionCharacter extends Character {
  constructor() { super({}, {}); this.bodies = []; }
  draw(context, form, value, ...placement) {
    this.bodies.push({ form, value: { ...value }, alpha: placement[3] ?? 1 });
    const previous = context.layer;
    context.layer = "body";
    try { super.draw(context, form, value, ...placement); }
    finally { context.layer = previous; }
  }
  tornado(context, progress, x, y, scale, front) {
    const previous = context.layer;
    context.layer = front ? "front wind" : "rear wind";
    try { super.tornado(context, progress, x, y, scale, front); }
    finally { context.layer = previous; }
  }
}

function transitionFrame(from, to, progress, source, target) {
  const context = transitionCanvas();
  const character = new TransitionCharacter();
  const endpoints = source === undefined && target === undefined ? [] : [source, target];
  character.transition(context, from, to, "Tornado", progress, 3, 0, 128, 128, 0.6016, ...endpoints);
  context.assertRestored();
  assert.equal(context.layer, "outside");
  assert.ok(character.bodies.every(body => Object.values(body.value).every(Number.isFinite)), "Transition produced a non-finite pose");
  return { context, character };
}

for (let from = 0; from < 3; from += 1) {
  for (let to = 0; to < 3; to += 1) {
    if (from === to) continue;
    const label = `${["key", "pound", "heart"][from]} to ${["key", "pound", "heart"][to]}`;
    // A blended source and explicit target expression detect substitution with
    // a newly generated default pose at either boundary.
    const source = Object.freeze(blend(pose(from, 0, 1.2, 1, 7), pose(from, 16, 0.3, 2, 5), 0.37));
    const target = Object.freeze(pose(to, 4, 0.5, 1, 3));

    test(`tornado ${label}: exact source and target endpoints without input mutation`, () => {
      const before = structuredClone({ source, target });
      for (const [progress, form, expected] of [[0, from, source], [1, to, target]]) {
        const { context, character } = transitionFrame(from, to, progress, source, target);
        assert.deepEqual(character.bodies, [{ form, value: expected, alpha: 1 }]);
        assert.ok(context.paints.length > 0, "Endpoint body was blank");
        assert.ok(context.paints.every(paint => paint.layer === "body"), "Wind remained visible at an endpoint");
      }
      assert.deepEqual({ source, target }, before);
    });

    test(`tornado ${label}: wind surrounds visible artwork and conceals the target until reveal`, () => {
      for (const progress of [0.30, 0.82]) {
        const { context, character } = transitionFrame(from, to, progress, source, target);
        const layers = context.paints.filter(paint => paint.alpha > 0).map(paint => paint.layer);
        const groups = layers.filter((layer, index) => index === 0 || layer !== layers[index - 1]);
        assert.deepEqual(groups, ["rear wind", "body", "front wind"], `Incorrect occlusion at ${progress}`);
        assert.equal(character.bodies.length, 1);
        assert.equal(character.bodies[0].form, progress < 0.5 ? from : to);
      }
      for (const progress of [0, 0.1, 0.3, 0.479, 0.5, 0.6, 0.719999, 0.72]) {
        const { context, character } = transitionFrame(from, to, progress, source, target);
        assert.ok(character.bodies.every(body => body.form !== to), `Target exposed before safe retargeting ended at ${progress}`);
        if (progress >= 0.5) {
          assert.equal(character.bodies.length, 0, "Concealed midpoint still draws a character");
          assert.ok(context.paints.some(paint => paint.alpha > 0), "Concealed midpoint is a blank frame");
        }
      }
    });

    test(`tornado ${label}: every sampled frame is finite and restores canvas state`, () => {
      for (let frame = 0; frame <= 42; frame += 1) transitionFrame(from, to, frame / 42, source, target);
    });
  }
}

test("tornado keeps the original call contract when endpoint poses are omitted", () => {
  for (const [progress, form] of [[0, 0], [1, 2]]) {
    const { character } = transitionFrame(0, 2, progress);
    assert.deepEqual(character.bodies, [{ form, value: pose(form, 3, 0.5, 0), alpha: 1 }]);
  }
});
