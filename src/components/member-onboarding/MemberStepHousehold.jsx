import React from "react";
import WizardField from "@/components/onboarding/WizardField";

const MARITAL = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
  "Living together",
  "Prefer not to say",
];

export default function MemberStepHousehold({ form, setField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="People in your household" required hint="Everyone living with you, including yourself.">
          <input
            type="number"
            min="1"
            value={form.household_size}
            onChange={(e) => setField("household_size", e.target.value)}
            placeholder="e.g. 4"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Dependants" hint="People who rely on your income, including children.">
          <input
            type="number"
            min="0"
            value={form.dependants_count}
            onChange={(e) => setField("dependants_count", e.target.value)}
            placeholder="e.g. 2"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Marital status" className="sm:col-span-2">
          <select
            value={form.marital_status}
            onChange={(e) => setField("marital_status", e.target.value)}
            className="led-field"
          >
            <option value="">Select…</option>
            {MARITAL.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </WizardField>
      </div>
    </div>
  );
}