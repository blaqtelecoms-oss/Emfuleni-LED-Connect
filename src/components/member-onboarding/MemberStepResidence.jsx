import React from "react";
import WizardField from "@/components/onboarding/WizardField";

const HOUSING = [
  "Own",
  "Rent",
  "Family home",
  "Municipal housing",
  "Informal dwelling",
  "Other",
];

export default function MemberStepResidence({ form, setField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Area / suburb" required>
          <input
            value={form.area}
            onChange={(e) => setField("area", e.target.value)}
            placeholder="e.g. Madadeni"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Ward" hint="Optional — your municipal ward number.">
          <input
            value={form.ward}
            onChange={(e) => setField("ward", e.target.value)}
            placeholder="e.g. Ward 12"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Street address" className="sm:col-span-2">
          <input
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="House number and street"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Housing situation" required>
          <select
            value={form.housing_tenure}
            onChange={(e) => setField("housing_tenure", e.target.value)}
            className="led-field"
          >
            <option value="">Select…</option>
            {HOUSING.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </WizardField>
        <WizardField label="Years in this area" hint="Optional.">
          <input
            type="number"
            min="0"
            value={form.years_in_area}
            onChange={(e) => setField("years_in_area", e.target.value)}
            placeholder="e.g. 5"
            className="led-field"
          />
        </WizardField>
      </div>
    </div>
  );
}