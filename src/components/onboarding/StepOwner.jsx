import React from "react";
import WizardField from "./WizardField";
import MultiSelect from "./MultiSelect";
import { OWNERSHIP_OPTIONS } from "@/lib/onboardingUtils";
import { Lock } from "lucide-react";

export default function StepOwner({ form, setField }) {
  return (
    <div className="space-y-4">
      <div className="led-box bg-soft/60 flex items-start gap-2.5 text-xs text-mute">
        <Lock className="w-4 h-4 text-brand flex-none mt-0.5" />
        <span>Your ID number is stored privately and is visible only to you and LED officers. It never appears in the public directory.</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Owner full name" required>
          <input className="led-field" value={form.owner_name || ""} onChange={(e) => setField("owner_name", e.target.value)} />
        </WizardField>
        <WizardField label="Owner ID number" required hint="South African ID or passport number">
          <input className="led-field" value={form.owner_id_number || ""} onChange={(e) => setField("owner_id_number", e.target.value)} />
        </WizardField>
        <WizardField label="Owner phone">
          <input className="led-field" value={form.owner_phone || ""} onChange={(e) => setField("owner_phone", e.target.value)} placeholder="082 123 4567" />
        </WizardField>
        <WizardField label="Owner email">
          <input type="email" className="led-field" value={form.owner_email || ""} onChange={(e) => setField("owner_email", e.target.value)} />
        </WizardField>
        <WizardField label="Number of owners">
          <input type="number" min={1} className="led-field" value={form.number_of_owners ?? 1} onChange={(e) => setField("number_of_owners", Number(e.target.value) || 1)} />
        </WizardField>
      </div>
      <WizardField label="Ownership profile" hint="Select all that apply. This helps with targeted support and reporting.">
        <MultiSelect options={OWNERSHIP_OPTIONS} value={form.ownership_profile || []} onChange={(v) => setField("ownership_profile", v)} />
      </WizardField>
    </div>
  );
}