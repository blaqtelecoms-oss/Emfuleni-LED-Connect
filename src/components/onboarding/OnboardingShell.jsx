import React from "react";
import { Check } from "lucide-react";
import MunicipalityLogo from "@/components/MunicipalityLogo";

/**
 * OnboardingShell — renders the Emfuleni LED onboarding template (attached HTML)
 * for both business and member flows. Left aside: logo + numbered step list +
 * LED office support panel. Right card: conic ring, Fraunces step title, subtitle,
 * the step content, and the nav bar. Visual only; flows provide their own content.
 */
export default function OnboardingShell({ steps, current, title, subtitle, onExit, children, nav }) {
  return (
    <div className="onb-page">
      <div className="onb-frame">
        <div className="onb-inner">
          {/* Left aside — logo, stepper, support */}
          <aside className="onb-left">
            <MunicipalityLogo />

            <ol className="onb-stp" aria-label="Onboarding steps">
              {steps.map((s, i) => {
                const idx = i + 1;
                const done = idx < current;
                const active = idx === current;
                const cls = active ? "on" : done ? "ok" : "";
                return (
                  <li key={s.key} className={cls}>
                    <span className="onb-dot">{done ? <Check className="w-3.5 h-3.5" /> : idx}</span>
                    <span>{s.label}</span>
                  </li>
                );
              })}
            </ol>

            <div className="onb-sup hidden md:block">
              <div className="onb-sb">
                <b>Chat to the LED office</b>
                <span>Questions about verification? Speak to our team.</span>
                <span className="onb-cp">ledsupport@newcastle.example</span>
              </div>
              <div className="onb-sb">
                <b>WhatsApp support</b>
                <span>Send us a photo of a document if upload fails.</span>
                <span className="onb-cp">034 000 0000</span>
              </div>
              <div className="onb-sb">
                <b>Call us</b>
                <span>Mon to Fri, 08:00 to 16:30 (SAST)</span>
                <span className="onb-cp">034 000 0001</span>
              </div>
              <p className="onb-fine">Sample contact details for this prototype. POPIA notice · Terms</p>
            </div>
          </aside>

          {/* Right card — step content */}
          <div className="onb-right">
            <div className="onb-wrap">
              <div className="flex items-center justify-between mb-4">
                <span className="onb-ring" aria-hidden="true" />
                <button type="button" onClick={onExit} className="onb-sv">
                  Exit
                </button>
              </div>
              <h2 className="onb-title">{title}</h2>
              <p className="onb-subt">{subtitle}</p>

              {children}

              <div className="onb-nav">{nav}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}