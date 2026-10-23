// Automated MSME Data Capturing, Profiling and Management System — onboarding wizard shared helpers and constants

export const SECTOR_OPTIONS = [
  "Retail",
  "Food and hospitality",
  "Trades and construction",
  "Services",
  "Agriculture",
  "Manufacturing",
  "Transport",
  "Tourism",
  "Creative and crafts",
  "Technology",
];

export const REGISTRATION_TYPES = [
  "Informal or not registered",
  "Sole proprietor",
  "Private company (Pty) Ltd",
  "Close corporation (CC)",
  "Co-operative",
  "NPC or NGO",
  "Partnership",
];

export const PREMISES_TYPES = [
  "Home-based",
  "Rented premises",
  "Municipal stall or market",
  "Mobile or street trader",
  "Farm or rural land",
  "Industrial site",
];

export const STAFF_BANDS = ["Owner only", "2 to 5", "6 to 10", "11 to 25", "26 to 50", "51 or more"];

export const TURNOVER_BANDS = [
  "Under R50 000",
  "R50 000 to R250 000",
  "R250 000 to R1 million",
  "R1 million to R5 million",
  "Over R5 million",
];

export const OWNERSHIP_OPTIONS = [
  "Women-owned",
  "Youth-owned (18 to 35)",
  "Owned by a person with a disability",
  "Military veteran",
  "Prefer not to say",
];

export const SUPPORT_OPTIONS = [
  "Funding",
  "Training",
  "Mentorship",
  "Tender opportunities",
  "Market access",
  "Compliance help",
  "Equipment",
  "Business space",
];

export const TRADING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const YES_NO_UNSURE = ["Yes", "No", "Not sure"];

// Map the new multi-select sector to the legacy single-enum used by the directory
const SECTOR_TO_OLD = {
  Retail: "Retail",
  "Food and hospitality": "Food",
  "Trades and construction": "Trades",
  Services: "Services",
  Agriculture: "Agriculture",
  Manufacturing: "Manufacturing",
  Transport: "Services",
  Tourism: "Services",
  "Creative and crafts": "Services",
  Technology: "Services",
};

export function primarySector(sectors) {
  if (!sectors || sectors.length === 0) return "Services";
  return SECTOR_TO_OLD[sectors[0]] || "Services";
}

// Evaluate whether a DocumentRule applies to a business record.
export function ruleApplies(rule, biz) {
  const c = rule.conditions || {};
  const keys = Object.keys(c);
  if (keys.length === 0) return true;
  for (const k of keys) {
    const allowed = Array.isArray(c[k]) ? c[k] : [c[k]];
    const val = biz ? biz[k] : undefined;
    if (Array.isArray(val)) {
      if (!val.some((v) => allowed.includes(v))) return false;
    } else if (!allowed.includes(val)) {
      return false;
    }
  }
  return true;
}

export function requirementBadge(level) {
  if (level === "required") return "bg-[#f9dcd2] text-[#8a2c10] dark:bg-red-500/15 dark:text-red-300";
  if (level === "needed") return "bg-[#fbeccb] text-[#6b4d00] dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-soft text-mute";
}

export const STEPS = [
  { key: "business", label: "Business details" },
  { key: "owner", label: "Owner profile" },
  { key: "premises", label: "Premises & trading" },
  { key: "size", label: "Size & turnover" },
  { key: "documents", label: "Documents & submit" },
];

export const MEMBER_STEPS = [
  { key: "personal", label: "Personal" },
  { key: "residence", label: "Residence" },
  { key: "household", label: "Household" },
  { key: "employment", label: "Employment" },
  { key: "consent", label: "Confirm" },
];

export const EMPLOYMENT_STATUS = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed",
  "Unemployed",
  "Student",
  "Retired",
  "Unable to work",
];

export const INCOME_BANDS = [
  "No income",
  "Under R2 000",
  "R2 000 to R5 000",
  "R5 000 to R10 000",
  "R10 000 to R20 000",
  "Over R20 000",
  "Prefer not to say",
];

export const MEMBER_SKILLS = [
  "Welding",
  "Forklift",
  "Carpentry",
  "Plumbing",
  "Electrical",
  "Cooking",
  "Driving",
  "Sewing",
  "Farming",
  "Bricklaying",
  "Painting",
  "Computer literacy",
];

export const MEMBER_SUPPORT_OPTIONS = [
  "Jobs",
  "Skills training",
  "Bursaries",
  "Business support",
  "Housing",
  "Health services",
  "Social relief",
  "Youth programmes",
];

export const MEMBER_DOC_TYPES = ["ID copy", "Proof of residence", "Other"];

export const ALERT_TYPES = [
  { key: "power_outages", label: "Power outages" },
  { key: "water_outages", label: "Water outages" },
  { key: "road_closures", label: "Road closures" },
  { key: "events", label: "Community events" },
  { key: "new_jobs", label: "New jobs" },
];

export const ALERT_CHANNELS = ["SMS", "WhatsApp", "app"];