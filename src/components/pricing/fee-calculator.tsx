import { useEffect, useState } from "react";
import { ArrowRight, Calculator, RotateCcw } from "lucide-react";
import { formatFee, leaseEstimate, sourcingEstimate, SOURCING_MINIMUM_PENCE, STANDARD_LEASE_RATE_BASIS_POINTS } from "@/lib/service-fees";

type Props = {
  taxLabel: string;
};

export function FeeCalculator({ taxLabel }: Props) {
  const [ready, setReady] = useState(false);
  const [service, setService] = useState<"sourcing" | "lease">("sourcing");
  const [sourceBedrooms, setSourceBedrooms] = useState("3");
  const [leaseBedrooms, setLeaseBedrooms] = useState("10");
  const [weeklyRent, setWeeklyRent] = useState("110.46");
  const [years, setYears] = useState("5");
  useEffect(() => setReady(true), []);
  const source = sourcingEstimate(sourceBedrooms);
  const lease = leaseEstimate(weeklyRent, leaseBedrooms, years);
  const estimate = service === "sourcing" ? source : lease;
  const leaseRate = STANDARD_LEASE_RATE_BASIS_POINTS / 100;

  function loadExample() {
    setService("lease");
    setLeaseBedrooms("10");
    setWeeklyRent("110.46");
    setYears("5");
    document.getElementById("fee-calculator-heading")?.focus({ preventScroll: true });
    document.getElementById("fee-calculator")?.scrollIntoView({ behavior: "instant", block: "start" });
  }

  return (
    <section className="pricing-calculation" id="fee-calculator" aria-labelledby="fee-calculator-heading">
      <div className="pricing-section-heading">
        <div>
          <p className="pricing-eyebrow">See the calculation</p>
          <h2 id="fee-calculator-heading" tabIndex={-1}>What would your service cost?</h2>
        </div>
        <p>Estimate each service separately. Your final quote reflects the property and agreed scope.</p>
      </div>
      <div className="pricing-calculator">
        <div className="pricing-calculator__inputs">
          <div className="pricing-calculator__switch" role="group" aria-label="Service to estimate">
            <button type="button" disabled={!ready} aria-pressed={service === "sourcing"} onClick={() => setService("sourcing")}>Sourcing</button>
            <button type="button" disabled={!ready} aria-pressed={service === "lease"} onClick={() => setService("lease")}>Lease facilitation</button>
          </div>
          <fieldset disabled={!ready}>
            <legend className="sr-only">{service === "sourcing" ? "Sourcing details" : "Lease details"}</legend>
            {service === "sourcing" ? (
              <div className="pricing-field">
                <label htmlFor="sourcing-bedrooms">Bedrooms in one property</label>
                <input id="sourcing-bedrooms" type="number" min="1" step="1" inputMode="numeric" value={sourceBedrooms} onChange={(event) => setSourceBedrooms(event.target.value)} aria-describedby="sourcing-basis" />
                <p id="sourcing-basis">Based on £5,000 for a 3-bedroom house.</p>
              </div>
            ) : (
              <>
                <div className="pricing-field">
                  <label htmlFor="lease-weekly-rent">Weekly rent per bedroom (£)</label>
                  <input id="lease-weekly-rent" type="number" min="0.01" step="0.01" inputMode="decimal" value={weeklyRent} onChange={(event) => setWeeklyRent(event.target.value)} />
                </div>
                <div className="pricing-field-pair">
                  <div className="pricing-field">
                    <label htmlFor="lease-bedrooms">Number of bedrooms</label>
                    <input id="lease-bedrooms" type="number" min="1" step="1" inputMode="numeric" value={leaseBedrooms} onChange={(event) => setLeaseBedrooms(event.target.value)} />
                  </div>
                  <div className="pricing-field">
                    <label htmlFor="lease-years">Lease length (years)</label>
                    <input id="lease-years" type="number" min="5" step="1" inputMode="numeric" value={years} onChange={(event) => setYears(event.target.value)} />
                  </div>
                </div>
              </>
            )}
          </fieldset>
          <div className="pricing-calculator__formula">
            <Calculator size={19} aria-hidden="true" />
            <div>
              <p>{service === "sourcing" ? "£5,000 ÷ 3 × bedrooms" : `Weekly rent × bedrooms × 52 × years × ${leaseRate}%`}</p>
              <span>{service === "sourcing"
                ? `${formatFee(SOURCING_MINIMUM_PENCE)} minimum per property. The final amount is rounded to the nearest penny.`
                : "£5,000 minimum lease facilitation fee. Rent is calculated using 52 weeks per year."}</span>
            </div>
          </div>
          <noscript><p>Enable JavaScript to change the estimate. The service charges, formulas and worked example remain available below.</p></noscript>
        </div>
        <div className="pricing-receipt" data-fee-receipt aria-live="polite" aria-atomic="true">
          <p className="pricing-eyebrow">Your estimate</p>
          <h3>{service === "sourcing" ? "Sourcing fee" : "Lease facilitation fee"}</h3>
          {estimate ? (
            <>
              <p className="pricing-receipt__amount" data-estimated-fee>{formatFee(estimate.feePence)}</p>
              <p className="pricing-receipt__tax">{taxLabel}</p>
              <dl>
                {service === "lease" && lease ? (
                  <>
                    <div><dt>Total weekly rent</dt><dd data-rent-weekly>{formatFee(lease.weeklyPence)}</dd></div>
                    <div><dt>Annual rent</dt><dd data-rent-annual>{formatFee(lease.annualPence)}</dd></div>
                    <div><dt>Rent over the lease</dt><dd data-rent-total>{formatFee(lease.leasePence)}</dd></div>
                    <div><dt>Fee at {leaseRate}%</dt><dd>{formatFee(lease.calculatedPence)}</dd></div>
                  </>
                ) : source && <div><dt>Bedroom calculation</dt><dd>{formatFee(source.calculatedPence)}</dd></div>}
              </dl>
              {estimate.minimumApplied && <p className="pricing-receipt__minimum" data-minimum-applied>The minimum service charge applies.</p>}
              <p className="pricing-receipt__note">This estimate covers the selected service. Gold and Platinum are quoted for the combined scope.</p>
            </>
          ) : (
            <p className="pricing-receipt__invalid" role="status" data-fee-validation>
              {service === "sourcing" ? "Enter a positive whole number of bedrooms to see an estimate." : "Enter positive rent with up to two decimal places, a whole number of bedrooms and a lease of at least 5 whole years."}
            </p>
          )}
        </div>
      </div>
      <div className="pricing-worked-example" data-worked-example>
        <div className="pricing-worked-example__heading">
          <div>
            <p className="pricing-eyebrow">Illustrative example</p>
            <h3>10 one-bedroom flats in Blackpool</h3>
            <p>£110.46 per bedroom per week, over a five-year lease.</p>
          </div>
          <button type="button" className="pricing-example-button" disabled={!ready} onClick={loadExample}><RotateCcw size={17} aria-hidden="true" />Use this example</button>
        </div>
        <ol>
          {[
            ["Weekly rent", "£110.46 × 10", "£1,104.60"],
            ["Annual rent", "£1,104.60 × 52", "£57,439.20"],
            ["Five-year rent", "£57,439.20 × 5", "£287,196.00"],
            ["Lease facilitation", "£287,196.00 × 5%", "£14,359.80"],
          ].map(([label, formula, total], index) => (
            <li key={label}>
              <div><span>{label}</span>{index < 3 && <ArrowRight size={17} aria-hidden="true" />}</div>
              <p>{formula}</p><strong>{total}</strong>
            </li>
          ))}
        </ol>
        <p className="pricing-worked-example__tax">Service fee: {taxLabel}.</p>
      </div>
    </section>
  );
}
