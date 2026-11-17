import { z } from "zod";

import type { EnquiryRouteId } from "@/content/contact";

/**
 * The enquiry form's validation and the payload it posts, kept out of the
 * component so a test can hold both without a browser.
 *
 * WAVE 1363: `slot` is `nullish`, not `optional`. The preview slots are radio
 * inputs, and react-hook-form reads a radio group with nothing chosen as
 * `null`. `optional` accepts `undefined` and refuses `null`, so "Talk to the
 * team" could not be sent at all unless a slot was picked: the resolver
 * refused it, no request left the browser, and the only message the visitor
 * got was zod's own wording at the top of the form. The slots are labelled
 * "Or pick a slot", so not picking one is a valid answer. The payload then
 * omits the key rather than sending `null`.
 */

const base = {
  name: z.string().trim().min(2, "Please give your full name").max(100),
  email: z.string().trim().email("Use a valid work email address").max(255),
  organisation: z.string().trim().min(2, "Please name your organisation").max(150),
  role: z.string().trim().min(1, "Please select your role"),
};

export function schemaFor(route: EnquiryRouteId) {
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
      return z.object({ ...base, message, slot: z.string().nullish() });
    default:
      return z.object({ ...base, message });
  }
}

export type FormValues = {
  name: string;
  email: string;
  organisation: string;
  role: string;
  message?: string;
  slot?: string | null;
  ticketSize?: string;
  acknowledgement?: boolean;
  holdings?: string;
  entityType?: string;
  deadline?: string;
};

/** What `POST /public/enquiry` receives. A slot nobody chose is left out. */
export function buildEnquiryPayload(values: FormValues, route: EnquiryRouteId, routedTo: string) {
  const { slot, ...rest } = values;
  return { ...rest, ...(slot ? { slot } : {}), route, routedTo };
}
