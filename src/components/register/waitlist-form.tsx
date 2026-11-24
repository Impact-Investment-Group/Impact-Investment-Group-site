import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ConsentBlock } from "@/components/register/consent-block";
import { SuccessState } from "@/components/register/success-state";
import {
  CONSENT_VERSION,
  MIN_TIME_ON_FORM_MS,
  RESIDENT_SPECIAL_CATEGORY_OPTIONS,
  SUBMIT_TIMEOUT_MS,
  contactFieldLabels,
  phoneMessage,
  registerFailureLines,
  residentHealthConsent,
  type RegisterQuestion,
  type RegisterRoleContent,
} from "@/content/register";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * The wait-list questionnaire. One component, ten roles: the questions come
 * from content/register.ts and nothing about a role is encoded here.
 *
 * ── WHAT IS REQUIRED, AND WHY SO LITTLE ───────────────────────────────────
 *
 * Name and email are required, because a wait list with no address on it is a
 * list of nobody. Organisation is required for the nine roles that have one,
 * because it is what makes a registration checkable. EVERY QUESTION ABOVE IS
 * OPTIONAL, deliberately. A half-answered registration is worth enormously
 * more than an abandoned one, and a required question a visitor cannot answer
 * on the spot ("how many placements a year?") is the one that loses them.
 *
 * Two exceptions, and neither is a marketing gate:
 *   1. Tick the text-me box and leave the phone blank and the form asks for
 *      the number, because the alternative is promising a text we cannot send.
 *   2. On the resident page, answer one of the health, disability or
 *      third-party options and the special-category consent is required. See
 *      `residentHealthConsent` in content/register.ts.
 *
 * ── WHERE IT POSTS ────────────────────────────────────────────────────────
 *
 * Cross-origin to the platform backend, exactly like the contact form and for
 * the same reason: the deployed site is static, it has no server, and its own
 * /api file routes are absent from the build. See src/lib/api.ts.
 */

export interface WaitlistFormValues {
  name: string;
  email: string;
  organisation?: string;
  phone?: string;
  consentEmail: boolean;
  consentSms: boolean;
  /** Resident page only. Gates the special-category answers, nothing else. */
  consentHealth?: boolean;
  /**
   * ⚠️ ALWAYS EMPTY WHEN A PERSON SENDS THIS. See the honeypot in the form.
   */
  website?: string;
  /**
   * ⚠️ `unknown`, and NOT `string | string[]`, because that is not what
   * react-hook-form puts here. An untouched radio group reads back as `null`
   * and an untouched checkbox group as `false` or as an array with `false` in
   * every unticked slot. Typing this narrowly is what hid a bug that made the
   * form unsubmittable: the zod record rejected those values, the error landed
   * on `answers` where nothing renders it, and the submit button did nothing
   * at all. `buildWaitlistPayload` is the one place that narrows them.
   */
  answers: Record<string, unknown>;
}

/** The values actually chosen for a question, as strings, with the noise gone. */
function chosen(value: unknown): string[] {
  if (Array.isArray(value)) {
    // react-hook-form fills the unticked slots of a checkbox array with
    // `false`, so this drops everything that is not a real answer.
    return value.filter((entry): entry is string => typeof entry === "string" && entry !== "");
  }
  return typeof value === "string" && value.trim() !== "" ? [value.trim()] : [];
}

/**
 * Has this resident chosen anything that is health, disability or somebody
 * else's data? The gate reads the option STRINGS, so it cannot drift from the
 * words on the page.
 */
export function touchesSpecialCategory(values: WaitlistFormValues): boolean {
  return Object.entries(RESIDENT_SPECIAL_CATEGORY_OPTIONS).some(([questionId, gated]) =>
    chosen(values.answers?.[questionId]).some((answer) =>
      (gated as readonly string[]).includes(answer),
    ),
  );
}

/**
 * A UK number in E.164, or null if it is not one.
 *
 * `07700 900123`, `+44 7700 900123`, `0044 7700 900123` and `(07700) 900123`
 * are the same number and a person will type any of them. The platform stores
 * one shape. See `phoneMessage` in content/register.ts for which side owns
 * this, and why it is only one side.
 */
export function toE164UK(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[\s().-]/g, "");
  const body = digits.startsWith("+44")
    ? digits.slice(3)
    : digits.startsWith("0044")
      ? digits.slice(4)
      : digits.startsWith("44") && digits.length >= 12
        ? digits.slice(2)
        : digits.startsWith("0")
          ? digits.slice(1)
          : null;
  if (body === null || !/^\d{9,10}$/.test(body)) return null;
  return `+44${body}`;
}

/**
 * Lengths match the platform's site-enquiry model field for field, so a
 * submission that passes here cannot be a 422 there. `role` is not a free
 * field on this form: it comes from the URL segment and is one of ten ids.
 */
function schemaFor(role: RegisterRoleContent) {
  const organisation = role.askOrganisation
    ? z.string().trim().min(2, "Please name your organisation").max(150)
    : z.string().trim().max(150).optional();

  return z
    .object({
      name: z.string().trim().min(2, "Please give your full name").max(100),
      email: z.string().trim().email("Please use an email address we can reach you on").max(255),
      organisation,
      phone: z.string().trim().max(40).optional(),
      consentEmail: z.boolean(),
      consentSms: z.boolean(),
      consentHealth: z.boolean().optional(),
      website: z.string().optional(),
      // Every question is optional, so this has to accept what an untouched
      // control reads back as: `null` from a radio group, `false` from a
      // checkbox, and `false` in the unticked slots of a checkbox array. The
      // lengths are the platform's; the browser caps them at the input too.
      answers: z
        .record(
          z.union([
            z.string().max(2000),
            z.array(z.union([z.string().max(300), z.boolean()])),
            z.boolean(),
            z.null(),
          ]),
        )
        .optional()
        .default({}),
    })
    .superRefine((values, ctx) => {
      const typed = values as unknown as WaitlistFormValues;
      const phone = typed.phone?.trim();
      if (phone && toE164UK(phone) === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: phoneMessage });
      }
      if (typed.consentSms && !phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Add a number so we can text you, or untick the text box.",
        });
      }
      if (role.id === "resident" && touchesSpecialCategory(typed) && !typed.consentHealth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["consentHealth"],
          message: residentHealthConsent.requiredMessage,
        });
      }
    });
}

/**
 * THE WIRE PAYLOAD, AND IT IS THE PLATFORM'S CONTRACT, NOT THE SITE'S HABIT.
 *
 * ⚠️ EVERY KEY IS snake_case, INCLUDING THE ENVELOPE. The first cut sent
 * `consentEmail` and `consentSms` camelCase because that is what the site's
 * older enquiry POST does, and the review caught it: the platform stores
 * snake_case columns, and a wire name that has to be translated on arrival is
 * a rename waiting to be got wrong. The exact key set is asserted by
 * scripts/wave295-payload-example.ts and written out in docs/WAVE295_REPORT.md
 * so wave 294 can accept exactly it.
 *
 * `phone` is E.164 or absent, never as typed. `organisation` and `phone` are
 * omitted rather than sent null, because the platform's site-enquiry model
 * uses `extra="forbid"` and a null is a different thing from a missing key.
 *
 * ⚠️ THE RESIDENT'S SPECIAL-CATEGORY CONSENT TRAVELS INSIDE `answers`, as
 * `health_data_consent`, to keep this envelope exactly the ten keys the
 * contract names. It is Article 9 consent and it arguably deserves a column of
 * its own; that call is wave 294's and it is flagged in the report.
 */
export function buildWaitlistPayload(role: RegisterRoleContent, values: WaitlistFormValues) {
  const answers: Record<string, string | string[]> = {};

  for (const question of role.questions) {
    const picked = chosen(values.answers?.[question.id]);
    if (picked.length === 0) continue;
    answers[question.id] = Array.isArray(values.answers?.[question.id]) ? picked : picked[0]!;
  }

  if (role.id === "resident" && touchesSpecialCategory(values)) {
    answers["health_data_consent"] = values.consentHealth ? "yes" : "no";
  }

  const phone = toE164UK(values.phone);
  const organisation = values.organisation?.trim();

  return {
    role: role.id,
    name: values.name.trim(),
    email: values.email.trim(),
    ...(phone ? { phone } : {}),
    ...(organisation ? { organisation } : {}),
    answers,
    consent_email: Boolean(values.consentEmail),
    consent_sms: Boolean(values.consentSms),
    consent_version: CONSENT_VERSION,
    source: "site-register",
  };
}

/** The exact envelope keys, in order. The refuter script asserts against this. */
export const WAITLIST_PAYLOAD_KEYS = [
  "role",
  "name",
  "email",
  "phone",
  "organisation",
  "answers",
  "consent_email",
  "consent_sms",
  "consent_version",
  "source",
] as const;

const fieldClass =
  "min-h-11 w-full rounded-[10px] border border-rule bg-page px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted focus-visible:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

const optionClass =
  "flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border border-rule bg-page px-4 py-3 text-[15px] leading-snug text-ink-muted transition-colors hover:border-teal-600 has-checked:border-teal-600 has-checked:bg-tint-teal";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-heading text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted"
    >
      {children}
    </label>
  );
}

/** Announce the specific error using the shared validation colour. */
function ErrorText({ id, children }: { id: string; children?: string | undefined }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-[13px] font-medium text-destructive">
      {children}
    </p>
  );
}

/**
 * One question. `single` and `multi` are real radios and checkboxes rather
 * than a select, because a select hides its options and these options ARE the
 * question: a landlord who cannot see "guaranteed rent on a long lease" in the
 * list does not know it is on offer.
 */
function Question({
  question,
  register,
  tail,
}: {
  question: RegisterQuestion;
  register: ReturnType<typeof useForm<WaitlistFormValues>>["register"];
  /** Rendered inside this question's fieldset. See `tail` in content/register.ts. */
  tail?: React.ReactNode;
}) {
  const name = `answers.${question.id}` as const;
  const helpId = question.help ? `${question.id}-help` : undefined;

  if (question.kind === "single" || question.kind === "multi") {
    return (
      <fieldset>
        <legend className="font-heading text-[19px] font-semibold leading-snug text-ink">
          {question.label}
        </legend>
        {question.help ? (
          <p id={helpId} className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
            {question.help}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(question.options ?? []).map((option) => (
            <label key={option} className={optionClass}>
              <input
                type={question.kind === "single" ? "radio" : "checkbox"}
                value={option}
                className="mt-0.5 size-4 shrink-0 accent-teal-600"
                aria-describedby={helpId}
                {...register(name)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {tail ? <div className="mt-4">{tail}</div> : null}
      </fieldset>
    );
  }

  const inputId = `q-${question.id}`;
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className={cn(
          "font-heading leading-snug",
          // A tail sits inside the question above it, so it is labelled like a
          // part of that question and not like another one. Same 19px weight
          // as a heading here and the page would read as seven questions
          // again, which is the whole thing the tail exists to avoid.
          question.tail
            ? "text-[15px] font-medium text-ink-muted"
            : "text-[19px] font-semibold text-ink",
        )}
      >
        {question.label}
      </label>
      {question.help ? (
        <p id={helpId} className="text-[14px] leading-relaxed text-ink-muted">
          {question.help}
        </p>
      ) : null}
      {question.kind === "textarea" ? (
        <textarea
          id={inputId}
          rows={4}
          maxLength={question.maxLength ?? 2000}
          placeholder={question.placeholder}
          aria-describedby={helpId}
          className={cn(fieldClass, "min-h-[110px] resize-y")}
          {...register(name)}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          maxLength={question.maxLength ?? 200}
          placeholder={question.placeholder}
          aria-describedby={helpId}
          className={fieldClass}
          {...register(name)}
        />
      )}
    </div>
  );
}

export function WaitlistForm({ role }: { role: RegisterRoleContent }) {
  const [sent, setSent] = React.useState(false);
  const [failure, setFailure] = React.useState<keyof typeof registerFailureLines | null>(null);
  /** When this form first rendered. See MIN_TIME_ON_FORM_MS. */
  const mountedAt = React.useRef(Date.now());

  const resolver = React.useMemo(
    () => zodResolver(schemaFor(role) as unknown as z.ZodType<WaitlistFormValues>),
    [role],
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormValues>({
    resolver,
    defaultValues: {
      name: "",
      email: "",
      organisation: "",
      phone: "",
      // ⚠️ ALL THREE FALSE. Never pre-tick a consent: it is not a consent if it is.
      consentEmail: false,
      consentSms: false,
      consentHealth: false,
      website: "",
      answers: {},
    },
  });

  // The resident page only asks for the health consent once an answer needs
  // it, so the box has to appear the moment one is chosen rather than sit
  // there on a page where it applies to nothing.
  const watched = watch();
  const needsHealthConsent =
    role.id === "resident" && touchesSpecialCategory(watched as WaitlistFormValues);

  const onSubmit = async (values: WaitlistFormValues) => {
    setFailure(null);

    // ── Spam, and nothing a person will ever notice ───────────────────────
    //
    // Two cheap signals, no captcha. A captcha on this page would gate people
    // in housing difficulty behind a puzzle to save us a handful of junk rows,
    // and that trade is the wrong way round.
    //
    // Both branches show the SUCCESS state without posting. Telling a script
    // it was blocked is telling it what to change.
    const tooFast = Date.now() - mountedAt.current < MIN_TIME_ON_FORM_MS;
    if (values.website || tooFast) {
      setSent(true);
      return;
    }

    // ⚠️ A TIMEOUT, OR THE BUTTON STAYS ON "SENDING" FOREVER. A fetch to a
    // host that accepts the connection and then says nothing never settles on
    // its own, and `isSubmitting` is tied to this promise.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const res = await fetch(apiUrl("/public/waitlist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildWaitlistPayload(role, values)),
        signal: controller.signal,
      });

      if (res.ok) {
        setSent(true);
      } else if (res.status === 429) {
        setFailure("rateLimited");
      } else if (res.status >= 400 && res.status < 500) {
        // The payload was refused. Trying again sends the same payload.
        setFailure("rejected");
      } else {
        setFailure("network");
      }
    } catch {
      // Offline, DNS, CORS, or the abort above. All of them are worth a retry.
      setFailure("network");
    } finally {
      clearTimeout(timer);
    }
  };

  if (sent) return <SuccessState role={role} />;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[var(--radius-panel)] border border-rule bg-page/50 p-5 sm:p-8"
    >
      <div className="flex flex-col gap-10">
        {role.questions
          .filter((question) => !question.tail)
          .map((question) => {
            // A tail question belongs to the block before it. Looked up in the
            // ORIGINAL list, so the pairing follows the content file's order
            // and not an index computed over the filtered one.
            const next = role.questions[role.questions.indexOf(question) + 1];
            const tailQuestion = next?.tail ? next : undefined;
            return (
              <Question
                key={question.id}
                question={question}
                register={register}
                tail={
                  tailQuestion ? (
                    <Question question={tailQuestion} register={register} />
                  ) : undefined
                }
              />
            );
          })}
      </div>

      {needsHealthConsent ? (
        <div className="mt-8 rounded-[var(--radius-panel)] border border-teal-600 bg-tint-teal p-5">
          <label
            htmlFor={residentHealthConsent.id}
            className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] leading-relaxed text-ink"
          >
            <input
              id={residentHealthConsent.id}
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-teal-600"
              aria-invalid={!!errors.consentHealth}
              aria-describedby={errors.consentHealth ? "consentHealth-error" : undefined}
              {...register("consentHealth")}
            />
            <span>{residentHealthConsent.label}</span>
          </label>
          <div className="mt-2">
            <ErrorText id="consentHealth-error">{errors.consentHealth?.message}</ErrorText>
          </div>
        </div>
      ) : null}

      <hr className="mt-10 border-rule" />

      <h2 className="mt-10 font-heading text-[19px] font-semibold text-ink">
        Where do we reach you?
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="name">{contactFieldLabels.name}</FieldLabel>
          <input
            id="name"
            className={fieldClass}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          <ErrorText id="name-error">{errors.name?.message}</ErrorText>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="email">{contactFieldLabels.email}</FieldLabel>
          <input
            id="email"
            type="email"
            className={fieldClass}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : "email-help"}
            {...register("email")}
          />
          <p id="email-help" className="text-[13px] leading-snug text-ink-muted">
            {contactFieldLabels.emailHelp}
          </p>
          <ErrorText id="email-error">{errors.email?.message}</ErrorText>
        </div>

        {role.askOrganisation ? (
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="organisation">{contactFieldLabels.organisation}</FieldLabel>
            <input
              id="organisation"
              className={fieldClass}
              autoComplete="organization"
              aria-invalid={!!errors.organisation}
              aria-describedby={errors.organisation ? "organisation-error" : "organisation-help"}
              {...register("organisation")}
            />
            <p id="organisation-help" className="text-[13px] leading-snug text-ink-muted">
              {role.organisationLabel}
            </p>
            <ErrorText id="organisation-error">{errors.organisation?.message}</ErrorText>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="phone">{contactFieldLabels.phone}</FieldLabel>
          <input
            id="phone"
            type="tel"
            className={fieldClass}
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : "phone-help"}
            {...register("phone")}
          />
          <p id="phone-help" className="text-[13px] leading-snug text-ink-muted">
            {contactFieldLabels.phoneHelp}
          </p>
          <ErrorText id="phone-error">{errors.phone?.message}</ErrorText>
        </div>
      </div>

      {/*
       * The honeypot.
       *
       * ⚠️ MOVED OFF SCREEN, NEVER `display: none` OR `hidden`. A scraper that
       * is worth defending against skips fields it can see are hidden, and
       * some browsers skip them on autofill too. This one is a real, focusable
       * -1 field that simply sits outside the viewport, so a script filling
       * "every input" fills it and a person never meets it.
       *
       * `aria-hidden` plus `tabIndex={-1}` keeps it away from screen readers
       * and off the tab order, so it costs a keyboard user nothing.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">{contactFieldLabels.honeypot}</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="mt-8">
        <ConsentBlock register={register} />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : role.submitLabel}
          </Button>
        </div>
        {failure ? (
          <p role="alert" className="text-[14px] font-medium text-destructive">
            {registerFailureLines[failure]}
          </p>
        ) : null}
      </div>
    </form>
  );
}
