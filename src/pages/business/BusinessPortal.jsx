import React from "react";
import { useParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import PortalPlaceholder from "@/components/PortalPlaceholder";
import PageHeader from "@/components/PageHeader";
import BusinessDashboard from "@/components/business/BusinessDashboard";
import BusinessProfile from "@/components/business/BusinessProfile";
import BusinessDocuments from "@/components/business/BusinessDocuments";
import BusinessTenders from "@/components/business/BusinessTenders";
import BusinessFunding from "@/components/business/BusinessFunding";
import BusinessVacancies from "@/components/business/BusinessVacancies";
import BusinessTraining from "@/components/business/BusinessTraining";
import BusinessInbox from "@/components/business/BusinessInbox";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  Landmark,
  Users,
  GraduationCap,
  Inbox,
  FileText,
} from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "profile", label: "My profile", icon: Store },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "tenders", label: "Tenders", icon: Briefcase },
  { key: "funding", label: "Funding", icon: Landmark },
  { key: "vacancies", label: "Vacancies", icon: Users },
  { key: "training", label: "Training", icon: GraduationCap },
  { key: "inbox", label: "Inbox", icon: Inbox },
];

const WORKING = {
  dashboard: BusinessDashboard,
  profile: BusinessProfile,
  documents: BusinessDocuments,
  tenders: BusinessTenders,
  funding: BusinessFunding,
  vacancies: BusinessVacancies,
  training: BusinessTraining,
  inbox: BusinessInbox,
};

export default function BusinessPortal() {
  const { section } = useParams();
  const activeKey = section || "dashboard";
  const active = NAV.find((n) => n.key === activeKey) || NAV[0];
  const Section = WORKING[active.key];

  return (
    <PortalLayout portal="business" navItems={NAV} activeKey={active.key} allowedAccountType="business">
      {Section ? <Section /> : (
        <>
          <PageHeader title={active.label} />
          <PortalPlaceholder icon={active.icon} note={active.note} />
        </>
      )}
    </PortalLayout>
  );
}