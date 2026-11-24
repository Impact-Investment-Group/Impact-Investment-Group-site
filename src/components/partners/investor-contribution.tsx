import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { englandTemporaryHouseholdsMarch2026 } from "@/content/problem";
import "@/routes/impact-evidence.css";

const count = new Intl.NumberFormat("en-GB");
const share = new Intl.NumberFormat("en-GB", { style: "percent", maximumSignificantDigits: 2 });
const pounds = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function wholeNumber(raw: string, min: number, max: number) {
  const value = Number(raw);
  return /^\d+$/.test(raw) && Number.isSafeInteger(value) && value >= min && value <= max
    ? value
    : null;
}

interface ScenarioFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  description?: string;
}

function ScenarioField({ id, label, value, onChange, min, max, description }: ScenarioFieldProps) {
  const invalid = value !== "" && wholeNumber(value, min, max) === null;
  return (
    <div className="impact-input">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid || description ? id + "-note" : undefined}
      />
      {(invalid || description) && (
        <p id={id + "-note"} className={invalid ? "impact-input-error" : undefined}>
          {invalid
            ? `Enter a whole number from ${count.format(min)} to ${count.format(max)}.`
            : description}
        </p>
      )}
    </div>
  );
}

export function InvestorContribution() {
  const [investors, setInvestors] = useState("1");
  const [perInvestor, setPerInvestor] = useState("1");
  const [perHome, setPerHome] = useState("");
  const [rent, setRent] = useState("");
  const [expenses, setExpenses] = useState("");

  const participants = wholeNumber(investors, 1, 1_000);
  const homesEach = wholeNumber(perInvestor, 1, 100);
  const upfrontCost = wholeNumber(perHome, 1, 100_000_000);
  const annualRent = wholeNumber(rent, 0, 10_000_000);
  const annualExpenses = wholeNumber(expenses, 0, 10_000_000);
  const homes = participants !== null && homesEach !== null ? participants * homesEach : null;
  const capital = homes !== null && upfrontCost !== null ? homes * upfrontCost : null;
  const cashFlow =
    annualRent !== null && annualExpenses !== null ? annualRent - annualExpenses : null;

  return (
    <section id="your-impact" className="impact-investor" aria-labelledby="contribution-heading">
      <div className="impact-evidence-wrap">
        <p className="impact-kicker">Your impact as a property investor</p>
        <h2 id="contribution-heading">How many homes could you help fund?</h2>
        <p className="impact-intro">
          Try one property or a group of investors. Start with a home that meets local need, then
          enter what it would cost to buy and prepare.
        </p>
        <div className="impact-calculator">
          <fieldset className="impact-inputs">
            <legend className="sr-only">Your property scenario</legend>
            <ScenarioField
              id="investor-count"
              label="Investors taking part"
              value={investors}
              onChange={setInvestors}
              min={1}
              max={1_000}
            />
            <ScenarioField
              id="homes-each"
              label="Homes per investor"
              value={perInvestor}
              onChange={setPerInvestor}
              min={1}
              max={100}
            />
            <div className="impact-input-wide">
              <ScenarioField
                id="home-budget"
                label="Upfront cost per home (£)"
                description="Include purchase price, taxes, fees, works and contingency. Use your own estimate in whole pounds."
                value={perHome}
                onChange={setPerHome}
                min={1}
                max={100_000_000}
              />
            </div>
          </fieldset>
          <div className="impact-result" role="status" aria-live="polite" aria-atomic="true">
            <p>Potential homes</p>
            <strong>{homes === null ? "Enter both counts" : count.format(homes)}</strong>
            <p>Estimated capital across all homes</p>
            <strong>{capital === null ? "Awaiting figures" : "~" + pounds.format(capital)}</strong>
            {homes !== null && (
              <p>
                If each home suited a separate household in England, that capacity would equal{" "}
                <b>~{share.format(homes / englandTemporaryHouseholdsMarch2026)}</b> of the{" "}
                {count.format(englandTemporaryHouseholdsMarch2026)} households in temporary
                accommodation on 31 March 2026.
              </p>
            )}
          </div>
        </div>
        <p className="impact-note">
          The comparison uses a single day's count to show scale. Each investor funds separate
          homes. A local partner still needs to confirm who each home suits and arrange any ongoing
          support.{" "}
          <Link className="impact-source" to="/the-problem" hash="four-nations">
            See the housing figures
          </Link>
        </p>
        <details className="impact-rent">
          <summary>What could one home mean financially?</summary>
          <div>
            <p>
              Under a lease, the property owner receives the agreed rent. Use the proposed lease
              terms to check what you would receive and which costs you would pay.
            </p>
            <div className="impact-inputs">
              <ScenarioField
                id="annual-rent"
                label="Expected annual rent received (£)"
                description="Allow for any rent-free periods or unpaid months."
                value={rent}
                onChange={setRent}
                min={0}
                max={10_000_000}
              />
              <ScenarioField
                id="annual-expenses"
                label="Annual owner payments (£)"
                description="Include finance payments, insurance, fees, repairs and a reserve where applicable."
                value={expenses}
                onChange={setExpenses}
                min={0}
                max={10_000_000}
              />
            </div>
            <p className="impact-cashflow" role="status" aria-live="polite">
              Estimated annual cash flow before tax{" "}
              <strong>
                {cashFlow === null ? "Awaiting rent and costs" : "~" + pounds.format(cashFlow)}
              </strong>
            </p>
            <p className="impact-note">
              Annual cash flow is rent received less owner payments for one home. Actual rent and
              costs depend on the property and lease. A shortfall means you would need to cover the
              difference.
            </p>
          </div>
        </details>
        <Link to="/register/$role" params={{ role: "investor" }} className="impact-action">
          Register your interest as an investor <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}
