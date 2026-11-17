import { describe, expect, test } from "bun:test";

import { buildEnquiryPayload, schemaFor } from "../src/components/contact/enquiry-schema";
import { enquiryRouteIds, enquiryRoutes } from "../src/content/contact";
import { contactRoutes } from "../src/content/site";

/**
 * Wave 1363. Register your interest registers an account on /register; the
 * contact form is for enquiries only, and Talk to the team, now its default,
 * sends without a preview slot.
 */
const demo = {
  name: "Browser example",
  email: "example@example.com",
  organisation: "Example organisation",
  role: "Other",
  message: "A local example message, never delivered.",
};

describe("wave 1363 enquiry form", () => {
  test("Talk to the team accepts an unchosen slot, which react-hook-form reads as null", () => {
    const parsed = schemaFor("demo").safeParse({ ...demo, slot: null });
    expect(parsed.success).toBe(true);
  });

  test("the payload leaves out a slot nobody chose and keeps one that was chosen", () => {
    const none = buildEnquiryPayload({ ...demo, slot: null }, "demo", "Platform team");
    expect("slot" in none).toBe(false);
    expect(none).toMatchObject({ ...demo, route: "demo", routedTo: "Platform team" });
    const chosen = buildEnquiryPayload({ ...demo, slot: "Friday · 09:30" }, "demo", "Platform team");
    expect(chosen.slot).toBe("Friday · 09:30");
  });

  test("the contact form offers no waitlist enquiry", () => {
    expect((enquiryRouteIds as readonly string[]).includes("waitlist")).toBe(false);
    expect(enquiryRoutes.some((route) => route.label === "Register your interest")).toBe(false);
  });

  test("the footer's Register your interest opens /register, not an enquiry", () => {
    const item = contactRoutes.find((route) => route.label === "Register your interest");
    expect(item).toBeDefined();
    expect(item && "to" in item ? item.to : undefined).toBe("/register");
    expect(item && "enquiry" in item).toBe(false);
  });
});
