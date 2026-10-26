import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { evaluateChecklist } from "@/lib/fundingUtils";
import { formatRand } from "@/lib/ledUtils";
import { Loader2, Upload, Eye, FileText, Lock, Landmark, CheckCircle2, AlertCircle } from "lucide-react";

export default function FundingApplyDialog({ program, business, docs, onSubmitted, onClose }) {
  const [docList, setDocList] = useState(docs || []);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const fileRefs = useRef({});

  useEffect(() => {
    if (program) setForm({});
  }, [program]);

  // Required document items (from programme requirements)
  const docRequirements = useMemo(
    () => (program?.requirements || []).filter((r) => r.type === "document"),
    [program]
  );

  const docByType = useMemo(() => {
    const map = {};
    docList.forEach((d) => {
      if (!map[d.document_type] || (d.version || 1) > (map[d.document_type].version || 0)) map[d.document_type] = d;
    });
    return map;
  }, [docList]);

  if (!program) return null;

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (req) => {
    const file = fileRefs.current[req.document_type]?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5 MB.", variant: "destructive" });
      return;
    }
    setUploadingType(req.document_type);
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.BusinessDocument.create({
        business: business.id,
        document_type: req.document_type,
        file: file_uri,
        file_name: file.name,
        file_size: file.size,
        status: "uploaded",
        version: 1,
      });
      const refreshed = await base44.entities.BusinessDocument.filter({ business: business.id }).catch(() => []);
      setDocList(refreshed);
      toast({ title: "Uploaded", description: req.label });
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      setUploadingType(null);
    }
  };

  const viewDoc = async (doc) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file });
      window.open(signed_url, "_blank");
    } catch (e) {
      toast({ title: "Couldn't open document", description: e.message, variant: "destructive" });
    }
  };

  const missingRequired = (program.application_fields || []).filter(
    (f) => f.required && f.type !== "checkbox" && !(form[f.key] != null && String(form[f.key]).trim() !== "")
  );

  const submit = async (e) => {
    e.preventDefault();
    if (missingRequired.length > 0) {
      toast({ title: "Please complete required fields", description: missingRequired.map((f) => f.label).join(", "), variant: "destructive" });
      return;
    }
    const amountRaw = form.amount_requested;
    const amount = amountRaw ? Number(amountRaw) : null;
    if (amount != null && isNaN(amount)) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (amount != null && program.max_amount && amount > program.max_amount) {
      toast({ title: `Maximum for this programme is ${formatRand(program.max_amount)}`, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const attached = Object.values(docByType).map((d) => d.id);
      const checklist = evaluateChecklist(program, business, docList).map((c) => ({ key: c.key, label: c.label, status: c.status }));
      const purpose = form.use_of_funds || form.purpose || "";
      await base44.entities.FundingApplication.create({
        program: program.id,
        business: business.id,
        requested_amount: amount ?? 0,
        purpose: String(purpose).trim(),
        form_data: form,
        attached_documents: attached,
        checklist_snapshot: { items: checklist },
        status: "submitted",
      });
      toast({ title: "Application submitted", description: "You'll be notified when a decision is made." });
      onSubmitted();
    } catch (err) {
      toast({ title: "Application failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!program} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-line">
          <DialogTitle className="pr-6">Apply: {program.name}</DialogTitle>
          <DialogDescription>
            {program.funder}{program.max_amount != null ? ` · Up to ${formatRand(program.max_amount)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto px-5 py-4 space-y-4">
            <div className="led-box bg-soft/40 flex items-start gap-2.5 text-xs text-mute">
              <Lock className="w-4 h-4 text-brand flex-none mt-0.5" />
              <span>Your application and documents are stored privately and are visible only to you and LED officers. You can also apply on the official portal — this LED portal application is forwarded to the LED office for review.</span>
            </div>

            {/* Programme-specific fields */}
            <div className="space-y-3">
              {(program.application_fields || []).map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">
                    {f.label}{f.required && <span className="text-red-500"> *</span>}
                  </label>
                  {f.type === "text" && (
                    <input className="led-field" value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} />
                  )}
                  {f.type === "number" && (
                    <input type="number" className="led-field" value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} />
                  )}
                  {f.type === "textarea" && (
                    <textarea rows={3} className="led-field" value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} placeholder={f.placeholder} />
                  )}
                  {f.type === "select" && (
                    <select className="led-field" value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)}>
                      <option value="">Select…</option>
                      {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                  {f.type === "date" && (
                    <input type="date" className="led-field" value={form[f.key] || ""} onChange={(e) => setField(f.key, e.target.value)} />
                  )}
                  {f.type === "checkbox" && (
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setField(f.key, e.target.checked)} className="w-4 h-4 accent-[hsl(var(--green))]" />
                      <span>{f.label}</span>
                    </label>
                  )}
                </div>
              ))}
            </div>

            {/* Supporting documents */}
            {docRequirements.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand" /> Supporting documents
                </h3>
                <div className="space-y-2">
                  {docRequirements.map((req) => {
                    const doc = docByType[req.document_type];
                    return (
                      <div key={req.document_type} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-line bg-shell/40">
                        <FileText className="w-4 h-4 text-brand flex-none" />
                        <div className="min-w-0 flex-1">
                          <b className="text-xs text-ink block">{req.label}</b>
                          {doc ? (
                            <span className="text-[11px] text-mute flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {doc.file_name || "Uploaded"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Not uploaded yet
                            </span>
                          )}
                        </div>
                        <input
                          ref={(el) => (fileRefs.current[req.document_type] = el)}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={() => upload(req)}
                        />
                        {doc && (
                          <button type="button" onClick={() => viewDoc(doc)} className="led-btn led-btn-s led-btn-l flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => fileRefs.current[req.document_type]?.click()}
                          disabled={busy && uploadingType === req.document_type}
                          className="led-btn led-btn-s flex items-center gap-1"
                        >
                          {busy && uploadingType === req.document_type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {doc ? "Replace" : "Upload"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-line bg-shell/60">
            <button type="submit" disabled={busy} className="led-btn w-full flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
              Submit application
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}