import React from "react";

/**
 * Emfuleni header art — repeating SVG pattern using the Emfuleni palette
 * (blue, yellow, red, green, dark). Rendered as a decorative bar at the top
 * of the portal container.
 */
export function HeaderArt() {
  return (
    <svg
      preserveAspectRatio="xMinYMid slice"
      viewBox="0 0 768 96"
      className="block w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <pattern id="emfuleni-art" width="768" height="96" patternUnits="userSpaceOnUse">
          <rect width="96" height="96" fill="#0a5ba8" />
          <path d="M12 70q20-30 36-8t36-26" stroke="#f7d117" strokeWidth="12" fill="none" strokeLinecap="round" />
          <rect x="96" width="96" height="96" fill="#f6ead8" />
          <path d="M96 96a96 96 0 0 1 96-96v96z" fill="#d9261c" />
          <rect x="192" width="96" height="96" fill="#17181c" />
          <path d="M192 96l96-96M192 72l72-72M192 48l48-48M192 24l24-24M216 96l72-72M240 96l48-48M264 96l24-24" stroke="#f7d117" strokeWidth="7" />
          <rect x="288" width="96" height="96" fill="#0f9a42" />
          <path d="M336 14l40 68H296z" fill="#f6ead8" />
          <path d="M336 40l20 34h-40z" fill="#0f9a42" />
          <rect x="384" width="96" height="96" fill="#f7d117" />
          <path d="M384 96a48 48 0 0 1 96 0z" fill="#0a5ba8" />
          <path d="M400 96a32 32 0 0 1 64 0z" fill="#f6ead8" />
          <rect x="480" width="96" height="96" fill="#f6ead8" />
          <circle cx="504" cy="48" r="9" fill="#17181c" />
          <circle cx="528" cy="48" r="9" fill="#17181c" />
          <circle cx="552" cy="48" r="9" fill="#17181c" />
          <rect x="576" width="96" height="96" fill="#d9261c" />
          <path d="M576 96l48-70 48 70z" fill="#0a5ba8" />
          <path d="M600 96l24-34 24 34z" fill="#f7d117" />
          <rect x="672" width="96" height="96" fill="#0a5ba8" />
          <path d="M684 96v-30a36 36 0 0 1 72 0v30z" fill="#0f9a42" />
          <path d="M700 96v-22a20 20 0 0 1 40 0v22z" fill="#f6ead8" />
        </pattern>
      </defs>
      <rect width="768" height="96" fill="url(#emfuleni-art)" />
    </svg>
  );
}

/**
 * Emfuleni brand mark — triangular shield with Vaal-river wave lines in the
 * Emfuleni palette. Used in the sidebar header.
 */
export function EmfuleniBrand() {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <svg
        viewBox="0 0 120 108"
        className="w-[58px] h-auto"
        aria-label="Emfuleni Local Municipality"
      >
        <path d="M60 2L118 104H2z" fill="#0a5ba8" />
        <path d="M38 38q14 6 26 18 6 6 12 4" stroke="#f7d117" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M30 62q20-4 40 12 6 4 12 2" stroke="#d9261c" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M20 84q24-8 52 8 12 6 28 2" stroke="#0f9a42" strokeWidth="10" fill="none" strokeLinecap="round" />
      </svg>
      <b className="text-[15px] font-semibold tracking-tight leading-none text-white">EMFULENI</b>
      <small className="text-[9px] tracking-[1.6px] text-gray-400 font-medium">LOCAL MUNICIPALITY</small>
    </div>
  );
}
