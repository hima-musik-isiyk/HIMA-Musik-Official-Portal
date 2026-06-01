"use client";

import React, { useEffect, useState } from "react";

import BlurText from "@/components/BlurText";
import LightPillar from "@/components/LightPillar";
import TextPressure from "@/components/TextPressure";
import { shouldRunViewEntrance } from "@/lib/view-entrance";

const AccentLine = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className = "", ...props }, ref) => (
  <span
    ref={ref}
    className={`bg-gold-500/40 block h-px w-8 md:w-12 ${className}`}
    aria-hidden="true"
    {...props}
  />
));
AccentLine.displayName = "AccentLine";

interface BerandaTitleProps {
  value1?: string; // Main title part 1, e.g., "HIMA"
  value2?: string; // Main title part 2, e.g., "MUSIK"
  value3?: string; // Subtitle, e.g., "Institut Seni Indonesia Yogyakarta"
}

export const BerandaTitle: React.FC<BerandaTitleProps> = ({
  value1 = "HIMA",
  value2 = "MUSIK",
  value3 = "Institut Seni Indonesia Yogyakarta",
}) => {
  const pathname = "/";
  const [disableEntranceEffects, setDisableEntranceEffects] = useState(false);
  const [disablePressureEffect, setDisablePressureEffect] = useState(false);
  const [musikPressureActive, setMusikPressureActive] = useState(false);

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
    <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -bottom-36 -z-10"
        aria-hidden="true"
      >
        <div className="relative h-full w-full md:ml-auto md:w-[60vw] lg:w-[52vw]">
          <div
            data-animate="fade"
            data-animate-delay="0.51"
            data-animate-duration="8"
            className="h-full w-full"
          >
            <LightPillar
              topColor="#D4A64D"
              bottomColor="#0a0a0a"
              intensity={1}
              glowAmount={0.005}
              pillarWidth={3.4}
              pillarHeight={0.46}
              noiseIntensity={0.35}
              className="opacity-15"
              mixBlendMode="screen"
              quality="medium"
            />
          </div>
          <div className="absolute inset-x-0 top-0 bottom-0 bg-linear-to-b from-transparent via-stone-950/25 to-stone-950" />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 -left-20 h-128 w-lg rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 160, 122, 0.15)_0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -right-20 bottom-1/3 h-112 w-md rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(28, 25, 23, 0.3)_0%, transparent 70%)",
          }}
        />
      </div>

      <div className="mb-6 flex items-center gap-4 md:mb-8">
        <AccentLine
          data-animate="right"
          data-animate-delay="0.25"
          data-animate-duration="0.7"
        />
        <p
          data-animate="up"
          data-animate-delay="0.33"
          data-animate-duration="0.85"
          className="text-xs font-medium tracking-[0.4em] text-stone-400/80 uppercase md:text-sm"
        >
          Himpunan Mahasiswa
        </p>
      </div>

      <h1 className="flex flex-col font-serif text-[5.5rem] leading-[0.88] tracking-tight text-white md:text-[9rem] lg:text-[11rem]">
        {disableEntranceEffects ? (
          <span className="inline-flex whitespace-nowrap">{value1}</span>
        ) : (
          <BlurText
            text={value1 || "HIMA"}
            className="inline-flex"
            animateBy="letters"
          />
        )}
        <div className="relative isolate min-h-[1em] w-full overflow-visible font-light text-stone-700 italic">
          {disablePressureEffect ? (
            disableEntranceEffects ? (
              <span className="inline-block whitespace-nowrap text-stone-700">
                {value2}
              </span>
            ) : (
              <BlurText
                text={value2 || "MUSIK"}
                className="inline-flex text-stone-700"
                animateBy="letters"
              />
            )
          ) : musikPressureActive ? (
            <TextPressure
              text={value2 || "MUSIK"}
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
              text={value2 || "MUSIK"}
              className="inline-flex text-stone-700"
              animateBy="letters"
              onAnimationComplete={() => setMusikPressureActive(true)}
            />
          )}
        </div>
      </h1>

      <p
        data-animate="up"
        data-animate-delay="0.59"
        data-animate-duration="0.75"
        className="mt-4 text-sm tracking-[0.08em] text-stone-500 md:text-base"
      >
        {value3}
      </p>
    </div>
  );
};
