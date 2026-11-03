import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ContactLayout } from "@/components/contact/contact-layout";
import { enquiryRouteIds, type EnquiryRouteId } from "@/content/contact";
import { contactDetails } from "@/content/site";

const searchSchema = z.object({
  enquiry: z.string().optional().catch(undefined),
  type: z.string().optional().catch(undefined),
  role: z.string().optional().catch(undefined),
});

function toRouteId(value: string | undefined): EnquiryRouteId {
  return enquiryRouteIds.includes(value as EnquiryRouteId) ? (value as EnquiryRouteId) : "waitlist";
}

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  validateSearch: (search) => searchSchema.parse(search),
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
  const selected = toRouteId(hydrated ? (type ?? enquiry) : undefined);

  const select = (id: EnquiryRouteId) => {
    void navigate({
      search: { ...{ enquiry: id, type: id }, ...(role ? { role } : {}) },
      resetScroll: false,
    });
  };

  return <ContactLayout selected={selected} role={hydrated ? role : undefined} onSelect={select} />;
}
