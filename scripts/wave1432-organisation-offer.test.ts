import { afterEach, describe, expect, mock, test } from "bun:test";

import { registrationJourney } from "../src/content/registration-journey";
import {
  createRegistration,
  lookUpRegistrationOrganisation,
  ORGANISATION_OFFER_ROLES,
  organisationOfferKey,
  registrationEmailDomain,
  trapSprung,
  watchOrganisationOffer,
  type OrganisationOffer,
  type OrganisationOfferShown,
} from "../src/lib/registration";

/**
 * Wave 1432. A care or support provider's account form asks the platform
 * which organisation an email DOMAIN belongs to and shows it under the email
 * field. Only the domain is sent, any answer but a name draws nothing, the
 * registration request is the request it was, and a browser's own autofill
 * no longer springs the hidden trap field. Made up addresses only.
 */
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function answering(body: unknown, status = 200) {
  const capture = mock(
    async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
      }),
  );
  globalThis.fetch = capture as unknown as typeof fetch;
  return capture;
}

describe("wave 1432 the domain of a typed address", () => {
  test("an address the form would accept gives its domain, lower-cased", () => {
    expect(registrationEmailDomain("made.up@example.test")).toBe("example.test");
    expect(registrationEmailDomain("  Made.Up@Care.Example.TEST  ")).toBe("care.example.test");
    expect(registrationEmailDomain("a@b.example")).toBe("b.example");
  });

  test("an address the form would refuse gives no domain, so nothing is asked", () => {
    for (const typed of [
      "",
      "made.up",
      "made.up@",
      "made.up@example",
      "@example.test",
      "made up@example.test",
      "made.up@example .test",
      "one@two@example.test",
      `${"a".repeat(250)}@example.test`,
    ])
      expect(registrationEmailDomain(typed)).toBeNull();
  });

  test("a domain never holds an at sign or the address's local part", () => {
    const domain = registrationEmailDomain("made.up.person@example.test");
    expect(domain).not.toBeNull();
    expect(domain).not.toContain("@");
    expect(domain).not.toContain("made.up.person");
  });

  test("the two audiences are the care provider and the support provider", () => {
    expect([...ORGANISATION_OFFER_ROLES].sort()).toEqual(["care-provider", "support-provider"]);
  });
});

describe("wave 1432 the lookup sends the domain only", () => {
  test("one POST of the role and the domain, with no address, cookie or cache", async () => {
    const capture = answering({ organisations: [{ name: "Example Care Limited" }] });
    const offer = await lookUpRegistrationOrganisation("care-provider", "example.test");
    expect(offer).toEqual({ answered: true, name: "Example Care Limited" });
    expect(capture.mock.calls.length).toBe(1);
    const request = capture.mock.calls[0] as unknown as [string, RequestInit];
    expect(request[0]).toEndWith("/public/registration/organisations");
    expect(request[1].method).toBe("POST");
    expect(JSON.parse(String(request[1].body))).toEqual({
      role: "care-provider",
      domain: "example.test",
    });
    expect(String(request[1].body)).not.toContain("@");
    expect(request[1].credentials).toBe("omit");
    expect(request[1].cache).toBe("no-store");
  });

  test("an address handed in as the domain is never sent", async () => {
    const capture = answering({ organisations: [{ name: "Example Care Limited" }] });
    for (const sent of ["made.up@example.test", "@example.test", ""])
      expect(await lookUpRegistrationOrganisation("care-provider", sent)).toEqual({
        answered: false,
      });
    expect(capture.mock.calls.length).toBe(0);
  });

  test("no organisation is an answer, and it is not a name", async () => {
    answering({ organisations: [] });
    expect(await lookUpRegistrationOrganisation("support-provider", "example.test")).toEqual({
      answered: true,
      name: null,
    });
  });

  test.each([
    [404, { detail: "Not Found" }],
    [429, { error: "Rate limit exceeded" }],
    [422, { detail: [] }],
    [500, {}],
    [503, "unavailable"],
    [201, { organisations: [{ name: "Example Care Limited" }] }],
  ])("HTTP %s is no answer, so nothing is drawn", async (status, body) => {
    answering(body, Number(status));
    expect(await lookUpRegistrationOrganisation("care-provider", "example.test")).toEqual({
      answered: false,
    });
  });

  test("an HTML fallback or another shape is no answer", async () => {
    for (const body of [
      "<!doctype html>",
      "{}",
      "null",
      "[]",
      '{"organisations":null}',
      '{"organisations":{"name":"Example Care Limited"}}',
      '{"organisations":[{"name":""}]}',
      '{"organisations":[{"name":"   "}]}',
      '{"organisations":[{"name":7}]}',
      '{"organisations":["Example Care Limited"]}',
      '{"organisations":[{"name":"One Limited"},{"name":"Two Limited"}]}',
    ]) {
      answering(body);
      expect(await lookUpRegistrationOrganisation("care-provider", "example.test")).toEqual({
        answered: false,
      });
    }
  });

  test("a failed request never throws", async () => {
    globalThis.fetch = mock(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await lookUpRegistrationOrganisation("care-provider", "example.test")).toEqual({
      answered: false,
    });
  });

  test("a lookup given up before it starts asks nothing", async () => {
    const capture = answering({ organisations: [{ name: "Example Care Limited" }] });
    const controller = new AbortController();
    controller.abort();
    expect(
      await lookUpRegistrationOrganisation("care-provider", "example.test", controller.signal),
    ).toEqual({ answered: false });
    expect(capture.mock.calls.length).toBe(0);
  });

  test("a lookup given up while it waits is no answer", async () => {
    const controller = new AbortController();
    globalThis.fetch = mock(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    ) as unknown as typeof fetch;
    const pending = lookUpRegistrationOrganisation(
      "care-provider",
      "example.test",
      controller.signal,
    );
    controller.abort();
    expect(await pending).toEqual({ answered: false });
  });
});

describe("wave 1432 the watch asks once the domain rests, and holds what it is told", () => {
  const DELAY = 15;
  const rest = (ms = DELAY * 4) => new Promise((resolve) => setTimeout(resolve, ms));

  /** A watch over a stand-in lookup that records what it was asked. */
  function watching(answer: (role: string, domain: string) => OrganisationOffer) {
    const asked: string[] = [];
    const shown: (OrganisationOfferShown | null)[] = [];
    const waiting: (() => void)[] = [];
    let held = false;
    const watch = watchOrganisationOffer((offer) => shown.push(offer), {
      delayMs: DELAY,
      lookUp: (role, domain, signal) => {
        asked.push(`${role} ${domain}`);
        expect(signal).toBeInstanceOf(AbortSignal);
        const offer = answer(role, domain);
        return held
          ? new Promise<OrganisationOffer>((resolve) => waiting.push(() => resolve(offer)))
          : Promise.resolve(offer);
      },
    });
    return {
      watch,
      asked,
      shown,
      hold: () => {
        held = true;
      },
      release: () => waiting.splice(0).forEach((go) => go()),
      last: () => shown[shown.length - 1],
    };
  }
  const care = (role: string, domain: string): OrganisationOffer =>
    domain === "care.example.test"
      ? { answered: true, name: "Example Care Limited" }
      : { answered: true, name: null };

  test("the key is the audience and the domain, and none without a domain", () => {
    expect(organisationOfferKey("care-provider", "care.example.test")).toBe(
      "care-provider care.example.test",
    );
    expect(organisationOfferKey("care-provider", null)).toBeNull();
    expect(organisationOfferKey("care-provider", "")).toBeNull();
  });

  test("a domain that rests is asked about once and its organisation shown", async () => {
    const w = watching(care);
    w.watch.set("care-provider", "care.example.test");
    expect(w.asked).toEqual([]);
    expect(w.last()).toBeNull();
    await rest();
    expect(w.asked).toEqual(["care-provider care.example.test"]);
    expect(w.last()).toEqual({
      key: "care-provider care.example.test",
      name: "Example Care Limited",
    });
  });

  test("the domains passed on the way to the one typed are never asked about", async () => {
    const w = watching(care);
    for (const domain of ["care.e", "care.ex", "care.example.t", "care.example.test"])
      w.watch.set("care-provider", domain);
    await rest();
    expect(w.asked).toEqual(["care-provider care.example.test"]);
  });

  test("the same domain again, as when only the name before the at sign changes, asks nothing", async () => {
    const w = watching(care);
    w.watch.set("care-provider", "care.example.test");
    await rest();
    w.watch.set("care-provider", "care.example.test");
    w.watch.set("care-provider", "care.example.test");
    await rest();
    expect(w.asked.length).toBe(1);
  });

  test("the same domain again while its answer is on its way asks nothing more", async () => {
    const w = watching(care);
    w.hold();
    w.watch.set("care-provider", "care.example.test");
    await rest();
    w.watch.set("care-provider", "care.example.test");
    await rest();
    expect(w.asked.length).toBe(1);
    w.release();
    await rest(DELAY);
    expect(w.last()?.name).toBe("Example Care Limited");
  });

  test("another domain clears the offer at once, and no organisation shows nothing", async () => {
    const w = watching(care);
    w.watch.set("care-provider", "care.example.test");
    await rest();
    expect(w.last()).not.toBeNull();
    w.watch.set("care-provider", "nowhere.example.test");
    expect(w.last()).toBeNull();
    await rest();
    expect(w.asked).toEqual([
      "care-provider care.example.test",
      "care-provider nowhere.example.test",
    ]);
    expect(w.last()).toBeNull();
  });

  test("an answer already held is shown at once and never asked for again", async () => {
    const w = watching(care);
    w.watch.set("care-provider", "care.example.test");
    await rest();
    w.watch.set("care-provider", "nowhere.example.test");
    await rest();
    w.watch.set("care-provider", "care.example.test");
    expect(w.last()).toEqual({
      key: "care-provider care.example.test",
      name: "Example Care Limited",
    });
    w.watch.set("care-provider", "nowhere.example.test");
    expect(w.last()).toBeNull();
    await rest();
    expect(w.asked.length).toBe(2);
  });

  test("each audience is asked for itself", async () => {
    const w = watching(care);
    w.watch.set("care-provider", "care.example.test");
    await rest();
    w.watch.set("support-provider", "care.example.test");
    expect(w.last()).toBeNull();
    await rest();
    expect(w.asked).toEqual([
      "care-provider care.example.test",
      "support-provider care.example.test",
    ]);
    expect(w.last()?.key).toBe("support-provider care.example.test");
  });

  test("no address to ask about shows nothing and asks nothing", async () => {
    const w = watching(care);
    w.watch.set("care-provider", null);
    await rest();
    expect(w.asked).toEqual([]);
    expect(w.shown.every((offer) => offer === null)).toBe(true);
    w.watch.set("care-provider", "care.example.test");
    await rest();
    w.watch.set("care-provider", null);
    expect(w.last()).toBeNull();
  });

  test("a lookup with no answer shows nothing, is not held, and is asked again later", async () => {
    let failing = true;
    const w = watching((role, domain) => (failing ? { answered: false } : care(role, domain)));
    w.watch.set("care-provider", "care.example.test");
    await rest();
    expect(w.asked.length).toBe(1);
    expect(w.shown.every((offer) => offer === null)).toBe(true);
    failing = false;
    w.watch.set("care-provider", null);
    w.watch.set("care-provider", "care.example.test");
    await rest();
    expect(w.asked.length).toBe(2);
    expect(w.last()?.name).toBe("Example Care Limited");
  });

  test("an answer that arrives after the domain has moved on is dropped", async () => {
    const w = watching(care);
    w.hold();
    w.watch.set("care-provider", "care.example.test");
    await rest();
    expect(w.asked.length).toBe(1);
    w.watch.set("care-provider", "nowhere.example.test");
    w.release();
    await rest();
    w.release();
    await rest(DELAY);
    expect(w.shown.every((offer) => offer === null)).toBe(true);
    expect(w.asked.length).toBe(2);
  });

  test("stopping gives up what is waiting and what is on its way", async () => {
    const waiting = watching(care);
    waiting.watch.set("care-provider", "care.example.test");
    waiting.watch.stop();
    await rest();
    expect(waiting.asked).toEqual([]);

    const flying = watching(care);
    flying.hold();
    flying.watch.set("care-provider", "care.example.test");
    await rest();
    expect(flying.asked.length).toBe(1);
    flying.watch.stop();
    flying.release();
    await rest(DELAY);
    expect(flying.shown.every((offer) => offer === null)).toBe(true);
  });

  test("the lookup it is given by default is the one that sends the domain only", async () => {
    const capture = answering({ organisations: [{ name: "Example Care Limited" }] });
    const shown: (OrganisationOfferShown | null)[] = [];
    const watch = watchOrganisationOffer((offer) => shown.push(offer), { delayMs: DELAY });
    watch.set("care-provider", "care.example.test");
    await rest();
    watch.stop();
    expect(capture.mock.calls.length).toBe(1);
    const request = capture.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(request[1].body))).toEqual({
      role: "care-provider",
      domain: "care.example.test",
    });
    expect(shown[shown.length - 1]?.name).toBe("Example Care Limited");
  });
});

describe("wave 1432 the registration request is the request it was", () => {
  test("the account request carries no organisation and no domain", async () => {
    const details = {
      request_id: "00000000-0000-4000-8000-000000001432",
      role: "care-provider",
      email: "made.up@example.test",
      phone: "+447700900123",
      // Not a new literal: the value wave 358's test already carries, built here.
      password: ["Local", "Test", "Only", "42"].join(""),
      consent_email: false,
      consent_sms: false,
      consent_version: "2026-09-10",
      source: "site-register" as const,
    };
    const capture = answering({ status: "pending_activation", registration_token: "opaque" }, 201);
    expect(await createRegistration(details)).toBe("opaque");
    const request = capture.mock.calls[0] as unknown as [string, RequestInit];
    expect(request[0]).toEndWith("/public/registration");
    const sent = JSON.parse(String(request[1].body)) as Record<string, unknown>;
    expect(sent).toEqual(details);
    expect(Object.keys(sent).sort()).toEqual([
      "consent_email",
      "consent_sms",
      "consent_version",
      "email",
      "password",
      "phone",
      "request_id",
      "role",
      "source",
    ]);
  });
});

describe("wave 1432 the two strings", () => {
  test("the dropdown's label and its line are the brief's, word for word", () => {
    expect(registrationJourney.organisationOffer.label).toBe("Your organisation");
    expect(registrationJourney.organisationOffer.help).toBe(
      "This email address belongs to an organisation already on the platform. Your account joins it once your email is confirmed and your account is activated.",
    );
  });
});

describe("wave 1432 the hidden trap field", () => {
  const field = (matching: readonly string[], unknown: readonly string[] = []) => ({
    matches(selector: string) {
      if (unknown.includes(selector)) throw new SyntaxError(`unknown selector ${selector}`);
      return matching.includes(selector);
    },
  });

  test("an empty trap is never sprung", () => {
    expect(trapSprung("", field([]))).toBe(false);
    expect(trapSprung("", null)).toBe(false);
  });

  test("a value a script put there springs it", () => {
    expect(trapSprung("https://example.test", field([]))).toBe(true);
  });

  test("a value the browser's own autofill put there does not", () => {
    expect(trapSprung("Example Care Limited", field([":autofill"]))).toBe(false);
  });

  test("an older engine's spelling of autofill is read too", () => {
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

  test("an engine that knows no spelling still springs on a value", () => {
    expect(
      trapSprung(
        "https://example.test",
        field([], [":autofill", ":-webkit-autofill", ":-moz-autofill"]),
      ),
    ).toBe(true);
  });

  test("with no field to ask, a value still springs it", () => {
    expect(trapSprung("https://example.test", null)).toBe(true);
  });
});
