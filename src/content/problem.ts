export const problemHero = {
  title: "Where could the next home come from?",
  description:
    "A family in temporary accommodation needs a home they can afford, near the people and services they rely on. What would it take to put more of the UK's homes within reach?",
};

export const impactSources = {
  need: "https://landaid.org/news-and-stories/landaid-and-homewards-launches-uks-first-homelessness-data-lab/",
  market: "https://propertyindustryeye.com/the-uk-property-market-is-dead-who-told-the-buyers/",
  vacancies:
    "https://analysisfunction.civilservice.gov.uk/policy-store/empty-homes-statistics-from-across-the-uk-2026/",
  definitions:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/articles/ukhomelessness/2004to2024",
  plan: "https://www.crisis.org.uk/ending-homelessness/the-plan-to-end-homelessness/targets-and-costs/chapter-15-cost-of-ending-homelessness/",
  pilot:
    "https://www.homelessnessimpact.org/publication/everyone-in-social-investment-pilot-final-evaluation",
};

export const englandTemporaryHouseholdsMarch2026 = 135_580;

export const nationFigures = [
  {
    nation: "England",
    households: englandTemporaryHouseholdsMarch2026.toLocaleString("en-GB"),
    emptyHomes: "303,185",
    source:
      "https://www.gov.uk/government/statistics/statutory-homelessness-in-england-january-to-march-2026/statutory-homelessness-in-england-january-to-march-2026",
  },
  {
    nation: "Scotland",
    households: "19,004",
    emptyHomes: "44,453",
    source:
      "https://www.gov.scot/publications/homelessness-in-scotland-2025-26/pages/the-extent-of-homelessness-in-scotland/",
  },
  {
    nation: "Wales",
    households: "6,201",
    emptyHomes: "23,033",
    source: "https://www.gov.wales/homelessness-april-2025-march-2026-html",
  },
  {
    nation: "Northern Ireland",
    households: "5,633",
    emptyHomes: "21,472",
    source:
      "https://datavis.nisra.gov.uk/communities/northern-ireland-homelessness-bulletin-october-2025-march-2026.html",
  },
];

// Keep populations, periods and source definitions attached to each measure.
export const problemSections = [
  {
    id: "scale",
    buddyTopic: "property" as const,
    title: "Waiting for social housing",
    lead: "Housing registers include people who already have somewhere to live. England's waiting list in March 2025 was its largest since 2014. The four nations count different units, so each figure stands alone.",
    earlier: {
      label:
        "In December 2025, Northern Ireland recorded 49,755 households waiting for social housing.",
      source: "https://www.nisra.gov.uk/news/almost-50000-households-housing-waiting-list",
    },
    rows: [
      {
        label: "Households on English council registers, March 2025",
        value: "1.34m",
        source:
          "https://www.gov.uk/government/statistics/social-housing-lettings-in-england-april-2024-to-march-2025/social-housing-lettings-in-england-tenants-april-2024-to-march-2025",
      },
      {
        label: "Applications to 26 Scottish council or common registers, March 2025",
        value: "180,074",
        source: "https://www.gov.scot/publications/housing-statistics-2025-key-trends-summary/",
      },
      {
        label: "People waiting in Wales, October 2023 survey cited by Senedd Research",
        value: "~139,000",
        source:
          "https://research.senedd.wales/research-articles/lists-within-lists-how-can-people-access-social-housing-in-wales/",
      },
      {
        label: "Households on Northern Ireland's waiting list, March 2026",
        value: "50,381",
        source:
          "https://datavis.nisra.gov.uk/communities/northern-ireland-housing-statistics-2025-26.html",
      },
    ],
  },
  {
    id: "cost",
    buddyTopic: "support" as const,
    title: "The cost of waiting",
    earlier: {
      label:
        "On 31 December 2025, 134,210 households and 176,130 dependent children were in temporary accommodation in England.",
      source:
        "https://www.gov.uk/government/statistics/statutory-homelessness-in-england-october-to-december-2025/statutory-homelessness-in-england-october-to-december-2025",
    },
    lead: "A shortage of suitable housing can keep families in temporary accommodation and people in hospital after they are ready to leave.",
    rows: [
      {
        label: "Children in temporary accommodation in England, 31 March 2026",
        value: "177,530",
        source: nationFigures[0].source,
      },
      {
        label: "English councils' temporary accommodation spend excluding administration, 2024/25",
        value: "~£2.7bn",
        source:
          "https://england.shelter.org.uk/media/press_release/bill_for_homeless_accommodation_soars_by_25_hitting_28_bn_",
      },
      {
        label:
          "Cost to English mental health services of discharge delays while people waited for supported housing, 2024/25",
        value: "~£102m",
        source:
          "https://www.lookahead.org.uk/supported-housing-crisis-costs-nhs-mental-health-services-in-england-102-million-a-year-new-report-finds/",
      },
    ],
  },
  {
    id: "opportunity",
    buddyTopic: "investment" as const,
    title: "What public funding can deliver",
    earlier: {
      label:
        "In April 2026 the government reported £3.6 billion for homelessness prevention and rough sleeping services from 2026/27 to 2028/29.",
      source:
        "https://questions-statements.parliament.uk/written-questions/detail/2026-04-16/HL16470",
    },
    lead: "England's Social and Affordable Homes Programme runs from 2026 to 2036. Its original £39 billion settlement increased in the November 2026 Budget.",
    rows: [
      {
        label: "Programme investment over ten years, after the Budget increase",
        value: "£40bn+",
        source: "https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html",
      },
      {
        label: "Original ambition for new social and affordable homes",
        value: "~300,000",
        source:
          "https://www.gov.uk/government/news/thousands-more-families-to-get-warm-secure-social-homes",
      },
      {
        label: "Target share of programme homes for social rent",
        value: "60%+",
        source:
          "https://www.gov.uk/government/news/thousands-more-families-to-get-warm-secure-social-homes",
      },
      {
        label:
          "Separate funding for homelessness and rough sleeping services over three years, announced October 2026",
        value: "£4.4bn+",
        source:
          "https://questions-statements.parliament.uk/written-statements/detail/2026-10-26/hcws419",
      },
    ],
  },
];
