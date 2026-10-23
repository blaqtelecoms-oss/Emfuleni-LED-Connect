import React from "react";
import { useParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import PortalPlaceholder from "@/components/PortalPlaceholder";
import PageHeader from "@/components/PageHeader";
import MemberHome from "@/components/member/MemberHome";
import MemberUpdates from "@/components/member/MemberUpdates";
import MemberJobs from "@/components/member/MemberJobs";
import MemberBuyLocal from "@/components/member/MemberBuyLocal";
import MemberReport from "@/components/member/MemberReport";
import MemberSay from "@/components/member/MemberSay";
import MemberProfile from "@/components/member/MemberProfile";
import {
  Home as HomeIcon,
  Megaphone,
  Briefcase,
  Store,
  Flag,
  Vote,
  User,
} from "lucide-react";

const NAV = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "updates", label: "Updates", icon: Megaphone },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "buy", label: "Buy local", icon: Store },
  { key: "report", label: "Report", icon: Flag },
  { key: "say", label: "Have your say", icon: Vote },
  { key: "profile", label: "My profile", icon: User },
];

const WORKING = {
  home: MemberHome,
  updates: MemberUpdates,
  jobs: MemberJobs,
  buy: MemberBuyLocal,
  report: MemberReport,
  say: MemberSay,
  profile: MemberProfile,
};

export default function MemberPortal() {
  const { section } = useParams();
  const activeKey = section || "home";
  const active = NAV.find((n) => n.key === activeKey) || NAV[0];
  const Section = WORKING[active.key];

  return (
    <PortalLayout portal="member" navItems={NAV} activeKey={active.key} allowedAccountType="member">
      {Section ? <Section /> : (
        <>
          <PageHeader title={active.label} />
          <PortalPlaceholder icon={active.icon} note={active.note} />
        </>
      )}
    </PortalLayout>
  );
}