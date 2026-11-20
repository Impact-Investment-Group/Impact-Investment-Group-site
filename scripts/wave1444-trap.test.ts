import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { trapSprung } from "../src/lib/registration";

/**
 * Wave 1444. The account form holds one hidden trap field. Until this wave
 * any value in it refused the form before a request was sent, and a
 * browser's own autofill can put a value there, so a real person was turned
 * away from the only door to an account. `trapSprung` is wave 1432's, lifted
 * here unchanged and alone: a value the browser marks as autofilled is a
 * person, a value typed or scripted there still refuses, an empty trap
 * passes. Made up values only.
 */

/** A stand-in for the trap's element: what it matches, and what it does not know. */
const field = (matching: readonly string[], unknown: readonly string[] = []) => ({
  matches(selector: string) {
    if (unknown.includes(selector)) throw new SyntaxError(`unknown selector ${selector}`);
    return matching.includes(selector);
  },
});

describe("wave 1444 the hidden trap field", () => {
  test("an empty trap passes, whatever the field says", () => {
    expect(trapSprung("", field([]))).toBe(false);
    expect(trapSprung("", field([":autofill"]))).toBe(false);
    expect(trapSprung("", null)).toBe(false);
  });

  test("a value typed or scripted into the trap still refuses", () => {
    expect(trapSprung("https://example.test", field([]))).toBe(true);
    expect(trapSprung("Example Care Limited", field([]))).toBe(true);
    // As before this wave: one space is a value.
    expect(trapSprung(" ", field([]))).toBe(true);
  });

  test("a value the browser marks as autofilled does not", () => {
    expect(trapSprung("Example Care Limited", field([":autofill"]))).toBe(false);
    expect(trapSprung("https://example.test", field([":autofill"]))).toBe(false);
  });

  test("an older engine's spelling of the mark is read too", () => {
    expect(trapSprung("Example Care Limited", field([":-webkit-autofill"], [":autofill"]))).toBe(
      false,
    );
    expect(
      trapSprung(
        "Example Care Limited",
        field([":-moz-autofill"], [":autofill", ":-webkit-autofill"]),
      ),
    ).toBe(false);
  });

  test("an engine that knows no spelling of the mark still refuses a value", () => {
    expect(
      trapSprung(
        "https://example.test",
        field([], [":autofill", ":-webkit-autofill", ":-moz-autofill"]),
      ),
    ).toBe(true);
  });

  test("with no field to ask, a value still refuses", () => {
    expect(trapSprung("https://example.test", null)).toBe(true);
  });

  test("only the browser's autofill mark is asked about, so nothing else excuses a value", () => {
    const asked: string[] = [];
    const recording = {
      matches(selector: string) {
        asked.push(selector);
        return false;
      },
    };
    expect(trapSprung("https://example.test", recording)).toBe(true);
    expect(asked).toEqual([":autofill", ":-webkit-autofill", ":-moz-autofill"]);
  });
});

/**
 * The form itself cannot be drawn where the site's packages are not
 * installed, so these three read its source: they pin that the account
 * step's refusal is `trapSprung`'s answer, asked of the trap's own element,
 * and that it still comes before the one request. A browser journey is the
 * deploy gate's.
 */
describe("wave 1444 the account form asks trapSprung", () => {
  const flow = readFileSync(
    new URL("../src/components/register/registration-flow.tsx", import.meta.url),
    "utf8",
  );
  const refusal = flow.match(
    /if \(trapSprung\(honeypot, document\.getElementById\("([^"]+)"\)\)\) \{\s+setFailure\("rejected"\);\s+return;\s+\}/,
  );

  test("the refusal is trapSprung's answer for the trap's own element", () => {
    expect(refusal).not.toBeNull();
    const trap = flow.match(/<input\s+id="([^"]+)"[^>]*?value=\{honeypot\}/);
    expect(trap).not.toBeNull();
    expect(refusal?.[1]).toBe(trap?.[1]);
  });

  test("a value alone no longer refuses the form", () => {
    expect(flow).not.toMatch(/if \(!?honeypot\b/);
  });

  test("the refusal still comes before the one registration request", () => {
    const requests = flow.split("await createRegistration(").length - 1;
    expect(requests).toBe(1);
    expect(refusal?.index ?? -1).toBeGreaterThan(-1);
    expect(refusal?.index ?? Infinity).toBeLessThan(flow.indexOf("await createRegistration("));
  });
});
