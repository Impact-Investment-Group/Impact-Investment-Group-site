import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ContactLayout } from "@/components/contact/contact-layout";
import { enquiryRouteIds, type EnquiryRouteId } from "@/content/contact";
import { contactDetails } from "@/content/site";

type ContactSearch = { enquiry?: string; type?: string; role?: string };

// Route search is eager on every page. Accept only these optional strings;
// the form and API retain their separate submission validation.
function validateContactSearch(search: Record<string, unknown>): ContactSearch {
  const clean: ContactSearch = {};
  for (const key of ["enquiry", "type", "role"] as const) {
    const value = search[key];
    // Router validation merges into raw search, so invalid values need clearing.
    clean[key] = typeof value === "string" ? value : undefined;
  }
  return clean;
}

// WAVE 1363: the default is "Talk to the team". It used to be the waitlist
// route, so a plain Contact Us link opened a form headed "Register your
// interest" that registered nothing.
function toRouteId(value: string | undefined): EnquiryRouteId {
  return enquiryRouteIds.includes(value as EnquiryRouteId) ? (value as EnquiryRouteId) : "demo";
}

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  validateSearch: validateContactSearch,
  head: () => ({
    meta: [
      { title: "Contact — Impact Investment Group" },
      {
        name: "description",
        // Interpolated, not typed out. This description carried its own copy of
        // the general address and went stale the day the mailbox changed.
        content: `Tell us what you need and a person replies within one working day. Email ${contactDetails.email} or call ${contactDetails.phone}.`,
      },
      { property: "og:title", content: "Contact — Impact Investment Group" },
      {
        property: "og:description",
        content: "Choose the right enquiry route and speak directly with the team.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function ContactPage() {
  const { enquiry, type, role } = Route.useSearch();
  const navigate = useNavigate({ from: "/contact" });
  // Pages serves one canonical HTML file for every enquiry query. Hydrate
  // that same form first, then apply the visitor's deep-linked selection.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  // WAVE 1363: a link still carrying the retired waitlist enquiry goes to the
  // one place an interest is registered, /register.
  const retiredWaitlist = enquiry === "waitlist" || type === "waitlist";
  useEffect(() => {
    if (retiredWaitlist) void navigate({ to: "/register", replace: true });
  }, [retiredWaitlist, navigate]);
  const selected = toRouteId(hydrated ? (type ?? enquiry) : undefined);

  const select = (id: EnquiryRouteId) => {
    void navigate({
      search: { ...{ enquiry: id, type: id }, ...(role ? { role } : {}) },
      resetScroll: false,
    });
  };

  return <ContactLayout selected={selected} role={hydrated ? role : undefined} onSelect={select} />;
}
