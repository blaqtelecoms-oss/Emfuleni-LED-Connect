import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import PortalLayout from "@/components/PortalLayout";
import PageHeader from "@/components/PageHeader";
import PortalPlaceholder from "@/components/PortalPlaceholder";
import OfficerDashboard from "@/components/officer/OfficerDashboard";
import OfficerBusinesses from "@/components/officer/OfficerBusinesses";
import OfficerVerification from "@/components/officer/OfficerVerification";
import OfficerFunding from "@/components/officer/OfficerFunding";
import OfficerUpdates from "@/components/officer/OfficerUpdates";
import OfficerReports from "@/components/officer/OfficerReports";
import OfficerOpportunities from "@/components/officer/OfficerOpportunities";
import OfficerMessages from "@/components/officer/OfficerMessages";
import OfficerImpact from "@/components/officer/OfficerImpact";
import OfficerMap from "@/components/officer/OfficerMap";
import OfficerWorkshops from "@/components/officer/OfficerWorkshops";
import OfficerPolls from "@/components/officer/OfficerPolls";
import OfficerIdeas from "@/components/officer/OfficerIdeas";
import {
  LayoutDashboard,
  Store,
  Landmark,
  Briefcase,
  Megaphone,
  TrendingUp,
  Map as MapIcon,
  MessageSquare,
  Flag,
  GraduationCap,
  Vote,
  Lightbulb,
  ClipboardCheck,
} from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "businesses", label: "Businesses", icon: Store },
  { key: "verification", label: "Verification", icon: ClipboardCheck },
  { key: "programs", label: "Funding", icon: Landmark },
  { key: "opportunities", label: "Tenders & jobs", icon: Briefcase },
  { key: "updates", label: "Updates", icon: Megaphone },
  { key: "reports", label: "Service reports", icon: Flag },
  { key: "workshops", label: "Workshops", icon: GraduationCap },
  { key: "polls", label: "Polls", icon: Vote },
  { key: "ideas", label: "Ideas", icon: Lightbulb },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "impact", label: "Impact", icon: TrendingUp },
  { key: "map", label: "Map", icon: MapIcon },
];

const WORKING = {
  dashboard: OfficerDashboard,
  businesses: OfficerBusinesses,
  verification: OfficerVerification,
  programs: OfficerFunding,
  updates: OfficerUpdates,
  reports: OfficerReports,
  opportunities: OfficerOpportunities,
  messages: OfficerMessages,
  impact: OfficerImpact,
  map: OfficerMap,
  workshops: OfficerWorkshops,
  polls: OfficerPolls,
  ideas: OfficerIdeas,
};

export default function OfficerPortal() {
  const { section } = useParams();
  const { user } = useAuth();
  // Officers are invited accounts: account_type "officer" or role "admin".
  // A signed-in non-officer (incl. an unrecognised Google account) is sent away.
  const accountType = user?.account_type || (user?.role === "admin" ? "officer" : null);
  if (accountType !== "officer") {
    return <Navigate to={accountType ? `/${accountType}` : "/"} replace />;
  }
  const activeKey = section || "dashboard";
  const active = NAV.find((n) => n.key === activeKey) || NAV[0];
  const Section = WORKING[active.key];
  const Icon = active.icon;

  return (
    <PortalLayout portal="officer" navItems={NAV} activeKey={active.key} allowedAccountType="officer">
      {Section ? (
        <Section />
      ) : (
        <>
          <PageHeader title={active.label} />
          <PortalPlaceholder icon={Icon} note={active.note} />
        </>
      )}
    </PortalLayout>
  );
}