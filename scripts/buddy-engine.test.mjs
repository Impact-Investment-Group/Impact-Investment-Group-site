import assert from "node:assert/strict";
import test from "node:test";
import { Character, blend, names, pose } from "../src/components/buddy/buddy-engine.js";
import { createIdleDirector, sampleTornadoSpin, TORNADO_DURATION_SECONDS, TORNADO_TIMING } from "../src/components/buddy/buddy-motion.js";
import { createAmbientDirector } from "../src/components/buddy/buddy-ambient-director.js";
import { AMBIENT_BOUNDS, AMBIENT_DURATIONS, drawAmbientScene, sampleAmbientScene, PROPS_RECTS } from "../src/components/buddy/buddy-play.js";

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
    transform(...matrix) { multiply(matrix); },
    fillRect(...rectangle) { finite(...rectangle); this.paint("rectangle"); },
    rotate(angle) { finite(angle); multiply([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]); },
    beginPath() {}, closePath() {}, rect: finite, clip() {},
    moveTo: finite, lineTo: finite, quadraticCurveTo: finite, bezierCurveTo: finite,
    ellipse(x, y, rx, ry, rotation, start, end) {
      finite(x, y, rx, ry, rotation, start, end);
      assert.ok(rx >= 0 && ry >= 0, "Negative ellipse radius");
    },
    createRadialGradient(...points) {
      finite(...points);
      return { addColorStop(offset) { assert.ok(Number.isFinite(offset) && offset >= 0 && offset <= 1); } };
    },
    createLinearGradient(...points) {
      finite(...points);
      return { addColorStop(offset) { assert.ok(Number.isFinite(offset) && offset >= 0 && offset <= 1); } };
    },
    paint(kind) {
      assert.ok(state.globalAlpha >= 0 && state.globalAlpha <= initial.globalAlpha + 1e-12, "Paint ignored inherited opacity");
      paints.push({ layer: this.layer, kind, alpha: state.globalAlpha, transform: [...state.transform] });
    },
    fill() { this.paint("fill"); },
    stroke() { this.paint("stroke"); },
    drawImage(_image, ...coordinates) { finite(...coordinates); this.paint("image"); paints[paints.length - 1].coordinates = coordinates; },
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
      for (const progress of [0, 0.1, 0.3, 0.459, 0.5, TORNADO_TIMING.retargetUntil, TORNADO_TIMING.revealStart - 0.000001, TORNADO_TIMING.revealStart]) {
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


function seededRandom(seed = 1879) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

test("idle direction has bounded varied poses, recent-repeat protection and deterministic sampling", () => {
  const left = createIdleDirector(seededRandom()), right = createIdleDirector(seededRandom());
  const recent = [], observed = new Set(), styles = new Set(), pauses = new Set();
  for (let index = 0; index < 180; index += 1) {
    const form = Math.floor(index / 12) % 3;
    const step = left.next(form);
    assert.deepEqual(step, right.next(form), "Same seed and page forms changed choreography");
    assert.ok(step.action >= 0 && step.action < names.length);
    assert.ok(step.expression >= 1 && step.expression <= 12);
    assert.ok(step.seconds >= 1 && step.seconds <= 5);
    assert.ok([0, 1, 2].includes(step.style));
    if (step.action === 0) { pauses.add(step.seconds); continue; }
    assert.ok(!recent.includes(step.action), "A recently performed gesture repeated");
    recent.push(step.action); if (recent.length > 4) recent.shift();
    observed.add(step.action); styles.add(step.style);
  }
  assert.ok(observed.size >= 12, "The director collapsed into a small repeating loop");
  assert.equal(styles.size, 3, "Calm, bouncy and expressive treatments must all remain available");
  assert.ok(pauses.size > 10, "Every pause used the same timing");
});

test("unreliable injected randomness cannot create missing or unbounded idle steps", () => {
  for (const value of [NaN, Infinity, -5, 1, 20]) {
    const director = createIdleDirector(() => value);
    for (let index = 0; index < 50; index += 1) {
      const step = director.next(index % 3);
      assert.ok(Object.values(step).every(Number.isFinite));
      assert.ok(step.action >= 0 && step.action < names.length);
      assert.ok(step.seconds >= 1 && step.seconds <= 5);
    }
  }
});

test("tornado retargeting ends while concealed, with dense wind throughout that interval", () => {
  assert.equal(TORNADO_DURATION_SECONDS, 3.2);
  assert.ok(TORNADO_TIMING.concealEnd < TORNADO_TIMING.retargetUntil);
  assert.ok(TORNADO_TIMING.retargetUntil < TORNADO_TIMING.revealStart);
  assert.ok((TORNADO_TIMING.revealStart - TORNADO_TIMING.concealEnd) * TORNADO_DURATION_SECONDS < .5);
  for (let i = 0; i <= 20; i += 1) {
    const t = TORNADO_TIMING.concealEnd + (TORNADO_TIMING.revealStart - TORNADO_TIMING.concealEnd) * i / 20;
    const { context, character } = transitionFrame(0, 2, t);
    assert.equal(character.bodies.length, 0);
    assert.ok(context.paints.some(paint => paint.layer === "rear wind" && paint.alpha > .1));
    assert.ok(context.paints.some(paint => paint.layer === "front wind" && paint.alpha > .1));
  }
});

test("tornado spin has continuous angular momentum and a genuinely turning silhouette", () => {
  assert.equal(sampleTornadoSpin(0).velocity, 0);
  assert.equal(sampleTornadoSpin(1).velocity, 0);
  assert.equal(sampleTornadoSpin(0).angle, 0);
  assert.ok(sampleTornadoSpin(1).angle >= Math.PI * 8, "Transformation never completed several full turns");
  let previous = sampleTornadoSpin(0);
  for (let i = 1; i <= 1000; i += 1) {
    const current = sampleTornadoSpin(i / 1000);
    assert.ok(Object.values(current).every(Number.isFinite));
    assert.ok(current.angle > previous.angle, "Angular phase reset or reversed");
    assert.ok(current.angle - previous.angle < .1, "Angular phase jumped");
    previous = current;
  }
  assert.ok(sampleTornadoSpin(.1).velocity < sampleTornadoSpin(.3).velocity);
  assert.ok(sampleTornadoSpin(.9).velocity < sampleTornadoSpin(.7).velocity);
  const rig = new RecordingCharacter();
  let faces = 0;
  rig.face = () => { faces += 1; };
  for (const yaw of [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2]) {
    const context = transitionCanvas();
    rig.draw(context, 0, { ...pose(0, 0, .6), yaw }, 440, 220);
    context.assertRestored();
  }
  assert.equal(faces, 2, "Rear and edge-on turns exposed the front-facing facial artwork");
});

test("ambient direction covers all scenes without immediate repeats or fixed pauses", () => {
  const first = createAmbientDirector(seededRandom()), second = createAmbientDirector(seededRandom());
  const recent = [], observed = new Set(), pauses = new Set();
  let lastVariant;
  for (let i = 0; i < 100; i += 1) {
    const step = first.next();
    assert.deepEqual(step, second.next());
    assert.ok(Object.hasOwn(AMBIENT_DURATIONS, step.kind));
    assert.equal(step.seconds, AMBIENT_DURATIONS[step.kind]);
    assert.ok(!recent.includes(step.kind));
    assert.notEqual(step.variant, lastVariant);
    assert.ok([0, 1, 2].includes(step.variant));
    assert.ok(step.restSeconds >= (i ? 10 : 8) && step.restSeconds <= (i ? 20 : 14));
    recent.push(step.kind); if (recent.length > 2) recent.shift();
    observed.add(step.kind); pauses.add(step.restSeconds); lastVariant = step.variant;
  }
  assert.equal(observed.size, 5);
  assert.ok(pauses.size > 20);
});

test("ambient art stays in its approved cells and has no ball or toy-brick renderer", () => {
  assert.equal("ball" in AMBIENT_DURATIONS, false);
  assert.equal("ball" in PROPS_RECTS, false);
  assert.equal("brick" in PROPS_RECTS, false);
  for (const [x, y, w, h] of Object.values(PROPS_RECTS)) {
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0);
    assert.ok(x + w <= 1536 && y + h <= 1024);
  }
});

for (const kind of Object.keys(AMBIENT_DURATIONS)) {
  test(`${kind}: actual actor endpoints are preserved and every form/variant is bounded`, () => {
    const duration = AMBIENT_DURATIONS[kind];
    for (let form = 0; form < 3; form += 1) {
      const source = Object.freeze(blend(pose(form, 3, .2), pose(form, 0, .6), .4));
      const target = Object.freeze(pose(form, 0, .9, 0, 7));
      const saved = structuredClone({ source, target });
      for (let variant = 0; variant < 3; variant += 1) {
        for (const [t, expected, complete] of [[0, source, false], [duration, target, true], [duration + 50, target, true]]) {
          const frame = sampleAmbientScene(form, kind, t, variant, source, target);
          assert.deepEqual(frame, { pose: expected, x: AMBIENT_BOUNDS.anchorX, y: AMBIENT_BOUNDS.anchorY, scale: 1, complete });
        }
        let previous;
        for (let frame = 0; frame <= Math.ceil(duration * 60); frame += 1) {
          const current = sampleAmbientScene(form, kind, frame / 60, variant, source, target);
          assert.ok(Object.values(current.pose).every(Number.isFinite));
          assert.ok([current.x, current.y, current.scale].every(Number.isFinite));
          assert.ok(current.x >= 100 && current.x <= 470 && current.y >= 120 && current.y <= 330);
          assert.ok(current.scale >= .55 && current.scale <= 1);
          if (previous) assert.ok(Math.hypot(current.x - previous.x, current.y - previous.y) < 26, "Actor teleported between frames");
          previous = current;
        }
        for (const atlas of [{}, undefined]) {
          for (let frame = 0; frame <= 24; frame += 1) {
            const context = transitionCanvas();
            drawAmbientScene(context, new Character({}, {}), atlas, form, kind, duration * frame / 24, 0, 0, 1, variant, source, target);
            context.assertRestored();
            assert.ok(context.paints.some(paint => paint.alpha > 0), "Scene painted a blank frame");
          }
          const final = transitionCanvas(), later = transitionCanvas();
          drawAmbientScene(final, new Character({}, {}), atlas, form, kind, duration, 0, 0, 1, variant, source, target);
          drawAmbientScene(later, new Character({}, {}), atlas, form, kind, duration + 10, 0, 0, 1, variant, source, target);
          assert.deepEqual(final.paints, later.paints, "Completed ambient scene kept moving");
        }
      }
      assert.deepEqual({ source, target }, saved, "Scene changed a captured pose");
    }
  });
}

test("construction moves Buddy through the work rather than moving props around a stationary actor", () => {
  for (let form = 0; form < 3; form += 1) {
    const frames = Array.from({ length: 180 }, (_, i) => sampleAmbientScene(form, "build", i / 30));
    const xs = frames.map(frame => frame.x), ys = frames.map(frame => frame.y);
    assert.ok(Math.max(...xs) - Math.min(...xs) > 270, "Buddy did not leave the launcher anchor");
    assert.ok(Math.max(...ys) - Math.min(...ys) > 65, "Buddy stayed on one horizontal track");
    assert.ok(frames.some(frame => Math.abs(frame.pose.yaw) > Math.PI), "The dash never turned the actual body");
    const lastWork = sampleAmbientScene(form, "build", 6.4);
    const ending = sampleAmbientScene(form, "build", AMBIENT_DURATIONS.build);
    assert.notEqual(lastWork.x, ending.x);
  }
});

function imagePaints(context, rect) {
  return context.paints.filter(paint => paint.kind === "image" && rect.every((n, i) => n === paint.coordinates[i]));
}

function worldPoint(matrix, x, y) {
  return { x: matrix[0] * x + matrix[2] * y + matrix[4], y: matrix[1] * x + matrix[3] * y + matrix[5] };
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

test("wall courses follow strikes; roof, complete window frames and door arrive later", () => {
  const counts = [[.9, 0], [1.2, 1], [2, 3], [3.99, 8], [4.6, 9], [5.0, 10], [5.45, 11], [5.85, 12], [6.25, 13], [6.5, 1]];
  for (const [time, expected] of counts) {
    const context = transitionCanvas();
    drawAmbientScene(context, new Character({}, {}), {}, 0, "build", time);
    assert.equal(imagePaints(context, PROPS_RECTS.house).length, expected, `Wrong house stage at ${time}`);
    context.assertRestored();
  }
  const beforeDoor = transitionCanvas(), afterDoor = transitionCanvas();
  drawAmbientScene(beforeDoor, new Character({}, {}), {}, 0, "build", 5.9);
  drawAmbientScene(afterDoor, new Character({}, {}), {}, 0, "build", 6.25);
  assert.equal(imagePaints(beforeDoor, PROPS_RECTS.door).length, 0);
  assert.equal(imagePaints(afterDoor, PROPS_RECTS.door).length, 1);
});

test("construction dust originates at the actual rig-attached hammer head at every course strike", () => {
  const u = .01 / .48, dustWidth = 62 * (.55 + u * .65);
  for (let form = 0; form < 3; form += 1) {
    for (let i = 0; i < 8; i += 1) {
      const context = transitionCanvas(), time = 1 + i * .4;
      drawAmbientScene(context, new Character({}, {}), {}, form, "build", time);
      const hammer = imagePaints(context, PROPS_RECTS.hammer);
      assert.equal(hammer.length, 1, "Hammer detached or duplicated");
      const contact = worldPoint(hammer[0].transform, -5, -62);
      const scale = 230 / 481, localX = (contact.x - 7 - 35) / scale;
      const localY = (contact.y - 11 - (386 - 479 * scale)) / scale;
      assert.ok(insidePolygon(localX, localY, [[35, 221], [226, 72], [446, 221], [446, 479], [35, 479]]), `Hammer missed wall silhouette: form ${form}, course ${i}`);
      for (const [x, y, w, h] of [[183, 126, 119, 124], [55, 286, 111, 127], [315, 286, 111, 127], [160, 263, 166, 216]]) {
        assert.ok(!(localX >= x && localX <= x + w && localY >= y && localY <= y + h), `Hammer hit an unbuilt opening: form ${form}, course ${i}`);
      }
      const puff = imagePaints(context, PROPS_RECTS.dust).find(paint => Math.abs(paint.coordinates[6] - dustWidth) < 1e-7);
      assert.ok(puff, "No strike puff at the workpoint");
      const [, , , , x, y, w] = puff.coordinates;
      const origin = worldPoint(puff.transform, x + w / 2, y + w * .37 + u * 15);
      assert.ok(Math.hypot(contact.x - origin.x, contact.y - origin.y) < 1e-7, "Dust was detached from the transformed hammer");
      context.assertRestored();
    }
  }
});

test("hammer stays in a closed sampled left hand, including the roof-guide and inspection transitions", () => {
  for (let form = 0; form < 3; form += 1) {
    for (const t of [.26, .7, 1.4, 3.8, 4.12, 4.48, 5.6, 6.0, 6.3, 6.49]) {
      const frame = sampleAmbientScene(form, "build", t);
      assert.equal(frame.pose.lh, 1);
      assert.equal(frame.pose.handMix, 1, "A partly open old hand was still drawn over the handle");
      const context = transitionCanvas(), rig = new TransitionCharacter();
      drawAmbientScene(context, rig, {}, form, "build", t);
      assert.deepEqual(rig.bodies.at(-1).value, frame.pose, "Rendered grip differs from the interruptible sampled pose");
      assert.equal(imagePaints(context, PROPS_RECTS.hammer).length, 1);
    }
  }
});

test("all scene variants alter an authored movement or finish, without moving construction contacts", () => {
  for (const [kind, time] of [["dance", 2], ["peek", 2.1], ["stretch", 2.7], ["polish", 2.6], ["build", 7.7]]) {
    const variants = [0, 1, 2].map(variant => sampleAmbientScene(0, kind, time, variant));
    assert.notDeepEqual(variants[0], variants[1], kind);
    assert.notDeepEqual(variants[1], variants[2], kind);
  }
  for (let i = 0; i < 8; i += 1) {
    const time = 1 + i * .4;
    assert.deepEqual(sampleAmbientScene(0, "build", time, 0), sampleAmbientScene(0, "build", time, 2));
  }
});

test("hand-held props remain behind the gripping hands without changing the draw contract", () => {
  const rig = new RecordingCharacter(), context = transitionCanvas();
  let attachment;
  rig.draw(context, 0, pose(0, 28, .4), 300, 220, 1, 1, {
    beforeHands(_context, parts) {
      assert.equal(rig.drawnHands.length, 0);
      attachment = parts.right.w;
    },
  });
  assert.ok(attachment.every(Number.isFinite));
  assert.equal(rig.drawnHands.length, 2);
  context.assertRestored();
});

