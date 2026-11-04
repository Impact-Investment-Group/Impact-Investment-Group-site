/**
 * The charity pledge, from Callum, 9 October 2026 (wave 576). His words, never
 * shortened or reworded: every placement on the site imports this constant, and
 * the same sentence is held by the platform's twin (wave 575). Charity copy
 * stays together here so the visible commitment remains consistent.
 */
export const charityPledge =
  "10% of all profits made go to Metro World Child UK to bring hope and joy to children today and change lives for tomorrow.";

export const charity = {
  name: "Metro World Child",
  recordUrl:
    "https://register-of-charities.charitycommission.gov.uk/en/charity-search/-/charity-details/3963704",
  eyebrow: "Our commitment to children",
  heading: "Helping children build brighter futures.",
  introduction:
    "Metro World Child is a faith-based humanitarian charity supporting children in vulnerable communities around the world.",
  action: "View the charity record",
  registration: "Registered charity 1079863",
  footerAction: "Read about our commitment",
  work: [
    {
      id: "essentials",
      label: "Everyday essentials",
      title: "Practical help for everyday needs",
      body: "From healthy food and clean water to help in an emergency, Metro works to meet children's basic needs in the communities it serves.",
      source: "https://www.metroworldchild.org/programs",
    },
    {
      id: "support",
      label: "Personal support",
      title: "A familiar face, week after week",
      body: "Regular personal visits help children and families build lasting relationships with people who know them, listen and offer encouragement.",
      source: "https://www.metroworldchild.org/our-approach",
    },
    {
      id: "learning",
      label: "Learning and hope",
      title: "Encouragement for the future",
      body: "Through its faith-based children's programmes and, where resources allow, school supplies, Metro supports children as they learn and grow.",
      source: "https://www.metroworldchild.org/sponsor",
    },
  ],
} as const;
