import { createFileRoute } from "@tanstack/react-router";

import { RolePicker } from "@/components/register/role-picker";
import { PreReleaseBadge } from "@/components/ui/pre-release-badge";
import { Reveal } from "@/components/ui/reveal";
import { pickerContent } from "@/content/register";

/**
 * /register, the picker.
 *
 * R295-3: the heading, one line of lede, and the ten tiles. Nothing else is on
 * this page and nothing else should be added to it. A chooser earns its keep
 * by being unambiguous, and every extra thing on it is another reason to stop
 * and think rather than click.
 *
 * There is no orange action here on purpose. The ten tiles ARE the action, and
 * a primary button beside them would be an eleventh choice competing with the
 * ten. The site's one-orange-action rule is satisfied by the header button,
 * which is chrome and sits outside the count.
 */
export const Route = createFileRoute("/register/")({
  component: RegisterPickerPage,
  head: () => ({
    meta: [
      { title: "Register to join the waitlist | Impact Investment Group" },
      { name: "description", content: pickerContent.lede },
      {
        property: "og:title",
        content: "Register to join the waitlist | Impact Investment Group",
      },
      { property: "og:description", content: pickerContent.lede },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/register" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/register" }],
  }),
});

function RegisterPickerPage() {
  return (
    <div className="registration-picker">
      <section className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <PreReleaseBadge className="mx-auto mb-6 w-fit" />
          <p className="eyebrow text-teal-600">{pickerContent.eyebrow}</p>
          <h1 className="heading-tight mt-4 text-balance text-[clamp(2.125rem,4vw,3.5rem)] font-bold text-ink">
            {pickerContent.h1}
          </h1>
          <p className="measure mx-auto mt-5 text-[17px] leading-relaxed text-ink-muted">
            {pickerContent.lede}
          </p>
        </Reveal>

        <Reveal index={1} className="mt-10 border-t border-rule pt-8">
          <h2
            id="register-picker-grid"
            className="text-center font-heading text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted"
          >
            {pickerContent.gridLabel}
          </h2>
          <div className="mt-5">
            <RolePicker labelledBy="register-picker-grid" />
          </div>
        </Reveal>

        <Reveal index={2} className="mt-10">
          <p className="measure mx-auto text-center text-[14px] max-lg:text-[15px] leading-relaxed text-ink-muted">
            {pickerContent.footnote}
          </p>
        </Reveal>
      </section>
    </div>
  );
}
