import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, KeyRound, Layers3, Wrench } from "lucide-react";
import { pricing } from "@/content/pricing";

const icons = { silver: KeyRound, gold: Layers3, platinum: Wrench };

export function ServicePackages() {
  return (
    <section className="pricing-packages" aria-labelledby="pricing-packages-heading">
      <div className="pricing-section-heading">
        <div>
          <p className="pricing-eyebrow">Three ways to work together</p>
          <h2 id="pricing-packages-heading">Choose your level of support.</h2>
        </div>
        <p>Each package starts here. Your property determines the final service charge.</p>
      </div>
      <div className="pricing-packages__grid">
        {pricing.packages.map((plan) => {
          const Icon = icons[plan.id];
          const ServiceIcon = plan.id === "silver" ? ArrowUpRight : Check;
          return (
            <article className="pricing-package" data-package={plan.id} key={plan.id} aria-labelledby={`package-${plan.id}`}>
              <div className="pricing-package__top">
                <h3 id={`package-${plan.id}`}>{plan.name}</h3>
                <Icon size={25} strokeWidth={1.6} aria-hidden="true" />
              </div>
              <p className="pricing-package__description">{plan.description}</p>
              <p className="pricing-package__price"><span>From</span> <strong>{plan.startingPrice}</strong></p>
              <p className="pricing-package__basis">{plan.priceBasis}{pricing.taxLabel && <> · {pricing.taxLabel}</>}</p>
              <ul>
                {plan.services.map((service) => <li key={service}><ServiceIcon size={17} aria-hidden="true" /><span>{service}</span></li>)}
              </ul>
              <p className="pricing-package__detail">{plan.detail}</p>
              <Link to="/contact" search={{ enquiry: "investor" }} className="pricing-package__action">
                {plan.action}<ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
