import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WizardField from "./WizardField";
import MultiSelect from "./MultiSelect";
import { SECTOR_OPTIONS, REGISTRATION_TYPES } from "@/lib/onboardingUtils";

export default function StepBusiness({ form, setField }) {
  const [wards, setWards] = useState([]);
  useEffect(() => {
    base44.entities.Ward.list().then((w) => setWards((w || []).sort((a, b) => a.number - b.number))).catch(() => {});
  }, []);
  const showCipc = form.registration_type && form.registration_type !== "Informal or not registered";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Business name" required>
          <input className="led-field" value={form.name || ""} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Thandi's Bakery" />
        </WizardField>
        <WizardField label="Trading name" hint="If different from the registered name">
          <input className="led-field" value={form.trading_name || ""} onChange={(e) => setField("trading_name", e.target.value)} />
        </WizardField>
        <WizardField label="Registration type" required>
          <select className="led-field" value={form.registration_type || ""} onChange={(e) => setField("registration_type", e.target.value)}>
            <option value="">Select…</option>
            {REGISTRATION_TYPES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </WizardField>
        <WizardField label="Year started">
          <input type="number" className="led-field" value={form.year_started ?? ""} onChange={(e) => setField("year_started", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 2019" />
        </WizardField>
        {showCipc ? (
          <WizardField label="CIPC registration number" className="sm:col-span-2">
            <input className="led-field" value={form.cipc_number || ""} onChange={(e) => setField("cipc_number", e.target.value)} />
          </WizardField>
        ) : null}
      </div>
      <WizardField label="Sectors" required hint="Select all that apply. These determine which compliance documents you need.">
        <MultiSelect options={SECTOR_OPTIONS} value={form.sectors || []} onChange={(v) => setField("sectors", v)} />
      </WizardField>
      <WizardField label="Description">
        <textarea className="led-field" rows={3} value={form.description || ""} onChange={(e) => setField("description", e.target.value)} placeholder="What does your business do?" />
      </WizardField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <WizardField label="Area" required>
          <input className="led-field" value={form.area || ""} onChange={(e) => setField("area", e.target.value)} placeholder="e.g. Madadeni" />
        </WizardField>
        <WizardField label="Ward">
          {wards.length > 0 ? (
            <select
              className="led-field"
              value={form.ward_number != null ? String(form.ward_number) : ""}
              onChange={(e) => {
                const n = e.target.value ? Number(e.target.value) : null;
                setField("ward_number", n);
                setField("ward", n ? `Ward ${n}` : "");
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
            <input className="led-field" value={form.ward || ""} onChange={(e) => setField("ward", e.target.value)} placeholder="e.g. Ward 12" />
          )}
        </WizardField>
      </div>
    </div>
  );
}