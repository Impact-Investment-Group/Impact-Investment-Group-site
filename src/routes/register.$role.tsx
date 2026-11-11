import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, LifeBuoy } from "lucide-react";

import { RoleIcon } from "@/components/register/role-icon";
import { RegistrationFlow } from "@/components/register/registration-flow";
import { Button } from "@/components/ui/button";
import { residentUrgentNote } from "@/content/register";
import { crisisLines, crisisNote, whatsappCommunity } from "@/content/site";

/**
 * /register/<role>: one page per role, asking that role its own questions.
 *
 * The flow owns the single h1 and shows account details before preferences.
 *
 * The resident page carries the crisis numbers above the questions. They are
 * in the footer of every page already, and they are here as well for the same
 * reason contact.tsx repeats them: this is a page somebody in difficulty can
 * land on, and a number they have to go looking for is a number they may not
 * find. That repetition is correct.
 */
export const Route = createFileRoute("/register/$role")({
  // The ten ids are a closed set. Anything else is a 404 rather than an empty
  // page, so a mistyped or retired link fails loudly instead of quietly.
  loader: async ({ params }) => {
    const { getRegisterRole } = await import("@/content/register");
    const role = getRegisterRole(params.role);
    if (!role) throw notFound();
    return { role };
  },
  component: RegisterRolePage,
  head: ({ loaderData }) => {
    const role = loaderData?.role;
    if (!role) return {};
    // A pipe, not an em dash. The rest of the site's titles use an em
    // dash and these two deliberately do not: this wave authors none.
    const title = `${role.h1} | Impact Investment Group`;
    const path = `/register/${role.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: role.metaDescription },
        { property: "og:title", content: title },
        { property: "og:description", content: role.metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: path },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: path }],
    };
  },
});

function RegisterRolePage() {
  const { role } = Route.useLoaderData();

  return (
    <div className="registration-page">
      <section className="mx-auto w-full max-w-[1040px] px-5 py-8 sm:px-8 lg:py-12">
        <div className="registration-context mx-auto mb-4 flex max-w-[820px] flex-wrap items-center justify-between gap-4">
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted underline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            All roles
          </Link>

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
                  <h2 className="font-heading text-[19px] font-semibold text-ink">
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

        <RegistrationFlow key={role.id} role={role} />

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
                  Join our investor community for one sourced deal a day and the figures behind it.
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
    </div>
  );
}
