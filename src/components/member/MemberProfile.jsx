import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLedProfile } from "@/hooks/useLedProfile";
import PageHeader from "@/components/PageHeader";
import { SectionLoading } from "@/components/SectionStates";
import { toast } from "@/components/ui/use-toast";
import { Loader2, X, Plus } from "lucide-react";

const LANGUAGES = ["English", "isiZulu", "Afrikaans"];
const ALERT_TYPES = [
  { key: "power_outages", label: "Power outages" },
  { key: "water_outages", label: "Water outages" },
  { key: "road_closures", label: "Road closures" },
  { key: "events", label: "Community events" },
  { key: "new_jobs", label: "New jobs" },
];
const ALERT_CHANNELS = ["SMS", "WhatsApp", "app"];
const COMMON_SKILLS = ["Welding", "Forklift", "Carpentry", "Plumbing", "Electrical", "Cooking", "Driving", "Sewing", "Farming", "Bricklaying", "Painting", "Computer literacy"];

export default function MemberProfile() {
  const { user } = useAuth();
  const { profile, loading: loadingProfile } = useLedProfile();
  const [form, setForm] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || user?.full_name || "",
        phone: profile.phone || "",
        area: profile.area || "",
        ward: profile.ward || "",
        language: profile.language || "English",
        skills: profile.skills || [],
        alert_preferences: profile.alert_preferences || ["power_outages", "water_outages"],
        alert_channel: profile.alert_channel || "app",
      });
    } else if (!loadingProfile && user) {
      // profile may not exist yet — create a blank one
      setForm({
        full_name: user?.full_name || "",
        phone: "", area: "", ward: "", language: "English",
        skills: [], alert_preferences: ["power_outages", "water_outages"], alert_channel: "app",
      });
    }
  }, [profile, loadingProfile, user]);

  if (loadingProfile || !form) return <SectionLoading />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSkill = (s) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s],
    }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  };

  const toggleAlert = (k) =>
    setForm((f) => ({
      ...f,
      alert_preferences: f.alert_preferences.includes(k) ? f.alert_preferences.filter((x) => x !== k) : [...f.alert_preferences, k],
    }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        user: user.id,
        account_type: "member",
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        area: form.area.trim(),
        ward: form.ward.trim(),
        language: form.language,
        skills: form.skills,
        alert_preferences: form.alert_preferences,
        alert_channel: form.alert_channel,
      };
      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, payload);
      } else {
        await base44.entities.UserProfile.create(payload);
      }
      await base44.auth.updateMe({ full_name: form.full_name.trim(), phone: form.phone.trim(), area: form.area.trim(), language: form.language }).catch(() => {});
      toast({ title: "Profile saved", description: "Your preferences have been updated." });
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="My profile" subtitle="Manage your details, skills and alert preferences." />

      <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="led-box space-y-3">
          <h2 className="text-[17px] font-bold text-ink">Personal details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Full name</label>
              <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="082 123 4567" className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Area</label>
              <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Madadeni" className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Ward</label>
              <input value={form.ward} onChange={(e) => set("ward", e.target.value)} placeholder="e.g. Ward 12" className="led-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">Language</label>
              <select value={form.language} onChange={(e) => set("language", e.target.value)} className="led-field">
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="led-box space-y-3">
          <h2 className="text-[17px] font-bold text-ink">Skills</h2>
          <p className="text-xs text-mute">Add skills to match with jobs that suit you.</p>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Type a skill and press Enter"
              className="led-field"
            />
            <button type="button" onClick={addSkill} className="led-btn led-btn-s led-btn-l flex items-center gap-1"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SKILLS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSkill(s)} className={`led-chip ${form.skills.includes(s) ? "on" : ""}`}>{s}</button>
            ))}
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 bg-soft rounded-full px-2.5 py-1 text-xs text-ink">
                  {s}
                  <button type="button" onClick={() => toggleSkill(s)}><X className="w-3 h-3 text-mute hover:text-tangerine" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="led-box space-y-3 lg:col-span-2">
          <h2 className="text-[17px] font-bold text-ink">Alert preferences</h2>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-2">Notify me about</label>
            <div className="flex flex-wrap gap-2">
              {ALERT_TYPES.map((a) => (
                <button key={a.key} type="button" onClick={() => toggleAlert(a.key)} className={`led-chip ${form.alert_preferences.includes(a.key) ? "on" : ""}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-2">Preferred channel</label>
            <div className="flex gap-2">
              {ALERT_CHANNELS.map((c) => (
                <button key={c} type="button" onClick={() => set("alert_channel", c)} className={`led-chip ${form.alert_channel === c ? "on" : ""}`}>
                  {c === "app" ? "In-app" : c}
                </button>
              ))}
            </div>
            {(form.alert_channel === "SMS" || form.alert_channel === "WhatsApp") && (
              <p className="text-xs text-mute mt-2">SMS and WhatsApp delivery require a messaging provider to be connected. In-app alerts are active now.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <button type="submit" disabled={busy} className="led-btn flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}