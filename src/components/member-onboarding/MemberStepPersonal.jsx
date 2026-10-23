import React from "react";
import WizardField from "@/components/onboarding/WizardField";

const LANGUAGES = ["English", "isiZulu", "Afrikaans"];
const GENDERS = ["Female", "Male", "Other", "Prefer not to say"];

export default function MemberStepPersonal({ form, setField }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Full name" required>
          <input
            value={form.full_name}
            onChange={(e) => setField("full_name", e.target.value)}
            placeholder="First and last name"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Cell number" required>
          <input
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="082 123 4567"
            inputMode="tel"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Alternative phone" hint="Optional — a secondary contact number.">
          <input
            value={form.alt_phone}
            onChange={(e) => setField("alt_phone", e.target.value)}
            placeholder="Optional"
            inputMode="tel"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Email">
          <input
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="you@example.com"
            className="led-field"
          />
        </WizardField>
        <WizardField label="Date of birth" hint="Optional.">
          <input
            type="date"
            value={form.date_of_birth || ""}
            onChange={(e) => setField("date_of_birth", e.target.value)}
            className="led-field"
          />
        </WizardField>
        <WizardField label="Gender" required>
          <select
            value={form.gender}
            onChange={(e) => setField("gender", e.target.value)}
            className="led-field"
          >
            <option value="">Select…</option>
            {GENDERS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </WizardField>
        <WizardField label="Preferred language" required>
          <select
            value={form.language}
            onChange={(e) => setField("language", e.target.value)}
            className="led-field"
          >
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </WizardField>
      </div>
    </div>
  );
}