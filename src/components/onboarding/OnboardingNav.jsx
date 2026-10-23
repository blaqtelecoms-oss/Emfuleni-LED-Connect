import React from "react";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";

/**
 * OnboardingNav — shared bottom action bar for the business and member
 * onboarding wizards. Stays inline on every screen: the secondary actions
 * (Go back, Save) collapse to icons on very small screens, while the
 * primary action keeps its label (shortened on mobile).
 */
export default function OnboardingNav({
  onBack,
  backDisabled,
  onSave,
  saving,
  onPrimary,
  primaryLoading = false,
  primaryLabel,
  primaryLabelShort,
  primaryIcon: PrimaryIcon = ArrowRight,
}) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className="obtn obtn-o disabled:opacity-50"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden min-[380px]:inline">Go back</span>
      </button>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="obtn-sv"
          aria-label="Save and continue later"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="hidden md:inline">Save and continue later</span>
          <span className="hidden min-[380px] md:hidden">Save</span>
        </button>

        <button type="button" onClick={onPrimary} disabled={primaryLoading} className="obtn">
          {primaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PrimaryIcon className="w-4 h-4" />}
          <span className="hidden sm:inline">{primaryLabel}</span>
          <span className="sm:hidden">{primaryLabelShort || primaryLabel}</span>
        </button>
      </div>
    </>
  );
}