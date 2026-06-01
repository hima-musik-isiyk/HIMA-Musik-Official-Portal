"use client";

import { usePathname } from "next/navigation";
import React, { useState } from "react";

import BlurText from "@/components/BlurText";
import TextPressure from "@/components/TextPressure";
import useIsomorphicLayoutEffect from "@/lib/useIsomorphicLayoutEffect";
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
  const currentPathname = usePathname() || "/";
  const [disableEntranceEffects, setDisableEntranceEffects] = useState(false);
  const [disablePressureEffect, setDisablePressureEffect] = useState(false);
  const [musikPressureActive, setMusikPressureActive] = useState(false);

  // We use this to force a reset of Part B whenever entrance effects are enabled
  const [mountId, setMountId] = useState(0);

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

  useIsomorphicLayoutEffect(() => {
    const shouldAnimate = shouldRunViewEntrance(currentPathname);

    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouchOnly =
      window.matchMedia("(pointer: coarse)").matches &&
      !window.matchMedia("(pointer: fine)").matches;

    // Reset states for fresh entrance
    setMountId((prev) => prev + 1);

    if (!shouldAnimate || isReducedMotion) {
      setDisableEntranceEffects(true);
      setMusikPressureActive(!isReducedMotion && !isTouchOnly);
    } else {
      setDisableEntranceEffects(false);
      setMusikPressureActive(false);
    }

    if (isReducedMotion || isTouchOnly) {
      setDisablePressureEffect(true);
    } else {
      setDisablePressureEffect(false);
    }
  }, [currentPathname]);

  return (
    <h1 className="flex flex-col font-serif text-[5.5rem] leading-[0.88] tracking-tight text-white md:text-[9rem] lg:text-[11rem]">
      {disableEntranceEffects ? (
        <span className="inline-flex whitespace-nowrap">{partA}</span>
      ) : (
        <BlurText
          key={`part-a-${mountId}`}
          text={partA}
          className="inline-flex"
          animateBy="letters"
          delay={100}
          threshold={0}
        />
      )}
      <div className="relative isolate min-h-[1em] w-full overflow-visible font-light text-stone-700 italic">
        {disablePressureEffect ? (
          disableEntranceEffects ? (
            <span className="inline-block whitespace-nowrap text-stone-700">
              {partB}
            </span>
          ) : (
            <BlurText
              key={`part-b-no-pressure-${mountId}`}
              text={partB}
              className="inline-flex text-stone-700"
              animateBy="letters"
              delay={250}
              threshold={0}
            />
          )
        ) : musikPressureActive ? (
          <TextPressure
            key={`part-b-pressure-${mountId}`}
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
            key={`part-b-entrance-${mountId}`}
            text={partB}
            className="inline-flex text-stone-700"
            animateBy="letters"
            delay={250}
            threshold={0}
            onAnimationComplete={() => {
              setMusikPressureActive(true);
            }}
          />
        )}
      </div>
    </h1>
  );
};
