"use client";

import { useEffect } from "react";

export default function LocatorInitializer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    if (process.env.NEXT_PUBLIC_ENABLE_LOCATOR !== "true") {
      return;
    }

    const hostname = window.location.hostname;
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";

    if (!isLocalHost) {
      return;
    }

    import("@locator/runtime")
      .then(({ default: setupLocatorUI }) => {
        setupLocatorUI();
      })
      .catch(() => undefined);
  }, []);

  return null;
}
