import React, { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { HERO_URL } from "@/lib/ledUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    title: "Your local economy, in one place.",
    body: "The Automated MSME Data Capturing, Profiling and Management System connects Emfuleni's businesses, residents and the LED office, so opportunities, support and updates reach the people who need them.",
  },
  {
    title: "Tenders, funding and training.",
    body: "Register once, appear in the local directory, respond to tenders, apply for funding and track every application from your phone.",
  },
  {
    title: "Jobs, updates and a voice.",
    body: "Apply for local work, get outage and event alerts by SMS, report problems and have your say on ward priorities.",
  },
];

const FEATURES = ["Tenders and funding", "Local jobs", "Outage and event alerts"];

export default function LoginHero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => clearInterval(timer.current);
  }, [paused]);

  const go = (n) => setIndex((n + SLIDES.length) % SLIDES.length);

  return (
    <div
      className="relative rounded-[20px] overflow-hidden min-h-[420px] h-full flex flex-col justify-end p-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Image
        src={HERO_URL}
        alt="A local baker serving customers at a market stall in Emfuleni, Gauteng"
        fittingType="fill"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* teal → navy gradient from the bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b2229]/95 via-[#087E83]/45 to-transparent" aria-hidden="true" />

      {/* top pill */}
      <div className="absolute top-4 left-4 text-xs font-semibold tracking-wide px-3.5 py-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-white">
        Emfuleni Local Economic Development
      </div>

      {/* floating feature pills */}
      <div className="absolute top-4 right-4 hidden sm:flex flex-col gap-2 items-end">
        {FEATURES.map((f) => (
          <span
            key={f}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-white"
          >
            {f}
          </span>
        ))}
      </div>

      {/* frosted rotating card */}
      <div className="relative z-10 rounded-[18px] bg-white/12 border border-white/20 backdrop-blur-md p-5 text-white">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((s, i) => (
              <div key={i} className="w-full shrink-0 px-0.5">
                <p className="font-display text-[19px] font-semibold leading-snug">{s.title}</p>
                <p className="text-white/85 text-[13px] leading-relaxed mt-1.5">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/45"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="w-7 h-7 rounded-full grid place-items-center bg-white/15 border border-white/25 hover:bg-white/25 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="w-7 h-7 rounded-full grid place-items-center bg-white/15 border border-white/25 hover:bg-white/25 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}