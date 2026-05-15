"use client";

import dynamic from "next/dynamic";

const LegacyHashRedirect = dynamic(() => import("./LegacyHashRedirect"), {
  ssr: false,
});

export default function LegacyHashRedirectWrapper() {
  return <LegacyHashRedirect />;
}
