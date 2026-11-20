import { apiUrl } from "@/lib/api";

export type SurveyAnswers = Record<string, string | string[]>;

export type RegistrationFailure = "network" | "rateLimited" | "rejected" | "expired" | "password";

export class RegistrationError extends Error {
  constructor(public kind: RegistrationFailure) {
    super(kind);
  }
}

export function normaliseRegistrationPhone(raw: string): string | null {
  const compact = raw.trim().replace(/[\s().-]/g, "");
  const national = compact.startsWith("+44")
    ? compact.slice(3)
    : compact.startsWith("0044")
      ? compact.slice(4)
      : compact.startsWith("0")
        ? compact.slice(1)
        : null;
  return national && /^[1-9][0-9]{9}$/.test(national) ? `+44${national}` : null;
}

export interface AccountDetails {
  request_id: string;
  role: string;
  email: string;
  phone: string;
  password: string;
  consent_email: boolean;
  consent_sms: boolean;
  consent_version: string;
  source: "site-register";
}

async function post(path: string, payload: unknown): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
    if (!response.ok) {
      if (response.status === 429) throw new RegistrationError("rateLimited");
      if (response.status === 401 || response.status === 403)
        throw new RegistrationError("expired");
      if (response.status >= 500) throw new RegistrationError("network");
      const body = await response.json().catch(() => null);
      if (body?.detail === "registration_session_expired") {
        throw new RegistrationError("expired");
      }
      if (body?.detail?.password_policy) throw new RegistrationError("password");
      throw new RegistrationError("rejected");
    }
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new RegistrationError("network");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RegistrationError) throw error;
    throw new RegistrationError("network");
  } finally {
    clearTimeout(timer);
  }
}

export async function createRegistration(details: AccountDetails): Promise<string> {
  const result = await post("/public/registration", details);
  if (
    result["status"] !== "pending_activation" ||
    typeof result["registration_token"] !== "string" ||
    !result["registration_token"]
  ) {
    throw new RegistrationError("network");
  }
  return result["registration_token"];
}

export async function saveRegistrationPreferences(
  registrationToken: string,
  answers: SurveyAnswers,
  complete: boolean,
  name?: string,
  organisation?: string,
): Promise<void> {
  const result = await post("/public/registration/preferences", {
    registration_token: registrationToken,
    answers,
    complete,
    name: name?.trim() ?? "",
    organisation: organisation?.trim() ?? "",
  });
  if (result["status"] !== "saved") throw new RegistrationError("network");
}

/**
 * WAVE 1432: the audiences whose account form asks the platform which
 * organisation an email DOMAIN belongs to. The platform answers the same two
 * and no other (`OFFER_AUDIENCES` in its `routers/site_registration.py`).
 */
export const ORGANISATION_OFFER_ROLES: readonly string[] = ["care-provider", "support-provider"];

/**
 * The DOMAIN of a typed address, or null while the address is not one the
 * account form would accept (the form's own shape check, and its own length).
 * Lower-cased. One `@` only, so what comes back never holds one.
 */
export function registrationEmailDomain(email: string): string | null {
  const address = email.trim();
  if (address.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return null;
  return address.slice(address.indexOf("@") + 1).toLowerCase();
}

/** What the platform said: an organisation's name, none, or no answer at all. */
export type OrganisationOffer = { answered: true; name: string | null } | { answered: false };

/**
 * WAVE 1432: ask the platform which organisation this DOMAIN belongs to.
 *
 * THE DOMAIN ONLY. This function has no parameter an address could arrive in,
 * and the platform refuses a body holding an `@` (its ruling R263-5: nothing
 * may say whether an address has an account). The registration request
 * itself is untouched and carries no organisation.
 *
 * NEVER THROWS. A route that is missing (404), busy (429), failing, slow or
 * answering anything but the one shape is `answered: false`, and the form
 * then draws nothing and registers exactly as it did before this existed.
 */
export async function lookUpRegistrationOrganisation(
  role: string,
  domain: string,
  signal?: AbortSignal,
): Promise<OrganisationOffer> {
  if (!domain || domain.includes("@")) return { answered: false };
  const controller = new AbortController();
  const stop = () => controller.abort();
  const timer = setTimeout(stop, 8000);
  signal?.addEventListener("abort", stop, { once: true });
  try {
    if (signal?.aborted) return { answered: false };
    const response = await fetch(apiUrl("/public/registration/organisations"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, domain }),
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });
    if (response.status !== 200) return { answered: false };
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return { answered: false };
    const list = (body as Record<string, unknown>)["organisations"];
    if (!Array.isArray(list) || list.length > 1) return { answered: false };
    if (list.length === 0) return { answered: true, name: null };
    const first: unknown = list[0];
    const name =
      first && typeof first === "object" ? (first as Record<string, unknown>)["name"] : null;
    return typeof name === "string" && name.trim()
      ? { answered: true, name: name.trim() }
      : { answered: false };
  } catch {
    return { answered: false };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}

/** An organisation as the form holds it: the name, and what it was answered for. */
export interface OrganisationOfferShown {
  key: string;
  name: string;
}

/** What an answer is held and drawn under: one audience and one domain. */
export function organisationOfferKey(role: string, domain: string | null): string | null {
  return domain ? `${role} ${domain}` : null;
}

export interface OrganisationOfferWatch {
  /** What the form holds now: its audience, and the typed address's domain or null. */
  set(role: string, domain: string | null): void;
  /** Give up whatever is waiting or on its way. */
  stop(): void;
}

/**
 * WAVE 1432: keep `show` told which organisation, if any, belongs to the
 * domain the form holds.
 *
 * The domain is asked about once it has rested for `delayMs`, so an address
 * being typed asks for the domain it ends on and not for each one on the
 * way. An answer is held per audience and domain and never asked twice. An
 * answer that arrives after the domain has moved on is dropped, and a lookup
 * that got no answer shows nothing and is not held. `show` is told `null`
 * the moment the domain changes to one with no answer held, so nothing of
 * the last domain's stays on the page.
 */
export function watchOrganisationOffer(
  show: (offer: OrganisationOfferShown | null) => void,
  options: { delayMs?: number; lookUp?: typeof lookUpRegistrationOrganisation } = {},
): OrganisationOfferWatch {
  const delayMs = options.delayMs ?? 400;
  const lookUp = options.lookUp ?? lookUpRegistrationOrganisation;
  const answers = new Map<string, string | null>();
  let current: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;
  const giveUp = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    controller?.abort();
    controller = null;
  };
  return {
    set(role, domain) {
      const key = organisationOfferKey(role, domain);
      if (key === current) return;
      current = key;
      giveUp();
      const known = key ? answers.get(key) : null;
      show(key && known ? { key, name: known } : null);
      if (!key || !domain || known !== undefined) return;
      const mine = new AbortController();
      controller = mine;
      timer = setTimeout(() => {
        timer = null;
        void lookUp(role, domain, mine.signal).then((offer) => {
          if (mine.signal.aborted || current !== key || !offer.answered) return;
          answers.set(key, offer.name);
          show(offer.name ? { key, name: offer.name } : null);
        });
      }, delayMs);
    },
    stop() {
      current = null;
      giveUp();
    },
  };
}

/**
 * WAVE 1432: is the hidden trap field sprung?
 *
 * The account form holds one field no person can see or reach. Anything
 * typed into it marks the sender as a script, and the form refuses before it
 * sends. A browser's own autofill can put a value there too, and that is a
 * person: it reads the field's label, not the screen. The browser marks what
 * it filled (`:autofill`, with the older engines' own spellings), and a
 * script that sets a value is never marked, so a value the browser marked is
 * not the trap being sprung. With no field to ask, a value still springs it.
 */
export function trapSprung(value: string, field: Pick<Element, "matches"> | null): boolean {
  if (!value) return false;
  if (!field) return true;
  for (const selector of [":autofill", ":-webkit-autofill", ":-moz-autofill"]) {
    try {
      if (field.matches(selector)) return false;
    } catch {
      // An engine that does not know this spelling. Try the next.
    }
  }
  return true;
}
