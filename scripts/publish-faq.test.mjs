import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { RESERVED_IDS, applyFaqChange, parseAnswer, validateCommunityFaq } from "./publish-faq.mjs";

const existing = [
  { id: "first-question", q: "How do I contact the team?", a: ["Use the contact page."] },
  { id: "second-question", q: "Can I ask about a property?", a: ["Tell the team what you need."] },
];
const request = {
  action: "publish", id: "another-question", question: "Can an organisation ask a question?",
  answer: "Yes, use the contact page. || The team will consider your enquiry.", approved: true,
};

test("reserved IDs stay aligned with the protected core FAQ source", async () => {
  const source = await readFile(new URL("../src/content/faq.ts", import.meta.url), "utf8");
  const ids = [...source.matchAll(/\bid:\s*"([a-z0-9-]+)"/gu)].map((match) => match[1]);
  assert.ok(ids.length > 0, "The core FAQ IDs must remain discoverable.");
  assert.deepEqual([...RESERVED_IDS].sort(), ids.sort());
});

test("publishing appends the approved record without changing existing records or input", () => {
  const source = structuredClone(existing);
  const input = structuredClone(request);
  const result = applyFaqChange(source, input);
  assert.deepEqual(result.slice(0, 2), existing);
  assert.deepEqual(result[2], {
    id: request.id, q: request.question,
    a: ["Yes, use the contact page.", "The team will consider your enquiry."],
  });
  assert.deepEqual(source, existing);
  assert.deepEqual(input, request);
  result[0].a.push("This modifies only the returned copy.");
  assert.deepEqual(source, existing);
});

test("an update replaces only the requested record and preserves its position", () => {
  const result = applyFaqChange(existing, { ...request, action: "update", id: "first-question" });
  assert.equal(result.length, 2);
  assert.equal(result[0].id, "first-question");
  assert.equal(result[0].q, request.question);
  assert.deepEqual(result[1], existing[1]);
});

test("removing a record needs only its ID and leaves other records intact", () => {
  assert.deepEqual(applyFaqChange(existing, { action: "remove", id: "first-question", approved: true }), [existing[1]]);
});

test("unapproved input and ambiguous operations cannot change published content", () => {
  for (const approved of [false, undefined, "false", "yes", 1]) {
    assert.throws(() => applyFaqChange(existing, { ...request, approved }), /Confirm accuracy/);
  }
  assert.throws(() => applyFaqChange(existing, { ...request, action: "replace" }), /Choose publish/);
  assert.throws(() => applyFaqChange(existing, { ...request, id: "first-question" }), /already exists/);
  for (const action of ["update", "remove"]) {
    assert.throws(() => applyFaqChange(existing, { ...request, action }), /does not exist/);
  }
  assert.equal(applyFaqChange([], { ...request, approved: "true" }).length, 1);
});

test("core FAQ IDs and malformed slugs cannot be published, updated or removed", () => {
  for (const id of RESERVED_IDS) {
    for (const action of ["publish", "update", "remove"]) {
      assert.throws(() => applyFaqChange([], { ...request, id, action }), /protected core FAQ/);
    }
  }
  for (const id of ["", "../file", "Upper", "two--hyphens", "-start", "end-", "9start", "x".repeat(65)]) {
    assert.throws(() => applyFaqChange([], { ...request, id }), /Use an ID/);
  }
});

test("duplicate or malformed existing data stops all publication operations", () => {
  assert.throws(() => validateCommunityFaq([existing[0], existing[0]]), /duplicate ID/);
  for (const entry of [
    { ...existing[0], sender: "redacted" },
    { ...existing[0], a: [] },
    { ...existing[0], a: "not an array" },
    { ...existing[0], q: "" },
    { ...existing[0], id: "lease" },
  ]) {
    assert.throws(() => applyFaqChange([entry], request));
  }
  assert.throws(() => validateCommunityFaq({}), /must be an array/);
  assert.deepEqual(validateCommunityFaq([]), []);
});

test("answers accept blank lines or the editor separator and keep ordinary public text", () => {
  assert.deepEqual(parseAnswer(" First line\r\ncontinued.\r\n\r\nSecond paragraph. "), ["First line continued.", "Second paragraph."]);
  assert.deepEqual(parseAnswer("First paragraph. || Second paragraph."), ["First paragraph.", "Second paragraph."]);
  assert.deepEqual(parseAnswer("A five-year plan can include 2026 and 2031. Contact the team using its public email address."), ["A five-year plan can include 2026 and 2031. Contact the team using its public email address."]);
});

test("empty, oversized, control-character or formatted content is rejected", () => {
  for (const answer of ["", "   ", "One. || ", "<script>unsafe</script>", "[link](https://example.invalid)", "`code`", "Bad\u0000text", "Hidden\u202etext", "Use\u2014punctuation", "x".repeat(2001), Array(9).fill("Paragraph.").join(" || ")]) {
    assert.throws(() => applyFaqChange([], { ...request, answer }));
  }
  assert.throws(() => applyFaqChange([], { ...request, question: "x".repeat(241) }), /question/);
  assert.throws(() => parseAnswer("x".repeat(12001)), /12000/);
});

test("credential-like content is refused without reflecting its value in the error", () => {
  const marker = "fictional-placeholder-only";
  assert.throws(() => parseAnswer(`password: ${marker}`), (error) => {
    assert.match(error.message, /credentials/);
    assert.ok(!error.message.includes(marker));
    return true;
  });
});
