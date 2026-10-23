import React from "react";
import { Check } from "lucide-react";
import { STEPS } from "@/lib/onboardingUtils";

export default function WizardStepper({ current, steps = STEPS }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-1.5 flex-none ${active ? "" : "opacity-70"}`}>
              <span
                className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold ${
                  active || done ? "bg-brand text-white" : "bg-soft text-mute border border-line"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : idx}
              </span>
              <span className={`text-xs whitespace-nowrap ${active ? "font-bold text-ink" : "text-mute"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? <span className="w-4 h-px bg-line flex-none" /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}