import React from "react";
import WizardField from "./WizardField";
import MultiSelect from "./MultiSelect";
import { PREMISES_TYPES, TRADING_DAYS } from "@/lib/onboardingUtils";

export default function StepPremises({ form, setField }) {
  return (
    <div className="space-y-4">
      <WizardField label="Premises type" required>
        <select className="led-field" value={form.premises_type || ""} onChange={(e) => setField("premises_type", e.target.value)}>
          <option value="">Select…</option>
          {PREMISES_TYPES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </WizardField>
      <WizardField label="Street address">
        <input className="led-field" value={form.address || ""} onChange={(e) => setField("address", e.target.value)} />
      </WizardField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Latitude" hint="Optional — used for the business map">
          <input type="number" step="any" className="led-field" value={form.latitude ?? ""} onChange={(e) => setField("latitude", e.target.value ? Number(e.target.value) : null)} />
        </WizardField>
        <WizardField label="Longitude" hint="Optional — used for the business map">
          <input type="number" step="any" className="led-field" value={form.longitude ?? ""} onChange={(e) => setField("longitude", e.target.value ? Number(e.target.value) : null)} />
        </WizardField>
      </div>
      <WizardField label="Trading days">
        <MultiSelect options={TRADING_DAYS} value={form.trading_days || []} onChange={(v) => setField("trading_days", v)} />
      </WizardField>
    </div>
  );
}