import React from "react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/ledUtils";

export default function MunicipalityLogo({ className = "" }) {
  return (
    <div className={`relative w-full max-w-[280px] shrink-0 ${className}`}>
      <Image
        src={LOGO_URL}
        alt="Emfuleni Local Municipality logo"
        fittingType="fit"
        originWidth={577}
        originHeight={433}
        className="w-full aspect-[577/433] object-contain"
      />
    </div>
  );
}