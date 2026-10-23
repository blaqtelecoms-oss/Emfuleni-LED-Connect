// Automated MSME Data Capturing, Profiling and Management System — funding catalogue helpers and sourced seed data

export const FUNDERS = ["Municipality", "NYDA", "SEDA", "SEFA", "COGTA", "DSBD", "IDC", "Other"];

export const FUNDING_TYPES = ["Grant", "Loan", "Voucher", "Mixed support", "Non-financial"];

export const CALL_STATUSES = [
  { key: "standing", label: "Standing programme" },
  { key: "open_call", label: "Open call" },
  { key: "closed", label: "Closed" },
];

// Status pill styling for checklist items (met / missing / needs review)
export const CHECKLIST_STATUS = {
  met: { label: "Met", className: "bg-[#d9efe0] text-[#14532b] dark:bg-emerald-500/15 dark:text-emerald-300" },
  missing: { label: "Missing", className: "bg-[#f9dcd2] text-[#8a2c10] dark:bg-red-500/15 dark:text-red-300" },
  needs_review: { label: "Needs review", className: "bg-[#fbeccb] text-[#6b4d00] dark:bg-amber-500/15 dark:text-amber-300" },
};

// Evaluate a single programme requirement against the business profile and its
// uploaded documents. Returns a checklist status only — never an overall verdict.
export function evaluateRequirement(req, business, docs) {
  if (!req) return { status: "needs_review" };

  if (req.type === "document") {
    const doc = (docs || []).find((d) => d.document_type === req.document_type);
    if (!doc) return { status: "missing" };
    if (doc.status === "rejected") return { status: "needs_review" };
    return { status: "met" };
  }

  if (req.type === "profile") {
    const val = business ? business[req.field] : undefined;
    if (req.values && req.values.length) {
      const hit = Array.isArray(val)
        ? val.some((v) => req.values.includes(v))
        : req.values.includes(val);
      return { status: hit ? "met" : "missing" };
    }
    if (val === "Not sure" || val === "Prefer not to say") return { status: "needs_review" };
    const present = val !== undefined && val !== null && val !== "" && val !== false;
    return { status: present ? "met" : "missing" };
  }

  // info: cannot be verified from stored data — officer/manual confirmation needed
  return { status: "needs_review" };
}

export function evaluateChecklist(program, business, docs) {
  return (program.requirements || []).map((req) => ({
    ...req,
    ...evaluateRequirement(req, business, docs),
  }));
}

export function checklistCounts(checklist) {
  return {
    met: checklist.filter((c) => c.status === "met").length,
    missing: checklist.filter((c) => c.status === "missing").length,
    needs_review: checklist.filter((c) => c.status === "needs_review").length,
  };
}

// Curated, sourced catalogue of local and national programmes.
// Sourced and verified 2026-10-10 from official / authoritative pages.
// Standing programmes (always open) are distinguished from time-limited calls.
export const SEED_PROGRAMS = [
  {
    name: "NYDA Grant Programme",
    summary: "Grant and business development support for young entrepreneurs (18–35).",
    description:
      "The NYDA Grant Programme provides financial and non-financial support to young South African entrepreneurs aged 18–35. Grants range from R1,000 up to R100,000 for viable business ideas, paired with business management training and a pitch assessment. The programme is a standing offer; applications are processed at an NYDA branch within 30 working days of receiving all required documents.",
    funder: "NYDA",
    funding_type: "Grant",
    support_type: "Grant + business development support",
    target_groups: ["Youth (18–35)", "South African citizens"],
    min_amount: 1000,
    max_amount: 100000,
    call_status: "standing",
    apply_url: "https://erp.nyda.gov.za/register",
    source_name: "NYDA — Grant Programme",
    source_url: "https://www.nyda.gov.za/Products-Services/NYDA-Grant-Programme.html",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "youth_owned", label: "Owner aged 18–35 (youth-owned)", type: "profile", field: "ownership_profile", values: ["Youth-owned (18 to 35)"], hint: "Confirmed from your onboarding ownership profile." },
      { key: "sa_citizen", label: "South African citizen / resident", type: "info", hint: "Confirmed with ID during application review." },
      { key: "bank_account", label: "Active business bank account", type: "profile", field: "has_bank_account", hint: "From your business profile." },
      { key: "turnover_under_cap", label: "Annual turnover under R750,000", type: "profile", field: "turnover_band", values: ["Under R50 000", "R50 000 to R250 000"], hint: "Businesses above this threshold are excluded." },
      { key: "cipc", label: "CIPC registration (if registered)", type: "document", document_type: "CIPC registration", hint: "Required for registered companies; informal traders may still apply." },
      { key: "bank_letter", label: "Bank confirmation letter", type: "document", document_type: "Bank confirmation letter" },
      { key: "business_plan", label: "Business plan / pitch (prepared at application)", type: "info", hint: "A 10-minute pitch is part of the application process." },
      { key: "bmt_training", label: "Business management training attended", type: "info", hint: "Proof of attendance is required before the grant is paid." },
    ],
    application_fields: [
      { key: "amount_requested", label: "Amount requested (R)", type: "number", required: true, placeholder: "e.g. 25000" },
      { key: "business_stage", label: "Is this an existing or start-up business?", type: "select", required: true, options: ["Existing business", "Start-up idea"] },
      { key: "use_of_funds", label: "How will you use the grant?", type: "textarea", required: true, placeholder: "Describe equipment, stock, or working capital needed." },
      { key: "training_attended", label: "I have attended / will attend business management training", type: "checkbox" },
      { key: "pitch_date", label: "Preferred pitch session date", type: "date" },
    ],
  },
  {
    name: "NYDA Voucher Programme",
    summary: "Business support vouchers for young entrepreneurs to access professional services.",
    description:
      "The NYDA Voucher Programme assists young entrepreneurs aged 18–35 to access business development support services (such as business plan drafting, accounting and marketing) through approved service providers, via vouchers of varying value.",
    funder: "NYDA",
    funding_type: "Voucher",
    support_type: "Voucher for professional business services",
    target_groups: ["Youth (18–35)"],
    max_amount: 19000,
    call_status: "standing",
    apply_url: "https://erp.nyda.gov.za/register",
    source_name: "NYDA — Voucher Programme",
    source_url: "https://www.nyda.gov.za/Products-Services/NYDA-Voucher-Programme.html",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "youth_owned", label: "Owner aged 18–35 (youth-owned)", type: "profile", field: "ownership_profile", values: ["Youth-owned (18 to 35)"] },
      { key: "sa_citizen", label: "South African citizen / resident", type: "info" },
      { key: "cipc", label: "CIPC registration (if registered)", type: "document", document_type: "CIPC registration" },
    ],
    application_fields: [
      { key: "amount_requested", label: "Voucher value needed (R)", type: "number", required: true, placeholder: "e.g. 9500" },
      { key: "service_needed", label: "Which service do you need?", type: "select", required: true, options: ["Business plan", "Accounting / bookkeeping", "Marketing", "Compliance", "Other"] },
      { key: "use_of_funds", label: "Describe what the service must achieve", type: "textarea", required: true },
    ],
  },
  {
    name: "SEFA Township & Rural Entrepreneurship Programme (TREP)",
    summary: "Funding package for township and rural enterprises, including a grant portion.",
    description:
      "TREP, delivered through SEFA on behalf of DSBD, supports township and rural enterprises with a funding package that can include a grant of up to R100,000 within an overall package of up to R1 million, alongside business support. It targets informal traders, spaza shops, micro-manufacturers and other township/rural enterprises.",
    funder: "SEFA",
    funding_type: "Mixed support",
    support_type: "Grant + loan + business support",
    target_groups: ["Township enterprises", "Rural enterprises", "Informal traders"],
    min_amount: 1000,
    max_amount: 1000000,
    call_status: "standing",
    apply_url: "https://systems.sefa.org.za/onlineapplication/admin/onlineapplication/OnlineApplicationTC.aspx",
    source_name: "DSBD / SEFA — Programmes",
    source_url: "https://www.destea.gov.za/wp-content/uploads/2023/06/DSBD-PROGRAMMESFNL.pdf",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "premises", label: "Operates in a township or rural area", type: "profile", field: "premises_type", values: ["Municipal stall or market", "Mobile or street trader", "Home-based", "Farm or rural land"] },
      { key: "cipc", label: "CIPC registration (if registered)", type: "document", document_type: "CIPC registration" },
      { key: "bank_letter", label: "Bank confirmation letter", type: "document", document_type: "Bank confirmation letter" },
      { key: "bbbee", label: "B-BBEE affidavit (if applicable)", type: "document", document_type: "B-BBEE affidavit" },
      { key: "business_plan", label: "Business plan / proposal", type: "info", hint: "Required as part of the application." },
    ],
    application_fields: [
      { key: "amount_requested", label: "Amount requested (R)", type: "number", required: true, placeholder: "e.g. 75000" },
      { key: "enterprise_type", label: "Enterprise type", type: "select", required: true, options: ["Spaza shop / general dealer", "Micro-manufacturer", "Street trader", "Services", "Other"] },
      { key: "use_of_funds", label: "What will the funding be used for?", type: "textarea", required: true },
      { key: "jobs_created", label: "Jobs to be created or retained", type: "number", placeholder: "e.g. 2" },
    ],
  },
  {
    name: "SEDA Co-operative Development Support Programme (CDSP)",
    summary: "Development support for cooperatives, including registration and capacity building.",
    description:
      "The SEDA Cooperative Development Support Programme assists cooperatives with registration, compliance and capacity-building support, and where eligible, access to grant funding for cooperative enterprises. Support is delivered through SEDA offices and partners.",
    funder: "SEDA",
    funding_type: "Mixed support",
    support_type: "Registration + capacity building + grant",
    target_groups: ["Co-operatives", "Groups of entrepreneurs"],
    max_amount: 350000,
    call_status: "standing",
    apply_url: "https://www.seda.org.za",
    source_name: "SEDA — Cooperative Development Support",
    source_url: "https://www.seda.org.za/Shared%20Documents/COOPERATIVE%20DEVELOPMENT%20SUPPORT%20-%20APPLICATION%20FORM%202024.pdf",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "coop", label: "Registered or forming a co-operative", type: "profile", field: "registration_type", values: ["Co-operative"] },
      { key: "cipc", label: "CIPC registration certificate", type: "document", document_type: "CIPC registration" },
      { key: "business_plan", label: "Co-operative business plan", type: "info" },
      { key: "members", label: "List of co-operative members", type: "info", hint: "Submitted with the application form." },
    ],
    application_fields: [
      { key: "amount_requested", label: "Amount requested (R)", type: "number", required: true },
      { key: "member_count", label: "Number of members", type: "number", required: true, placeholder: "e.g. 5" },
      { key: "use_of_funds", label: "Purpose of the support", type: "textarea", required: true },
    ],
  },
  {
    name: "DSBD Asset Assist Programme",
    summary: "Grant funding for MSMEs to acquire productive equipment and assets.",
    description:
      "The Asset Assist Programme, led by the Department of Small Business Development, offers grants of up to R250,000 for South African MSMEs to acquire productive assets and equipment that grow their operations. Applicants must operate a registered business and meet the programme's sector and ownership criteria.",
    funder: "DSBD",
    funding_type: "Grant",
    support_type: "Asset / equipment grant",
    target_groups: ["MSMEs", "Registered businesses"],
    max_amount: 250000,
    call_status: "standing",
    apply_url: "http://www.dsbd.gov.za/forms",
    source_name: "DSBD — Forms",
    source_url: "http://www.dsbd.gov.za/forms",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "registered", label: "Registered business (CIPC)", type: "document", document_type: "CIPC registration", hint: "A CIPC registration certificate is required." },
      { key: "tax_clearance", label: "Tax clearance certificate", type: "document", document_type: "Tax clearance certificate" },
      { key: "bank_letter", label: "Bank confirmation letter", type: "document", document_type: "Bank confirmation letter" },
      { key: "bbbee", label: "B-BBEE affidavit", type: "document", document_type: "B-BBEE affidavit" },
      { key: "asset_quote", label: "Quotation for the asset / equipment", type: "info", hint: "A pro-forma invoice is required with the application." },
    ],
    application_fields: [
      { key: "amount_requested", label: "Amount requested (R)", type: "number", required: true, placeholder: "e.g. 120000" },
      { key: "asset_description", label: "Asset / equipment to acquire", type: "text", required: true },
      { key: "supplier", label: "Supplier name", type: "text" },
      { key: "use_of_funds", label: "How will this asset grow your business?", type: "textarea", required: true },
    ],
  },
  {
    name: "IDC Funding for Growing Businesses",
    summary: "Debt and equity funding for established businesses, from R1 million upwards.",
    description:
      "The Industrial Development Corporation (IDC) funds start-up and existing businesses with debt and equity from a minimum of R1 million up to R1 billion, with tailored sector products. Suited to established businesses with a track record and bankable business plans.",
    funder: "IDC",
    funding_type: "Loan",
    support_type: "Debt / equity finance",
    target_groups: ["Established businesses", "Sector-specific enterprises"],
    min_amount: 1000000,
    max_amount: 1000000000,
    call_status: "standing",
    apply_url: "https://www.idc.co.za/what-we-offer-2/",
    source_name: "IDC — What we offer",
    source_url: "https://www.idc.co.za/what-we-offer-2/",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "turnover", label: "Established business with track record", type: "profile", field: "turnover_band", values: ["R250 000 to R1 million", "R1 million to R5 million", "Over R5 million"] },
      { key: "cipc", label: "CIPC registration certificate", type: "document", document_type: "CIPC registration" },
      { key: "financials", label: "Financial statements (prepared externally)", type: "info", hint: "Audited or management accounts are required." },
      { key: "business_plan", label: "Bankable business plan", type: "info" },
    ],
    application_fields: [
      { key: "amount_requested", label: "Amount requested (R)", type: "number", required: true, placeholder: "e.g. 2500000" },
      { key: "funding_type", label: "Funding type", type: "select", required: true, options: ["Debt / loan", "Equity", "Not sure"] },
      { key: "use_of_funds", label: "Project / purpose of funding", type: "textarea", required: true },
    ],
  },
  {
    name: "KZN Tourism & Film Enterprise Development Programme",
    summary: "Enterprise development support for tourism and film businesses in KwaZulu-Natal.",
    description:
      "A KwaZulu-Natal enterprise development programme supporting tourism and film businesses with business profile development, business plans and funding support. Applications are submitted through the KZN tourism enterprise development online portal, which requires a business profile and business plan as part of the application checklist.",
    funder: "Other",
    funding_type: "Mixed support",
    support_type: "Enterprise development support",
    target_groups: ["Tourism businesses", "Film businesses", "KZN enterprises"],
    max_amount: 250000,
    call_status: "open_call",
    apply_url: "https://visitkzn-sa.com/tourismprojectfund/kzn-tourism-film-enterprise-development-programme-online-application/",
    source_name: "Visit KZN — Tourism Project Fund",
    source_url: "https://visitkzn-sa.com/tourismprojectfund/kzn-tourism-film-enterprise-development-programme-online-application/",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "sector", label: "Tourism or film sector business", type: "profile", field: "sectors", values: ["Tourism", "Creative and crafts"] },
      { key: "cipc", label: "CIPC registration (if registered)", type: "document", document_type: "CIPC registration" },
      { key: "business_plan", label: "Business profile & business plan", type: "info", hint: "Required checklist item on the application form." },
      { key: "photos", label: "Business / premises photos", type: "document", document_type: "Photos" },
    ],
    application_fields: [
      { key: "amount_requested", label: "Support amount requested (R)", type: "number", required: true },
      { key: "sub_sector", label: "Sub-sector", type: "select", required: true, options: ["Accommodation", "Tour operator", "Restaurant / catering", "Film production", "Other"] },
      { key: "use_of_funds", label: "Describe the development support needed", type: "textarea", required: true },
    ],
  },
  {
    name: "Emfuleni Municipality LED Business Support",
    summary: "Local LED forum and enterprise support programmes facilitated by the Municipality.",
    description:
      "Through its Local Economic Development unit, Emfuleni Municipality facilitates an LED forum and enterprise support initiatives for local SMMEs, including connections to agency funding (such as NYDA) and supplier development opportunities. Enquiries and applications are made through the Municipality's LED Department. Confirm current available programmes and closing dates directly with the LED office, as these change during the year.",
    funder: "Municipality",
    funding_type: "Mixed support",
    support_type: "Local enterprise support & referrals",
    target_groups: ["Emfuleni businesses", "Local SMMEs"],
    call_status: "standing",
    apply_url: "",
    source_name: "Emfuleni LED Forum",
    source_url: "",
    source_verified_at: "2026-10-10",
    status: "open",
    requirements: [
      { key: "area", label: "Business located in Emfuleni", type: "profile", field: "area", hint: "From your business profile." },
      { key: "verified", label: "Verified business on the LED portal", type: "info", hint: "Verification is coordinated by the LED office." },
      { key: "cipc", label: "CIPC registration (if registered)", type: "document", document_type: "CIPC registration" },
    ],
    application_fields: [
      { key: "amount_requested", label: "Support / funding amount sought (R)", type: "number", required: true, placeholder: "e.g. 50000" },
      { key: "support_type", label: "Type of support needed", type: "select", required: true, options: ["Funding", "Market access", "Training", "Business space", "Compliance help"] },
      { key: "use_of_funds", label: "Describe your request to the LED office", type: "textarea", required: true },
    ],
  },
];

export const FIELD_TYPES = ["text", "number", "textarea", "select", "date", "checkbox"];