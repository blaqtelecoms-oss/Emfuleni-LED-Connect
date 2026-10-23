import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import StatusPill from "@/components/StatusPill";
import { SectionLoading } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { requirementBadge } from "@/lib/onboardingUtils";
import { formatSAST, formatSASTTime } from "@/lib/ledUtils";
import { Lock, Eye, Loader2, FileText, ClipboardList, Check, X, AlertTriangle, Send } from "lucide-react";

export default function OfficerVerificationReview({ app, business, onClose, onDecided }) {
  const [docs, setDocs] = useState(null);
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [d, r, l, u] = await Promise.all([
        base44.entities.BusinessDocument.filter({ application: app.id }).catch(() => []),
        base44.entities.DocumentRule.filter({ active: true }).catch(() => []),
        base44.entities.VerificationLog.filter({ application: app.id }).catch(() => []),
        base44.entities.User.list().catch(() => []),
      ]);
      if (!active) return;
      setDocs(d);
      setRules(r);
      setLogs([...l].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      const um = {};
      (u || []).forEach((x) => (um[x.id] = x.full_name || x.email));
      setUsers(um);
    })();
    return () => {
      active = false;
    };
  }, [app.id]);

  const ruleByType = {};
  rules.forEach((r) => (ruleByType[r.document_type] = r));

  const viewDoc = async (doc) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file });
      window.open(signed_url, "_blank");
    } catch (e) {
      toast({ title: "Couldn't open document", description: e.message, variant: "destructive" });
    }
  };

  const decide = async (action) => {
    if ((action === "incomplete" || action === "declined") && !note.trim()) {
      toast({ title: "A note is required for this decision", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("decideVerificationApplication", {
        applicationId: app.id,
        action,
        note,
      });
      if (res.data?.error) {
        toast({ title: res.data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Decision recorded" });
      onDecided();
    } catch (e) {
      toast({ title: e.response?.data?.error || e.message || "Action failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const decided = app.status === "verified" || app.status === "declined";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {business?.name || "Unknown business"}
            <StatusPill status={app.status} />
          </DialogTitle>
          <DialogDescription>
            Reference {app.reference || "—"} · submitted{" "}
            {app.submitted_at ? formatSAST(app.submitted_at, { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </DialogDescription>
        </DialogHeader>

        {!docs ? (
          <SectionLoading />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="led-box bg-soft/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-mute uppercase mb-1.5">
                <Lock className="w-3.5 h-3.5" /> Owner identity — private
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-ink">
                <Field label="Owner" value={business?.owner_name} />
                <Field label="ID number" value={app.owner_id_number} mono />
                <Field label="Phone" value={business?.owner_phone} />
                <Field label="Email" value={business?.owner_email} />
              </div>
            </div>

            <div className="led-box">
              <div className="text-xs font-semibold text-mute uppercase mb-1.5">Business profile</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-ink">
                <Field label="Trading name" value={business?.trading_name} />
                <Field label="Registration" value={business?.registration_type} />
                <Field label="CIPC no." value={business?.cipc_number} />
                <Field label="Year started" value={business?.year_started} />
                <Field label="Sectors" value={(business?.sectors || []).join(", ")} span2 />
                <Field label="Area / ward" value={[business?.area, business?.ward].filter(Boolean).join(", ")} />
                <Field label="Premises" value={business?.premises_type} />
                <Field label="Address" value={business?.address} span2 />
                <Field label="Trading days" value={(business?.trading_days || []).join(", ")} span2 />
                <Field label="Staff" value={business?.staff_band} />
                <Field label="Turnover" value={business?.turnover_band} />
                <Field label="Bank account" value={business?.has_bank_account == null ? "—" : business.has_bank_account ? "Yes" : "No"} />
                <Field label="VAT" value={business?.vat_status} />
                <Field label="CSD" value={business?.csd_status} />
                <Field label="Owners" value={business?.number_of_owners} />
                <Field label="Ownership" value={(business?.ownership_profile || []).join(", ")} span2 />
                <Field label="Support needed" value={(business?.support_needed || []).join(", ")} span2 />
                {business?.description ? <Field label="Description" value={business.description} span2 /> : null}
              </div>
            </div>

            <div className="led-box">
              <div className="text-xs font-semibold text-mute uppercase mb-2">Submitted documents</div>
              {docs.length === 0 ? (
                <p className="text-mute text-sm">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {docs.map((d) => {
                    const rule = ruleByType[d.document_type];
                    const label = rule?.label || d.document_type || "Document";
                    return (
                      <div key={d.id} className="flex items-center gap-3 py-1.5">
                        <FileText className="w-4 h-4 text-brand flex-none" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <b className="text-ink text-sm">{label}</b>
                            {d.requirement_level ? (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${requirementBadge(d.requirement_level)}`}>
                                {d.requirement_level}
                              </span>
                            ) : null}
                            <StatusPill status={d.status} />
                          </div>
                          <span className="text-xs text-mute">
                            {d.file_name || "file"}
                            {d.file_size ? ` · ${Math.round(d.file_size / 1024)} KB` : ""}
                          </span>
                        </div>
                        <button onClick={() => viewDoc(d)} className="led-btn led-btn-s led-btn-l flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {logs.length > 0 ? (
              <div className="led-box">
                <div className="text-xs font-semibold text-mute uppercase mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" /> Audit trail
                </div>
                <div className="space-y-1.5">
                  {logs.map((l) => (
                    <div key={l.id} className="text-xs text-ink">
                      <span className="text-mute">
                        {formatSAST(l.created_date, { day: "numeric", month: "short", year: "numeric" })} {formatSASTTime(l.created_date)}
                      </span>{" "}
                      · <b>{l.action}</b> — {l.detail}
                      {l.actor ? <span className="text-mute"> ({users[l.actor] || "officer"})</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {decided ? (
              <div className="led-box bg-soft/60">
                <div className="text-xs font-semibold text-mute uppercase mb-1.5">Decision</div>
                <p className="text-ink flex items-center gap-2 flex-wrap">
                  <StatusPill status={app.status} /> by {users[app.decided_by] || "an officer"} on{" "}
                  {app.decided_at ? formatSAST(app.decided_at, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </p>
                {app.decision_note ? <p className="text-mute mt-1">{app.decision_note}</p> : null}
              </div>
            ) : (
              <div className="led-box space-y-3">
                <div className="text-xs font-semibold text-mute uppercase">Decision</div>
                <textarea
                  className="led-field"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note to the business (required when requesting more info or declining)…"
                />
                <div className="flex flex-wrap gap-2">
                  {app.status === "submitted" || app.status === "incomplete" ? (
                    <button disabled={busy} onClick={() => decide("in_review")} className="led-btn led-btn-l led-btn-s flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Start review
                    </button>
                  ) : null}
                  <button disabled={busy} onClick={() => decide("incomplete")} className="led-btn led-btn-l led-btn-s flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Request info
                  </button>
                  <button disabled={busy} onClick={() => decide("verified")} className="led-btn led-btn-s flex items-center gap-1.5">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Verify
                  </button>
                  <button disabled={busy} onClick={() => decide("declined")} className="led-btn led-btn-r led-btn-s flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, span2, mono }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <div className="text-[11px] text-mute uppercase tracking-wide">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}