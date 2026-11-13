import { getPartnerSummary, type PartnerSummary } from "./partner-summaries";
export { partnerNavItems } from "./partner-summaries";

export interface PartnerRelationship {
  partner: string;
  detail: string;
}

export interface PartnerProfile extends PartnerSummary {
  whoTheyAre: string;
  rolePoints: [string, string, string, string];
  platformIntro: string;
  platformSteps: [string, string, string];
  relationships: PartnerRelationship[];
  whyJoin: string;
  ecosystemBenefits: [string, string, string];
  impactIntro: string;
  impactPoints: [string, string, string];
  diagram: {
    inputs: [string, string];
    centre: string;
    outputs: [string, string, string];
  };
  closingLine: string;
  motto: string;
  importantNote?: string;
  /**
   * Crisis signposting shown ABOVE THE FOLD, before the hero.
   *
   * ⚠ ONLY THE RESIDENT PROFILE CARRIES THIS, and that is the whole point of
   * it being optional. The other nine pathway pages address organisations:
   * councils, housing associations, providers, investors. This one addresses
   * the person who may be homeless, in temporary accommodation or leaving
   * hospital, and the platform's published Disclaimer puts the helplines on
   * every seeker-facing page rather than only in a footer somebody in
   * difficulty has to scroll to find.
   *
   * The numbers themselves are NOT here. They live once, in
   * `crisisLines` and `crisisNote` in content/site.ts, and the panel reads
   * them from there, so a changed helpline number can never be right in the
   * footer and stale on this page. (Wave 298, R298-6.)
   */
  crisisSignpost?: {
    heading: string;
    /** Written in the first person, like the rest of this profile. */
    body: string;
  };
}

/**
 * The ten roles in one demand-led housing and care ecosystem. The wording is
 * deliberately written both to the role itself ("your role") and to somebody
 * trying to understand why that role matters. It explains a proposed network;
 * it does not claim that every visitor is already a contracted partner.
 */
export const partnerProfiles: PartnerProfile[] = [
  {
    ...getPartnerSummary("investor"),
    whoTheyAre:
      "Property Investors may be individuals, companies, family offices or institutions. They provide the capital and ownership capacity needed to acquire, convert or improve property, connecting a commercial property decision with an evidenced housing requirement.",
    rolePoints: [
      "Fund suitable acquisitions, conversions and refurbishment.",
      "Assess each opportunity against clear investment criteria.",
      "Work with housing and delivery partners before committing capital.",
      "Support responsible, long-term housing supply rather than speculation alone.",
    ],
    platformIntro:
      "See demand evidence, property information and the proposed delivery structure in one traceable view before deciding whether an opportunity is right for you.",
    platformSteps: [
      "Review demand-led opportunities and their supporting evidence.",
      "Understand the property, lease, housing and delivery structure.",
      "Follow delivery milestones and the intended social outcome.",
    ],
    relationships: [
      {
        partner: "Local Authorities",
        detail: "Define local need and relevant commissioning priorities.",
      },
      {
        partner: "Landlords & Developers",
        detail: "Provide, create or improve the physical property.",
      },
      {
        partner: "Housing Associations",
        detail: "Establish the housing, tenancy and management route.",
      },
      {
        partner: "Care & Support Providers",
        detail: "Help define what residents need from the home.",
      },
    ],
    whyJoin:
      "Property investment is often fragmented. The ecosystem creates a clearer route from verified demand to property, delivery partners and social purpose.",
    ecosystemBenefits: [
      "See the need before selecting the property.",
      "Coordinate due diligence with the right organisations.",
      "Make the intended social purpose visible alongside the commercial case.",
    ],
    impactIntro:
      "When capital starts with a genuine housing requirement, it can create homes that are more likely to remain useful, accountable and aligned with local need.",
    impactPoints: [
      "Direct capital towards evidenced housing demand.",
      "Bring empty or unsuitable property into purposeful use.",
      "Increase the supply of supported, specialist and general-needs homes.",
    ],
    diagram: {
      inputs: ["Verified demand", "Investment capital"],
      centre: "Property Investor",
      outputs: ["Suitable property", "Delivery structure", "Home with purpose"],
    },
    closingLine: "You do more than fund a transaction. You help create housing capacity.",
    motto: "INVEST IN PROPERTY. MEET REAL DEMAND. CREATE HOMES. TRANSFORM LIVES.",
    importantNote:
      "Every opportunity remains subject to independent legal, financial, property and regulatory due diligence. Demand, occupancy, lease income and returns are not guaranteed.",
  },
  {
    ...getPartnerSummary("landlord"),
    whoTheyAre:
      "Property Landlords are individuals or organisations that already own accommodation. A suitable existing home can respond to verified demand quickly when its condition, location, lease route and management responsibilities are clearly understood.",
    rolePoints: [
      "Make accurate property and ownership information available.",
      "Agree an appropriate lease and management structure.",
      "Complete required works, adaptations and safety checks.",
      "Meet the maintenance, insurance and compliance duties in the agreement.",
    ],
    platformIntro:
      "The platform lets you present a property once, compare it with verified requirements and coordinate the housing, management, care and support partners responsible for delivery.",
    platformSteps: [
      "Share location, condition, availability and compliance information.",
      "Compare the property with a defined housing requirement.",
      "Coordinate works, due diligence, lease information and ongoing records.",
    ],
    relationships: [
      {
        partner: "Housing Associations",
        detail: "May lease or underlease the home and oversee the tenancy.",
      },
      {
        partner: "Management Agents",
        detail: "May hold a headlease and deliver agreed housing-management services.",
      },
      {
        partner: "Local Authorities",
        detail: "Identify demand and may nominate or refer eligible residents.",
      },
      {
        partner: "Care & Support Providers",
        detail: "Deliver services in or around the home where required.",
      },
    ],
    whyJoin:
      "Instead of managing demand, delivery and multiple introductions separately, you can see how a suitable property fits within one accountable housing route.",
    ecosystemBenefits: [
      "Connect existing property with evidenced need.",
      "Clarify responsibilities before entering an agreement.",
      "Coordinate the organisations responsible for the home and resident.",
    ],
    impactIntro:
      "Existing homes can increase local housing supply without waiting for new construction and can bring empty property back into use.",
    impactPoints: [
      "Respond more quickly to local housing shortages.",
      "Make existing homes available for purposeful use.",
      "Support stable, professionally managed housing partnerships.",
    ],
    diagram: {
      inputs: ["Available property", "Verified requirement"],
      centre: "Property Landlord",
      outputs: ["Suitable lease route", "Managed property", "Resident home"],
    },
    closingLine:
      "You are not simply providing a building. You are making housing capacity available.",
    motto: "PROVIDE PROPERTY. MEET DEMAND. CREATE STABILITY. TRANSFORM LIVES.",
    importantNote:
      "Lease terms, responsibilities, occupancy and income depend on the individual agreements and all required legal, financial, property and regulatory checks.",
  },
  {
    ...getPartnerSummary("developer"),
    whoTheyAre:
      "Property Developers create new homes, convert buildings, refurbish empty property and deliver specialist adaptations. Within this ecosystem, the brief starts with verified demand—not construction alone.",
    rolePoints: [
      "Test land and buildings against an identified housing requirement.",
      "Design around location, accessibility and resident needs.",
      "Manage planning, approvals, construction and refurbishment.",
      "Deliver safe, compliant homes to an agreed specification.",
    ],
    platformIntro:
      "The platform gives you earlier visibility of housing requirements and delivery partners so a proposal can be tested against a real brief before significant time and capital are committed.",
    platformSteps: [
      "Explore location-specific demand and property specifications.",
      "Share sites, schemes and conversion opportunities with relevant partners.",
      "Keep approvals, specifications, milestones and handover connected.",
    ],
    relationships: [
      {
        partner: "Local Authorities",
        detail: "Provide local priorities and exercise relevant public functions.",
      },
      { partner: "Property Investors", detail: "Provide capital for acquisition and delivery." },
      {
        partner: "Housing Associations",
        detail: "Review the housing and long-term management route.",
      },
      {
        partner: "Care & Support Providers",
        detail: "Help define specialist layout and accessibility needs.",
      },
    ],
    whyJoin:
      "A well-built scheme can still fail if its use, location and operating model are unclear. The network helps validate the requirement before delivery begins.",
    ecosystemBenefits: [
      "Start with a defined commissioning or housing brief.",
      "Bring delivery partners into the design earlier.",
      "Create a clearer route from development to occupied home.",
    ],
    impactIntro:
      "Demand-led development can reduce the risk of creating the wrong type of accommodation in the wrong place.",
    impactPoints: [
      "Build homes in areas of evidenced shortage.",
      "Create accessible and specialist accommodation.",
      "Bring empty or underused buildings back into service.",
    ],
    diagram: {
      inputs: ["Verified brief", "Land or building"],
      centre: "Property Developer",
      outputs: ["Designed scheme", "Suitable homes", "Delivery handover"],
    },
    closingLine: "You turn an identified housing need into a suitable place to live.",
    motto: "UNDERSTAND DEMAND. BUILD THE RIGHT HOMES. SUPPORT COMMUNITIES.",
    importantNote:
      "All schemes remain subject to planning, technical, legal, financial and regulatory due diligence. Identified demand is not a purchase, lease or occupancy guarantee.",
  },
  {
    ...getPartnerSummary("housing-association"),
    whoTheyAre:
      "Housing Associations and Registered Providers provide, lease and manage affordable, social, supported and specialist housing. They bring the tenancy structure, housing governance and long-term stewardship that turns a property into a home.",
    rolePoints: [
      "Assess property suitability and the proposed housing model.",
      "Own, lease, manage or oversee the accommodation.",
      "Provide tenancy, rent and housing-management services.",
      "Maintain property, safety, compliance and resident accountability.",
    ],
    platformIntro:
      "The platform connects suitable supply with demand and keeps property checks, lease information, placements, housing management and support partners aligned around each home.",
    platformSteps: [
      "Review homes matched to an identified requirement.",
      "Coordinate lease, property checks and delivery responsibilities.",
      "Maintain a shared view of homes, tenancies, services and outcomes.",
    ],
    relationships: [
      {
        partner: "Investors & Landlords",
        detail: "Provide capital, ownership capacity and suitable property.",
      },
      {
        partner: "Local Authorities",
        detail: "Identify demand, refer residents and coordinate relevant funding.",
      },
      {
        partner: "Care Providers",
        detail: "Deliver regulated or specialist care separately from housing.",
      },
      {
        partner: "Support Providers",
        detail: "Help residents sustain tenancies and build independence.",
      },
    ],
    whyJoin:
      "The ecosystem brings suitable property, verified demand and service partners into one clearer operating picture, helping you expand supply without losing housing accountability.",
    ecosystemBenefits: [
      "Access demand-led property opportunities.",
      "Coordinate approved management and service partners.",
      "Keep housing, care and support responsibilities clearly separated.",
    ],
    impactIntro:
      "Housing expertise creates the structure through which people can live safely, securely and with dignity.",
    impactPoints: [
      "Increase access to suitable, well-managed homes.",
      "Create secure and sustainable tenancy arrangements.",
      "Give commissioners and delivery partners a clearer operational picture.",
    ],
    diagram: {
      inputs: ["Housing demand", "Suitable property"],
      centre: "Housing Association",
      outputs: ["Lease & tenancy", "Housing management", "Secure home"],
    },
    closingLine: "You are the housing partner that helps hold the ecosystem together.",
    motto: "PROVIDE HOUSING. CONNECT PARTNERS. SUPPORT PEOPLE. TRANSFORM LIVES.",
  },
  {
    ...getPartnerSummary("local-authority"),
    whoTheyAre:
      "A Local Authority is not one department with one budget. Housing, homelessness, Housing Benefit, adult social care, children’s services, commissioning, planning and safeguarding each have distinct functions. Together they connect public need, local strategy, eligible funding and delivery.",
    rolePoints: [
      "Identify local housing, homelessness, care and support needs.",
      "Assess eligibility, make referrals and safeguard vulnerable people.",
      "Commission and fund eligible care or support through relevant departments.",
      "Administer eligible Housing Benefit, including many supported or exempt claims.",
    ],
    platformIntro:
      "The platform translates local requirements into a clearer demand signal and connects that need with suitable property, housing organisations and care or support providers.",
    platformSteps: [
      "Define location, household, property and service requirements.",
      "Review potential homes and the proposed delivery team.",
      "Keep referrals, placements, responsibilities and outcomes connected.",
    ],
    relationships: [
      {
        partner: "Housing Associations",
        detail: "Provide or oversee homes, tenancies and housing management.",
      },
      {
        partner: "Investors, Landlords & Developers",
        detail: "Fund, provide or create suitable property.",
      },
      {
        partner: "Care & Support Providers",
        detail: "Deliver assessed and commissioned services.",
      },
      {
        partner: "DWP",
        detail: "Administers and pays Universal Credit; it is separate from the Local Authority.",
      },
    ],
    whyJoin:
      "You may hold verified demand but have limited access to suitable property. The ecosystem gives relevant teams a route to housing, investment and delivery partners capable of responding.",
    ecosystemBenefits: [
      "Make local requirements easier for the market to understand.",
      "Direct investment towards evidenced need.",
      "Coordinate housing, care, support and outcome reporting.",
    ],
    impactIntro:
      "Clear public-sector demand and coordinated funding can help prevent homelessness, reduce unsuitable placements and improve how public resources are used.",
    impactPoints: [
      "Create stronger pathways out of temporary accommodation.",
      "Fund eligible care and support through the correct departments.",
      "Align housing supply with local strategies and residents’ needs.",
    ],
    diagram: {
      inputs: ["Local need", "Eligibility & funding"],
      centre: "Local Authority",
      outputs: ["Housing brief", "Partner response", "Resident outcome"],
    },
    closingLine:
      "You do more than refer people. You help assess, fund and coordinate the solution.",
    motto: "IDENTIFY NEED. COORDINATE FUNDING. CREATE HOMES. SUPPORT PEOPLE.",
    importantNote:
      "Local Authorities administer Housing Benefit where eligible. Universal Credit is administered and paid by the Department for Work and Pensions. Personal care and support are generally assessed and funded separately from rent and housing costs.",
  },
  {
    ...getPartnerSummary("care-provider"),
    whoTheyAre:
      "Care Providers deliver personal, regulated or specialist care to children, young people and adults. Depending on the activity and setting, services may require oversight by the CQC or Ofsted. Their insight is essential when a home must work around an individual’s assessed needs.",
    rolePoints: [
      "Develop and deliver person-centred care plans.",
      "Provide trained staff and regulated activities where required.",
      "Manage safeguarding, health and agreed care risks.",
      "Review outcomes with the person, family and professionals.",
    ],
    platformIntro:
      "The platform helps you contribute practical housing requirements earlier, coordinate with housing partners and keep the home, placement and agreed care delivery connected.",
    platformSteps: [
      "Translate an assessed care need into practical housing requirements.",
      "Review potential homes and the organisations responsible for delivery.",
      "Coordinate placement information, visits and agreed outcomes.",
    ],
    relationships: [
      {
        partner: "Local Authorities",
        detail: "Assess eligibility and may commission or fund eligible care.",
      },
      {
        partner: "Housing Associations",
        detail: "Provide the home and tenancy structure separately from care.",
      },
      {
        partner: "Social Workers",
        detail: "Coordinate plans, safeguarding, reviews and the person’s voice.",
      },
      {
        partner: "Residents & Families",
        detail: "Remain central to planning, choice and delivery.",
      },
    ],
    whyJoin:
      "Providers often understand the need but cannot secure the right property quickly. The ecosystem connects the service requirement with housing and property partners.",
    ecosystemBenefits: [
      "Influence the property brief before a home is selected.",
      "Keep care and housing responsibilities clear.",
      "Coordinate one delivery team around the person.",
    ],
    impactIntro:
      "A suitable property provides accommodation. Appropriate care helps a person live there safely, meaningfully and with dignity.",
    impactPoints: [
      "Support safe hospital discharge and community living.",
      "Reduce placement breakdown and avoidable escalation.",
      "Improve safety, independence and quality of life.",
    ],
    diagram: {
      inputs: ["Assessed care need", "Suitable home"],
      centre: "Care Provider",
      outputs: ["Care plan", "Safe delivery", "Personal outcomes"],
    },
    closingLine: "You turn suitable accommodation into a place where someone can live safely.",
    motto: "DELIVER CARE. PROTECT DIGNITY. ENABLE INDEPENDENCE. TRANSFORM LIVES.",
    importantNote:
      "Each service must confirm its own registration, safeguarding, contractual and regulatory requirements before delivery.",
  },
  {
    ...getPartnerSummary("support-provider"),
    whoTheyAre:
      "Support Providers help individuals and families maintain accommodation, develop life skills and participate in their community. Support may include tenancy sustainment, outreach, resettlement, mentoring or practical help and is distinct from regulated personal care.",
    rolePoints: [
      "Create person-centred support and tenancy-sustainment plans.",
      "Help with daily routines, appointments and practical skills.",
      "Identify safeguarding concerns and coordinate with professionals.",
      "Record progress towards agreed independence and stability outcomes.",
    ],
    platformIntro:
      "The platform connects the support plan with the proposed home, placement information and the housing responsibilities held by other partners.",
    platformSteps: [
      "Define the support someone needs around their home.",
      "See property, placement and partner responsibilities together.",
      "Record agreed activity and outcomes in the housing context.",
    ],
    relationships: [
      {
        partner: "Housing Associations",
        detail: "Hold the tenancy and housing-management responsibilities.",
      },
      {
        partner: "Local Authorities",
        detail: "May commission eligible support and monitor outcomes.",
      },
      {
        partner: "Care Providers",
        detail: "Deliver regulated care separately where it is required.",
      },
      {
        partner: "Social Workers",
        detail: "Coordinate assessments, plans, safeguarding and reviews.",
      },
    ],
    whyJoin:
      "Support works best when the home, tenancy and wider professional network are not planned in isolation.",
    ecosystemBenefits: [
      "Help shape the location and practical property requirement.",
      "Clarify where housing management ends and support begins.",
      "Keep progress and agreed outcomes connected to the home.",
    ],
    impactIntro:
      "The right practical support can help turn a placement into a stable home and create a stronger route towards independence.",
    impactPoints: [
      "Help people settle into and sustain their accommodation.",
      "Prevent homelessness and avoidable placement breakdown.",
      "Build confidence, practical skills and community connection.",
    ],
    diagram: {
      inputs: ["Support needs", "Suitable home"],
      centre: "Support Provider",
      outputs: ["Support plan", "Stable tenancy", "Greater independence"],
    },
    closingLine: "You help transform accommodation into stability, confidence and opportunity.",
    motto: "PROVIDE SUPPORT. BUILD STABILITY. ENABLE INDEPENDENCE. TRANSFORM LIVES.",
    importantNote:
      "Non-regulated support is still accountable. Providers must meet every applicable legal, safeguarding, contractual and service requirement.",
  },
  {
    ...getPartnerSummary("social-worker"),
    whoTheyAre:
      "Social Workers assess need, safeguard people and coordinate plans across housing, care, health and support services. They often see first-hand where an unsuitable home creates risk or prevents progress.",
    rolePoints: [
      "Understand the person’s circumstances, strengths and assessed needs.",
      "Represent choice, rights, culture and the person’s own voice.",
      "Coordinate referrals, care planning, safeguarding and reviews.",
      "Monitor whether the proposed solution continues to meet need.",
    ],
    platformIntro:
      "The platform gives you a clearer route to describe housing and support requirements, follow a referral and understand who owns each part of the proposed solution.",
    platformSteps: [
      "Share the agreed referral and practical requirements for a home.",
      "Follow progress through matching and partner coordination.",
      "Keep circumstances, choices and agreed outcomes central.",
    ],
    relationships: [
      {
        partner: "Residents & Families",
        detail: "Their rights, needs and choices guide the plan.",
      },
      {
        partner: "Local Authorities",
        detail: "Assess eligibility and coordinate relevant public services.",
      },
      {
        partner: "Housing Associations",
        detail: "Provide or oversee a suitable home and tenancy.",
      },
      {
        partner: "Care & Support Providers",
        detail: "Deliver the services specified in the agreed plan.",
      },
    ],
    whyJoin:
      "A connected process can reduce repeated explanations, show who is responsible and keep housing decisions centred on the person.",
    ecosystemBenefits: [
      "Follow a referral without losing the person’s context.",
      "See housing and service responsibilities together.",
      "Create a clearer line from assessment to delivery and review.",
    ],
    impactIntro:
      "When professional assessment and lived experience stay visible, the wider network is better able to create an appropriate response.",
    impactPoints: [
      "Strengthen the person’s voice in housing decisions.",
      "Reduce gaps between assessment, referral and delivery.",
      "Support clearer safeguarding and outcome accountability.",
    ],
    diagram: {
      inputs: ["Person’s voice", "Professional assessment"],
      centre: "Social Worker",
      outputs: ["Clear referral", "Coordinated plan", "Reviewed outcome"],
    },
    closingLine: "You help ensure the system responds to a person—not simply a vacancy.",
    motto: "ASSESS NEED. PROTECT RIGHTS. CONNECT SERVICES. KEEP PEOPLE CENTRAL.",
  },
  {
    ...getPartnerSummary("broker"),
    whoTheyAre:
      "Property and Housing Brokers connect owners, buyers, property opportunities and housing organisations. In a demand-led network, the broker’s value comes from understanding the requirement and introducing credible opportunities—not simply circulating listings.",
    rolePoints: [
      "Understand the property specification and intended delivery route.",
      "Bring complete, accurate opportunities into the network.",
      "Coordinate introductions between owners, capital and housing partners.",
      "Maintain a clear record of progress and next steps.",
    ],
    platformIntro:
      "The platform allows you to present suitable opportunities, compare them with current housing requirements and connect owners with organisations able to assess and deliver them.",
    platformSteps: [
      "Submit an opportunity with the information needed for assessment.",
      "See where location and specification align with demand.",
      "Coordinate introductions and follow the opportunity forward.",
    ],
    relationships: [
      {
        partner: "Local Authorities",
        detail: "Provide evidence of the type and location of need.",
      },
      {
        partner: "Investors & Landlords",
        detail: "Bring capital, ownership capacity and available property.",
      },
      { partner: "Developers", detail: "Respond to conversion, adaptation and new-build briefs." },
      {
        partner: "Housing Associations",
        detail: "Assess the housing, lease and management route.",
      },
    ],
    whyJoin:
      "The network helps you qualify opportunities against a real requirement and make introductions with the context partners need to act.",
    ecosystemBenefits: [
      "Understand demand before sourcing property.",
      "Reduce unsuitable or speculative introductions.",
      "Follow one opportunity across a multi-partner process.",
    ],
    impactIntro:
      "Better-informed introductions save time and help more suitable homes reach the organisations and people who need them.",
    impactPoints: [
      "Widen the pipeline of relevant housing opportunities.",
      "Help owners understand standards and delivery structures.",
      "Connect fragmented organisations around one requirement.",
    ],
    diagram: {
      inputs: ["Housing demand", "Property opportunity"],
      centre: "Broker",
      outputs: ["Qualified match", "Partner introduction", "Delivery route"],
    },
    closingLine: "You turn disconnected opportunities into informed, purposeful introductions.",
    motto: "UNDERSTAND THE NEED. FIND THE FIT. CONNECT THE PARTNERS.",
    importantNote:
      "Introductions remain subject to the relevant property, legal, financial, procurement and regulatory checks. A match is not a guarantee of a transaction or placement.",
  },
  {
    ...getPartnerSummary("resident"),
    whoTheyAre:
      "I may be an individual, child, young person or family needing a safe and suitable home. I may need housing only, or care, support, adaptations or specialist services as well. I am not a supply category, placement or data point; my circumstances, choices and goals are why the network exists.",
    rolePoints: [
      "I may be homeless, in temporary accommodation or leaving hospital or care.",
      "I may need general-needs, supported, specialist or adapted housing.",
      "I may need regulated care, practical support—or no additional service.",
      "My rights, culture, relationships, choices and ambitions must shape the plan.",
    ],
    platformIntro:
      "The platform is designed to help authorised teams coordinate around me while making the proposed home, responsible organisations and next steps easier to understand.",
    platformSteps: [
      "Understand my housing needs, preferences and accessibility requirements.",
      "Connect the proposed home with responsible housing and service teams.",
      "Keep agreed actions and outcomes visible to authorised people.",
    ],
    relationships: [
      { partner: "Social Workers", detail: "Listen to me, assess need and coordinate my plan." },
      {
        partner: "Local Authorities",
        detail: "Assess eligibility and coordinate relevant housing or services.",
      },
      { partner: "Housing Associations", detail: "Provide or manage the home and tenancy." },
      {
        partner: "Care & Support Providers",
        detail: "Deliver the help I need to live safely and independently.",
      },
    ],
    whyJoin:
      "The objective is not to place me in the first available property. It is to create a joined-up route to accommodation that is appropriate, safe and capable of supporting my future.",
    ecosystemBenefits: [
      "Tell my story once and keep my needs visible.",
      "Understand who is responsible for each part of the plan.",
      "Help shape the home and support intended for me.",
    ],
    impactIntro:
      "Success is not simply a placement. It is a suitable home, the right level of support and a stronger foundation for daily life.",
    impactPoints: [
      "Greater safety, stability and personal choice.",
      "A clearer route out of homelessness or unsuitable accommodation.",
      "Support for independence, recovery, family life and community connection.",
    ],
    diagram: {
      inputs: ["My needs & choices", "A coordinated network"],
      centre: "Person at the centre",
      outputs: ["Suitable home", "Right support", "Personal future"],
    },
    closingLine: "I am not at the end of the ecosystem. I am the reason it exists.",
    motto: "LISTEN TO ME. FIND THE RIGHT HOME. SUPPORT MY FUTURE.",
    importantNote:
      "Access to housing, benefits, care and support depends on individual circumstances, assessments, eligibility and available services. The platform does not replace professional advice or statutory decision-making.",
    crisisSignpost: {
      heading: "If you need help now",
      /*
       * Three things, in the platform's seeker voice, before anything else on
       * the page: what this is (homes that MAY suit, never a promise of one),
       * that a person is always in the loop, and that this is not the number
       * to call in an emergency. The `importantNote` further down the page
       * still carries the assessment and statutory-decision qualification and
       * is not replaced by this.
       */
      body: "This page describes a network that looks for homes that may suit you. It is not an emergency service and it cannot house you today. A person from the housing and support team confirms every match before anything happens. If you need help now, these lines are there for anyone.",
    },
  },
];

export function getPartnerProfile(id: string) {
  const profile = partnerProfiles.find((partner) => partner.id === id);
  if (!profile) throw new Error(`Unknown partner profile: ${id}`);
  return profile;
}
