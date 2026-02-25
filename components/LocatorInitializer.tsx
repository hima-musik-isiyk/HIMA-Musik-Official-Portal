"use client";

import { useEffect } from "react";

export default function LocatorInitializer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
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
