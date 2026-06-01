"use client";

import React from "react";

import LightPillar from "@/components/LightPillar";

interface BerandaTempArtworkProps {
  variation1?: string;
  variation2?: string;
  className?: string;
}

export const BerandaTempArtwork: React.FC<BerandaTempArtworkProps> = ({
  variation1 = "",
  className = "",
}) => {
  // Subtle is Variation 1
  const isSubtle = variation1 === "1" || variation1?.toLowerCase() === "subtle";

  if (isSubtle) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        {/* Subtle LightPillar */}
        <div className="absolute inset-x-0 top-0 -bottom-36 -z-10">
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

        {/* Subtle Radial Gradients */}
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
    );
  }

  // Basic is Variation 2
  return (
    <div
      className={`pointer-events-none absolute top-0 right-0 z-0 h-screen w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(212,166,77,0.03)_0%,transparent_70%)] ${className}`}
      aria-hidden="true"
    />
  );
};

export default BerandaTempArtwork;
