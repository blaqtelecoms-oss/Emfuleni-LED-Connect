import React from "react";
import WizardField from "./WizardField";
import MultiSelect from "./MultiSelect";
import { STAFF_BANDS, TURNOVER_BANDS, SUPPORT_OPTIONS, YES_NO_UNSURE } from "@/lib/onboardingUtils";
import { TAX_STATUSES, validCsdNumber } from "@/lib/msmeUtils";

export default function StepSize({ form, setField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Staff count" required>
          <select className="led-field" value={form.staff_band || ""} onChange={(e) => setField("staff_band", e.target.value)}>
            <option value="">Select…</option>
            {STAFF_BANDS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </WizardField>
        <WizardField label="Yearly turnover" required>
          <select className="led-field" value={form.turnover_band || ""} onChange={(e) => setField("turnover_band", e.target.value)}>
            <option value="">Select…</option>
            {TURNOVER_BANDS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </WizardField>
        <WizardField label="Business bank account?" required>
          <div className="flex gap-2 pt-1">
            {["Yes", "No"].map((o) => (
              <button type="button" key={o} onClick={() => setField("has_bank_account", o === "Yes")} className={`led-chip ${form.has_bank_account === (o === "Yes") ? "on" : ""}`}>
                {o}
              </button>
            ))}
          </div>
        </WizardField>
        <WizardField label="VAT registered?">
          <select className="led-field" value={form.vat_status || ""} onChange={(e) => setField("vat_status", e.target.value)}>
            <option value="">Select…</option>
            {YES_NO_UNSURE.map((s) => <option key={s}>{s}</option>)}
          </select>
        </WizardField>
        <WizardField label="On the Central Supplier Database (CSD)?">
          <select className="led-field" value={form.csd_status || ""} onChange={(e) => setField("csd_status", e.target.value)}>
            <option value="">Select…</option>
            {YES_NO_UNSURE.map((s) => <option key={s}>{s}</option>)}
          </select>
        </WizardField>
        {form.csd_status === "Yes" ? (
          <WizardField label="CSD supplier number" hint="Looks like MAAA1234567. LED will verify it.">
            <input
              className="led-field"
              value={form.csd_number || ""}
              onChange={(e) => setField("csd_number", e.target.value.toUpperCase())}
              placeholder="MAAA1234567"
            />
            {form.csd_number && !validCsdNumber(form.csd_number) ? (
              <span className="text-xs text-mute block mt-1">This does not match the usual pattern. Check it, or leave it for LED to confirm.</span>
            ) : null}
          </WizardField>
        ) : null}
        <WizardField label="Tax compliance status" hint="Your status with SARS, if you know it.">
          <select className="led-field" value={form.tax_compliance_status || ""} onChange={(e) => setField("tax_compliance_status", e.target.value)}>
            <option value="">Select…</option>
            {TAX_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </WizardField>
      </div>
      <WizardField label="Support needed" hint="Select all that apply.">
        <MultiSelect options={SUPPORT_OPTIONS} value={form.support_needed || []} onChange={(v) => setField("support_needed", v)} />
      </WizardField>
    </div>
  );
}