import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLedProfile } from "@/hooks/useLedProfile";
import PageHeader from "@/components/PageHeader";
import { SectionLoading } from "@/components/SectionStates";
import MultiSelect from "@/components/onboarding/MultiSelect";
import { SECTOR_OPTIONS, YES_NO_UNSURE, primarySector } from "@/lib/onboardingUtils";
import { TAX_STATUSES, CSD_LABELS, CSD_TONE, csdState, validCsdNumber, businessSectors, sizeClass, enterpriseForm } from "@/lib/msmeUtils";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const LABEL = "block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5";

export default function BusinessProfile() {
  const { business, loading: loadingProfile } = useLedProfile();
  const [form, setForm] = useState(null);
  const [wards, setWards] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    base44.entities.Ward.list().then((w) => setWards((w || []).sort((a, b) => a.number - b.number))).catch(() => {});
  }, []);

  useEffect(() => {
    if (business)
      setForm({
        name: business.name || "",
        sectors: businessSectors(business),
        area: business.area || "",
        ward: business.ward || "",
        ward_number: business.ward_number ?? null,
        description: business.description || "",
        phone: business.phone || "",
        csd_status: business.csd_status || "",
        csd_number: business.csd_number || "",
        tax_compliance_status: business.tax_compliance_status || "",
      });
  }, [business]);

  if (loadingProfile || !form) return <SectionLoading />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const csdNumber = form.csd_status === "Yes" ? form.csd_number.trim().toUpperCase() : "";

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast({ title: "Business name is required", variant: "destructive" });
    setBusy(true);
    try {
      const numberChanged = csdNumber !== (business.csd_number || "");
      await base44.entities.Business.update(business.id, {
        name: form.name.trim(),
        sectors: form.sectors,
        sector: form.sectors.length ? primarySector(form.sectors) : business.sector,
        area: form.area.trim(),
        ward: form.ward,
        ward_number: form.ward_number,
        description: form.description.trim(),
        phone: form.phone.trim(),
        csd_status: form.csd_status || undefined,
        csd_number: csdNumber,
        // A changed CSD number has to be checked again by an officer.
        ...(numberChanged ? { csd_verified: false } : {}),
        tax_compliance_status: form.tax_compliance_status || undefined,
      });
      toast({ title: "Profile saved", description: "Your business details have been updated." });
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const state = csdState(business);

  return (
    <div>
      <PageHeader title="My profile" subtitle="Keep your business details current. They appear in the local directory and on tender responses." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={save} className="led-box lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={LABEL}>Business name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="led-field" />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Sectors</label>
              <MultiSelect options={SECTOR_OPTIONS} value={form.sectors} onChange={(v) => set("sectors", v)} />
            </div>
            <div>
              <label className={LABEL}>Area</label>
              <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Sebokeng" className="led-field" />
            </div>
            <div>
              <label className={LABEL}>Ward</label>
              {wards.length > 0 ? (
                <select
                  className="led-field"
                  value={form.ward_number != null ? String(form.ward_number) : ""}
                  onChange={(e) => {
                    const n = e.target.value ? Number(e.target.value) : null;
                    set("ward_number", n);
                    set("ward", n ? `Ward ${n}` : "");
                  }}
                >
                  <option value="">I do not know my ward</option>
                  {wards.map((w) => (
                    <option key={w.id || w.number} value={w.number}>
                      {`Ward ${w.number}${w.area_name && w.area_name !== "To be confirmed" ? ` (${w.area_name})` : ""}`}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={form.ward} onChange={(e) => set("ward", e.target.value)} placeholder="e.g. Ward 12" className="led-field" />
              )}
            </div>
            <div>
              <label className={LABEL}>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="082 123 4567" className="led-field" />
            </div>
            <div>
              <label className={LABEL}>Tax compliance status</label>
              <select value={form.tax_compliance_status} onChange={(e) => set("tax_compliance_status", e.target.value)} className="led-field">
                <option value="">Select…</option>
                {TAX_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>On the Central Supplier Database (CSD)?</label>
              <select value={form.csd_status} onChange={(e) => set("csd_status", e.target.value)} className="led-field">
                <option value="">Select…</option>
                {YES_NO_UNSURE.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            {form.csd_status === "Yes" ? (
              <div>
                <label className={LABEL}>CSD supplier number</label>
                <input value={form.csd_number} onChange={(e) => set("csd_number", e.target.value.toUpperCase())} placeholder="MAAA1234567" className="led-field" />
                {form.csd_number && !validCsdNumber(form.csd_number) ? (
                  <span className="text-xs text-mute block mt-1">This does not match the usual MAAA1234567 pattern.</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div>
            <label className={LABEL}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What does your business do?" className="led-field" />
          </div>
          <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save profile
          </button>
        </form>

        <div className="space-y-4">
          <div className="led-box">
            <h3 className="text-sm font-bold text-ink mb-2">Verification status</h3>
            <p className="text-mute text-xs mb-3">Your business must be verified before you can respond to tenders or apply for funding.</p>
            <span
              className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                business.status === "verified" ? "bg-[#d9efe0] text-[#14532b]" : business.status === "rejected" ? "bg-[#f9dcd2] text-[#8a2c10]" : "bg-[#fbeccb] text-[#6b4d00]"
              }`}
            >
              {business.status}
            </span>
            {business.status === "verified" && business.verified_at && (
              <p className="text-mute text-xs mt-3">Verified on {new Date(business.verified_at).toLocaleDateString("en-ZA")}</p>
            )}
            {business.status === "pending" && (
              <p className="text-mute text-xs mt-3">An LED officer will review your registration. Upload your compliance documents to speed up verification.</p>
            )}
          </div>

          <div className="led-box">
            <h3 className="text-sm font-bold text-ink mb-2">CSD and compliance</h3>
            <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${CSD_TONE[state]}`}>{CSD_LABELS[state]}</span>
            {business.csd_checked_at ? (
              <p className="text-mute text-xs mt-2">Last checked {new Date(business.csd_checked_at).toLocaleDateString("en-ZA")}</p>
            ) : (
              <p className="text-mute text-xs mt-2">An LED officer confirms your CSD registration. Add your CSD number to speed this up.</p>
            )}
            <div className="text-xs text-mute mt-3 space-y-1">
              <div>Tax status: <b className="text-ink">{business.tax_compliance_status || "Not given"}</b></div>
              <div>Size class: <b className="text-ink">{sizeClass(business)}</b></div>
              <div>Formal or informal: <b className="text-ink">{enterpriseForm(business)}</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
