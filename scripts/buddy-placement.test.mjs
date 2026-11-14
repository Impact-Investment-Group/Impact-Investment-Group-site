import assert from "node:assert/strict";
import test from "node:test";
import { buddyDestinationRect, followBuddyDestination, selectBuddyDestination } from "../src/components/buddy/buddy-placement.js";

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
