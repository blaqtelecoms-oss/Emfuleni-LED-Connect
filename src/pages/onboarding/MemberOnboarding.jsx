import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import MemberStepPersonal from "@/components/member-onboarding/MemberStepPersonal";
import MemberStepResidence from "@/components/member-onboarding/MemberStepResidence";
import MemberStepHousehold from "@/components/member-onboarding/MemberStepHousehold";
import MemberStepEmployment from "@/components/member-onboarding/MemberStepEmployment";
import MemberStepConsent from "@/components/member-onboarding/MemberStepConsent";
import { MEMBER_STEPS } from "@/lib/onboardingUtils";
import { SectionLoading } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight, Send } from "lucide-react";
import OnboardingNav from "@/components/onboarding/OnboardingNav";

const STEP_COMPONENTS = [
  MemberStepPersonal,
  MemberStepResidence,
  MemberStepHousehold,
  MemberStepEmployment,
  MemberStepConsent,
];

export default function MemberOnboarding() {
  const { user } = useAuth();
  const { profile, loading: loadingProfile } = useLedProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const accountType = user?.account_type || (user?.role === "admin" ? "officer" : null);

  useEffect(() => {
    if (loadingProfile) return;
    setForm({
      full_name: profile?.full_name || user?.full_name || "",
      phone: profile?.phone || "",
      alt_phone: profile?.alt_phone || "",
      email: profile?.email || user?.email || "",
      date_of_birth: profile?.date_of_birth || "",
      gender: profile?.gender || "",
      language: profile?.language || "English",
      area: profile?.area || "",
      ward: profile?.ward || "",
      address: profile?.address || "",
      housing_tenure: profile?.housing_tenure || "",
      years_in_area: profile?.years_in_area ?? "",
      marital_status: profile?.marital_status || "",
      household_size: profile?.household_size ?? "",
      dependants_count: profile?.dependants_count ?? "",
      employment_status: profile?.employment_status || "",
      occupation: profile?.occupation || "",
      income_band: profile?.income_band || "",
      skills: profile?.skills || [],
      support_needed: profile?.support_needed || [],
      alert_preferences: profile?.alert_preferences || ["power_outages", "water_outages"],
      alert_channel: profile?.alert_channel || "app",
      popia_consent: !!profile?.popia_consent_at,
      signature_name: profile?.full_name || user?.full_name || "",
    });
    setStep(profile?.onboarding_step || 1);
  }, [loadingProfile, profile, user]);

  if (accountType && accountType !== "member")
    return <Navigate to={`/${accountType}`} replace />;
  if (loadingProfile || !form) {
    return (
      <div className="min-h-screen grid place-items-center bg-page">
        <SectionLoading />
      </div>
    );
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = (s) => {
    if (s === 1) {
      if (!(form.full_name || "").trim()) return "Full name is required.";
      if (!(form.phone || "").trim()) return "Your cell number is required.";
      if (!form.gender) return "Please select a gender, or 'Prefer not to say'.";
      if (!form.language) return "Please select your preferred language.";
    }
    if (s === 2) {
      if (!(form.area || "").trim()) return "Your area is required.";
      if (!form.housing_tenure) return "Your housing situation is required.";
    }
    if (s === 3) {
      if (form.household_size === "" || form.household_size == null)
        return "Number of people in your household is required.";
    }
    if (s === 4) {
      if (!form.employment_status) return "Your employment status is required.";
    }
    if (s === 5) {
      if (!form.popia_consent)
        return "You must consent to POPIA processing to finish onboarding.";
      if (!(form.signature_name || "").trim())
        return "Please type your full name to confirm your profile.";
    }
    return null;
  };

  const buildPayload = (nextStep, completed) => {
    const consentAt = form.popia_consent
      ? profile?.popia_consent_at || new Date().toISOString()
      : null;
    return {
      user: user.id,
      account_type: "member",
      full_name: form.full_name,
      phone: form.phone,
      alt_phone: form.alt_phone,
      email: form.email,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender,
      language: form.language,
      area: form.area,
      ward: form.ward,
      address: form.address,
      housing_tenure: form.housing_tenure,
      years_in_area: form.years_in_area === "" ? null : Number(form.years_in_area),
      marital_status: form.marital_status,
      household_size: form.household_size === "" ? null : Number(form.household_size),
      dependants_count: form.dependants_count === "" ? null : Number(form.dependants_count),
      employment_status: form.employment_status,
      occupation: form.occupation,
      income_band: form.income_band,
      skills: form.skills,
      support_needed: form.support_needed,
      alert_preferences: form.alert_preferences,
      alert_channel: form.alert_channel,
      onboarding_step: nextStep,
      onboarding_completed_at: completed ? new Date().toISOString() : profile?.onboarding_completed_at || null,
      popia_consent_at: consentAt,
    };
  };

  const persist = async (nextStep, completed = false) => {
    const payload = buildPayload(nextStep, completed);
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, payload);
    } else {
      await base44.entities.UserProfile.create(payload);
    }
  };

  const saveAndContinue = async () => {
    setError("");
    const v = validateStep(step);
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    try {
      await persist(step + 1);
      setStep((s) => Math.min(s + 1, MEMBER_STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveAndExit = async () => {
    setSaving(true);
    try {
      await persist(step);
      toast({ title: "Progress saved" });
      navigate("/member");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const v = validateStep(5);
      if (v) {
        setError(v);
        return;
      }
      await persist(MEMBER_STEPS.length, true);
      await base44.auth
        .updateMe({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          area: form.area.trim(),
          language: form.language,
        })
        .catch(() => {});
      toast({ title: "Profile complete", description: "Welcome to your community hub." });
      window.location.href = "/member";
    } catch (e) {
      setError(e.message || "Saving failed");
    } finally {
      setSubmitting(false);
    }
  };

  const StepComp = STEP_COMPONENTS[step - 1];
  const stepLabel = MEMBER_STEPS[step - 1].label;

  return (
    <OnboardingShell
      steps={MEMBER_STEPS}
      current={step}
      title={stepLabel}
      subtitle="Tell us about yourself so Emfuleni LED can match you with jobs, services and updates in your ward. Your progress is saved automatically."
      onExit={() => navigate("/member")}
      nav={
        <OnboardingNav
          onBack={goBack}
          backDisabled={step === 1}
          onSave={saveAndExit}
          saving={saving}
          onPrimary={step < MEMBER_STEPS.length ? saveAndContinue : submit}
          primaryLoading={step < MEMBER_STEPS.length ? saving : submitting}
          primaryLabel={step < MEMBER_STEPS.length ? "Continue" : "Complete profile"}
          primaryLabelShort={step < MEMBER_STEPS.length ? "Continue" : "Complete"}
          primaryIcon={step < MEMBER_STEPS.length ? ArrowRight : Send}
        />
      }
    >
      {error ? <div className="onb-err">{error}</div> : null}
      <StepComp form={form} setField={setField} userId={user.id} />
    </OnboardingShell>
  );
}