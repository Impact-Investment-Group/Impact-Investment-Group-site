import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, LifeBuoy } from "lucide-react";

import { BuddySlot } from "@/components/buddy/buddy-slot";
import { RoleIcon } from "@/components/register/role-icon";
import { RolePicker } from "@/components/register/role-picker";
import { RegistrationFlow, type RegistrationStage } from "@/components/register/registration-flow";
import { Button } from "@/components/ui/button";
import { PreReleaseBadge } from "@/components/ui/pre-release-badge";
import { Reveal } from "@/components/ui/reveal";
import { pickerContent } from "@/content/audiences";
import { getRegisterRole, residentUrgentNote } from "@/content/register";
import { crisisLines, crisisNote, whatsappCommunity } from "@/content/site";
import { isPlainClick } from "@/lib/plain-click";

/**
 * /register and /register/<role>: ONE page. WAVE 1363 (Callum, 16:55 UK
 * 17 Nov 2026): "it's just all in one page, and it's really easy to follow as
 * to not confuse people so that they think they've registered for the
 * platform as a certain role, and not actually registered for an account."
 *
 * In order, top to bottom: the page's one h1 and its lede, then who you are
 * (the tiles), then the account form for that role. Choosing a tile moves the
 * address to /register/<role>, which is this same page with that role chosen:
 * the tiles fold away to the existing role row ("All roles" and the chosen
 * role) and the form opens under it, with the keyboard and the screen on its
 * heading, or for the resident on the crisis card straight under the row.
 * Every role address keeps working and is prerendered as the form itself.
 *
 * Once the account is created the row loses its "All roles" control: the
 * account exists in that role, and choosing another here would start a second
 * registration that the platform answers without creating anything.
 *
 * No string on this page is new. Every one was already on /register or on
 * /register/<role>.
 */
/**
 * Where the screen and the keyboard go when the page arrives after a choice
 * made on it. Module scope because the move is a router navigation between the
 * two register routes, which mounts a new page: the choice is made on one
 * instance and honoured by the next. Set only by a plain click, read once.
 */
let arrival: "form" | "crisis" | "roles" | null = null;

const arrivalTarget = {
  form: "registration-heading",
  crisis: "register-crisis-heading",
  roles: "register-picker-grid",
} as const;

export function RegisterPage({ initialRoleId }: { initialRoleId?: string }) {
  const [stage, setStage] = React.useState<RegistrationStage>("account");
  const role = initialRoleId ? getRegisterRole(initialRoleId) : undefined;

  React.useEffect(() => {
    const target = arrival;
    arrival = null;
    if (!target) return;
    const node = document.getElementById(arrivalTarget[target]);
    if (!node) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth";
    node.focus({ preventScroll: true });
    /* WAVE 1363 (the second reading's major): THE RESIDENT LANDS ON THE CRISIS
       NUMBERS, never on the form below them. The role row is scrolled to the
       top of the screen and the card sits straight under it, so its heading
       and its numbers are what somebody in difficulty sees the moment they
       pick that tile. Every other role lands on the account form's heading. */
    const anchor =
      target === "crisis" ? (document.getElementById("register-role-row") ?? node) : node;
    anchor.scrollIntoView({ behavior, block: "start" });
  }, []);

  const choose = (id: string) => {
    arrival = id === "resident" ? "crisis" : "form";
  };

  return (
    <div className="registration-picker registration-directory">
      <section className="registration-directory__layout mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 lg:py-16">
        <div className="registration-directory__intro">
          <PreReleaseBadge className="mb-6 w-fit" />
          <p className="eyebrow text-teal-600">{pickerContent.eyebrow}</p>
          <h1 className="heading-tight mt-4 text-balance text-[clamp(2.125rem,4vw,3.5rem)] font-bold text-ink">
            {pickerContent.h1}
          </h1>
          <p className="measure mt-5 text-base leading-relaxed text-ink-muted">
            {pickerContent.lede}
          </p>
          <div className="registration-directory__characters">
            <BuddySlot form="property" action="wave" animated className="mx-auto w-52 max-w-full" />
          </div>
          {role ? null : (
            <p className="registration-directory__note mt-6 text-sm leading-relaxed text-ink-muted">
              {pickerContent.footnote}
            </p>
          )}
        </div>

        {/* The grid keeps the Reveal it has always had: /register is one of the
            two pages scripts/wave412-screenshots.py probes for one (wave 946). */}
        {role ? null : (
          <Reveal index={1}>
            <h2
              id="register-picker-grid"
              tabIndex={-1}
              className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              {pickerContent.gridLabel}
            </h2>
            <div className="mt-5">
              <RolePicker labelledBy="register-picker-grid" onSelect={choose} />
            </div>
          </Reveal>
        )}
      </section>

      {role ? (
        <section
          data-register-role={role.id}
          className="registration-page mx-auto w-full max-w-[1040px] px-5 pb-8 sm:px-8 lg:pb-12"
        >
          <div
            id="register-role-row"
            className="registration-context mx-auto mb-4 flex max-w-[820px] flex-wrap items-center justify-between gap-4"
          >
            {stage === "account" ? (
              <Link
                to="/register"
                resetScroll={false}
                onClick={(event) => {
                  if (isPlainClick(event)) arrival = "roles";
                }}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted underline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                All roles
              </Link>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              <RoleIcon roleId={role.id} />
              <p className="font-heading text-lg font-semibold text-ink">{role.label}</p>
            </div>
          </div>

          {role.id === "resident" ? (
            <div className="mx-auto mb-8 max-w-[820px]">
              {/* WHITE, not the teal tint. The numbers are set in teal-600,
                and teal-600 on the 12% teal tint is 4.46:1 over white and
                4.00:1 over the cream, both under the 4.5:1 floor that 15px
                text answers to; over this page's ground it measured 3.58:1.
                The surface moves, so the plate is white (teal-600 on it is
                5.25:1) and the teal-600 border still says what the card is.
                These are crisis telephone numbers; they are the last text on
                the site that may be hard to read. */}
              <aside className="rounded-[14px] border border-teal-600 bg-page p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <LifeBuoy aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-600" />
                  <div>
                    <h2
                      id="register-crisis-heading"
                      tabIndex={-1}
                      className="font-heading text-[19px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                    >
                      {residentUrgentNote.heading}
                    </h2>
                    <p className="measure mt-2 text-[15px] leading-relaxed text-ink-muted">
                      {residentUrgentNote.body}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                      {crisisLines.map((line) => (
                        <li key={line.label} className="text-[15px] text-ink">
                          <a
                            href={`tel:${line.detail.replace(/[^+\d]/g, "")}`}
                            className="inline-flex min-h-11 flex-wrap items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                          >
                            <span className="font-semibold">{line.label}</span>
                            <span className="font-mono text-teal-600 underline underline-offset-4">
                              {line.detail}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[14px] font-semibold text-ink">{crisisNote}</p>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}

          <RegistrationFlow key={role.id} role={role} onStageChange={setStage} />

          {/*
           * The WhatsApp community, BELOW the form and never above it, and ON
           * THE INVESTOR PAGE ONLY.
           *
           * The form's own button is the one thing this page exists to get, and
           * an invite offered before it is an invite to leave. Placed here it is
           * what someone reads once they have finished, so it is secondary in
           * position as well as in styling: teal outline, the site's own
           * secondary, never the orange.
           *
           * WAVE 415, CALLUM'S RULING OF 19 SEP 2026 ("WhatsApp: yes both"):
           * the role condition. Wave 411's brief named none, so the card drew
           * on all ten /register/<role> pages and put a sentence about sourced
           * deals and their figures in front of a resident looking for a home.
           * The community is an investor community and the copy says so, so the
           * page it belongs on is the investor one.
           *
           * WAVE 415, THE SAME RULING: the `aria-label` is gone. It set an
           * accessible name ("Join our investor WhatsApp community") that does
           * not contain the visible label ("Open WhatsApp"), which fails WCAG
           * 2.5.3 Label in Name at Level A against the site's stated 2.2 AA
           * standard: someone driving the page by voice says what they can see
           * and the control does not answer. The accessible name is now the
           * visible text.
           *
           * WAVE 415, THE LIGHT SITE. Wave 411 was built on origin/main at
           * 9adb0bb, which is BEFORE wave 412 turned the ground white, so the
           * card arrived as a navy plate (border-navy-700, bg-navy-800/50,
           * text-white, text-mist). On this page's cream it would have been a
           * second navy island inside <main>, which the gate fails at, and
           * white on navy-800 at 50% over cream is not a contrast pair at all.
           * The surface moves: it is now the site's own card on the cream,
           * `panel`, with ink and ink-muted type. No string changed.
           *
           * The QR is hidden below `sm` on purpose. It is not a decoration that
           * happens to be large: it is a code to be scanned with a second
           * device, and nobody scans the screen they are holding. On a phone the
           * button alone does the whole job, and the image would be 160px of
           * nothing.
           */}
          {role.id === "investor" ? (
            <aside className="panel mx-auto mt-10 w-full max-w-[820px] p-5 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-[19px] font-semibold text-ink">
                    Prefer WhatsApp?
                  </h2>
                  <p className="measure mt-2 text-[15px] leading-relaxed text-ink-muted">
                    Join our investor community for one sourced deal a day and the figures behind
                    it.
                  </p>
                  <Button asChild variant="secondary" className="mt-5">
                    <a href={whatsappCommunity.url} target="_blank" rel="noopener">
                      Open WhatsApp
                    </a>
                  </Button>
                </div>

                <img
                  src="/images/whatsapp-community-qr.svg"
                  width="160"
                  height="160"
                  alt="QR code for the Impact Investment Group WhatsApp community"
                  className="hidden shrink-0 rounded-[10px] sm:block"
                />
              </div>
            </aside>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
