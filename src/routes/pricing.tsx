import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, ChevronDown, CheckCircle2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { pricing } from "@/content/pricing";
import { ServicePackages } from "@/components/pricing/service-packages";
import { FeeCalculator } from "@/components/pricing/fee-calculator";
import "@/components/pricing/pricing.css";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing | Impact Investment Group" },
      {
        name: "description",
        content:
          "Transparent property service charges: Silver from £5,000 per service, Gold from £10,000 and Platinum from £12,500. VAT not applicable. Explore the fees and estimate your service costs.",
      },
    ],
    links: [{ rel: "canonical", href: "https://impactinvestmentgroup.co.uk/pricing" }],
  }),
});

function PricingPage() {
  return (
    <div className="pricing-page" data-pricing-page>
      <section className="pricing-intro" aria-labelledby="pricing-heading">
        <header className="pricing-intro__copy">
          <p className="pricing-eyebrow">{pricing.eyebrow}</p>
          <h1 id="pricing-heading">
            {pricing.heading}<br />
            <span>{pricing.headingAccent}</span>
          </h1>
          <p className="pricing-status" data-pricing-status>
            <span aria-hidden="true" />
            {pricing.status}
          </p>
          <p className="pricing-intro__description">{pricing.introduction}</p>
          <p className="pricing-intro__commitment">{pricing.commitment}</p>
          <p className="pricing-intro__tax">Value Added Tax (VAT) is not applicable.</p>
          <div className="pricing-intro__actions">
            <Button asChild variant="primary" size="lg">
              <Link to="/contact" search={{ enquiry: "investor" }}>{pricing.contactAction}</Link>
            </Button>
            <a href="#fee-calculator" className="pricing-estimate-link">Estimate your fees <ArrowUpRight size={18} aria-hidden="true" /></a>
          </div>
        </header>
      </section>
      <ServicePackages />
      <FeeCalculator taxLabel={pricing.taxLabel} />
      <section className="pricing-clarity" aria-labelledby="pricing-promise-heading">
        <div className="pricing-clarity__copy">
          <p className="pricing-eyebrow">Clear before you commit</p>
          <h2>Know what you’re paying for.</h2>
          <p>Start with the service you need, see how its fee is calculated, then agree the details with our team.</p>
          <p className="pricing-tax-note"><CheckCircle2 size={18} aria-hidden="true" />{pricing.taxLabel}</p>
        </div>
        <div className="pricing-paper" aria-labelledby="pricing-promise-heading">
          <div className="pricing-paper__heading">
            <div className="pricing-paper__mark" aria-hidden="true">
              <BookOpen size={32} strokeWidth={1.5} />
            </div>
            <div>
              <p className="pricing-eyebrow">{pricing.panelEyebrow}</p>
              <h3 id="pricing-promise-heading">{pricing.panelHeading}</h3>
            </div>
            <ArrowUpRight className="pricing-paper__arrow" size={26} aria-hidden="true" />
          </div>
          <p className="pricing-paper__introduction">{pricing.panelIntroduction}</p>
          <div className="pricing-disclosures" data-pricing-disclosures>
            {pricing.points.map((point, index) => (
              <details key={point.id} open={index === 0} data-pricing-point={point.id}>
                <summary
                  onClick={(event) => {
                    // Only an explicit interaction animates a disclosure.
                    // The initially open explanation stays visible at hydration.
                    const details = event.currentTarget.parentElement;
                    if (details) details.dataset.interacted = "true";
                  }}
                >
                  <span className="pricing-disclosures__number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{point.label}</span>
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <div className="pricing-disclosures__content">
                  <h4>{point.title}</h4>
                  <p>{point.body}</p>
                </div>
              </details>
            ))}
          </div>
          <div className="pricing-paper__footer">
            <CheckCircle2 size={17} aria-hidden="true" />
            <span>Clear scope. Agreed service charges.</span>
          </div>
        </div>
      </section>

      <section className="pricing-next" aria-labelledby="pricing-next-heading">
        <Reveal className="pricing-next__inner">
          <div className="pricing-next__mark" aria-hidden="true">
            <Handshake size={46} strokeWidth={1.4} />
          </div>
          <div className="pricing-next__copy">
            <p className="pricing-eyebrow">{pricing.nextEyebrow}</p>
            <h2 id="pricing-next-heading">{pricing.nextHeading}</h2>
            <p>{pricing.nextBody}</p>
          </div>
          <Button asChild variant="secondary" withArrow>
            <Link to="/platform">{pricing.nextAction}</Link>
          </Button>
        </Reveal>
      </section>
    </div>
  );
}
