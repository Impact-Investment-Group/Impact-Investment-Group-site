/** Property service charges supplied by the owner on 5 November 2026. */
export const pricing = {
  eyebrow: "Pricing",
  heading: "Clarity before",
  headingAccent: "you decide.",
  status: "Property service charges",
  introduction:
    "Choose sourcing, lease facilitation or support with both. Our service charges reflect the property and the work involved.",
  commitment:
    "We believe pricing should be transparent, straightforward and easy to understand.",
  contactAction: "Talk to our team",
  taxLabel: "VAT not applicable",
  packages: [
    {
      id: "silver",
      name: "Silver",
      description: "Choose the service you need.",
      startingPrice: "£5,000",
      priceBasis: "Minimum per service",
      services: ["Property sourcing", "Lease facilitation"],
      detail: "Sourcing and lease facilitation are available separately, each from £5,000.",
      action: "Discuss Silver",
    },
    {
      id: "gold",
      name: "Gold",
      description: "Bring sourcing and leasing together.",
      startingPrice: "£10,000",
      priceBasis: "Minimum package charge",
      services: ["Property sourcing", "Lease facilitation"],
      detail: "Both services in one package. Pricing varies with the property and lease.",
      action: "Discuss Gold",
    },
    {
      id: "platinum",
      name: "Platinum",
      description: "More support before acquisition.",
      startingPrice: "£12,500",
      priceBasis: "Minimum package charge",
      services: ["Property sourcing", "Lease facilitation", "Full pre-acquisition project management"],
      detail: "Includes organising and coordinating contractors before acquisition.",
      action: "Discuss Platinum",
    },
  ],
  panelEyebrow: "Our approach",
  panelHeading: "An open book.",
  panelIntroduction: "Understand the service, the calculation and your agreed scope before proceeding.",
  points: [
    {
      id: "prices",
      label: "How pricing works",
      title: "The costs, clearly set out.",
      body: "These are starting service charges. Sourcing varies with the property's bedrooms, while lease facilitation is based on the rental value over the lease term.",
    },
    {
      id: "included",
      label: "What's included",
      title: "Know what you're choosing.",
      body: "Silver offers either service separately. Gold combines sourcing and lease facilitation. Platinum also includes full project management before acquisition, including contractor coordination.",
    },
    {
      id: "additional",
      label: "Additional costs",
      title: "The full picture, upfront.",
      body: "We'll make any additional costs and relevant terms clear before you decide to proceed.",
    },
  ],
  nextEyebrow: "See how we can help",
  nextHeading: "Find your place in the platform.",
  nextBody:
    "Explore the tools and walkthroughs for your role, from finding property to managing homes and connecting with partners.",
  nextAction: "Explore our services",
} as const;
