import React from "react";
import { Link } from "react-router-dom";
import { STEPS } from "@/lib/onboardingUtils";
import { Check, ChevronRight } from "lucide-react";

/**
 * OnboardingProgress — shows a business's verification onboarding progress
 * on the business dashboard. Displays the 5 steps with done/current/pending
 * states and a "Continue onboarding" call-to-action.
 *
 * Props:
 *   draftStep — the draft_step value from the VerificationApplication (1-based)
 *   submitted — true if the application has been submitted (status !== draft)
 */
export default function OnboardingProgress({ draftStep = 1, submitted = false }) {
  const currentStep = draftStep || 1;

  if (submitted) return null;

  const completedCount = currentStep - 1;
  const totalSteps = STEPS.length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="rounded-[16px] bg-card border border-line p-4 mb-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <b className="text-[15px] font-semibold text-ink block">
            {completedCount > 0 ? "Continue your verification" : "Complete your verification"}
          </b>
          <span className="text-mute text-xs">
            {completedCount > 0
              ? `Step ${currentStep} of ${totalSteps} — ${STEPS[currentStep - 1]?.label || ""}`
              : "Verify your business to unlock tenders, funding and the directory."}
          </span>
        </div>
        <Link
          to="/onboarding"
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-brand text-white text-[13px] font-medium hover:bg-brand-dark transition-colors flex-none"
        >
          {completedCount > 0 ? "Continue" : "Start"}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-soft overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const idx = i + 1;
          const done = idx < currentStep;
          const active = idx === currentStep;
          return (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[8px] text-[11px] font-medium flex-1 ${
                  done
                    ? "text-green-dark bg-[hsl(var(--green)/0.12)]"
                    : active
                    ? "text-brand bg-brand/10"
                    : "text-mute bg-soft"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full grid place-items-center flex-none ${
                    done
                      ? "bg-green text-white"
                      : active
                      ? "bg-brand text-white"
                      : "bg-mute/30 text-mute"
                  }`}
                >
                  {done ? <Check className="w-2.5 h-2.5" /> : idx}
                </span>
                <span className="truncate hidden sm:inline">{s.label}</span>
              </div>
              {idx < totalSteps && (
                <div className={`w-3 h-px ${done ? "bg-green/40" : "bg-line"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
