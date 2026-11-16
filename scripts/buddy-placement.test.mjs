import assert from "node:assert/strict";
import test from "node:test";
import { buddyDestinationRect, followBuddyDestination, selectBuddyDestination } from "../src/components/buddy/buddy-placement.js";

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
  const chat = slot("chat", "chat", 40, 900, 48);
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


test("ordinary arm padding preserves body scale and its destination centre", () => {
  for (const size of [48, 112, 144, 224, 256]) {
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
