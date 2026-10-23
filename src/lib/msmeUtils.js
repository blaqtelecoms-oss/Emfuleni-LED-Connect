// Automated MSME Data Capturing, Profiling and Management System
// MSME classification, CSD tracking, file import/export and duplicate detection helpers.

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import {
  SECTOR_OPTIONS,
  REGISTRATION_TYPES,
  STAFF_BANDS,
  TURNOVER_BANDS,
  primarySector,
} from "@/lib/onboardingUtils";

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export const SIZE_CLASSES = ["Micro", "Very small", "Small", "Medium"];

const STAFF_CLASS = { "Owner only": 0, "2 to 5": 0, "6 to 10": 1, "11 to 25": 2, "26 to 50": 2, "51 or more": 3 };
const TURNOVER_CLASS = {
  "Under R50 000": 0,
  "R50 000 to R250 000": 0,
  "R250 000 to R1 million": 0,
  "R1 million to R5 million": 1,
  "Over R5 million": 2,
};

// Indicative enterprise size class from the staff and turnover bands captured at
// registration. LED confirms the final class.
export function sizeClass(b) {
  if (!b || (!b.staff_band && !b.turnover_band)) return "Unclassified";
  const s = STAFF_CLASS[b.staff_band] ?? 0;
  const t = TURNOVER_CLASS[b.turnover_band] ?? 0;
  return SIZE_CLASSES[Math.max(s, t)];
}

export function enterpriseForm(b) {
  if (!b?.registration_type) return "Unknown";
  return b.registration_type === "Informal or not registered" ? "Informal" : "Formal";
}

const LEGACY_SECTOR = { Food: "Food and hospitality", Trades: "Trades and construction" };

export function businessSectors(b) {
  if (!b) return [];
  if (Array.isArray(b.sectors) && b.sectors.length) return b.sectors;
  if (b.sector) return [LEGACY_SECTOR[b.sector] || b.sector];
  return [];
}

export function primarySectorName(b) {
  return businessSectors(b)[0] || "Unclassified";
}

// ---------------------------------------------------------------------------
// Wards and location
// ---------------------------------------------------------------------------

export function wardNumberOf(b) {
  if (!b) return null;
  if (b.ward_number != null && !isNaN(Number(b.ward_number))) return Number(b.ward_number);
  const m = String(b.ward || "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

export function wardLabel(n) {
  return n == null ? "No ward" : `Ward ${n}`;
}

const TOWNSHIPS = ["evaton", "sebokeng", "sharpeville", "boipatong", "bophelong", "tshepiso", "zone "];
const URBAN = ["vereeniging", "vanderbijlpark", "three rivers", "roshnee", "duncanville", "residensia", "rust-ter-vaal", "cbd", "town"];

// township | rural | urban | mixed | unknown. A ward's own area type wins; then premises; then the area name.
export function areaType(b, wardsByNumber) {
  const w = wardsByNumber ? wardsByNumber[wardNumberOf(b)] : null;
  if (w?.area_type) return w.area_type;
  if (b?.premises_type === "Farm or rural land") return "rural";
  const a = `${b?.area || ""} ${w?.area_name || ""}`.toLowerCase();
  if (TOWNSHIPS.some((t) => a.includes(t))) return "township";
  if (URBAN.some((t) => a.includes(t))) return "urban";
  return "unknown";
}

export function townshipRural(b, wardsByNumber) {
  const t = areaType(b, wardsByNumber);
  return t === "township" || t === "rural";
}

// ---------------------------------------------------------------------------
// CSD and tax compliance
// ---------------------------------------------------------------------------

export const TAX_STATUSES = ["Compliant", "Not compliant", "Not registered", "Not sure"];

export function csdState(b) {
  if (b?.csd_verified) return "verified";
  if (b?.csd_status === "Yes" && b?.csd_number) return "number_recorded";
  if (b?.csd_status === "Yes") return "claimed";
  if (b?.csd_status === "No") return "not_on_csd";
  return "unknown";
}

export const CSD_LABELS = {
  verified: "On CSD, verified",
  number_recorded: "On CSD, number recorded",
  claimed: "Says on CSD, no number",
  not_on_csd: "Not on CSD",
  unknown: "CSD status unknown",
};

export const CSD_TONE = {
  verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  number_recorded: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  claimed: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  not_on_csd: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  unknown: "bg-soft text-mute",
};

// CSD supplier numbers look like MAAA0123456.
export function validCsdNumber(s) {
  return /^MAAA\d{7}$/i.test(String(s || "").replace(/\s/g, ""));
}

// ---------------------------------------------------------------------------
// Phone, text and number cleaning
// ---------------------------------------------------------------------------

export function cleanPhone(s) {
  let d = String(s || "").replace(/\D/g, "");
  if (!d) return { value: "", ok: true };
  if (d.startsWith("27") && d.length === 11) d = "0" + d.slice(2);
  if (d.length === 9) d = "0" + d;
  const ok = d.length === 10 && d.startsWith("0");
  return { value: ok ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : String(s).trim(), ok };
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const phoneKey = (s) => String(s || "").replace(/\D/g, "").slice(-9);

function numberFrom(s) {
  const n = Number(String(s ?? "").replace(/[^\d.]/g, ""));
  return isNaN(n) ? null : n;
}

export function staffBandFrom(s) {
  const text = String(s ?? "").trim();
  if (!text) return null;
  const exact = STAFF_BANDS.find((b) => b.toLowerCase() === text.toLowerCase());
  if (exact) return exact;
  const n = numberFrom(text);
  if (n == null) return undefined;
  if (n <= 1) return "Owner only";
  if (n <= 5) return "2 to 5";
  if (n <= 10) return "6 to 10";
  if (n <= 25) return "11 to 25";
  if (n <= 50) return "26 to 50";
  return "51 or more";
}

export function turnoverBandFrom(s) {
  const text = String(s ?? "").trim();
  if (!text) return null;
  const exact = TURNOVER_BANDS.find((b) => b.toLowerCase() === text.toLowerCase());
  if (exact) return exact;
  const n = numberFrom(text);
  if (n == null) return undefined;
  if (n < 50000) return TURNOVER_BANDS[0];
  if (n < 250000) return TURNOVER_BANDS[1];
  if (n < 1000000) return TURNOVER_BANDS[2];
  if (n < 5000000) return TURNOVER_BANDS[3];
  return TURNOVER_BANDS[4];
}

const SECTOR_SYNONYMS = {
  retail: "Retail", shop: "Retail", spaza: "Retail", trading: "Retail", wholesale: "Retail",
  food: "Food and hospitality", hospitality: "Food and hospitality", catering: "Food and hospitality", restaurant: "Food and hospitality", bakery: "Food and hospitality",
  trades: "Trades and construction", construction: "Trades and construction", building: "Trades and construction", plumbing: "Trades and construction", electrical: "Trades and construction", welding: "Trades and construction",
  services: "Services", service: "Services", cleaning: "Services", security: "Services", beauty: "Services", salon: "Services",
  agriculture: "Agriculture", farming: "Agriculture", agri: "Agriculture",
  manufacturing: "Manufacturing", production: "Manufacturing",
  transport: "Transport", logistics: "Transport", taxi: "Transport",
  tourism: "Tourism", travel: "Tourism", accommodation: "Tourism",
  creative: "Creative and crafts", crafts: "Creative and crafts", craft: "Creative and crafts", arts: "Creative and crafts", media: "Creative and crafts",
  technology: "Technology", ict: "Technology", it: "Technology", software: "Technology",
};

export function normalizeSector(s) {
  const t = String(s || "").trim().toLowerCase();
  if (!t) return null;
  const exact = SECTOR_OPTIONS.find((o) => o.toLowerCase() === t);
  if (exact) return exact;
  if (SECTOR_SYNONYMS[t]) return SECTOR_SYNONYMS[t];
  const hit = Object.keys(SECTOR_SYNONYMS).find((k) => t.includes(k));
  return hit ? SECTOR_SYNONYMS[hit] : null;
}

const REG_SYNONYMS = [
  [/informal|unregistered|none|not registered|street|spaza/i, "Informal or not registered"],
  [/sole|proprietor|sole trader/i, "Sole proprietor"],
  [/pty|\(pty\)|private company|ltd|limited|inc/i, "Private company (Pty) Ltd"],
  [/\bcc\b|close corp/i, "Close corporation (CC)"],
  [/co-?op|cooperative|co-operative/i, "Co-operative"],
  [/npc|npo|ngo|non-?profit/i, "NPC or NGO"],
  [/partner/i, "Partnership"],
];

export function normalizeRegistrationType(s) {
  const t = String(s || "").trim();
  if (!t) return null;
  const exact = REGISTRATION_TYPES.find((o) => o.toLowerCase() === t.toLowerCase());
  if (exact) return exact;
  const hit = REG_SYNONYMS.find(([re]) => re.test(t));
  return hit ? hit[1] : undefined;
}

// ---------------------------------------------------------------------------
// CSV and Excel reading, CSV / Excel / PDF writing
// ---------------------------------------------------------------------------

export function parseCsv(text) {
  let s = String(text || "").replace(/^\uFEFF/, "");
  const first = s.split(/\r?\n/)[0] || "";
  const delims = [",", ";", "\t"];
  const delim = delims.map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => String(c).trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => String(c).trim() !== "")) rows.push(row);
  return rows;
}

// Reads a CSV or Excel file and returns { headers, rows } (rows are arrays of strings).
export async function readTableFile(file) {
  const name = (file.name || "").toLowerCase();
  let aoa;
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
  } else {
    aoa = parseCsv(await file.text());
  }
  aoa = aoa.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (aoa.length === 0) return { headers: [], rows: [] };
  const headers = aoa[0].map((h, i) => String(h ?? "").trim() || `Column ${i + 1}`);
  const rows = aoa.slice(1).map((r) => headers.map((_, i) => String(r[i] ?? "").trim()));
  return { headers, rows };
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function toCsv(headers, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}

export function exportTable({ filename, title, headers, rows, format }) {
  const base = filename.replace(/\.[a-z]+$/i, "");
  if (format === "csv") {
    download(new Blob(["\uFEFF" + toCsv(headers, rows)], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
    return;
  }
  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((h, i) => ({ wch: Math.min(40, Math.max(String(h).length, ...rows.slice(0, 200).map((r) => String(r[i] ?? "").length)) + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${base}.xlsx`);
    return;
  }
  // PDF: simple paginated table, landscape A4
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  const cols = headers.length;
  const weights = headers.map((h, i) => Math.min(30, Math.max(String(h).length, ...rows.slice(0, 60).map((r) => String(r[i] ?? "").length), 6)));
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => ((W - M * 2) * w) / total);
  const stamp = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });
  let y = M;
  const head = () => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(20);
    doc.text(title || base, M, y + 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(110);
    doc.text(`Generated ${stamp} (SAST)`, M, y + 24);
    y += 40;
    doc.setFillColor(20, 100, 90); doc.rect(M, y, W - M * 2, 16, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    let x = M;
    headers.forEach((h, i) => { doc.text(doc.splitTextToSize(String(h), widths[i] - 6)[0], x + 3, y + 11); x += widths[i]; });
    y += 18;
    doc.setTextColor(30); doc.setFont("helvetica", "normal");
  };
  head();
  rows.forEach((r, idx) => {
    const lines = r.map((c, i) => doc.splitTextToSize(String(c ?? ""), widths[i] - 6).slice(0, 3));
    const h = Math.max(...lines.map((l) => l.length), 1) * 9 + 5;
    if (y + h > H - M) { doc.addPage(); y = M; head(); }
    if (idx % 2) { doc.setFillColor(244, 247, 246); doc.rect(M, y - 2, W - M * 2, h, "F"); }
    let x = M;
    lines.forEach((l, i) => { doc.setFontSize(7); doc.text(l, x + 3, y + 7); x += widths[i]; });
    y += h;
  });
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFontSize(7); doc.setTextColor(120);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 16, { align: "right" });
  }
  doc.save(`${base}.pdf`);
}

// ---------------------------------------------------------------------------
// Import: column mapping, cleaning and validation
// ---------------------------------------------------------------------------

export const IMPORT_FIELDS = [
  { key: "name", label: "Business name", required: true, aliases: ["business name", "name", "company", "enterprise", "msme", "msme name", "company name", "registered name"] },
  { key: "trading_name", label: "Trading name", aliases: ["trading name", "trading as", "t/a"] },
  { key: "registration_type", label: "Registration type", aliases: ["registration type", "reg type", "registration", "legal form", "entity type", "business type", "type of entity", "legal type"] },
  { key: "cipc_number", label: "CIPC / registration number", aliases: ["cipc", "cipc number", "registration number", "reg no", "reg number", "company registration", "company reg"] },
  { key: "owner_name", label: "Owner name", aliases: ["owner", "owner name", "contact person", "contact name", "director", "proprietor"] },
  { key: "owner_phone", label: "Cell / phone", aliases: ["phone", "cell", "cellphone", "mobile", "contact number", "tel", "telephone", "cell number", "phone number"] },
  { key: "owner_email", label: "Email", aliases: ["email", "e-mail", "email address"] },
  { key: "sector", label: "Sector", aliases: ["sector", "industry", "category", "type of business", "business sector", "activity"] },
  { key: "area", label: "Area / township", aliases: ["area", "township", "suburb", "location", "town", "settlement"] },
  { key: "ward", label: "Ward", aliases: ["ward", "ward no", "ward number"] },
  { key: "address", label: "Address", aliases: ["address", "street address", "physical address"] },
  { key: "staff_band", label: "Employees", aliases: ["employees", "no of employees", "number of employees", "staff", "staff count", "jobs"] },
  { key: "turnover_band", label: "Annual turnover", aliases: ["turnover", "annual turnover", "yearly turnover", "revenue"] },
  { key: "csd_number", label: "CSD supplier number", aliases: ["csd", "csd number", "csd no", "supplier number", "csd supplier number", "maaa"] },
  { key: "tax_compliance_status", label: "Tax compliance", aliases: ["tax", "tax status", "tax compliance", "sars status"] },
  { key: "year_started", label: "Year started", aliases: ["year started", "year established", "established", "start year", "year"] },
  { key: "municipal_reference", label: "Municipal record number", aliases: ["reference", "ref", "ref no", "record number", "record no", "id", "no", "number"] },
];

export function guessMapping(headers) {
  const mapping = {};
  const used = new Set();
  const lower = headers.map((h) => h.toLowerCase().trim());
  IMPORT_FIELDS.forEach((f) => {
    let idx = lower.findIndex((h, i) => !used.has(i) && f.aliases.includes(h));
    if (idx < 0) idx = lower.findIndex((h, i) => !used.has(i) && f.aliases.some((a) => a.length > 3 && h.includes(a)));
    if (idx >= 0) { mapping[f.key] = idx; used.add(idx); }
  });
  return mapping;
}

// Turn one raw row into a Business record plus a list of issues.
export function cleanImportRow(raw, mapping, ctx) {
  const get = (k) => (mapping[k] != null && mapping[k] >= 0 ? String(raw[mapping[k]] ?? "").trim() : "");
  const issues = [];
  const err = (m) => issues.push({ level: "error", msg: m });
  const warn = (m) => issues.push({ level: "warning", msg: m });
  const rec = { source: "municipal_import", claim_status: "unclaimed", status: "pending" };

  rec.name = get("name");
  if (!rec.name) err("Business name is missing.");
  const trading = get("trading_name"); if (trading) rec.trading_name = trading;

  const regRaw = get("registration_type");
  if (regRaw) {
    const r = normalizeRegistrationType(regRaw);
    if (r === undefined) warn(`Registration type "${regRaw}" was not recognised and was left blank.`);
    else if (r) rec.registration_type = r;
  }
  const cipc = get("cipc_number"); if (cipc) rec.cipc_number = cipc;

  const owner = get("owner_name"); if (owner) rec.owner_name = owner;
  const ph = get("owner_phone");
  if (ph) {
    const c = cleanPhone(ph);
    rec.owner_phone = c.value; rec.phone = c.value;
    if (!c.ok) warn(`Phone "${ph}" does not look like a South African number.`);
  }
  const em = get("owner_email");
  if (em) {
    if (/^\S+@\S+\.\S+$/.test(em)) rec.owner_email = em.toLowerCase();
    else warn(`Email "${em}" is not valid and was left blank.`);
  }

  const secRaw = get("sector");
  if (secRaw) {
    const parts = secRaw.split(/[;,/|]/).map((p) => p.trim()).filter(Boolean);
    const sectors = [];
    parts.forEach((p) => {
      const n = normalizeSector(p);
      if (n) { if (!sectors.includes(n)) sectors.push(n); } else warn(`Sector "${p}" was not recognised.`);
    });
    if (sectors.length) { rec.sectors = sectors; rec.sector = primarySector(sectors); }
  } else warn("No sector given.");

  const area = get("area"); if (area) rec.area = area;
  const address = get("address"); if (address) rec.address = address;
  const wardRaw = get("ward");
  if (wardRaw) {
    const n = Number((wardRaw.match(/\d+/) || [])[0]);
    if (n >= 1 && n <= (ctx?.maxWard || 99)) { rec.ward_number = n; rec.ward = `Ward ${n}`; }
    else warn(`Ward "${wardRaw}" is not a valid ward number.`);
  }
  if (!rec.area && rec.ward_number == null) warn("No area or ward given, so the record cannot appear in ward reports.");

  const staffRaw = get("staff_band");
  if (staffRaw) {
    const b = staffBandFrom(staffRaw);
    if (b === undefined) warn(`Employees "${staffRaw}" could not be read.`); else if (b) rec.staff_band = b;
  }
  const toRaw = get("turnover_band");
  if (toRaw) {
    const b = turnoverBandFrom(toRaw);
    if (b === undefined) warn(`Turnover "${toRaw}" could not be read.`); else if (b) rec.turnover_band = b;
  }
  const csd = get("csd_number").toUpperCase().replace(/\s/g, "");
  if (csd) {
    rec.csd_number = csd; rec.csd_status = "Yes"; rec.csd_verified = false;
    if (!validCsdNumber(csd)) warn(`CSD number "${csd}" does not match the usual MAAA1234567 pattern.`);
  }
  const taxRaw = get("tax_compliance_status");
  if (taxRaw) {
    const t = TAX_STATUSES.find((s) => s.toLowerCase() === taxRaw.toLowerCase()) || (/compliant|good|yes/i.test(taxRaw) ? "Compliant" : /not/i.test(taxRaw) ? "Not compliant" : null);
    if (t) rec.tax_compliance_status = t; else warn(`Tax status "${taxRaw}" was not recognised.`);
  }
  const yr = get("year_started");
  if (yr) {
    const y = Number((yr.match(/\d{4}/) || [])[0]);
    if (y >= 1900 && y <= new Date().getFullYear()) rec.year_started = y; else warn(`Year "${yr}" is not valid.`);
  }
  const ref = get("municipal_reference"); if (ref) rec.municipal_reference = ref;
  return { record: rec, issues };
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

export function buildDupIndex(list) {
  const idx = { cipc: new Map(), phone: new Map(), name: new Map() };
  (list || []).forEach((b) => addToDupIndex(idx, b));
  return idx;
}

export function addToDupIndex(idx, b) {
  const c = norm(b.cipc_number); if (c) idx.cipc.set(c, b);
  const p = phoneKey(b.owner_phone || b.phone); if (p.length >= 9) idx.phone.set(p, b);
  const n = norm(b.name); if (n.length > 2) idx.name.set(`${n}|${norm(b.area || b.ward)}`, b);
}

export function findDuplicate(idx, b) {
  const c = norm(b.cipc_number);
  if (c && idx.cipc.has(c)) return { reason: "Same CIPC number", match: idx.cipc.get(c) };
  const p = phoneKey(b.owner_phone || b.phone);
  if (p.length >= 9 && idx.phone.has(p)) return { reason: "Same phone number", match: idx.phone.get(p) };
  const n = norm(b.name);
  const key = `${n}|${norm(b.area || b.ward)}`;
  if (n.length > 2 && idx.name.has(key)) return { reason: "Same name and area", match: idx.name.get(key) };
  return null;
}

// Other records that look like the same MSME (for the merge tool).
export function findMatches(b, all) {
  const c = norm(b.cipc_number), p = phoneKey(b.owner_phone || b.phone), n = norm(b.name);
  return (all || []).filter((o) => {
    if (o.id === b.id || o.merged_into) return false;
    if (c && norm(o.cipc_number) === c) return true;
    if (p.length >= 9 && phoneKey(o.owner_phone || o.phone) === p) return true;
    return n.length > 2 && norm(o.name) === n;
  });
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export async function logAudit(user, action, entity, entityId, detail) {
  try {
    await base44.entities.AuditLog.create({
      action,
      actor: user?.id || "",
      actor_name: user?.full_name || user?.email || "",
      entity: entity || "",
      entity_id: entityId || "",
      detail: detail || "",
    });
  } catch {
    // The audit trail must never block the action itself.
  }
}

// ---------------------------------------------------------------------------
// Register columns (used for the table and exports)
// ---------------------------------------------------------------------------

export const REGISTER_HEADERS = [
  "Business name", "Trading name", "Registration type", "CIPC number", "Sector(s)", "Size class", "Formal or informal",
  "Area", "Ward", "Township or rural", "Owner", "Cell", "Email", "Staff", "Turnover", "Ownership profile",
  "CSD status", "CSD number", "CSD verified", "Tax compliance", "Verification status", "Source", "Municipal record no.", "Registered on",
];

export function registerRow(b, wardsByNumber) {
  const wn = wardNumberOf(b);
  return [
    b.name, b.trading_name || "", b.registration_type || "", b.cipc_number || "",
    businessSectors(b).join("; "), sizeClass(b), enterpriseForm(b),
    b.area || "", wn == null ? "" : `Ward ${wn}`, townshipRural(b, wardsByNumber) ? "Yes" : areaType(b, wardsByNumber) === "unknown" ? "Unknown" : "No",
    b.owner_name || "", b.owner_phone || b.phone || "", b.owner_email || "", b.staff_band || "", b.turnover_band || "",
    (b.ownership_profile || []).filter((o) => o !== "Prefer not to say").join("; "),
    CSD_LABELS[csdState(b)], b.csd_number || "", b.csd_verified ? "Yes" : "No", b.tax_compliance_status || "",
    b.status || "", (b.source || "self_registered").replace(/_/g, " "), b.municipal_reference || "",
    b.created_date ? new Date(b.created_date).toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg" }) : "",
  ];
}

export function countBy(list, fn) {
  const m = {};
  list.forEach((x) => {
    const keys = [].concat(fn(x));
    keys.forEach((k) => { m[k] = (m[k] || 0) + 1; });
  });
  return m;
}

// ---------------------------------------------------------------------------
// Loading and filtering
// ---------------------------------------------------------------------------

// Reads every record of an entity, a page at a time (the default list size is small).
export async function listAll(entity, sort = "-created_date", pageSize = 500, max = 20000) {
  const out = [];
  for (let skip = 0; skip < max; skip += pageSize) {
    const page = await entity.list(sort, pageSize, skip).catch(() => []);
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}

export function wardMap(wards) {
  const m = {};
  (wards || []).forEach((w) => { m[w.number] = w; });
  return m;
}

export const EMPTY_FILTERS = {
  q: "", status: "All", sector: "All", ward: "All", size: "All", form: "All", csd: "All", ownership: "All", source: "All", from: "", to: "",
};

export function filterBusinesses(list, f, wardsByNumber) {
  const q = (f.q || "").toLowerCase().trim();
  return (list || []).filter((b) => {
    if (b.merged_into) return false;
    if (f.status && f.status !== "All" && b.status !== f.status) return false;
    if (f.sector && f.sector !== "All" && !businessSectors(b).includes(f.sector)) return false;
    if (f.ward && f.ward !== "All") {
      const wn = wardNumberOf(b);
      if (f.ward === "none" ? wn != null : String(wn) !== String(f.ward)) return false;
    }
    if (f.size && f.size !== "All" && sizeClass(b) !== f.size) return false;
    if (f.form && f.form !== "All" && enterpriseForm(b) !== f.form) return false;
    if (f.csd && f.csd !== "All" && csdState(b) !== f.csd) return false;
    if (f.ownership && f.ownership !== "All" && !(b.ownership_profile || []).includes(f.ownership)) return false;
    if (f.source && f.source !== "All" && (b.source || "self_registered") !== f.source) return false;
    if (f.from && b.created_date && new Date(b.created_date) < new Date(f.from)) return false;
    if (f.to && b.created_date && new Date(b.created_date) > new Date(`${f.to}T23:59:59`)) return false;
    if (q) {
      const hay = `${b.name} ${b.trading_name || ""} ${b.area || ""} ${b.ward || ""} ${b.owner_name || ""} ${b.cipc_number || ""} ${b.csd_number || ""} ${b.owner_phone || b.phone || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// Merge a duplicate into the record that stays. Fills gaps only, never overwrites.
export function mergePatch(keep, drop) {
  const patch = {};
  const scalar = ["trading_name", "registration_type", "cipc_number", "year_started", "area", "ward", "ward_number", "address", "latitude", "longitude",
    "description", "owner_name", "owner_phone", "owner_email", "premises_type", "staff_band", "turnover_band", "has_bank_account", "vat_status",
    "csd_status", "csd_number", "csd_checked_at", "csd_checked_by", "tax_compliance_status", "tax_checked_at", "phone", "municipal_reference", "import_batch"];
  scalar.forEach((k) => {
    const have = keep[k] !== undefined && keep[k] !== null && keep[k] !== "";
    const other = drop[k] !== undefined && drop[k] !== null && drop[k] !== "";
    if (!have && other) patch[k] = drop[k];
  });
  if (!keep.csd_verified && drop.csd_verified && (patch.csd_number || keep.csd_number) === drop.csd_number) patch.csd_verified = true;
  ["sectors", "ownership_profile", "support_needed", "trading_days"].forEach((k) => {
    const u = Array.from(new Set([...(keep[k] || []), ...(drop[k] || [])]));
    if (u.length !== (keep[k] || []).length) patch[k] = u;
  });
  if (!keep.sector && drop.sector) patch.sector = drop.sector;
  if (keep.owner) patch.claim_status = "claimed";
  return patch;
}
