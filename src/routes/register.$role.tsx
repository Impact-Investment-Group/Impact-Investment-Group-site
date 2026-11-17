import { createFileRoute, notFound } from "@tanstack/react-router";

import { RegisterPage } from "@/components/register/register-page";

/**
 * /register/<role>: the one register page with that role already chosen
 * (wave 1363), so every role address keeps working and opens on the account
 * form. The page, the resident's crisis numbers above the questions and the
 * investor's WhatsApp card live in components/register/register-page.tsx.
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
  return <RegisterPage key={role.id} initialRoleId={role.id} />;
}
