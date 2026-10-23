import React from "react";

// Matches the supplied design's `.box` empty-state aesthetic: white card, soft border,
// centred icon + heading + muted note.
export default function PortalPlaceholder({ icon: Icon, note }) {
  return (
    <div className="animate-fade-up">
      <div className="led-box text-center px-6 py-14">
        {Icon && (
          <div className="w-12 h-12 rounded-full bg-soft grid place-items-center mx-auto mb-3">
            <Icon className="w-6 h-6 text-brand" aria-hidden="true" />
          </div>
        )}
        <p className="text-ink font-semibold text-base">Ready for the next build phase</p>
        <p className="text-mute text-sm mt-2 max-w-md mx-auto leading-relaxed">
          {note ||
            "The shell, navigation and permissions are live now. This section's full functionality against live data is built in the next phase."}
        </p>
      </div>
    </div>
  );
}