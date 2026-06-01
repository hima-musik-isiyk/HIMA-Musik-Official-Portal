"use client";

import React, { useEffect, useState } from "react";

import BlurText from "@/components/BlurText";
import TextPressure from "@/components/TextPressure";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

interface BerandaTitleProps {
  value1?: string; // Main title part 1, e.g., "HIMA"
  value2?: string; // Main title part 2, e.g., "MUSIK"
  value3?: string; // Subtitle (unused since we only output the title component itself)
}

export const BerandaTitle: React.FC<BerandaTitleProps> = ({
  value1 = "",
  value2 = "",
}) => {
  const pathname = "/";
  const [disableEntranceEffects, setDisableEntranceEffects] = useState(false);
  const [disablePressureEffect, setDisablePressureEffect] = useState(false);
  const [musikPressureActive, setMusikPressureActive] = useState(false);

  // Parsing the word split dynamically
  const splitIndex = parseInt(value2, 10);
  let partA = "";
  let partB = "";

  if (!isNaN(splitIndex) && splitIndex > 0) {
    const words = value1.trim().split(/\s+/);
    if (words.length > 0) {
      const actualSplit = Math.min(splitIndex, words.length);
      partA = words.slice(0, actualSplit).join(" ");
      partB = words.slice(actualSplit).join(" ");
    }
  } else {
    // Legacy / Fallback mode
    partA = value1 || "HIMA";
    partB = value2 || "MUSIK";
  }

  useEffect(() => {
    const shouldAnimate = shouldRunViewEntrance(pathname);
    if (!shouldAnimate) setDisableEntranceEffects(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisablePressureEffect(true);
      setDisableEntranceEffects(true);
    }
    const isTouchOnly =
      window.matchMedia("(pointer: coarse)").matches &&
      !window.matchMedia("(pointer: fine)").matches;
    if (isTouchOnly) {
      setDisablePressureEffect(true);
    }
  }, []);

  useEffect(() => {
    if (disablePressureEffect) {
      setMusikPressureActive(false);
      return;
    }
    if (disableEntranceEffects) {
      setMusikPressureActive(true);
      return;
    }
    setMusikPressureActive(false);
  }, [disableEntranceEffects, disablePressureEffect]);

  return (
    <h1 className="flex flex-col font-serif text-[5.5rem] leading-[0.88] tracking-tight text-white md:text-[9rem] lg:text-[11rem]">
      {disableEntranceEffects ? (
        <span className="inline-flex whitespace-nowrap">{partA}</span>
      ) : (
        <BlurText text={partA} className="inline-flex" animateBy="letters" />
      )}
      <div className="relative isolate min-h-[1em] w-full overflow-visible font-light text-stone-700 italic">
        {disablePressureEffect ? (
          disableEntranceEffects ? (
            <span className="inline-block whitespace-nowrap text-stone-700">
              {partB}
            </span>
          ) : (
            <BlurText
              text={partB}
              className="inline-flex text-stone-700"
              animateBy="letters"
            />
          )
        ) : musikPressureActive ? (
          <TextPressure
            text={partB}
            className="translate-y-[0.04em]"
            fontFamily="var(--font-serif)"
            fontUrl=""
            autoFit={false}
            width={false}
            textColor={"var(--color-stone-700)"}
            stroke={false}
            flex={false}
            warmupDuration={1200}
            actuationDuration={1200}
            actuationWghtFrom={300}
            minWghtFloor={300}
          />
        ) : (
          <BlurText
            text={partB}
            className="inline-flex text-stone-700"
            animateBy="letters"
            onAnimationComplete={() => setMusikPressureActive(true)}
          />
        )}
      </div>
    </h1>
  );
};
