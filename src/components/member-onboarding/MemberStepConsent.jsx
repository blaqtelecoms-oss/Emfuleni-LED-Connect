import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WizardField from "@/components/onboarding/WizardField";
import MultiSelect from "@/components/onboarding/MultiSelect";
import {
  MEMBER_SUPPORT_OPTIONS,
  ALERT_TYPES,
  ALERT_CHANNELS,
  MEMBER_DOC_TYPES,
} from "@/lib/onboardingUtils";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UploadCloud, FileText, Trash2 } from "lucide-react";

export default function MemberStepConsent({ form, setField, userId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("ID copy");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await base44.entities.MemberDocument.filter({ user: userId }).catch(() => []);
      if (!cancelled) {
        setDocs(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const rec = await base44.entities.MemberDocument.create({
        user: userId,
        type: docType,
        file: file_uri,
        file_name: file.name,
        file_size: file.size,
        status: "uploaded",
      });
      setDocs((d) => [rec, ...d]);
      toast({ title: "Document uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDoc = async (id) => {
    await base44.entities.MemberDocument.delete(id).catch(() => {});
    setDocs((d) => d.filter((x) => x.id !== id));
  };

  const toggleAlert = (k) =>
    setField(
      "alert_preferences",
      form.alert_preferences.includes(k)
        ? form.alert_preferences.filter((x) => x !== k)
        : [...form.alert_preferences, k]
    );

  return (
    <div className="space-y-5">
      <div>
        <WizardField label="What support do you need?" hint="Choose any that apply — optional.">
          <MultiSelect
            options={MEMBER_SUPPORT_OPTIONS}
            value={form.support_needed}
            onChange={(v) => setField("support_needed", v)}
          />
        </WizardField>
      </div>

      <div>
        <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-2">
          Notify me about
        </label>
        <div className="flex flex-wrap gap-2">
          {ALERT_TYPES.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => toggleAlert(a.key)}
              className={`led-chip ${form.alert_preferences.includes(a.key) ? "on" : ""}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <label className="block text-xs font-semibold text-mute uppercase tracking-wide mt-3 mb-2">
          Preferred channel
        </label>
        <div className="flex flex-wrap gap-2">
          {ALERT_CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setField("alert_channel", c)}
              className={`led-chip ${form.alert_channel === c ? "on" : ""}`}
            >
              {c === "app" ? "In-app" : c}
            </button>
          ))}
        </div>
        {(form.alert_channel === "SMS" || form.alert_channel === "WhatsApp") && (
          <p className="text-mute text-xs mt-2">
            SMS and WhatsApp delivery need a messaging provider to be connected. In-app alerts are
            active now.
          </p>
        )}
      </div>

      <div className="led-box">
        <h3 className="text-sm font-bold text-ink mb-1">Verification documents</h3>
        <p className="text-mute text-xs mb-3">
          Optional. Upload an ID copy or proof of residence so the municipality can confirm your
          details when needed. These files are kept private — only you and LED officers can see
          them.
        </p>
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="led-field max-w-[180px]"
          >
            {MEMBER_DOC_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <label className="led-btn led-btn-s flex items-center gap-1.5 cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Upload
            <input type="file" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        </div>
        {loading ? (
          <p className="text-mute text-xs">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="text-mute text-xs">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2"
              >
                <FileText className="w-4 h-4 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-xs text-ink block truncate">{d.file_name}</b>
                  <span className="text-mute text-[11px]">{d.type}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDoc(d.id)}
                  className="text-mute hover:text-tangerine"
                  aria-label="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="led-box">
        <label className="flex items-start gap-2.5 text-[13px] text-ink leading-relaxed">
          <input
            type="checkbox"
            checked={form.popia_consent}
            onChange={(e) => setField("popia_consent", e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[hsl(var(--green))]"
          />
          <span>
            I consent to the Automated MSME Data Capturing, Profiling and Management System collecting and processing my information under POPIA to
            match me with jobs, services and community updates. I understand my information stays
            private and I can update it at any time.
          </span>
        </label>
        <div className="mt-3">
          <WizardField label="Type your full name to confirm">
            <input
              value={form.signature_name}
              onChange={(e) => setField("signature_name", e.target.value)}
              placeholder="Full name"
              className="led-field"
            />
          </WizardField>
        </div>
      </div>
    </div>
  );
}