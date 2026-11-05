/** Owner-supplied service-fee arithmetic. Keep whole pence until final rounding. */
export const SOURCING_THREE_BEDROOM_PENCE = 500_000;
export const SOURCING_MINIMUM_PENCE = 500_000;
export const LEASE_MINIMUM_PENCE = 500_000;
export const STANDARD_LEASE_RATE_BASIS_POINTS = 500;

export function positiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function moneyToPence(value: string): number | null {
  if (!/^(?:\d+|\d*\.\d{1,2})$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const pence = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(pence) && pence > 0 ? pence : null;
}

export function sourcingEstimate(bedrooms: string) {
  const rooms = positiveInteger(bedrooms);
  if (rooms === null) return null;
  const numerator = SOURCING_THREE_BEDROOM_PENCE * rooms;
  if (!Number.isSafeInteger(numerator)) return null;
  const calculatedPence = Math.round(numerator / 3);
  return {
    rooms,
    calculatedPence,
    feePence: Math.max(SOURCING_MINIMUM_PENCE, calculatedPence),
    minimumApplied: calculatedPence < SOURCING_MINIMUM_PENCE,
  };
}

export function leaseEstimate(weeklyRent: string, bedrooms: string, years: string) {
  const rentPence = moneyToPence(weeklyRent);
  const rooms = positiveInteger(bedrooms);
  const term = positiveInteger(years);
  if (rentPence === null || rooms === null || term === null || term < 5) return null;
  const weeklyPence = rentPence * rooms;
  const annualPence = weeklyPence * 52;
  const leasePence = annualPence * term;
  const numerator = leasePence * STANDARD_LEASE_RATE_BASIS_POINTS;
  if (![weeklyPence, annualPence, leasePence, numerator].every(Number.isSafeInteger)) return null;
  const calculatedPence = Math.round(numerator / 10_000);
  return {
    weeklyPence,
    annualPence,
    leasePence,
    calculatedPence,
    feePence: Math.max(LEASE_MINIMUM_PENCE, calculatedPence),
    minimumApplied: calculatedPence < LEASE_MINIMUM_PENCE,
  };
}

const pounds = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });
export function formatFee(pence: number) {
  return pounds.format(pence / 100);
}
