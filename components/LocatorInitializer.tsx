"use client";

import { useEffect } from "react";

const locatorTarget =
  "antigravity-ide://open?file=${projectPath}${filePath}&line=${line}&column=${column}";

function setDefaultLocatorTarget() {
  document.documentElement.dataset.locatorTarget = locatorTarget;

  try {
    const storedOptions = window.localStorage.getItem("LOCATOR_OPTIONS");
    const options = storedOptions ? JSON.parse(storedOptions) : {};

    if (!options.templateOrTemplateId) {
      window.localStorage.setItem(
        "LOCATOR_OPTIONS",
        JSON.stringify({ ...options, templateOrTemplateId: locatorTarget }),
      );
    }
  } catch {
    return;
  }
}

export default function LocatorInitializer() {
  useEffect(() => {
    const projectPath = process.env.NEXT_PUBLIC_PROJECT_PATH;

    if (
      process.env.NODE_ENV !== "development" ||
      process.env.NEXT_PUBLIC_ENABLE_LOCATOR === "false" ||
      !projectPath
    ) {
      return;
    }

    setDefaultLocatorTarget();

    import("@locator/runtime")
      .then(({ default: setupLocatorUI }) => {
        setupLocatorUI({ projectPath });
      })
      .catch(() => undefined);
  }, []);

  return null;
}
