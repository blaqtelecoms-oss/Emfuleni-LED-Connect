import React from "react";
import WizardField from "@/components/onboarding/WizardField";
import MultiSelect from "@/components/onboarding/MultiSelect";
import { EMPLOYMENT_STATUS, INCOME_BANDS, MEMBER_SKILLS } from "@/lib/onboardingUtils";

export default function MemberStepEmployment({ form, setField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Employment status" required>
          <select
            value={form.employment_status}
            onChange={(e) => setField("employment_status", e.target.value)}
            className="led-field"
          >
            <option value="">Select…</option>
            {EMPLOYMENT_STATUS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </WizardField>
        <WizardField label="Occupation" hint="Your job or trade, if any.">
          <input
            value={form.occupation}
            onChange={(e) => setField("occupation", e.target.value)}
            placeholder="e.g. Welder, student, none"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Monthly household income" hint="A band helps us match support — optional.">
          <select
            value={form.income_band}
            onChange={(e) => setField("income_band", e.target.value)}
            className="led-field"
          >
            <option value="">Select…</option>
            {INCOME_BANDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </WizardField>
      </div>
      <WizardField label="Skills" hint="Choose any that apply — we use them to match you with jobs.">
        <MultiSelect
          options={MEMBER_SKILLS}
          value={form.skills}
          onChange={(v) => setField("skills", v)}
        />
      </WizardField>
    </div>
  );
}