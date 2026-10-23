import React from "react";

export default function WizardField({ label, hint, required, children, className }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">
        {label}
        {required ? <span className="text-tangerine"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-mute text-xs mt-1 leading-snug">{hint}</p> : null}
    </div>
  );
}