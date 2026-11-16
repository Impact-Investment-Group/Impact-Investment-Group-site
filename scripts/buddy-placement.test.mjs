import assert from "node:assert/strict";
import test from "node:test";
import { buddyDestinationRect, findBuddyCorner, followBuddyDestination, selectBuddyDestination } from "../src/components/buddy/buddy-placement.js";

import { buddyCanvasLayout } from "../src/components/buddy/buddy-canvas-frame.js";

const viewport = { width: 1280, height: 800 };
const slot = (id, kind, top, left = 600, size = 192) => ({ id, kind, top, left, width: size, height: size, right: left + size, bottom: top + size });
const corner = slot("corner", "corner", 550, 1050);

test("the same actor chooses a readable page placement then returns to its corner", () => {
  const page = slot("page", "page", 280);
  assert.equal(selectBuddyDestination([corner, page], null, viewport).id, "page");
  assert.equal(selectBuddyDestination([corner, { ...page, top: -200, bottom: -8 }], "page", viewport).id, "corner");
});

test("a small scroll does not switch the actor between neighbouring page slots", () => {
  const a = slot("a", "page", 200);
  const b = slot("b", "page", 280);
  assert.equal(selectBuddyDestination([corner, a, b], "a", viewport).id, "a");
  assert.equal(selectBuddyDestination([corner, { ...a, top: 100, bottom: 292 }, b], "a", viewport).id, "b");
});

test("a chat header takes priority over an in-page placement", () => {
  const chat = slot("chat", "chat", 40, 900, 72);
  assert.equal(selectBuddyDestination([corner, slot("page", "page", 280), chat], "page", viewport).id, "chat");
});

test("minimizing the corner hides the actor including in-page destinations", () => {
  assert.equal(selectBuddyDestination([slot("page", "page", 280)], "page", viewport), null);
});

test("clipped and hidden page placements cannot attract Buddy", () => {
  assert.equal(selectBuddyDestination([corner, slot("clipped", "page", 280, 1250), slot("hidden", "page", 280, 300, 0)], null, viewport).id, "corner");
});

test("the actor centres within a destination without exceeding its space", () => {
  const target = buddyDestinationRect({ ...slot("page", "page", 100), width: 400, height: 300 });
  assert.deepEqual(target, { x: 656, y: 106, size: 288 });
});

test("a changed destination starts at the displayed position, not the old endpoint", () => {
  const shown = { x: 400, y: 300, size: 192 };
  const target = { x: 200, y: 150, size: 48 };
  const next = followBuddyDestination(shown, target, .016);
  assert.ok(next.x > target.x && next.x < shown.x);
  assert.ok(next.y > target.y && next.y < shown.y);
  assert.ok(next.size > target.size && next.size < shown.size);
  assert.deepEqual(shown, { x: 400, y: 300, size: 192 });
});

test("reduced motion puts the same actor directly in its destination", () => {
  const target = { x: 40, y: 60, size: 48 };
  assert.deepEqual(followBuddyDestination({ x: 800, y: 500, size: 192 }, target, .016, true), target);
});

test("flight preserves momentum when scrolling changes its destination", () => {
  const start = { x: 950, y: 600, size: 192 };
  const destination = { x: 400, y: 240, size: 256 };
  const moving = followBuddyDestination(start, destination, .08);
  const retargeted = followBuddyDestination(moving, { x: 1000, y: 650, size: 192 }, .001);
  assert.ok(moving.velocity.x < 0);
  assert.ok(retargeted.velocity.x < 0, "a new slot cannot instantly reverse his flight");
  assert.ok(Math.abs(retargeted.x - moving.x) < 4, "the displayed position is continuous");
});

test("flight settles at the same destination at different refresh rates", () => {
  const target = { x: 40, y: 60, size: 48 };
  for (const hz of [30, 60, 120]) {
    let shown = { x: 1000, y: 600, size: 256 };
    for (let i = 0; i < hz * 2; i++) shown = followBuddyDestination(shown, target, 1 / hz);
    assert.equal(shown.x, target.x);
    assert.equal(shown.y, target.y);
    assert.equal(shown.size, target.size);
    assert.equal(shown.velocity.x, 0);
  }
});

test("a long move starts gently and preserves the scale without a first-frame jump", () => {
  const start = { x: 1000, y: 500, size: 288 };
  const next = followBuddyDestination(start, { x: 400, y: 500, size: 176 }, 1 / 60);
  assert.ok(start.x - next.x > 0 && start.x - next.x < 6);
  assert.ok(start.size - next.size < 1);
});

test("an already clear corner stays put when the page offers other resting places", () => {
  const preferred = { x: 980, y: 550, size: 208 };
  const first = findBuddyCorner(preferred, viewport, []);
  const resting = { ...first, x: first.x - 24, y: first.y - 48 };
  const retained = findBuddyCorner(preferred, viewport, [], resting);
  assert.equal(retained.x, resting.x);
  assert.equal(retained.y, resting.y);
  const blocked = { left: resting.x, right: resting.x + 20, top: resting.y, bottom: resting.y + 20 };
  const relocated = findBuddyCorner(preferred, viewport, [blocked], resting);
  assert.ok(relocated.x !== resting.x || relocated.y !== resting.y || !relocated.clear);
});


test("ordinary arm padding preserves body scale and its destination centre", () => {
  for (const size of [72, 96, 144, 160, 192, 208, 256, 288]) {
    const frame = buddyCanvasLayout({ size });
    assert.equal(frame.size, size);
    assert.equal(frame.width, size * 1.25);
    assert.equal(frame.height, size);
    assert.equal(-size / 8 + frame.x, size / 2);
    assert.equal(frame.y, size / 2);
  }
});

test("ambient scenery retains its body anchor with the same right arm margin", () => {
  const size = 256;
  const frame = buddyCanvasLayout({ size, ambient: true });
  assert.equal(frame.size, size);
  assert.equal(frame.width, 448);
  assert.equal(frame.height, 288);
  assert.equal(-160 + frame.x, size / 2);
  assert.equal(-16 + frame.y, size / 2);
  assert.equal(-160 + frame.width, size + size / 8);
});

test("the fitted inspection composition keeps its square reading-aid slot", () => {
  assert.deepEqual(buddyCanvasLayout({ size: 144, inspect: true }),
    { width: 144, height: 144, size: 144, x: 72, y: 72 });
});

test("a narrow phone keeps the complete page-actor arm envelope inside the viewport", () => {
  const target = buddyDestinationRect(slot("page", "page", 180, 16, 288), 320);
  assert.ok(target.x - target.size / 8 >= 8 - 1e-9);
  assert.ok(target.x + target.size * 9 / 8 <= 312 + 1e-9);
  assert.ok(Math.abs(target.y + target.size / 2 - 324) < 1e-9);
  const desktop = buddyDestinationRect(slot("page", "page", 180, 300, 288), 1280);
  assert.equal(desktop.size, 288);
  assert.equal(desktop.x, 300);
});

const cornerAt = (width, height, size) => ({ x: width - 12 - size, y: height - 56 - size, size });
const fullFrame = (target) => ({ left: target.x - target.size * (target.roomForAmbient ? .625 : .125),
  right: target.x + target.size * 1.125, top: target.y - (target.roomForAmbient ? target.size / 16 : 0),
  bottom: target.y + target.size * (target.roomForAmbient ? 1.0625 : 1) });
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test("clear pages retain enlarged 208px phone and 288px desktop stages", () => {
  for (const [width, size] of [[390, 208], [1280, 288]]) {
    const target = findBuddyCorner(cornerAt(width, 900, size), { width, height: 900 }, []);
    assert.equal(target.size, size);
    assert.equal(target.clear, true);
    assert.equal(target.roomForAmbient, true);
    assert.ok(fullFrame(target).left >= 8);
    assert.ok(fullFrame(target).right <= width - 8);
  }
});

test("a 320px phone preserves the full ambient scene at a readable 160px body", () => {
  const target = findBuddyCorner(cornerAt(320, 900, 208), { width: 320, height: 900 }, []);
  assert.equal(target.size, 160);
  assert.equal(target.roomForAmbient, true);
  assert.ok(fullFrame(target).left >= 8);
  assert.ok(fullFrame(target).right <= 312);
});

test("nearby whitespace keeps Buddy large without covering right-side controls", () => {
  const blocked = { left: 1210, right: 1280, top: 80, bottom: 900 };
  const target = findBuddyCorner(cornerAt(1280, 900, 288), { width: 1280, height: 900 }, [blocked]);
  assert.equal(target.size, 288);
  assert.equal(target.clear, true);
  assert.ok(!overlaps(fullFrame(target), blocked));
  assert.ok(1268 - fullFrame(target).right <= 96);
});

test("bottom reading lines move the complete body and scenery up by a bounded amount", () => {
  const blocked = { left: 0, right: 1280, top: 760, bottom: 900 };
  const target = findBuddyCorner(cornerAt(1280, 900, 288), { width: 1280, height: 900 }, [blocked]);
  assert.equal(target.size, 288);
  assert.equal(target.clear, true);
  assert.ok(!overlaps(fullFrame(target), blocked));
  assert.ok(844 - target.y - target.size <= 240);
});

test("ordinary large placement remains when only expanded scenery has no room", () => {
  const blocked = [{ left: 0, right: 1020, top: 80, bottom: 900 }];
  const target = findBuddyCorner(cornerAt(1280, 900, 288), { width: 1280, height: 900 }, blocked);
  assert.equal(target.clear, true);
  assert.equal(target.size, 192);
  assert.equal(target.roomForAmbient, false);
  assert.ok(!overlaps(fullFrame(target), blocked[0]));
});

test("dense pages hide the character instead of shrinking below its readable minimum", () => {
  for (const [width, size, minimum] of [[320, 208, 160], [1280, 288, 192]]) {
    const target = findBuddyCorner(cornerAt(width, 900, size), { width, height: 900 }, [{ left: 0, top: 0, right: width, bottom: 900 }]);
    assert.equal(target.clear, false);
    assert.equal(target.roomForAmbient, false);
    assert.equal(target.size, minimum);
  }
  const compact = findBuddyCorner(cornerAt(390, 400, 96), { width: 390, height: 400 }, []);
  assert.equal(compact.size, 96);
  assert.equal(compact.clear, true);
});
