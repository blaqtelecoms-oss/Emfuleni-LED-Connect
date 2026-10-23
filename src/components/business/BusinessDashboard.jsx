import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading } from "@/components/SectionStates";
import { formatRand, formatSAST } from "@/lib/ledUtils";
import { ChevronRight, FileWarning, Landmark, Briefcase, GraduationCap, ShieldAlert } from "lucide-react";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const { business } = useLedProfile();
  const { data, loading } = useLedList(() =>
    Promise.all([
      base44.entities.Opportunity.filter({ status: "open" }).catch(() => []),
      base44.entities.FundingApplication.filter({}).catch(() => []),
      base44.entities.BusinessDocument.filter({ business: business?.id }).catch(() => []),
      base44.entities.WorkshopBooking.filter({ business: business?.id }).catch(() => []),
      base44.entities.OpportunityResponse.filter({ business: business?.id }).catch(() => []),
      base44.entities.VerificationApplication.filter({ business: business?.id }).catch(() => []),
    ]),
    // re-fetch when business id resolves
    [business?.id]
  );

  if (loading || !data) return <SectionLoading />;
  const [opps, apps, docs, bookings, responses, vapps] = data;

  const pendingDocs = docs.filter((d) => d.status === "uploaded");
  const fundingActive = apps.filter((a) => a.status === "submitted" || a.status === "under_review");
  const openTenders = opps.filter((o) => o.type === "tender");
  const openJobs = opps.filter((o) => o.type === "job");

  const draftApp = vapps.find((a) => a.status === "draft" || a.status === "incomplete");
  const activeApp = vapps.find((a) => a.status === "submitted" || a.status === "in_review");
  const showWizardBanner = !!draftApp || (!activeApp && business?.status !== "verified");

  const tasks = [
    pendingDocs.length > 0 && {
      label: `${pendingDocs.length} document${pendingDocs.length === 1 ? "" : "s"} awaiting review`,
      to: "/business/profile",
      tone: "led-task",
      icon: FileWarning,
    },
    fundingActive.length > 0 && {
      label: `${fundingActive.length} funding application${fundingActive.length === 1 ? "" : "s"} in review`,
      to: "/business/funding",
      tone: "led-task g",
      icon: Landmark,
    },
    openTenders.length > 0 && {
      label: `${openTenders.length} open tender${openTenders.length === 1 ? "" : "s"} to respond to`,
      to: "/business/tenders",
      tone: "led-task b",
      icon: Briefcase,
    },
  ].filter(Boolean);

  const stats = [
    { value: openTenders.length, label: "Open tenders" },
    { value: openJobs.length, label: "Open vacancies" },
    { value: apps.length, label: "Funding applied" },
    { value: responses.length, label: "Quotes sent" },
  ];

  return (
    <div>
      <PageHeader title={`Hello, ${business?.name || user?.full_name || "there"}`} subtitle="Your business at a glance — documents, tenders, funding and training." />

      {showWizardBanner ? (
        <Link
          to="/onboarding"
          className="led-task g flex items-center gap-3 mb-5 hover:border-brand/40"
        >
          <ShieldAlert className="w-5 h-5 text-brand flex-none" />
          <div className="min-w-0 flex-1">
            <b className="text-sm text-ink block">
              {draftApp ? "Continue your verification application" : "Complete your verification application"}
            </b>
            <span className="text-mute text-xs">
              {draftApp
                ? "Pick up where you left off — your progress is saved."
                : "Verify your business to unlock tenders, funding and the local directory."}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-mute flex-none" />
        </Link>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[12px] bg-soft p-3">
            <b className="text-[22px] font-bold text-ink block leading-none">{s.value}</b>
            <span className="text-mute text-xs mt-1 block">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Today's tasks</h2>
          {tasks.length === 0 ? (
            <div className="led-box text-mute text-sm">You're all caught up.</div>
          ) : (
            tasks.map((t, i) => (
              <Link key={i} to={t.to} className={`${t.tone} hover:border-brand/40`}>
                <t.icon className="w-4 h-4 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{t.label}</b>
                </div>
                <ChevronRight className="w-4 h-4 text-mute flex-none" />
              </Link>
            ))
          )}
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Recent activity</h2>
          {apps.length === 0 && responses.length === 0 && bookings.length === 0 ? (
            <div className="led-box text-mute text-sm">No activity yet. Apply for funding or respond to a tender to get started.</div>
          ) : (
            <div className="space-y-2">
              {apps.slice(0, 3).map((a) => (
                <div key={a.id} className="led-box py-2.5 flex items-center justify-between">
                  <span className="text-sm text-ink font-semibold">Funding · {formatRand(a.requested_amount)}</span>
                  <StatusPill status={a.status} />
                </div>
              ))}
              {responses.slice(0, 3).map((r) => (
                <div key={r.id} className="led-box py-2.5 flex items-center justify-between">
                  <span className="text-sm text-ink font-semibold">Quote · {formatRand(r.quote_amount)}</span>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}