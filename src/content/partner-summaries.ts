/** Small authored index used by navigation and route metadata. Full profile copy loads with its route. */
export interface PartnerSummary {
  id: string;
  label: string;
  pluralLabel: string;
  path: string;
  icon: string;
  stage: "need" | "property" | "delivery" | "outcome";
  summary: string;
}

export const partnerSummaries: PartnerSummary[] = [
  {
    id: "investor",
    label: "Property Investor",
    pluralLabel: "Property Investors",
    path: "/partner-with-investor",
    icon: "CircleDollarSign",
    stage: "property",
    summary: "The capital that can turn verified housing demand into suitable homes.",
  },
  {
    id: "landlord",
    label: "Property Landlord",
    pluralLabel: "Property Landlords",
    path: "/partner-with-landlord",
    icon: "Home",
    stage: "property",
    summary: "The property partner who can make existing homes available where they are needed.",
  },
  {
    id: "developer",
    label: "Property Developer",
    pluralLabel: "Property Developers",
    path: "/partner-with-developer",
    icon: "HardHat",
    stage: "property",
    summary: "The delivery partner who can build, convert and adapt the homes communities need.",
  },
  {
    id: "housing-association",
    label: "Housing Association",
    pluralLabel: "Housing Associations",
    path: "/partner-with-housing-association",
    icon: "Building2",
    stage: "delivery",
    summary:
      "The housing partner that turns suitable properties into secure, professionally managed homes.",
  },
  {
    id: "local-authority",
    label: "Local Authority",
    pluralLabel: "Local Authorities",
    path: "/partner-with-local-authority",
    icon: "Landmark",
    stage: "need",
    summary:
      "The strategic public partner that identifies need, coordinates funding and shapes local solutions.",
  },
  {
    id: "care-provider",
    label: "Care Provider",
    pluralLabel: "Care Providers",
    path: "/partner-with-care-provider",
    icon: "HeartHandshake",
    stage: "delivery",
    summary: "The specialist partner who helps people live safely and with dignity.",
  },
  {
    id: "support-provider",
    label: "Support Provider",
    pluralLabel: "Support Providers",
    path: "/partner-with-support-provider",
    icon: "Users",
    stage: "delivery",
    summary: "The practical partner who helps people build stability and independence.",
  },
  {
    id: "social-worker",
    label: "Social Worker",
    pluralLabel: "Social Workers",
    path: "/partner-with-social-worker",
    icon: "UserRoundCheck",
    stage: "need",
    summary:
      "The professional who brings the person’s needs, rights and voice into the housing journey.",
  },
  {
    id: "broker",
    label: "Property & Housing Broker",
    pluralLabel: "Property & Housing Brokers",
    path: "/partner-with-broker",
    icon: "Handshake",
    stage: "property",
    summary: "The connector who brings demand, property, capital and delivery partners together.",
  },
  {
    id: "resident",
    label: "Resident, Individual or Family",
    pluralLabel: "Residents, Individuals & Families",
    path: "/partner-with-resident",
    icon: "User",
    stage: "outcome",
    summary:
      "The person at the centre—needing the right home, in the right place, with the right help.",
  },
];

export const partnerNavItems = partnerSummaries.map(({ label, path }) => ({ label, to: path }));

export function getPartnerSummary(id: string) {
  const summary = partnerSummaries.find((partner) => partner.id === id);
  if (!summary) throw new Error(`Unknown partner profile: ${id}`);
  return summary;
}
