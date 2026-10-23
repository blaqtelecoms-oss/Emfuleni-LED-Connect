import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import MunicipalityLogo from "@/components/MunicipalityLogo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import LoginHero from "@/components/auth/LoginHero";
import {
  User,
  Store,
  Eye,
  EyeOff,
  Loader2,
  Check,
  ArrowLeft,
  Smartphone,
  MessageSquare,
} from "lucide-react";

const SECTORS = ["Retail", "Food", "Trades", "Services", "Agriculture", "Manufacturing"];

export default function Home() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  const [mode, setMode] = useState("login"); // login | signup
  const [role, setRole] = useState("member"); // member | business
  const [officerMode, setOfficerMode] = useState(false);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("Retail");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  // flow state
  const [step, setStep] = useState("form"); // form | otp | success
  const [otpPurpose, setOtpPurpose] = useState("signup"); // signup | sms_login
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // resend countdown (must run before any early return — rules of hooks)
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Already signed in? Route to the right portal.
  // Invited LED officers log in as role "admin" with no account_type — treat them as officer.
  const targetPortal = user?.account_type || (user?.role === "admin" ? "officer" : null);
  if (isAuthenticated && targetPortal) {
    return <Navigate to={`/${targetPortal}`} replace />;
  }

  const loginLabel = officerMode
    ? "Log in"
    : `Log in as ${role === "member" ? "Member" : "Business"}`;
  const signupLabel = `Sign up as ${role === "member" ? "Member" : "Business"}`;

  const validateSignup = () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!phone.trim()) return "Your cell number is required for SMS alerts.";
    if (!area.trim()) return "Your area is required.";
    if (!consent) return "Please accept the POPIA notice and terms to continue.";
    if (role === "business") {
      if (!businessName.trim()) return "Your business name is required.";
      if (!ownerName.trim()) return "The owner's full name is required.";
    } else {
      if (!fullName.trim()) return "Your full name is required.";
    }
    return null;
  };

  const doLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const doSignup = async (e) => {
    e.preventDefault();
    setError("");
    const v = validateSignup();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      setOtpPurpose("signup");
      setOtp("");
      setResendIn(30);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Sign up failed. This email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const startSmsCode = async (channel) => {
    setError("");
    if (!phone.trim()) {
      setError("Enter your cell number first to get a code.");
      return;
    }
    try {
      await base44.entities.NotificationLog.create({
        recipient: phone.trim(),
        channel,
        template: "login_otp",
        body: `Your Automated MSME Data Capturing, Profiling and Management System ${channel} login code is [code]. (stub)`,
        status: "queued (stub)",
      });
    } catch {
      /* non-blocking */
    }
    setOtpPurpose("sms_login");
    setOtp("");
    setResendIn(30);
    setStep("otp");
    toast({
      title: `${channel} code requested`,
      description: "SMS and WhatsApp code sending is a planned feature. For now, please log in with your email and password.",
    });
  };

  const doVerify = async () => {
    setError("");
    if (otp.length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (otpPurpose === "sms_login") {
      // SMS/WhatsApp login needs a messaging provider — stubbed for now.
      setError("SMS and WhatsApp login needs a messaging provider to be connected. Please go back and log in with your email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: email.trim(), otpCode: otp });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      const me = await base44.auth.me();
      // persist account type + profile fields
      const consentAt = new Date().toISOString();
      await base44.auth
        .updateMe({
          account_type: role,
          phone: phone.trim(),
          area: area.trim(),
          language: "English",
          popia_consent_at: consentAt,
          full_name: role === "business" ? ownerName.trim() : fullName.trim(),
        })
        .catch(() => {});
      if (role === "business") {
        await base44.entities.Business.create({
          owner: me.id,
          name: businessName.trim(),
          sector,
          area: area.trim(),
          phone: phone.trim(),
          status: "pending",
        });
      }
      await base44.entities.UserProfile.create({
        user: me.id,
        account_type: role,
        full_name: role === "business" ? ownerName.trim() : fullName.trim(),
        phone: phone.trim(),
        area: area.trim(),
        language: "English",
        popia_consent_at: consentAt,
      });
      setStep("success");
    } catch (err) {
      setError(err.message || "Verification failed. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (otpPurpose === "signup") {
      try {
        await base44.auth.resendOtp(email.trim());
        setResendIn(30);
        toast({ title: "Code sent", description: "Check your email for the new code." });
      } catch (err) {
        setError(err.message || "Failed to resend code.");
      }
    } else {
      setResendIn(30);
    }
  };

  // ---- OTP step ----
  if (step === "otp") {
    return (
      <AuthCard right={<LoginHero />}>
        <button
          onClick={() => {
            setStep("form");
            setError("");
          }}
          className="flex items-center gap-1.5 text-mute text-sm mb-4 hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="font-display text-[26px] font-semibold text-center leading-tight">
          {otpPurpose === "signup" ? "Verify your email" : "Enter your code"}
        </h2>
        <p className="text-mute text-sm text-center mt-1 mb-6">
          {otpPurpose === "signup"
            ? `We sent a 6-digit code to ${email.trim()}`
            : `Enter the 6-digit code we sent to ${phone.trim() || "your phone"}`}
        </p>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-100 text-red-800 text-sm dark:bg-red-500/15 dark:text-red-300">{error}</div>}

        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <button
          onClick={doVerify}
          disabled={loading || otp.length < 6}
          className="btn-grad w-full rounded-xl py-3.5 font-semibold text-white shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {otpPurpose === "signup" ? "Verify and continue" : "Continue"}
        </button>

        <p className="text-center text-sm text-mute mt-4">
          {resendIn > 0 ? (
            `Resend code in ${resendIn}s`
          ) : (
            <>
              Didn't get it?{" "}
              <button onClick={resend} className="text-brand font-semibold hover:underline">
                Resend code
              </button>
            </>
          )}
        </p>
      </AuthCard>
    );
  }

  // ---- Success step ----
  if (step === "success") {
    return (
      <AuthCard right={<LoginHero />}>
        <div className="flex flex-col items-center text-center py-6">
          <div className="btn-grad w-[76px] h-[76px] rounded-full grid place-items-center text-white text-3xl shadow-lg animate-pop mb-5">
            <Check className="w-9 h-9" strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-[26px] font-semibold leading-tight">
            {role === "business" ? "Business registered" : "You're in"}
          </h2>
          <p className="text-mute text-sm mt-2 max-w-xs">
            {role === "business"
              ? "Let's verify your business. Complete your profile and upload your documents so an LED officer can review them."
              : "Let's set up your community profile so we can match you with jobs, updates and services in your ward."}
          </p>
          <button
            onClick={() => {
              window.location.href = role === "business" ? "/onboarding" : "/member-onboarding";
            }}
            className="btn-grad w-full mt-6 rounded-xl py-3.5 font-semibold text-white shadow-lg"
          >
            {role === "business" ? "Start verification" : "Complete your profile"}
          </button>
        </div>
      </AuthCard>
    );
  }

  // ---- Form step ----
  const isSignup = mode === "signup";
  return (
    <AuthCard right={<LoginHero />}>
      {/* Segmented toggle */}
      {!officerMode && (
        <div className="relative flex bg-soft rounded-full p-1 w-[230px] mx-auto mb-5 border border-line">
          <span
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-shell shadow transition-transform duration-300"
            style={{ transform: isSignup ? "translateX(100%)" : "translateX(0)" }}
          />
          <button
            onClick={() => setMode("login")}
            aria-pressed={!isSignup}
            className={`relative z-10 flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
              !isSignup ? "text-ink" : "text-mute"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setMode("signup")}
            aria-pressed={isSignup}
            className={`relative z-10 flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
              isSignup ? "text-ink" : "text-mute"
            }`}
          >
            Sign up
          </button>
        </div>
      )}

      {/* officer login removed from the public page — LED staff use the /login invite link */}

      <h2 className="font-display text-[28px] font-semibold text-center leading-tight">
        {officerMode ? "LED staff log in" : isSignup ? "Create your account" : "Welcome back"}
      </h2>
      <p className="text-mute text-sm text-center mt-1 mb-5">
        {officerMode ? "Sign in to the LED Officer portal." : "Emfuleni's economy, in one place."}
      </p>

      {/* Role cards */}
      {!officerMode && (
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <RoleCard
            selected={role === "member"}
            onClick={() => setRole("member")}
            icon={User}
            title="Member"
            desc="Residents & job seekers"
          />
          <RoleCard
            selected={role === "business"}
            onClick={() => setRole("business")}
            icon={Store}
            title="Business"
            desc="Spazas, SMMEs, co-ops"
          />
        </div>
      )}

      {error && <div className="mb-3 p-3 rounded-xl bg-red-100 text-red-800 text-sm dark:bg-red-500/15 dark:text-red-300">{error}</div>}

      <form onSubmit={isSignup ? doSignup : doLogin} className="space-y-3">
        {isSignup && role === "business" && (
          <Field label="Business name">
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Thandi's Bakery"
              className="led-input"
            />
          </Field>
        )}
        {isSignup && (
          <Field label={role === "business" ? "Owner full name" : "Full name"}>
            <input
              value={role === "business" ? ownerName : fullName}
              onChange={(e) => (role === "business" ? setOwnerName(e.target.value) : setFullName(e.target.value))}
              placeholder="First and last name"
              className="led-input"
            />
          </Field>
        )}
        <Field label={isSignup ? "Email" : "Email or cell number"}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="led-input"
          />
        </Field>
        {isSignup && (
          <Field label="Cell number">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 082 123 4567"
              inputMode="tel"
              className="led-input"
            />
          </Field>
        )}
        {isSignup && role === "business" && (
          <Field label="Sector">
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="led-input">
              {SECTORS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        )}
        {isSignup && (
          <Field label="Area">
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Madadeni"
              className="led-input"
            />
          </Field>
        )}
        <Field
          label="Password"
          right={
            !isSignup && !officerMode ? (
              <Link to="/forgot-password" className="text-xs text-brand font-semibold hover:underline">
                Forgot password?
              </Link>
            ) : null
          }
        >
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="led-input pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {isSignup && (
          <label className="flex items-start gap-2.5 text-[13px] text-mute leading-relaxed mt-1">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[hsl(var(--green))]"
            />
            <span>
              I consent to the Automated MSME Data Capturing, Profiling and Management System collecting and processing my information under POPIA, and I agree to
              the terms of use.
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-grad w-full rounded-xl py-3.5 font-semibold text-white shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isSignup ? signupLabel : loginLabel}
        </button>
      </form>

      {/* OR divider + SMS/WhatsApp codes (login only) */}
      {!isSignup && !officerMode && (
        <>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[11px] tracking-widest text-mute">OR</span>
            <div className="flex-1 h-px bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => startSmsCode("SMS")}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-shell py-2.5 text-sm font-medium hover:bg-soft"
            >
              <Smartphone className="w-4 h-4 text-brand" /> SMS code
            </button>
            <button
              onClick={() => startSmsCode("WhatsApp")}
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-shell py-2.5 text-sm font-medium hover:bg-soft"
            >
              <MessageSquare className="w-4 h-4 text-brand" /> WhatsApp code
            </button>
          </div>
        </>
      )}

      {!isSignup && (
        <p className="text-center text-sm text-mute mt-5">
          LED staff?{" "}
          <Link to="/officer" className="text-brand font-semibold hover:underline">
            Sign in to the officer portal
          </Link>
        </p>
      )}

    </AuthCard>
  );
}

/* ---- small presentational helpers (kept in-file for the auth surface) ---- */

function AuthCard({ right, children }) {
  return (
    <div className="min-h-screen grid place-items-center p-3 sm:p-6 bg-page relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-[hsl(var(--green)/0.12)] blur-3xl" />
        <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-[hsl(var(--blue)/0.22)] blur-3xl" />
      </div>
      <div className="relative w-full max-w-[1120px] glass-surface shadow-glass rounded-[28px] grid grid-cols-1 md:grid-cols-2 p-3 gap-3 border border-[hsl(var(--line))]">
        <div className="flex flex-col p-5 md:px-9 md:py-8 min-w-0">
          <MunicipalityLogo className="self-start mb-5" />
          {children}
        </div>
        <div className="hidden md:block">{right}</div>
      </div>
    </div>
  );
}

function RoleCard({ selected, onClick, icon: Icon, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative text-left rounded-2xl border-[1.5px] p-3 transition-all ${
        selected
          ? "border-[hsl(var(--green))] bg-[hsl(var(--green)/0.06)] shadow-[0_0_0_4px_hsl(var(--green)/14%)]"
          : "border-[hsl(var(--line))] hover:border-[hsl(var(--green)/0.5)] bg-[hsl(var(--shell)/0.5)]"
      }`}
    >
      <Icon className="w-[22px] h-[22px] text-[hsl(var(--green))] mb-1.5" strokeWidth={1.8} />
      <b className="block text-sm text-ink">{title}</b>
      <span className="block text-xs text-mute leading-tight">{desc}</span>
      {selected && (
        <span className="absolute top-2 right-2.5 w-[18px] h-[18px] rounded-full bg-[hsl(var(--green))] text-white text-[11px] grid place-items-center">
          ✓
        </span>
      )}
    </button>
  );
}

function Field({ label, right, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="block font-semibold text-[13px] text-ink mb-1.5">{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}