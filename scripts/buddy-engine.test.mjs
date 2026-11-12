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
