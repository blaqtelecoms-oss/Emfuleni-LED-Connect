import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLedProfile } from "@/hooks/useLedProfile";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { SectionLoading } from "@/components/SectionStates";
import { formatSAST } from "@/lib/ledUtils";
import { ChevronRight, Megaphone, Briefcase, Vote, Store, ShieldAlert } from "lucide-react";

export default function MemberHome() {
  const { profile } = useLedProfile();
  const { data, loading } = useLedList(() =>
    Promise.all([
      base44.entities.Notice.filter({ status: "active" }).catch(() => []),
      base44.entities.Opportunity.filter({ status: "open", type: "job" }).catch(() => []),
      base44.entities.Poll.filter({ status: "open" }).catch(() => []),
    ]),
    [profile?.id]
  );

  if (loading || !data) return <SectionLoading />;
  const [notices, jobs, polls] = data;

  const areaNotices = notices.filter((n) => n.all_areas || !n.areas?.length || n.areas.includes(profile?.area));
  const matchedJobs = profile?.skills?.length
    ? jobs.filter((j) => !j.required_skills?.length || j.required_skills.some((s) => profile.skills.includes(s)))
    : jobs;

  return (
    <div>
      <PageHeader title={`Hello, ${profile?.full_name || "there"}`} subtitle={profile?.area ? `Your area: ${profile.area}` : "Welcome to your community hub."} />

      {!profile?.onboarding_completed_at && (
        <Link
          to="/member-onboarding"
          className="led-task led-task-g flex items-center gap-3 mb-5 hover:border-brand/40"
        >
          <ShieldAlert className="w-5 h-5 text-brand flex-none" />
          <div className="min-w-0 flex-1">
            <b className="text-sm text-ink block">Complete your community profile</b>
            <span className="text-mute text-xs">
              Add your household, skills and needs so we can match you with jobs and services in your ward.
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-mute flex-none" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Updates in your area</h2>
          {areaNotices.length === 0 ? (
            <div className="led-box text-mute text-sm">No active notices for your area.</div>
          ) : (
            areaNotices.slice(0, 4).map((n) => (
              <Link key={n.id} to="/member/updates" className="led-task hover:border-brand/40">
                <Megaphone className="w-4 h-4 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{n.headline}</b>
                  <span className="text-xs text-mute">{n.type} · {formatSAST(n.starts_at)}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-mute flex-none" />
              </Link>
            ))
          )}
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Jobs for you</h2>
          {matchedJobs.length === 0 ? (
            <div className="led-box text-mute text-sm">No jobs matching your skills yet. Add skills to your profile for better matches.</div>
          ) : (
            matchedJobs.slice(0, 4).map((j) => (
              <Link key={j.id} to="/member/jobs" className="led-task led-task-g hover:border-brand/40">
                <Briefcase className="w-4 h-4 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{j.title}</b>
                  <span className="text-xs text-mute">{j.pay || "Pay TBD"} · {j.sector || "General"}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-mute flex-none" />
              </Link>
            ))
          )}
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Have your say</h2>
          {polls.length === 0 ? (
            <div className="led-box text-mute text-sm">No open polls right now.</div>
          ) : (
            polls.slice(0, 2).map((p) => (
              <Link key={p.id} to="/member/say" className="led-task led-task-b hover:border-brand/40">
                <Vote className="w-4 h-4 text-brand flex-none" />
                <div className="min-w-0 flex-1">
                  <b className="text-sm text-ink block">{p.question}</b>
                  <span className="text-xs text-mute">Tap to vote</span>
                </div>
                <ChevronRight className="w-4 h-4 text-mute flex-none" />
              </Link>
            ))
          )}
        </div>

        <div>
          <h2 className="text-[17px] font-bold text-ink mb-2.5">Quick links</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/member/buy" className="led-box text-center py-4 hover:border-brand/40">
              <Store className="w-6 h-6 text-brand mx-auto mb-1" />
              <span className="text-xs font-semibold text-ink">Buy local</span>
            </Link>
            <Link to="/member/report" className="led-box text-center py-4 hover:border-brand/40">
              <Megaphone className="w-6 h-6 text-brand mx-auto mb-1" />
              <span className="text-xs font-semibold text-ink">Report an issue</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}