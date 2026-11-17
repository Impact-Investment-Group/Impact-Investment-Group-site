import { createFileRoute } from "@tanstack/react-router";

import { RegisterPage } from "@/components/register/register-page";
import { pickerContent } from "@/content/audiences";

/**
 * /register: the one register page with no role chosen yet (wave 1363). The
 * page itself is components/register/register-page.tsx; the notes below are
 * the picker's, and still hold for its tiles.
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
  return <RegisterPage />;
}
