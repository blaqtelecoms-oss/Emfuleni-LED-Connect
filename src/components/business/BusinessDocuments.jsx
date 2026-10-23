import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { Upload, Eye, FileText, Loader2, CheckCircle2 } from "lucide-react";

const DOC_TYPES = ["CIPC registration", "B-BBEE affidavit", "Photos", "Bank confirmation letter", "Tax clearance certificate"];

export default function BusinessDocuments() {
  const { business } = useLedProfile();
  const { data, loading, reload } = useLedList(
    () => base44.entities.BusinessDocument.filter({ business: business?.id }).catch(() => []),
    [business?.id]
  );
  const [busy, setBusy] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const fileRefs = useRef({});

  const docs = data || [];
  const docMap = Object.fromEntries(docs.map((d) => [d.type, d]));
  const approvedCount = docs.filter((d) => d.status === "approved").length;
  const completeness = Math.round((approvedCount / DOC_TYPES.length) * 100);

  const upload = async (type) => {
    const file = fileRefs.current[type]?.files?.[0];
    if (!file) return;
    setUploadingType(type);
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const existing = docMap[type];
      if (existing) {
        await base44.entities.BusinessDocument.update(existing.id, { file: file_uri, status: "uploaded", reviewer_note: "" });
      } else {
        await base44.entities.BusinessDocument.create({ business: business.id, type, file: file_uri, status: "uploaded" });
      }
      toast({ title: "Document uploaded", description: `${type} is now awaiting officer review.` });
      reload();
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      setUploadingType(null);
    }
  };

  const viewDoc = async (doc) => {
    if (!doc.file) return;
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file });
      window.open(signed_url, "_blank");
    } catch (e) {
      toast({ title: "Couldn't open document", description: e.message, variant: "destructive" });
    }
  };

  if (loading) return <SectionLoading />;

  return (
    <div>
      <PageHeader title="Compliance documents" subtitle="Upload your compliance documents for LED verification. Approved documents unlock tenders and funding." />

      <div className="led-box mb-4 flex items-center gap-4">
        <div className="flex-1">
          <b className="text-sm text-ink block">Profile completeness</b>
          <span className="text-mute text-xs">{approvedCount} of {DOC_TYPES.length} documents approved</span>
        </div>
        <div className="w-32 h-2 rounded-full bg-soft overflow-hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${completeness}%` }} />
        </div>
        <b className="text-ink text-lg">{completeness}%</b>
      </div>

      {loading ? (
        <SectionLoading />
      ) : (
        <div className="space-y-2.5">
          {DOC_TYPES.map((type) => {
            const doc = docMap[type];
            return (
              <div key={type} className="led-box flex flex-wrap items-center gap-3 py-3">
                <FileText className="w-5 h-5 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{type}</b>
                  {doc ? (
                    <span className="text-xs text-mute">Uploaded · {doc.reviewer_note ? `Note: ${doc.reviewer_note}` : "Awaiting review"}</span>
                  ) : (
                    <span className="text-xs text-mute">Not uploaded yet</span>
                  )}
                </div>
                {doc && <StatusPill status={doc.status} />}
                {doc && (
                  <button onClick={() => viewDoc(doc)} className="led-btn led-btn-s led-btn-l flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                )}
                <input
                  ref={(el) => (fileRefs.current[type] = el)}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={() => upload(type)}
                />
                <button
                  onClick={() => fileRefs.current[type]?.click()}
                  disabled={busy && uploadingType === type}
                  className="led-btn led-btn-s flex items-center gap-1.5"
                >
                  {busy && uploadingType === type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {doc ? "Replace" : "Upload"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}