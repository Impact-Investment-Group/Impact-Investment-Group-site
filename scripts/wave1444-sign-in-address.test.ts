import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

/**
 * Wave 1444. Under the account form, `Already registered? Sign in` opened
 * `/auth/login` on the platform. The platform has no page there: that is
 * the name of a data endpoint its app posts to, and an address it does not
 * know draws its not found page. Its sign in page is `/login`, which the
 * header's `Log in` already opened. The link now takes the header's own
 * constant, so the two cannot come apart again.
 *
 * Neither file can be imported where the site's packages are not installed,
 * so these read the source. Not one string a person reads is touched.
 */
const src = new URL("../src/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, src), "utf8");
const header = read("components/site-header.tsx");
const flow = read("components/register/registration-flow.tsx");

describe("wave 1444 the sign in address under the account form", () => {
  test("the header's Log in opens the platform's sign in page, /login", () => {
    const constant = header.match(/export const platformLoginUrl = "([^"]+)";/);
    expect(constant?.[1]).toBe("https://app.impactinvestmentgroup.co.uk/login");
    expect(header.split("href={platformLoginUrl}").length - 1).toBeGreaterThan(0);
  });

  test("the account form's sign in link opens it too, by the header's own constant", () => {
    expect(flow).toContain('import { platformLoginUrl } from "@/components/site-header";');
    const link = flow.match(/<a\s+href=(\S+)\s[^>]*>\s*\{copy\.signIn\}\s*<\/a>/);
    expect(link?.[1]).toBe("{platformLoginUrl}");
  });

  test("the address with no page behind it is nowhere under src", () => {
    // Named here on purpose: it is the address the link used to open.
    const dead = "impactinvestmentgroup.co.uk/auth/login";
    const files = (readdirSync(src, { recursive: true }) as string[]).filter((name) =>
      /\.(tsx?|jsx?|mjs|cjs|css|html|json|md)$/.test(name),
    );
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((name) => read(name).includes(dead))).toEqual([]);
  });
});
