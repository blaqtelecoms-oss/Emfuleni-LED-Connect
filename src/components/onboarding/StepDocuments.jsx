import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WizardField from "./WizardField";
import { ruleApplies, requirementBadge } from "@/lib/onboardingUtils";
import { SectionLoading } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { Upload, Eye, Loader2, FileText, ShieldCheck, Lock } from "lucide-react";

export default function StepDocuments({ form, setField, businessId, applicationId, onSubmit, submitting }) {
  const [rules, setRules] = useState(null);
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const fileRefs = useRef({});

  const load = async () => {
    const [r, d] = await Promise.all([
      base44.entities.DocumentRule.filter({ active: true }).catch(() => []),
      base44.entities.BusinessDocument.filter({ application: applicationId }).catch(() => []),
    ]);
    setRules(r);
    setDocs(d);
  };

  useEffect(() => {
    load();
  }, [applicationId]);

  if (!rules) return <SectionLoading />;

  const applicable = rules.filter((rule) => ruleApplies(rule, form));
  const docByType = {};
  docs.forEach((d) => {
    if (!docByType[d.document_type] || (d.version || 1) > (docByType[d.document_type].version || 0)) docByType[d.document_type] = d;
  });
  // Document uploads are optional for now — no required-missing check
  const optionalMissing = applicable.filter((r) => r.requirement_level === "required" && !docByType[r.document_type]);

  const upload = async (rule) => {
    const file = fileRefs.current[rule.document_type]?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5 MB.", variant: "destructive" });
      return;
    }
    setUploadingType(rule.document_type);
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const existing = docByType[rule.document_type];
      const payload = {
        business: businessId,
        application: applicationId,
        document_type: rule.document_type,
        requirement_level: rule.requirement_level,
        file: file_uri,
        file_name: file.name,
        file_size: file.size,
        status: "uploaded",
        reviewer_note: "",
        version: (existing?.version || 0) + 1,
      };
      if (existing) await base44.entities.BusinessDocument.update(existing.id, payload);
      else await base44.entities.BusinessDocument.create(payload);
      toast({ title: "Uploaded", description: rule.label });
      load();
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

  const doSubmit = () => {
    if (!form.consent) {
      toast({ title: "Consent required", variant: "destructive" });
      return;
    }
    if (!form.declaration) {
      toast({ title: "Declaration required", variant: "destructive" });
      return;
    }
    if (!(form.signature_name || "").trim()) {
      toast({ title: "Signature required", variant: "destructive" });
      return;
    }
    onSubmit();
  };

  return (
    <div className="space-y-4">
      <div className="led-box bg-soft/60 flex items-start gap-2.5 text-xs text-mute">
        <Lock className="w-4 h-4 text-brand flex-none mt-0.5" />
        <span>Uploaded documents are stored privately and are visible only to you and LED officers. Maximum 5 MB per file. PDF, JPG or PNG.</span>
      </div>
      <div>
        <h3 className="text-sm font-bold text-ink mb-2">Documents <span className="text-mute font-normal text-xs">(optional for now)</span></h3>
        <div className="space-y-2.5">
          {applicable.map((rule) => {
            const doc = docByType[rule.document_type];
            return (
              <div key={rule.document_type} className="led-box flex flex-wrap items-center gap-3 py-3">
                <FileText className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="text-sm text-ink">{rule.label}</b>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${requirementBadge(rule.requirement_level)}`}>
                      {rule.requirement_level}
                    </span>
                  </div>
                  {rule.hint ? <p className="text-xs text-mute mt-0.5 leading-snug">{rule.hint}</p> : null}
                  {doc ? <p className="text-xs text-mute mt-0.5">Uploaded: {doc.file_name || "file"}</p> : null}
                </div>
                {doc ? (
                  <button onClick={() => viewDoc(doc)} className="led-btn led-btn-s led-btn-l flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                ) : null}
                <input
                  ref={(el) => (fileRefs.current[rule.document_type] = el)}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={() => upload(rule)}
                />
                <button
                  onClick={() => fileRefs.current[rule.document_type]?.click()}
                  disabled={busy && uploadingType === rule.document_type}
                  className="led-btn led-btn-s flex items-center gap-1.5"
                >
                  {busy && uploadingType === rule.document_type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {doc ? "Replace" : "Upload"}
                </button>
              </div>
            );
          })}
          {applicable.length === 0 ? <p className="text-mute text-sm">Complete the earlier steps to see your required documents.</p> : null}
        </div>
      </div>
      <div className="led-box space-y-3">
        <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand" /> Consent & declaration
        </h3>
        <label className="flex items-start gap-2.5 text-sm text-ink leading-relaxed">
          <input type="checkbox" checked={!!form.consent} onChange={(e) => setField("consent", e.target.checked)} className="mt-0.5 w-4 h-4 accent-[hsl(var(--green))]" />
          <span>I consent to Emfuleni Municipality collecting and processing my business and owner information under POPIA for verification and local economic development purposes.</span>
        </label>
        <label className="flex items-start gap-2.5 text-sm text-ink leading-relaxed">
          <input type="checkbox" checked={!!form.declaration} onChange={(e) => setField("declaration", e.target.checked)} className="mt-0.5 w-4 h-4 accent-[hsl(var(--green))]" />
          <span>I declare that the information I have provided is true and correct. I understand that providing false information may result in my application being declined.</span>
        </label>
        <WizardField label="Signature (full name)">
          <input className="led-field" value={form.signature_name || ""} onChange={(e) => setField("signature_name", e.target.value)} placeholder="Type your full name" />
        </WizardField>
      </div>
      {optionalMissing.length > 0 ? (
        <div className="text-xs text-mute bg-soft rounded-lg px-3 py-2">
          You can skip these for now: {optionalMissing.map((r) => r.label).join(", ")}
        </div>
      ) : null}
    </div>
  );
}