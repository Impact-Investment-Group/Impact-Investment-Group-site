/** The wait-list role tiles and the three-panel band. Copy edits happen here, not in JSX. */

export const registerAsDivider = "Register to join the waitlist as";

export const pickerContent = {
  eyebrow: "The waiting list",
  h1: "Register to join the waitlist",
  lede: "Choose the role that fits you. Create your account, then tell us your preferences one question at a time.",
  gridLabel: "I am registering as",
  footnote:
    "Registering costs nothing and commits you to nothing. It puts you on the list before the platform opens, and it puts your answer in the room while we are still deciding what it does.",
} as const;

export interface AudienceRole {
  /**
   * Also the URL segment of this role's wait-list page, /register/<id>, and the
   * `role` field of the payload that page posts. Changing an id breaks a live
   * link and orphans every answer already stored against the old one.
   */
  id: string;
  label: string;
  detail: string;
  /** lucide-react icon name, resolved in the component. */
  icon: string;
  /** "route-out" tiles are styled with a teal ring — a way out, not a pitch. */
  tone?: "default" | "route-out";
  /**
   * WAVE 838: a tile that leaves the site. The role's registration lives on the
   * platform, so the tile is a plain anchor to it rather than a /register/<id>
   * page, and content/register.ts does not require a page for it.
   */
  href?: string;
  /** WAVE 838: drawn on /register only, not in the hero's strip of ten. */
  pickerOnly?: boolean;
}

/**
 * WAVE 838 (Callum, 1 Nov 2026): the platform's co-sourcer sign-up, switched on
 * in production (`GET /api/auth/register/sourcer` answers enabled). The site had
 * no way in for a co-sourcer; this is the one address, read by the tile below.
 */
export const coSourcerSignUpUrl = "https://app.impactinvestmentgroup.co.uk/sourcer/join";

export const registerRoles: AudienceRole[] = [
  {
    id: "investor",
    label: "Investor",
    detail: "Fund homes, earn returns",
    icon: "CircleDollarSign",
  },
  { id: "landlord", label: "Landlord", detail: "Lease homes securely", icon: "Home" },
  { id: "developer", label: "Developer", detail: "Build homes nationally", icon: "HardHat" },
  {
    id: "housing-association",
    label: "Housing Association",
    detail: "Buy, sell & lease homes",
    icon: "Building2",
  },
  {
    id: "local-authority",
    label: "Local Authority",
    detail: "Access housing supply",
    icon: "Landmark",
  },
  { id: "care-provider", label: "Care Provider", detail: "Access housing", icon: "HeartHandshake" },
  { id: "support-provider", label: "Support Provider", detail: "Access housing", icon: "Users" },
  {
    id: "social-worker",
    label: "Social Worker",
    detail: "Access housing and support",
    icon: "UserRoundCheck",
  },
  { id: "broker", label: "Broker", detail: "Partner and provide services", icon: "Handshake" },
  {
    id: "co-sourcer",
    label: "Co-sourcer",
    detail: "Source homes with us",
    icon: "Search",
    href: coSourcerSignUpUrl,
    pickerOnly: true,
  },
  {
    id: "resident",
    label: "Resident",
    detail: "Find suitable homes",
    icon: "User",
    // Still a route out and never a sales section. /register/resident asks what
    // this person needs and where; it does not sell them anything.
    tone: "route-out",
  },
];

export interface PillarCard {
  id: string;
  title: string;
  tone: "neutral" | "orange";
  /** Descriptive alt text — these are illustrative photographs, not case studies. */
  alt: string;
}

export const pillarCards: PillarCard[] = [
  {
    id: "homes",
    title: "Providing Homes",
    tone: "neutral",
    alt: "An agent handing keys to a young couple outside a brick terrace",
  },
  {
    id: "support",
    title: "Delivering Support",
    tone: "orange",
    alt: "A carer sitting with an older woman in a warmly lit living room",
  },
  {
    id: "lives",
    title: "Transforming Lives",
    tone: "neutral",
    alt: "A family of five smiling outside their front door",
  },
];
