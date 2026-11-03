import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HandHeart,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CONSENT_VERSION,
  consentBlock,
  registerPrivacy,
  RESIDENT_SPECIAL_CATEGORY_OPTIONS,
  residentHealthConsent,
  type RegisterQuestion,
  type RegisterRoleContent,
} from "@/content/register";
import { registrationJourney as copy } from "@/content/registration-journey";
import {
  createRegistration,
  normaliseRegistrationPhone,
  RegistrationError,
  saveRegistrationPreferences,
  type AccountDetails,
  type RegistrationFailure,
  type SurveyAnswers,
} from "@/lib/registration";
import { cn } from "@/lib/utils";
import { useDrawMark } from "@/hooks/use-draw-mark";
import "./registration-experience.css";

/** The step's exit, in ms. Must match `--duration-exit` in styles.css. */
const STEP_EXIT_MS = 120;
/** How late the backstop timer may be before it stops waiting for the event. */
const STEP_EXIT_GRACE_MS = 60;

type AccountField = "email" | "phone" | "password" | "confirmPassword";
type Details = Record<AccountField, string>;
const emptyDetails: Details = { email: "", phone: "", password: "", confirmPassword: "" };
/* WAVE 413: `aria-invalid:border-destructive`. The message under a field is
   the only thing that used to mark it, and on a form this long the message can
   be the thing below the fold. The border is where the eye already is, and it
   is driven off `aria-invalid`, which the fields already set, so the visual
   state and the announced state cannot drift apart. Colour is not the only
   channel: the message is still there, still `role="alert"`, and still names
   what is wrong. */
const fieldClass =
  "registration-input min-h-14 w-full rounded-xl border border-rule bg-page px-4 py-3 text-base text-ink placeholder:text-ink-muted aria-invalid:border-destructive focus-visible:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

function sensitiveAnswers(answers: SurveyAnswers): boolean {
  return Object.entries(RESIDENT_SPECIAL_CATEGORY_OPTIONS).some(([id, options]) => {
    const value = answers[id];
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    return selected.some((option) => (options as readonly string[]).includes(option));
  });
}

function getQuestions(role: RegisterRoleContent): RegisterQuestion[] {
  // Location first for investors, without changing the stored answer keys.
  const questions =
    role.id === "investor"
      ? [
          ...role.questions.filter((q) => q.id === "preferred_regions"),
          ...role.questions.filter((q) => q.id === "regions"),
          ...role.questions.filter((q) => q.id !== "regions" && q.id !== "preferred_regions"),
        ]
      : [...role.questions];
  return [
    ...questions,
    { id: "profile_name", label: copy.name, kind: "text", maxLength: 100 },
    ...(role.askOrganisation
      ? [
          {
            id: "profile_organisation",
            label: copy.organisation,
            help: role.organisationLabel,
            kind: "text" as const,
            maxLength: 150,
          },
        ]
      : []),
  ];
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: RegisterQuestion;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  if (question.kind === "single" || question.kind === "multi") {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <div>
        <p id="question-selection-help" className="mb-4 text-sm font-medium text-ink-muted">
          {question.kind === "multi" ? "Select all that apply" : "Select one option"}
        </p>
        <fieldset
          aria-labelledby="registration-heading"
          aria-describedby={
            question.help ? "question-help question-selection-help" : "question-selection-help"
          }
          className="grid gap-3 sm:grid-cols-2"
        >
          <legend className="sr-only">{question.label}</legend>
          {(question.options ?? []).map((option) => (
            <label
              key={option}
              className="registration-option relative flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border border-rule bg-page p-5 text-base leading-relaxed text-ink-muted transition-colors hover:border-teal-600 has-checked:border-teal-600 has-checked:bg-secondary has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-600"
            >
              <input
                type={question.kind === "multi" ? "checkbox" : "radio"}
                name={question.id}
                value={option}
                checked={selected.includes(option)}
                className="size-5 shrink-0 accent-teal-600"
                onChange={(event) =>
                  onChange(
                    question.kind === "single"
                      ? option
                      : event.target.checked
                        ? [...selected, option]
                        : selected.filter((item) => item !== option),
                  )
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      </div>
    );
  }
  const shared = {
    id: "question-answer",
    value: typeof value === "string" ? value : "",
    maxLength: question.maxLength ?? 200,
    placeholder: question.placeholder,
    "aria-labelledby": "registration-heading",
    "aria-describedby": question.help ? "question-help" : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    className: cn(fieldClass, "min-h-20 text-lg sm:text-xl"),
  };
  return question.kind === "textarea" ? (
    <textarea {...shared} rows={4} className={cn(shared.className, "resize-y")} />
  ) : (
    <input
      {...shared}
      type="text"
      /* WAVE 414: `text` rather than nothing, so a browser that does not
         infer from `type` still opens the ordinary keyboard rather than
         whichever one it used last. */
      inputMode="text"
      autoComplete={
        question.id === "profile_name"
          ? "name"
          : question.id === "profile_organisation"
            ? "organization"
            : "off"
      }
    />
  );
}

export function RegistrationFlow({ role }: { role: RegisterRoleContent }) {
  const [stage, setStage] = React.useState<"account" | "survey" | "done">("account");
  const [details, setDetails] = React.useState<Details>(emptyDetails);
  const [errors, setErrors] = React.useState<Partial<Record<AccountField, string>>>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [consentEmail, setConsentEmail] = React.useState(false);
  const [consentSms, setConsentSms] = React.useState(false);
  const [consentHealth, setConsentHealth] = React.useState(false);
  const [healthError, setHealthError] = React.useState(false);
  const [answers, setAnswers] = React.useState<SurveyAnswers>({});
  const [index, setIndex] = React.useState(0);
  // WAVE 413b: the saved mark's dash, measured off its own path rather than
  // guessed at 48, which left a sixth of the shield undrawn for good. See
  // src/hooks/use-draw-mark.ts.
  const drawMark = useDrawMark();
  /*
   * ── WAVE 413: THE STEP MOVES IN THE DIRECTION OF TRAVEL ─────────────────
   *
   * Forward arrives from the right, Back arrives from the left, and the step
   * being left fades out over 120ms first. The job is orientation: a survey
   * with no page change and no URL change gave a visitor nothing at all to
   * tell "I have moved on" from "my answer did not take". Direction is the
   * cheapest possible answer, and it is the same one a paper form gives.
   *
   * `null` MEANS NO ANIMATION, AND IT IS THE STARTING VALUE. The register
   * routes are prerendered like every other route here, so the first step a
   * visitor sees was painted by the server; running an entrance on it is the
   * wave 412b defect, and the only safe first frame is no animation at all.
   * Only a move the visitor asked for sets a direction.
   */
  const [direction, setDirection] = React.useState<"forward" | "back" | null>(null);
  const [leaving, setLeaving] = React.useState(false);
  const moveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [accountFrozen, setAccountFrozen] = React.useState(false);
  const [failure, setFailure] = React.useState<RegistrationFailure | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [honeypot, setHoneypot] = React.useState("");
  // These capabilities live only in memory. Passwords never leave the account request.
  const token = React.useRef("");
  const requestId = React.useRef("");
  const accountAttempt = React.useRef<AccountDetails | null>(null);
  const locked = React.useRef(false);
  const heading = React.useRef<HTMLHeadingElement>(null);
  /** The step being left, so its exit can say when it is over. */
  const stepRef = React.useRef<HTMLDivElement | null>(null);
  const hasMoved = React.useRef(false);
  const questions = React.useMemo(() => getQuestions(role), [role]);
  const question = questions[index]!;
  const needsHealthConsent = role.id === "resident" && sensitiveAnswers(answers);

  // Static HTML must never submit named password fields as a native GET
  // before React has attached the account submit handler.
  React.useEffect(() => {
    setReady(true);
  }, []);

  React.useEffect(
    () => () => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
    },
    [],
  );

  /**
   * Leave this step, then arrive at the next one.
   *
   * The 120ms is the exit, and it is spent while the answer is already away:
   * `saveStep` awaits the network before it calls this, so the fade is not
   * latency added to the form, it is the last 120ms of a wait that had nothing
   * in it. Under reduced motion there is no wait at all and the step simply
   * changes, which is what rule 4 of this wave asks for: the STATE (a
   * different question, a longer bar, a new number in the counter) is conveyed
   * without any of the motion.
   */
  const moveTo = React.useCallback((next: number, heading: "forward" | "back") => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      if (moveTimer.current) clearTimeout(moveTimer.current);
      moveTimer.current = null;
      setDirection(heading);
      setIndex(next);
      setLeaving(false);
    };
    if (reduced) {
      land();
      return;
    }
    setLeaving(true);

    /*
     * ⚠ `animationend`, WITH THE TIMER AS A BACKSTOP AND NOT AS THE CLOCK.
     *
     * A setTimeout of STEP_EXIT_MS alone is the obvious way to write this and
     * it drifts: the timer is scheduled against a busy main thread and fires
     * some milliseconds after the fade it is supposed to be following, and
     * those milliseconds sit in the middle of the transition doing nothing.
     * Measured by the step probe in scripts/wave413-motion.py: 120ms of exit
     * and 250ms of entrance came to 400ms of wall clock, and the missing 30
     * were this.
     *
     * The animation's own `animationend` fires exactly when the fade is over,
     * so the new step mounts on the frame the old one finished. The timer
     * stays as a backstop for the cases where the event never arrives at all
     * (the element removed mid-animation, a browser that declines to run it),
     * because a step that never lands is worse than a step that lands late.
     * Whichever gets there first wins, once.
     */
    const node = stepRef.current;
    if (node) node.addEventListener("animationend", land, { once: true });
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(land, STEP_EXIT_MS + STEP_EXIT_GRACE_MS);
  }, []);

  React.useEffect(() => {
    if (!hasMoved.current) {
      hasMoved.current = true;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    /*
     * ⚠ THE LAST STEP GOES TO THE TOP OF THE PAGE, NOT TO ITS OWN HEADING.
     * WAVE 415, rel414b MINOR 5.
     *
     * This effect exists so that each new step of a nine-question journey
     * arrives at the top of the screen instead of wherever the last one
     * ended, and for the nine questions `block: "start"` on the heading is
     * exactly right. For the success state it was not: the panel is shorter
     * than one viewport and sits directly under the page's own chrome, so
     * aligning its HEADING to the top of the screen left the page at
     * scrollY 187 on a 390x844 phone, scrolled past the role header and the
     * back link, to show something that fits on screen without moving at
     * all. Scrolling to 0 instead puts the whole of it, heading, message and
     * action, inside the first screen with the page's own chrome above it.
     *
     * ⚠ AND NOT BY SKIPPING THE SCROLL. That was tried first and is worse:
     * somebody reaching the end has scrolled down through nine questions, so
     * with no scroll at all the success state renders at scrollY 1398 and
     * 1,025px above the top of the screen, which is to say off it. The gate
     * measured both, 187 and 1398, before this line was written.
     *
     * Invisible until wave 415 made the success probe in
     * scripts/wave414-mobile.py ASSERT `window.scrollY` instead of merely
     * reading it: the probe's three boxes are viewport-relative, so "inside
     * the first screen" only meant anything at 0. The rel414b re-check
     * called it and the assertion then found the page really was scrolling.
     *
     * Focus still moves on every change including this one, because that is
     * what tells a screen reader where it now is.
     */
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth";
    if (stage === "done") {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    heading.current?.scrollIntoView({ behavior, block: "start" });
  }, [stage, index]);

  async function submitAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const nextErrors: Partial<Record<AccountField, string>> = {};
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()) ||
      details.email.trim().length > 255
    )
      nextErrors.email = copy.errors.email;
    const phone = normaliseRegistrationPhone(details.phone);
    if (!phone) nextErrors.phone = copy.errors.phone;
    if (
      details.password.length < 10 ||
      details.password.length > 128 ||
      !/\p{L}/u.test(details.password) ||
      !/[0-9]/.test(details.password)
    )
      nextErrors.password = copy.errors.password;
    if (details.password !== details.confirmPassword || !details.confirmPassword)
      nextErrors.confirmPassword = copy.errors.confirmPassword;
    setErrors(nextErrors);
    const firstError = (Object.keys(nextErrors) as AccountField[])[0];
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }
    if (honeypot) {
      setFailure("rejected");
      return;
    }
    locked.current = true;
    setBusy(true);
    setFailure(null);
    try {
      requestId.current ||= crypto.randomUUID();
      accountAttempt.current ??= {
        request_id: requestId.current,
        role: role.id,
        email: details.email.trim(),
        phone: phone!,
        password: details.password,
        consent_email: consentEmail,
        consent_sms: consentSms,
        consent_version: CONSENT_VERSION,
        source: "site-register",
      };
      token.current = await createRegistration(accountAttempt.current);
      accountAttempt.current = null;
      setDetails(emptyDetails);
      setShowPassword(false);
      setShowConfirmation(false);
      setStage("survey");
    } catch (error) {
      const kind = error instanceof RegistrationError ? error.kind : "network";
      setFailure(kind);
      if (kind === "network" || accountFrozen) {
        // The server may have committed before the response was lost.
        // Retry the identical payload; changed details cannot be confirmed.
        setAccountFrozen(true);
      } else {
        accountAttempt.current = null;
        requestId.current = "";
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  async function saveStep(finish = false, skip = false) {
    if (locked.current || !token.current) return;
    const nextAnswers = { ...answers };
    if (skip) delete nextAnswers[question.id];
    const sensitive = role.id === "resident" && sensitiveAnswers(nextAnswers);
    if (sensitive && !consentHealth) {
      setHealthError(true);
      document.getElementById("health-consent")?.focus();
      return;
    }
    locked.current = true;
    setBusy(true);
    setFailure(null);
    setHealthError(false);
    const wireAnswers: SurveyAnswers = {};
    for (const q of role.questions) {
      const value = nextAnswers[q.id];
      if (typeof value === "string" && value.trim()) wireAnswers[q.id] = value.trim();
      if (Array.isArray(value) && value.length) wireAnswers[q.id] = value;
    }
    if (sensitive) wireAnswers["health_data_consent"] = "yes";
    try {
      await saveRegistrationPreferences(
        token.current,
        wireAnswers,
        finish,
        typeof nextAnswers["profile_name"] === "string" ? nextAnswers["profile_name"] : undefined,
        typeof nextAnswers["profile_organisation"] === "string"
          ? nextAnswers["profile_organisation"]
          : undefined,
      );
      setAnswers(nextAnswers);
      setSaved(true);
      if (finish || index === questions.length - 1) {
        token.current = "";
        setDirection("forward");
        setStage("done");
      } else {
        moveTo(index + 1, "forward");
      }
    } catch (error) {
      setFailure(error instanceof RegistrationError ? error.kind : "network");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  const failureMessage =
    failure === "password" ? copy.errors.weakPassword : failure ? copy.errors[failure] : null;

  return (
    <div className="registration-flow registration-edition mx-auto w-full max-w-[820px]">
      <ol aria-label="Registration progress" className="registration-stages">
        {(
          [
            { id: "account", label: "Your account" },
            { id: "survey", label: "Your preferences" },
            { id: "done", label: "Complete" },
          ] as const
        ).map((step, stepIndex) => {
          const active = stage === step.id;
          const completed = stage === "done" || (stage === "survey" && step.id === "account");
          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              data-complete={completed}
              className={cn("registration-stage", active ? "text-ink" : "text-ink-muted")}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "registration-stage__number grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs",
                  active || completed ? "border-teal-600 text-teal-600" : "border-rule",
                )}
              >
                {completed ? <ShieldCheck size={17} /> : String(stepIndex + 1).padStart(2, "0")}
              </span>
              <span className="font-medium leading-snug">
                {completed && !active ? <span className="sr-only">Completed: </span> : null}
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {stage === "account" ? (
        <div className="registration-panel registration-survey registration-account rounded-3xl border border-rule bg-page p-6 shadow-[var(--shadow-card)] sm:p-10">
          {/* No `data-step` here on purpose. This is the first thing the route
              paints and the server painted it; an entrance on it would blink
              away content the visitor is already reading. */}
          <div className="registration-step">
            <span aria-hidden="true" className="mb-3 inline-flex text-teal-600">
              <LockKeyhole size={22} />
            </span>
            <h1
              ref={heading}
              id="registration-heading"
              tabIndex={-1}
              className="registration-heading font-heading text-[clamp(2rem,4vw,3rem)] font-bold leading-tight text-ink"
            >
              {copy.accountTitle}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
              {copy.accountIntro}
            </p>
            <form onSubmit={submitAccount} noValidate className="mt-8" aria-busy={busy}>
              <fieldset
                disabled={busy || !ready || accountFrozen}
                className="grid gap-x-5 gap-y-6 sm:grid-cols-2"
              >
                <legend className="sr-only">Your account details</legend>
                {(["email", "phone", "password", "confirmPassword"] as const).map((field) => (
                  <div key={field}>
                    <label htmlFor={field} className="mb-2 block text-sm font-semibold text-ink">
                      {copy[field]}
                    </label>
                    <div className="relative">
                      <input
                        id={field}
                        name={field}
                        type={
                          field === "email"
                            ? "email"
                            : field === "phone"
                              ? "tel"
                              : (field === "password" ? showPassword : showConfirmation)
                                ? "text"
                                : "password"
                        }
                        /* ⚠ WAVE 414, PHONE RULE 5: `inputMode` BESIDE
                           `autoComplete`, AND NOT ON THE PASSWORD.

                           `type` already picks the keyboard in every browser
                           that honours it, and `inputMode` is what picks it
                           in the ones that do not, which on a phone is the
                           difference between an at-sign on the front row and
                           three taps to find it. It is deliberately ABSENT on
                           the two password fields: there is no inputMode that
                           is right for a password, and naming one would tell
                           the keyboard something about what is being typed
                           into a field whose whole point is that it does not.
                        */
                        inputMode={
                          field === "email" ? "email" : field === "phone" ? "tel" : undefined
                        }
                        autoComplete={
                          field === "email" ? "email" : field === "phone" ? "tel" : "new-password"
                        }
                        maxLength={field === "email" ? 255 : field === "phone" ? 40 : 128}
                        required
                        value={details[field]}
                        aria-invalid={!!errors[field]}
                        aria-describedby={
                          [
                            field === "password" ? "password-help" : "",
                            errors[field] ? `${field}-error` : "",
                            field === "confirmPassword" &&
                            details.confirmPassword &&
                            details.confirmPassword === details.password
                              ? "password-match"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ") || undefined
                        }
                        className={cn(
                          fieldClass,
                          (field === "password" || field === "confirmPassword") && "pr-14",
                        )}
                        onChange={(event) => {
                          setDetails((current) => ({ ...current, [field]: event.target.value }));
                          setErrors((current) => ({ ...current, [field]: undefined }));
                        }}
                      />
                      {(field === "password" || field === "confirmPassword") && (
                        <button
                          type="button"
                          aria-label={`${(field === "password" ? showPassword : showConfirmation) ? "Hide" : "Show"} ${field === "password" ? "password" : "password confirmation"}`}
                          aria-pressed={field === "password" ? showPassword : showConfirmation}
                          onClick={() =>
                            field === "password"
                              ? setShowPassword((current) => !current)
                              : setShowConfirmation((current) => !current)
                          }
                          className="absolute inset-y-1 right-1 grid w-12 place-items-center rounded-lg text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-600"
                        >
                          {(field === "password" ? showPassword : showConfirmation) ? (
                            <EyeOff aria-hidden="true" size={19} />
                          ) : (
                            <Eye aria-hidden="true" size={19} />
                          )}
                        </button>
                      )}
                    </div>
                    {field === "password" && (
                      <p
                        id="password-help"
                        className="mt-2 text-sm max-lg:text-[15px] leading-relaxed text-ink-muted"
                      >
                        {copy.passwordHelp}
                      </p>
                    )}
                    {field === "confirmPassword" &&
                    details.confirmPassword &&
                    details.confirmPassword === details.password ? (
                      <p
                        id="password-match"
                        className="mt-2 inline-flex items-center gap-2 text-sm text-teal-600"
                      >
                        <ShieldCheck aria-hidden="true" size={16} />
                        Passwords match
                      </p>
                    ) : null}
                    {errors[field] && (
                      <p
                        id={`${field}-error`}
                        role="alert"
                        className="mt-2 text-sm text-destructive"
                      >
                        {errors[field]}
                      </p>
                    )}
                  </div>
                ))}
              </fieldset>
              <div aria-hidden="true" className="absolute left-[-9999px] size-px overflow-hidden">
                <label htmlFor="registration-website">Company website</label>
                <input
                  id="registration-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>
              <fieldset disabled={busy || accountFrozen} className="mt-7 border-t border-rule pt-6">
                <legend className="sr-only">{consentBlock.heading}</legend>
                <p className="mb-3 text-sm max-lg:text-[15px] max-lg:leading-[1.6] text-ink-muted">
                  {consentBlock.help}
                </p>
                {[
                  {
                    id: "registration-email-consent",
                    value: consentEmail,
                    set: setConsentEmail,
                    label: consentBlock.email.label,
                  },
                  {
                    id: "registration-sms-consent",
                    value: consentSms,
                    set: setConsentSms,
                    label: consentBlock.sms.label,
                  },
                ].map((consent) => (
                  <label
                    key={consent.id}
                    className="flex min-h-11 cursor-pointer items-start gap-3 border-b border-rule py-3 text-sm leading-relaxed text-ink-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-600"
                  >
                    <input
                      id={consent.id}
                      type="checkbox"
                      checked={consent.value}
                      onChange={(event) => consent.set(event.target.checked)}
                      className="mt-0.5 size-5 shrink-0 accent-teal-600"
                    />
                    <span>{consent.label}</span>
                  </label>
                ))}
              </fieldset>
              <p className="mt-5 text-sm leading-relaxed text-ink-muted">
                <a
                  href={registerPrivacy.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-teal-600 lg:min-h-0"
                >
                  {registerPrivacy.linkLabel}
                </a>
              </p>
              <details className="mt-3 text-sm leading-relaxed text-ink-muted">
                <summary className="min-h-11 cursor-pointer py-2 focus-visible:outline-2 focus-visible:outline-teal-600">
                  How we use your details
                </summary>
                <p className="pb-4 text-sm max-lg:text-[15px] max-lg:leading-[1.6]">
                  {registerPrivacy.body}
                </p>
              </details>
              {failureMessage && (
                <p role="alert" className="my-4 text-sm text-destructive">
                  {accountFrozen
                    ? "We couldn't confirm your registration. Your details are held for this attempt. Please try again to confirm the save."
                    : failureMessage}
                </p>
              )}
              {/* WAVE 414: THE ACCOUNT STEP GETS THE SAME BOTTOM BAR AS THE
                  SURVEY, and it is the step that needed it most. This is the
                  first panel of the journey and the one the route paints, so
                  it is where the keyboard probe found the defect: at 390 with
                  the viewport cut to 420px, which is what an iPhone leaves
                  above an open keyboard, "Create account and continue" sat at
                  y=1040 and was not reachable with one scroll. Somebody
                  typing their e-mail address could not see the button that
                  does something with it. Sticky for the same reasons as the
                  survey's, with the same safe-area padding. */}
              <div className="registration-actions mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={busy || !ready}
                  className="w-full whitespace-normal"
                >
                  {busy ? (
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin motion-reduce:animate-none"
                    />
                  ) : null}
                  {busy ? copy.creating : copy.create}
                </Button>
              </div>
              <p className="mt-5 text-center text-sm">
                <a
                  href="https://app.impactinvestmentgroup.co.uk/auth/login"
                  className="inline-flex min-h-11 items-center text-ink-muted underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-600"
                >
                  {copy.signIn}
                </a>
              </p>
            </form>
          </div>
        </div>
      ) : stage === "survey" ? (
        <div
          className="registration-panel registration-survey rounded-3xl border border-rule bg-page p-6 shadow-[var(--shadow-card)] sm:p-10"
          aria-busy={busy}
        >
          {/* WAVE 414: THE PROGRESS CHROME IS PINNED UNDER THE BAR ON A PHONE.
              "Registration saved", "03 / 07" and the bar itself are the only
              things on this screen that say how far through the journey a
              visitor is, and on a 390px screen they scroll off the top after
              the first question. They travel together in one sticky band now,
              below 1024px, resting at `--header-height` so the header never
              covers them. See `.registration-chrome` in styles.css. */}
          <div className="registration-chrome">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-teal-600">
                <ShieldCheck aria-hidden="true" size={18} />
                Registration saved
              </span>
              {/* WAVE 413: this line already said which step you were on; it
                says it OUT LOUD now. `aria-live="polite"` on the existing
                counter, with no new copy, so somebody who cannot see the bar
                move or the question change is told "03 / 07" when it happens
                rather than having to go looking. `tabular-nums` because the
                two figures must not change width as they count. */}
              <span aria-live="polite" className="font-mono tabular-nums text-ink-muted">
                {String(index + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Survey progress"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={index + 1}
              aria-valuetext={`Question ${index + 1} of ${questions.length}`}
              className="mb-9 h-1.5 overflow-hidden rounded-full bg-rule"
            >
              {/* WAVE 413b: scaled from its left edge rather than widened, so
              the bar's own growth is a transform. The track above clips it. */}
              <div
                className="registration-progress h-full w-full rounded-full bg-teal-600"
                style={{ transform: `scaleX(${(index + 1) / questions.length})` }}
              />
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveStep(index === questions.length - 1);
            }}
          >
            <fieldset disabled={busy} className="min-w-0">
              <legend className="sr-only">{copy.surveyIntro}</legend>
              {/* `key` is the question, so React builds a NEW node on every
                  move and the entrance animation restarts without anything
                  having to reset it. `data-step` is the direction it came
                  from, and `data-leaving` is the 120ms on the way out. */}
              <div
                key={question.id}
                ref={stepRef}
                data-step={direction ?? undefined}
                data-leaving={leaving ? "true" : undefined}
                className="registration-step min-h-[280px]"
              >
                <p className="eyebrow mb-4 flex items-center gap-2 text-teal-600">
                  {question.id === "regions" || question.id === "location" ? (
                    <MapPin aria-hidden="true" size={16} />
                  ) : null}
                  {role.label} preferences
                </p>
                <h1
                  ref={heading}
                  id="registration-heading"
                  tabIndex={-1}
                  className="registration-heading font-heading text-[clamp(1.9rem,4vw,2.8rem)] font-bold leading-tight text-ink"
                >
                  {question.label}
                </h1>
                {question.help && (
                  <p id="question-help" className="mt-3 text-base leading-relaxed text-ink-muted">
                    {question.help}
                  </p>
                )}
                <div className="mt-7">
                  <QuestionInput
                    question={question}
                    value={answers[question.id]}
                    onChange={(value) => {
                      setAnswers((current) => ({ ...current, [question.id]: value }));
                      setSaved(false);
                      setHealthError(false);
                    }}
                  />
                </div>
              </div>
              {needsHealthConsent && (
                <div className="mt-6 rounded-2xl border border-teal-600 bg-tint-teal p-5">
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
                    <input
                      id="health-consent"
                      type="checkbox"
                      checked={consentHealth}
                      onChange={(event) => {
                        setConsentHealth(event.target.checked);
                        setHealthError(false);
                      }}
                      aria-invalid={healthError}
                      aria-describedby={healthError ? "health-error" : undefined}
                      className="mt-1 size-5 shrink-0 accent-teal-600"
                    />
                    <span>{residentHealthConsent.label}</span>
                  </label>
                  {healthError && (
                    <p id="health-error" role="alert" className="mt-3 text-sm text-destructive">
                      {residentHealthConsent.requiredMessage}
                    </p>
                  )}
                </div>
              )}
              {failureMessage && (
                <p role="alert" className="mt-5 text-sm text-destructive">
                  {failureMessage}
                </p>
              )}
              {/* WAVE 414: THE BOTTOM BAR, AND IT IS STICKY RATHER THAN FIXED.

                  Measured before: at 390 with the viewport cut to 420px, which
                  is roughly what an iPhone leaves above an open keyboard, the
                  Continue control sat at y=1040 and was not reachable with one
                  scroll, let alone visible while somebody typed. The one way
                  forward through a seven-question journey was three flicks
                  away from the answer being given.

                  STICKY, NOT FIXED, and the difference is the whole reason
                  this needed no spacer. A fixed bar leaves a hole in the flow
                  that has to be filled with a bottom padding somebody has to
                  keep in step with the bar's height, and it is a second fixed
                  layer to keep out of the back-to-top control's corner. A
                  sticky one occupies its own space, cannot cover the row
                  beneath it, and stops sticking at the foot of the fieldset,
                  which is exactly where a visitor no longer needs it.

                  The safe-area padding is the brief's and it is not optional:
                  on an iPhone with a home indicator the bottom 34px of the
                  screen is not a place a button may be. See
                  `.registration-actions` in styles.css. */}
              <div className="registration-actions mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    moveTo(index - 1, "back");
                    setFailure(null);
                    setHealthError(false);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-600 disabled:invisible"
                >
                  <ArrowLeft aria-hidden="true" size={17} />
                  {copy.back}
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1 whitespace-normal sm:flex-none"
                >
                  {/* WAVE 413: A SPINNER, AND THE BUTTON ALREADY GOES DEAD.
                      The label changed while a request was in flight and
                      nothing else did, which on a slow connection reads as a
                      press that did not take, and a second press is the last
                      thing this form needs. The fieldset around it is disabled
                      on `busy`, so the control cannot be pressed twice; the
                      spinner is what says why. No new copy: the label was
                      already `copy.saving`.

                      WAVE 413b: and it does not rotate under reduced motion.
                      The state is still conveyed: the control is dead and the
                      label has changed, which is the whole of "busy". */}
                  {busy ? (
                    <Loader2
                      aria-hidden="true"
                      className="animate-spin motion-reduce:animate-none"
                    />
                  ) : null}
                  {busy
                    ? copy.saving
                    : index === questions.length - 1
                      ? copy.finish
                      : copy.continue}
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => void saveStep(index === questions.length - 1, true)}
                  className="min-h-11 rounded-lg px-2 text-ink-muted underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-600"
                >
                  {copy.skip}
                </button>
                <button
                  type="button"
                  onClick={() => void saveStep(true)}
                  className="min-h-11 rounded-lg px-2 text-ink-muted underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-teal-600"
                >
                  {copy.later}
                </button>
              </div>
            </fieldset>
          </form>
          <p role="status" className="mt-4 text-center text-sm leading-relaxed text-ink-muted">
            {/* WAVE 413: the saved state DRAWS ITSELF, over 400ms, by running
                a stroke-dashoffset down the glyph's own paths. It is the
                site's own ShieldCheck and not a new tick: the brand replaced
                every checkmark on this site with a Lucide icon, and drawing
                one of those is the version of "a tick draws itself" that does
                not put a tick back. `key` is the step, so it draws again each
                time a step saves rather than once for good.

                Under reduced motion the glyph is simply there beside the word,
                which is the whole state; the drawing was never carrying it. */}
            {saved ? (
              <ShieldCheck
                key={`saved-${index}`}
                ref={drawMark}
                aria-hidden="true"
                size={16}
                className="draw-in mr-1.5 inline-block align-[-2px] text-teal-600"
              />
            ) : null}
            {saved ? `${copy.saved}. ` : ""}
            {copy.optional}
          </p>
        </div>
      ) : (
        <div
          data-step="forward"
          className="registration-panel registration-step rounded-3xl border border-teal-600 bg-page p-8 text-center sm:p-12"
        >
          <span
            aria-hidden="true"
            className="mx-auto grid size-20 place-items-center rounded-full border border-teal-600 bg-tint-teal text-teal-600"
          >
            <HandHeart size={34} strokeWidth={1.6} />
          </span>
          <h1
            ref={heading}
            tabIndex={-1}
            className="registration-heading mt-7 font-heading text-4xl font-bold text-ink"
          >
            {copy.doneTitle}
          </h1>
          <p
            role="status"
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted"
          >
            {copy.doneBody}
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-8">
            <Link to="/platform">
              Explore the platform
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-ink-muted">
            <Mail aria-hidden="true" size={16} className="mr-2 inline" />
            {copy.pending}
          </p>
        </div>
      )}
    </div>
  );
}
