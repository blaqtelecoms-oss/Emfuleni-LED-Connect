import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { FUNDERS, FUNDING_TYPES, CALL_STATUSES } from "@/lib/fundingUtils";
import { Loader2, Save, Trash2 } from "lucide-react";

const toLocalDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const REQUIREMENT_TEMPLATE = [
  { key: "cipc", label: "CIPC registration certificate", type: "document", document_type: "CIPC registration", hint: "Required document." },
  { key: "bank_letter", label: "Bank confirmation letter", type: "document", document_type: "Bank confirmation letter" },
  { key: "youth", label: "Owner aged 18–35", type: "profile", field: "ownership_profile", values: ["Youth-owned (18 to 35)"] },
  { key: "plan", label: "Business plan", type: "info", hint: "Required at application." },
];
const FIELD_TEMPLATE = [
  { key: "amount_requested", label: "Amount requested (R)", type: "number", required: true, placeholder: "e.g. 50000" },
  { key: "use_of_funds", label: "How will you use the funding?", type: "textarea", required: true },
];

const EMPTY = {
  name: "",
  summary: "",
  description: "",
  funder: "Other",
  funding_type: "Grant",
  support_type: "",
  target_groups: "",
  min_amount: "",
  max_amount: "",
  call_status: "standing",
  deadline: "",
  apply_url: "",
  source_url: "",
  source_name: "",
  source_verified_at: "",
  status: "open",
  requirements: REQUIREMENT_TEMPLATE,
  application_fields: FIELD_TEMPLATE,
};

export default function ProgrammeFormDialog({ program, onSaved, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [reqJson, setReqJson] = useState("");
  const [fieldJson, setFieldJson] = useState("");
  const [busy, setBusy] = useState(false);
  const editing = !!program;

  useEffect(() => {
    if (program) {
      setForm({
        ...EMPTY,
        ...program,
        target_groups: Array.isArray(program.target_groups) ? program.target_groups.join(", ") : "",
        min_amount: program.min_amount ?? "",
        max_amount: program.max_amount ?? "",
        deadline: toLocalDate(program.deadline),
        source_verified_at: toLocalDate(program.source_verified_at),
        requirements: program.requirements || REQUIREMENT_TEMPLATE,
        application_fields: program.application_fields || FIELD_TEMPLATE,
      });
    }
    setReqJson(JSON.stringify(program?.requirements || REQUIREMENT_TEMPLATE, null, 2));
    setFieldJson(JSON.stringify(program?.application_fields || FIELD_TEMPLATE, null, 2));
  }, [program]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    let requirements, application_fields;
    try {
      requirements = JSON.parse(reqJson || "[]");
      application_fields = JSON.parse(fieldJson || "[]");
    } catch {
      return toast({ title: "Invalid JSON", description: "Check the requirements / fields JSON blocks.", variant: "destructive" });
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        funder: form.funder,
        funding_type: form.funding_type || null,
        support_type: form.support_type.trim(),
        target_groups: form.target_groups.split(",").map((s) => s.trim()).filter(Boolean),
        min_amount: form.min_amount ? Number(form.min_amount) : null,
        max_amount: form.max_amount ? Number(form.max_amount) : null,
        call_status: form.call_status,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        apply_url: form.apply_url.trim(),
        source_url: form.source_url.trim(),
        source_name: form.source_name.trim(),
        source_verified_at: form.source_verified_at || null,
        status: form.status,
        requirements,
        application_fields,
      };
      if (editing) await base44.entities.Program.update(program.id, payload);
      else await base44.entities.Program.create(payload);
      toast({ title: editing ? "Programme updated" : "Programme added" });
      onSaved();
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await base44.entities.Program.delete(program.id);
      toast({ title: "Programme removed" });
      onSaved();
    } catch (err) {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-line">
          <DialogTitle className="pr-6">{editing ? "Edit programme" : "Add funding programme"}</DialogTitle>
          <DialogDescription>Maintain sourced programme details and the application form fields.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto px-5 py-4 space-y-3">
            <div>
              <Label>Programme name *</Label>
              <input className="led-field" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Summary</Label>
              <input className="led-field" value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One-line summary" />
            </div>
            <div>
              <Label>Full description</Label>
              <textarea rows={3} className="led-field" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Funder</Label>
                <select className="led-field" value={form.funder} onChange={(e) => set("funder", e.target.value)}>
                  {FUNDERS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label>Funding type</Label>
                <select className="led-field" value={form.funding_type} onChange={(e) => set("funding_type", e.target.value)}>
                  {FUNDING_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Support type</Label>
              <input className="led-field" value={form.support_type} onChange={(e) => set("support_type", e.target.value)} placeholder="e.g. Grant + business support" />
            </div>
            <div>
              <Label>Target groups (comma-separated)</Label>
              <input className="led-field" value={form.target_groups} onChange={(e) => set("target_groups", e.target.value)} placeholder="e.g. Youth, Co-operatives" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min amount (R)</Label>
                <input type="number" className="led-field" value={form.min_amount} onChange={(e) => set("min_amount", e.target.value)} />
              </div>
              <div>
                <Label>Max amount (R)</Label>
                <input type="number" className="led-field" value={form.max_amount} onChange={(e) => set("max_amount", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Availability</Label>
                <select className="led-field" value={form.call_status} onChange={(e) => set("call_status", e.target.value)}>
                  {CALL_STATUSES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Closing date (if open call)</Label>
                <input type="date" className="led-field" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Official apply URL</Label>
              <input className="led-field" value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label>Source name</Label>
              <input className="led-field" value={form.source_name} onChange={(e) => set("source_name", e.target.value)} placeholder="e.g. NYDA — Grant Programme" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source URL</Label>
                <input className="led-field" value={form.source_url} onChange={(e) => set("source_url", e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <Label>Verified date</Label>
                <input type="date" className="led-field" value={form.source_verified_at} onChange={(e) => set("source_verified_at", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <select className="led-field" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Requirements (JSON)</Label>
              <textarea
                rows={5}
                className="led-field font-mono text-[11px]"
                value={reqJson}
                onChange={(e) => setReqJson(e.target.value)}
                spellCheck={false}
              />
              <p className="text-[11px] text-mute mt-1">Each item: key, label, type (document|profile|info), optional field / document_type / values / hint.</p>
            </div>
            <div>
              <Label>Application form fields (JSON)</Label>
              <textarea
                rows={5}
                className="led-field font-mono text-[11px]"
                value={fieldJson}
                onChange={(e) => setFieldJson(e.target.value)}
                spellCheck={false}
              />
              <p className="text-[11px] text-mute mt-1">Each item: key, label, type (text|number|textarea|select|date|checkbox), required?, options?, placeholder?.</p>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-line bg-shell/60 flex items-center gap-2">
            {editing && (
              <button type="button" onClick={remove} disabled={busy} className="led-btn led-btn-r led-btn-s flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
            <button type="submit" disabled={busy} className="led-btn flex-1 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? "Save changes" : "Add programme"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }) {
  return <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">{children}</label>;
}