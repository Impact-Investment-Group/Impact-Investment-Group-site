import {
  CalendarDays,
  Check,
  Clock,
  HandCoins,
  Handshake,
  LifeBuoy,
  Mail,
  Megaphone,
  Phone,
  Plus,
  UsersRound,
} from "lucide-react";
import { EnquiryForm } from "@/components/contact/enquiry-form";
import { BuddySlot } from "@/components/buddy/buddy-slot";
import { contactHero, enquiryRoutes, type EnquiryRouteId } from "@/content/contact";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { faqEyebrow, faqHeading } from "@/content/faq";
import { publishedFaq as faq } from "@/content/published-faq";
import { contactDetails, crisisLines, crisisNote } from "@/content/site";
import "./contact-experience.css";

const telHref = (value: string) => `tel:${value.replace(/[^+\d]/g, "")}`;
const enquiryIcons = {
  demo: CalendarDays,
  waitlist: UsersRound,
  partner: Handshake,
  investor: HandCoins,
  media: Megaphone,
  support: LifeBuoy,
};

export function ContactLayout({
  selected,
  role,
  onSelect,
}: {
  selected: EnquiryRouteId;
  role?: string;
  onSelect: (id: EnquiryRouteId) => void;
}) {
  const current = enquiryRoutes.find((route) => route.id === selected)!;

  return (
    <div className="contact-page contact-edition">
      <section aria-labelledby="contact-heading" className="contact-intro">
        <div className="contact-container contact-intro__inner">
          <div>
            <p className="eyebrow text-orange-700">{contactHero.eyebrow}</p>
            <h1
              id="contact-heading"
              className="mt-3 max-w-[16ch] font-heading text-[clamp(2.5rem,5vw,4.25rem)] font-bold leading-[1.05] text-ink"
            >
              {contactHero.title}
            </h1>
          </div>
          <div className="contact-intro__characters">
            <BuddySlot
              form={selected === "investor" ? "investment" : selected === "support" ? "support" : "property"}
              action={selected === "support" ? "reassure" : "wave"}
              animated
              className="mx-auto w-40 lg:w-48"
            />
          </div>
        </div>
      </section>

      <div className="contact-container contact-workspace">
        <aside className="contact-support" aria-label="Contact details">
          <ul className="contact-direct">
            <li>
              <a href={`mailto:${contactDetails.email}`}>
                <Mail aria-hidden="true" />
                {contactDetails.email}
              </a>
            </li>
            <li>
              <a href={telHref(contactDetails.phone)}>
                <Phone aria-hidden="true" />
                {contactDetails.phone}
              </a>
            </li>
            <li>
              <span>
                <Clock aria-hidden="true" />
                {contactDetails.hours}
              </span>
            </li>
          </ul>
          <section
            aria-labelledby="crisis-heading"
            data-accent="teal"
            className="section-dark contact-crisis"
          >
            <h2
              id="crisis-heading"
              className="flex items-center gap-2 text-sm font-semibold text-white"
            >
              <LifeBuoy aria-hidden="true" className="size-4 text-orange-500" />
              In a crisis
            </h2>
            <ul className="mt-3">
              {crisisLines.map((line) => (
                <li key={line.label}>
                  <a
                    href={telHref(line.detail)}
                    className="flex min-h-11 items-center justify-between gap-3 text-sm text-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                  >
                    {line.label}
                    <span className="font-semibold text-white">{line.detail}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-semibold text-white">{crisisNote}</p>
          </section>
        </aside>

        <section id="contact-enquiry" aria-labelledby="enquiry-heading" className="min-w-0">
          <div className="contact-route-picker">
            <h2 id="enquiry-heading" className="font-heading text-2xl font-bold text-ink">
              <label htmlFor="enquiry-route">What do you need?</label>
            </h2>
            <fieldset className="contact-route-cards" aria-labelledby="enquiry-heading">
              {enquiryRoutes.map((route) => {
                const Icon = enquiryIcons[route.id];
                return (
                  <label
                    key={route.id}
                    className="contact-route-card"
                    data-selected={selected === route.id}
                  >
                    <input
                      type="radio"
                      name="enquiry-choice"
                      value={route.id}
                      checked={selected === route.id}
                      onChange={() => onSelect(route.id)}
                      aria-controls="contact-enquiry-form"
                    />
                    <span className="contact-route-card__icon" aria-hidden="true">
                      <Icon size={23} strokeWidth={1.7} />
                    </span>
                    <span>{route.label}</span>
                    <Check className="contact-route-card__check" aria-hidden="true" size={16} />
                  </label>
                );
              })}
            </fieldset>
            <select
              id="enquiry-route"
              value={selected}
              onChange={(event) => onSelect(event.target.value as EnquiryRouteId)}
              aria-controls="contact-enquiry-form"
              aria-describedby="enquiry-route-detail"
              className="contact-route-select mt-4 min-h-12 w-full cursor-pointer rounded-lg border border-rule bg-page px-4 py-3 text-base font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              {enquiryRoutes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.label}
                </option>
              ))}
            </select>
            <p
              id="enquiry-route-detail"
              className="mt-3 text-sm leading-relaxed text-ink-muted"
              aria-live="polite"
            >
              {current.subline}
            </p>
          </div>
          <div id="contact-enquiry-form">
            <EnquiryForm route={selected} prefilledRole={role} />
          </div>
        </section>
      </div>

      <section aria-labelledby="faq-heading" className="contact-faq">
        <div className="contact-container contact-faq__inner">
          <div>
            <p className="eyebrow text-teal-600">{faqEyebrow}</p>
            <h2
              id="faq-heading"
              className="mt-3 max-w-[20ch] font-heading text-3xl font-bold leading-tight text-ink"
            >
              {faqHeading}
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary"><Link to="/faqs" hash="ask-a-question">Ask a new question</Link></Button>
              <Button asChild variant="ghost"><Link to="/faqs">Explore all FAQs</Link></Button>
            </div>
          </div>
          <div className="contact-faq__rows">
            {faq.map((item) => (
              <details key={item.id} className="group border-b border-rule">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-semibold leading-relaxed text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus
                    aria-hidden="true"
                    className="size-5 shrink-0 text-teal-600 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  />
                </summary>
                <div className="space-y-3 pb-6 pr-8">
                  {item.a.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
