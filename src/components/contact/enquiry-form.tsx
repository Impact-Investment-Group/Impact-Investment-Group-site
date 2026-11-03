import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, HandHeart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";
import { contactDetails } from "@/content/site";
import { cn } from "@/lib/utils";
import { useDrawMark } from "@/hooks/use-draw-mark";
import {
  previewSlots,
  entityTypeOptions,
  enquiryRoutes,
  investorAcknowledgement,
  collectionNotice,
  roleOptions,
  ticketSizeOptions,
  type EnquiryRouteId,
} from "@/content/contact";

/**
 * One form for all six enquiry routes. The selected route changes the fields,
 * the routing and the promised reply time — there are no separate forms.
 */

const base = {
  name: z.string().trim().min(2, "Please give your full name").max(100),
  email: z.string().trim().email("Use a valid work email address").max(255),
  organisation: z.string().trim().min(2, "Please name your organisation").max(150),
  role: z.string().trim().min(1, "Please select your role"),
};

function schemaFor(route: EnquiryRouteId) {
  const message = z.string().trim().min(10, "Please give us a little more detail").max(2000);

  switch (route) {
    case "investor":
      return z.object({
        ...base,
        ticketSize: z.string().trim().min(1, "Please choose a ticket size"),
        acknowledgement: z.literal(true, {
          errorMap: () => ({ message: "Please confirm you understand the risk statement" }),
        }),
      });
    case "partner":
      return z.object({
        ...base,
        message,
        holdings: z.string().trim().min(10, "Tell us what you hold or what you need").max(2000),
        entityType: z.string().trim().min(1, "Please choose an entity type"),
      });
    case "media":
      return z.object({
        ...base,
        message,
        deadline: z.string().trim().min(1, "Please give your deadline"),
      });
    case "demo":
      return z.object({ ...base, message, slot: z.string().optional() });
    default:
      return z.object({ ...base, message });
  }
}

type FormValues = {
  name: string;
  email: string;
  organisation: string;
  role: string;
  message?: string;
  slot?: string;
  ticketSize?: string;
  acknowledgement?: boolean;
  holdings?: string;
  entityType?: string;
  deadline?: string;
};

/*
 * ⚠ WAVE 414: text-base, NOT text-sm, AND IT IS 16px FOR ONE REASON.
 *
 * Safari on iOS zooms the whole page in when a text-entry control under 16px
 * takes focus, and it does not zoom back out when the field is left. A 14px
 * field therefore does not just read small: it leaves the visitor on a page
 * that scrolls sideways for the rest of their visit, halfway through the form
 * this site exists to have filled in. 16px is the price of that not happening
 * and there is no way to buy it cheaper: `maximum-scale=1` would buy it by
 * taking pinch-zoom away from everybody, which is a WCAG 1.4.4 failure.
 *
 * The field is min-h-11 already, so the taller line box costs no height.
 */
const fieldClass =
  "min-h-12 w-full rounded-xl border border-rule bg-page px-4 py-3 text-base text-ink placeholder:text-ink-muted transition-colors hover:border-teal-600/60 aria-invalid:border-destructive focus-visible:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
      {children}
    </label>
  );
}

/*
 * ⚠️ `text-destructive`, NEVER an orange, and this form is why the rule is
 * written down twice. On /contact the `.section-light` block turns this
 * panel's `bg-page/50` WHITE, so the error text sits on white, where the
 * brand orange is 4.23:1 at 13px against a 4.5:1 floor. It also reads as the
 * page's call to action, which a failure is the opposite of.
 */
function ErrorText({ id, children }: { id: string; children?: string | undefined }) {
  if (!children) return null;
  return (
    /* WAVE 413: `error-in`, a 150ms fade. A validation message that snaps into
       existence under a field the visitor is still looking at reads as the
       page glitching; 150ms reads as an answer. It is an entrance on an
       element that did not exist a frame ago, so it can never leave anything
       hidden, and under reduced motion the message is simply there. The field
       above it changes its border at the same time, off `aria-invalid`, so the
       state has a second channel that is not this animation. */
    <p id={id} role="alert" className="error-in text-[13px] font-medium text-destructive">
      {children}
    </p>
  );
}

export function EnquiryForm({
  route,
  prefilledRole,
}: {
  route: EnquiryRouteId;
  prefilledRole?: string | undefined;
}) {
  const config = enquiryRoutes.find((r) => r.id === route) ?? enquiryRoutes[0]!;
  const [sent, setSent] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const successHeading = React.useRef<HTMLHeadingElement>(null);
  // WAVE 413b: the success mark's dash, measured off its own path rather than
  // guessed at 48. See src/hooks/use-draw-mark.ts.
  const drawMark = useDrawMark();

  const resolver = React.useMemo(
    () => zodResolver(schemaFor(route) as unknown as z.ZodType<FormValues>),
    [route],
  );

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: { role: prefilledRole ?? "" },
  });

  // Changing route changes the field set; clear stale errors but keep identity.
  React.useEffect(() => {
    setSent(false);
    setFailed(false);
    clearErrors();
  }, [route, clearErrors]);

  React.useEffect(() => setReady(true), []);

  React.useEffect(() => {
    if (sent) successHeading.current?.focus();
  }, [sent]);

  const messageLength = watch("message")?.length ?? 0;
  const errorFields = Object.keys(errors) as (keyof FormValues)[];

  const onSubmit = async (values: FormValues) => {
    setFailed(false);
    try {
      // Cross-origin to the platform backend, NOT the local /api/enquiry file
      // route: that route is a server handler and the GitHub Pages build ships
      // no server, so it 404s in production. See src/lib/api.ts.
      const res = await fetch(apiUrl("/public/enquiry"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, route, routedTo: config.routedTo }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSent(true);
      reset({ role: prefilledRole ?? "" });
    } catch {
      setFailed(true);
    }
  };

  if (sent) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-teal-600 bg-secondary p-8">
        <span className="grid size-11 place-items-center rounded-full border border-teal-600">
          {/* Affirmation, not a tick — the copy already says "received".
              WAVE 413: and it DRAWS ITSELF, over 400ms, when the panel
              replaces the form. This panel appears in place, with no
              navigation and nothing else moving, so the drawing is what marks
              the moment the enquiry left. Same treatment as the registration
              flow's saved state, on the same glyph family, for the same
              reason. */}
          <HandHeart ref={drawMark} aria-hidden="true" className="draw-in size-5 text-teal-600" />
        </span>
        <h3
          ref={successHeading}
          tabIndex={-1}
          className="mt-5 font-heading text-2xl font-bold text-ink focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          Enquiry received
        </h3>
        <p className="measure mt-3 text-base leading-relaxed text-ink-muted">
          Routed to our {config.routedTo.toLowerCase()}. {config.reply}.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => setSent(false)}>
            Send another enquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isSubmitting}
      aria-labelledby="enquiry-form-title"
      className="rounded-3xl border border-rule bg-page p-5 shadow-[var(--shadow-card)] sm:p-8"
    >
      <h3 id="enquiry-form-title" className="font-heading text-2xl font-bold text-ink">
        {config.label}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Routed to our {config.routedTo.toLowerCase()} · {config.reply.toLowerCase()}
      </p>

      {errorFields.length > 0 ? (
        <div className="mt-6 rounded-xl border border-destructive/40 bg-page-alt p-4">
          <p className="text-sm font-semibold text-destructive">
            Please check the highlighted fields.
          </p>
          <ul className="mt-2 flex flex-col items-start">
            {errorFields.map((field) => (
              <li key={field}>
                <button
                  type="button"
                  onClick={() => setFocus(field)}
                  className="min-h-11 text-left text-sm text-destructive underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
                >
                  {errors[field]?.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <input
            id="name"
            maxLength={100}
            required
            className={fieldClass}
            inputMode="text"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          <ErrorText id="name-error">{errors.name?.message}</ErrorText>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <input
            id="email"
            type="email"
            maxLength={255}
            required
            inputMode="email"
            className={fieldClass}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <ErrorText id="email-error">{errors.email?.message}</ErrorText>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="organisation">Organisation</Label>
          <input
            id="organisation"
            maxLength={150}
            required
            className={fieldClass}
            inputMode="text"
            autoComplete="organization"
            aria-invalid={!!errors.organisation}
            aria-describedby={errors.organisation ? "organisation-error" : undefined}
            {...register("organisation")}
          />
          <ErrorText id="organisation-error">{errors.organisation?.message}</ErrorText>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Your role</Label>
          <select
            id="role"
            required
            autoComplete="off"
            className={cn(fieldClass, "cursor-pointer")}
            aria-invalid={!!errors.role}
            aria-describedby={errors.role ? "role-error" : undefined}
            {...register("role")}
          >
            <option value="">Select your role</option>
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ErrorText id="role-error">{errors.role?.message}</ErrorText>
        </div>

        {route === "partner" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="entityType">Entity type</Label>
            <select
              id="entityType"
              autoComplete="off"
              className={cn(fieldClass, "cursor-pointer")}
              aria-invalid={!!errors.entityType}
              aria-describedby={errors.entityType ? "entityType-error" : undefined}
              {...register("entityType")}
            >
              <option value="">Select an entity type</option>
              {entityTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ErrorText id="entityType-error">{errors.entityType?.message}</ErrorText>
          </div>
        ) : null}

        {route === "media" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="deadline">Your deadline</Label>
            <input
              id="deadline"
              type="datetime-local"
              className={fieldClass}
              aria-invalid={!!errors.deadline}
              aria-describedby={errors.deadline ? "deadline-error" : undefined}
              {...register("deadline")}
            />
            <ErrorText id="deadline-error">{errors.deadline?.message}</ErrorText>
          </div>
        ) : null}

        {route === "investor" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticketSize">Ticket size</Label>
            <select
              id="ticketSize"
              className={cn(fieldClass, "cursor-pointer")}
              aria-invalid={!!errors.ticketSize}
              aria-describedby={errors.ticketSize ? "ticketSize-error" : undefined}
              {...register("ticketSize")}
            >
              <option value="">Select a ticket size</option>
              {ticketSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ErrorText id="ticketSize-error">{errors.ticketSize?.message}</ErrorText>
          </div>
        ) : null}
      </div>

      {/* Message · relabelled per route, replaced entirely for investors */}
      {route !== "investor" ? (
        <div
          className={cn(
            "mt-6 grid gap-6",
            route === "demo" && "lg:grid-cols-[1.4fr_1fr] lg:items-start",
          )}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">
              {route === "demo" ? "What would you like to see?" : "Message"}
            </Label>
            <textarea
              id="message"
              rows={6}
              maxLength={2000}
              required
              inputMode="text"
              autoComplete="off"
              className={cn(fieldClass, "min-h-[140px] resize-y")}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-count message-error" : "message-count"}
              {...register("message")}
            />
            <p
              id="message-count"
              className="text-right font-mono text-xs tabular-nums text-ink-muted"
            >
              {messageLength.toLocaleString("en-GB")} / 2,000 characters
            </p>
            <ErrorText id="message-error">{errors.message?.message}</ErrorText>
          </div>

          {route === "demo" ? (
            <fieldset className="rounded-[var(--radius-panel)] border border-rule bg-page p-5">
              <legend className="px-1 font-heading text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Or pick a slot
              </legend>
              <div className="mt-3 flex flex-col gap-2">
                {previewSlots.map((slot) => (
                  <label
                    key={slot}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-rule px-4 text-sm text-ink-muted transition-colors hover:border-teal-600 has-checked:border-teal-600 has-checked:bg-tint-teal"
                  >
                    <input
                      type="radio"
                      value={slot}
                      className="size-4 accent-teal-600"
                      {...register("slot")}
                    />
                    {slot}
                  </label>
                ))}
              </div>
              <p className="mt-4 text-[12px] max-lg:text-[15px] leading-snug max-lg:leading-[1.6] text-ink-muted">
                Example slots · illustrative
              </p>
              <div className="mt-3 flex items-center gap-3 rounded-[10px] border border-dashed border-rule p-4">
                <CalendarClock aria-hidden="true" className="size-4 shrink-0 text-teal-600" />
                <span className="text-[12px] max-lg:text-[15px] leading-snug max-lg:leading-[1.6] text-ink-muted">
                  Calendar embed slot — live availability appears here once the booking calendar is
                  connected.
                </span>
              </div>
            </fieldset>
          ) : null}
        </div>
      ) : null}

      {route === "partner" ? (
        <div className="mt-6 flex flex-col gap-2">
          <Label htmlFor="holdings">What do you hold or what do you need?</Label>
          <textarea
            id="holdings"
            rows={4}
            maxLength={2000}
            className={cn(fieldClass, "min-h-[110px] resize-y")}
            aria-invalid={!!errors.holdings}
            aria-describedby={errors.holdings ? "holdings-error" : undefined}
            {...register("holdings")}
          />
          <ErrorText id="holdings-error">{errors.holdings?.message}</ErrorText>
        </div>
      ) : null}

      {route === "investor" ? (
        <div className="mt-6 flex flex-col gap-2">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border border-rule bg-page p-4 text-sm leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-teal-600"
              aria-invalid={!!errors.acknowledgement}
              aria-describedby={errors.acknowledgement ? "acknowledgement-error" : undefined}
              {...register("acknowledgement")}
            />
            <span>{investorAcknowledgement}</span>
          </label>
          <ErrorText id="acknowledgement-error">{errors.acknowledgement?.message}</ErrorText>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            disabled={isSubmitting || !ready}
          >
            {/* WAVE 413: the same submit pattern as the registration flow, so
                the two forms on this site behave identically. The label
                already changed while the request was in flight; the spinner is
                what says the change is a WAIT rather than a new label, and the
                button is already disabled so a second press cannot send a
                second enquiry. No new copy.

                WAVE 413b: and it does not rotate under reduced motion. The
                dead control and the changed label carry "busy" without it. */}
            {isSubmitting ? (
              <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
            ) : null}
            {isSubmitting
              ? "Sending…"
              : route === "waitlist"
                ? "Register your interest"
                : "Send enquiry"}
          </Button>
        </div>
        <p className="font-heading text-sm font-semibold text-ink-muted">{config.reply}</p>
        {/*
         * THE NOTICE AT COLLECTION, beside the submit control.
         *
         * ⚠ IT STAYS NEXT TO THE BUTTON. Moving it to the footer, a tooltip or
         * a "find out more" would make it the layered-but-unreachable notice
         * the ICO's right-to-be-informed guidance is written against. It names
         * the controller, says what the details are used for, and links to the
         * Privacy Policy, which is the whole of what it has to do.
         *
         * 12px is the floor for this line and it is deliberate: it is the same
         * size the site already used, slate on the navy panel, and it must not
         * be shrunk further to fit a layout. (Wave 298, R298-3.)
         */}
        <p className="max-w-[70ch] text-[12px] max-lg:text-[15px] leading-snug max-lg:leading-[1.6] text-ink-muted">
          <span className="font-semibold text-ink-muted">{collectionNotice.controller}</span>{" "}
          {collectionNotice.purpose} {collectionNotice.contactLead}{" "}
          <a
            href={`mailto:${collectionNotice.contactAddress}`}
            className="font-semibold text-teal-600 underline underline-offset-4 transition-colors duration-200 hover:text-ink"
          >
            {collectionNotice.contactAddress}
          </a>
          . {collectionNotice.registration} ·{" "}
          <a
            href={collectionNotice.linkHref}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-teal-600 underline underline-offset-4 transition-colors duration-200 hover:text-ink max-lg:inline-flex max-lg:min-h-11 max-lg:items-center"
          >
            {collectionNotice.linkLabel}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
        {failed ? (
          <p role="alert" className="error-in text-[13px] font-medium text-destructive">
            {/* text-destructive, not orange (wave 295): on /contact the
                .section-light block turns this panel's background white, and
                the brand orange fails contrast there. The general address,
                read from content/site.ts rather than typed out again (wave
                298): this line is the one a person sees when the form has
                already failed them, so it is the worst possible place for a
                stale mailbox. */}
            That did not send. Please try again, or email {contactDetails.email} directly.
          </p>
        ) : null}
      </div>
    </form>
  );
}
