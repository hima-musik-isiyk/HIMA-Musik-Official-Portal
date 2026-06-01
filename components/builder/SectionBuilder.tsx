"use client";

import React from "react";

import {
  CMSComponent,
  CMSSection,
  ContainerCMSData,
} from "@/lib/notion-builder";

import { ComponentBuilder } from "./ComponentBuilder";

interface SectionBuilderProps {
  section: CMSSection;
  cmsData: ContainerCMSData;
  injectedProps?: Record<string, unknown>;
}

export const SectionBuilder: React.FC<SectionBuilderProps> = ({
  section,
  cmsData,
  injectedProps,
}) => {
  if (!section.show) return null;

  const page = cmsData.pages.find((p) => p.id === section.pageId);
  const maxWidth = page?.maxWidth || "7xl";

  const maxWidthMap: Record<string, string> = {
    "7xl": "max-w-7xl",
    max: "max-w-none",
    "6xl": "max-w-6xl",
    "5xl": "max-w-5xl",
    "4xl": "max-w-4xl",
    "3xl": "max-w-3xl",
    "2xl": "max-w-2xl",
    xl: "max-w-xl",
    lg: "max-w-lg",
    md: "max-w-md",
    sm: "max-w-sm",
  };
  const maxWidthClass = maxWidthMap[maxWidth.toLowerCase()] || "max-w-7xl";

  const renderGroup = (groupId: string, components: CMSComponent[]) => {
    // Sort by suborder
    const sorted = [...components].sort((a, b) => {
      const aSub = a.orderOrGroup.split("-")[1] || a.orderOrGroup;
      const bSub = b.orderOrGroup.split("-")[1] || b.orderOrGroup;
      return aSub.localeCompare(bSub, undefined, { numeric: true });
    });

    // Find if any component in this group specifies a Master Group Div Category
    const groupDefId = sorted.find((c) => c.groupId)?.groupId;
    const groupDef = groupDefId
      ? cmsData.groupCategories[groupDefId]
      : undefined;

    const renderedChildren = sorted.map((c) => (
      <ComponentBuilder
        key={c.id}
        component={c}
        registryDef={cmsData.componentRegistry[c.typeId]}
        groupDef={undefined} // Do not wrap individual components if we wrap the group
        cmsData={cmsData}
        contextPageId={section.pageId}
        injectedProps={injectedProps}
      />
    ));

    if (groupDef) {
      let groupClass = "";
      if (groupDef.type === "Flex") {
        groupClass = "flex w-full gap-4 md:gap-8";
        switch (groupDef.name) {
          case "Vertically Align Center":
            groupClass += " flex-col items-center justify-center text-center";
            break;
          case "Horizontally Align Center":
            groupClass +=
              " flex-row items-center justify-center text-center flex-wrap";
            break;
          case "Space Between":
            groupClass +=
              " flex-col md:flex-row items-start md:items-center justify-between";
            break;
          case "Vertically Align Bottom":
            groupClass += " flex-col justify-end";
            break;
          case "Vertically Align Top":
            groupClass += " flex-col justify-start";
            break;
          case "Horizontally Align Left":
            groupClass += " flex-col items-start justify-center text-left";
            break;
          case "Horizontally Align Right":
            groupClass += " flex-col items-end justify-center text-right";
            break;
          default:
            break;
        }
      } else if (
        groupDef.type === "Position" &&
        (groupDef.name === "Background" ||
          groupDef.name.includes("Absolute") ||
          groupDef.name.includes("Span All Height") ||
          groupDef.name.includes("Ignore Section Paddings"))
      ) {
        groupClass = "absolute inset-0 w-full h-full z-0";
      }

      return (
        <div key={groupId} className={groupClass}>
          {renderedChildren}
        </div>
      );
    }

    // No group wrapper, just return children
    return <React.Fragment key={groupId}>{renderedChildren}</React.Fragment>;
  };

  const isFullHeight =
    section.height === "Full Height" || section.height === "Full Viewport";
  const baseSectionClass = `relative flex flex-col justify-center px-6 ${isFullHeight ? "min-h-[calc(100svh-5rem)] border-b border-white/5 py-24" : "py-20 md:py-28"}`;

  // Check if we have background elements
  const bgComponents = section.components.filter((c) => {
    const groupDefId = c.groupId;
    const groupDef = groupDefId
      ? cmsData.groupCategories[groupDefId]
      : undefined;
    return (
      groupDef?.type === "Position" &&
      (groupDef?.name === "Background" ||
        groupDef?.name.includes("Absolute") ||
        groupDef?.name.includes("Span All Height") ||
        groupDef?.name.includes("Ignore Section Paddings"))
    );
  });

  const foregroundComponents = section.components.filter(
    (c) => !bgComponents.includes(c),
  );

  // Re-group foreground components
  const fgGroups: Record<string, CMSComponent[]> = {};
  foregroundComponents.forEach((c) => {
    const orderKey = c.orderOrGroup?.trim() || "0";
    const groupPrefix = orderKey.includes("-")
      ? orderKey.split("-")[0]
      : orderKey;
    if (!fgGroups[groupPrefix]) fgGroups[groupPrefix] = [];
    fgGroups[groupPrefix].push(c);
  });

  const sortedGroupKeys = Object.keys(fgGroups).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  return (
    <section id={section.slug?.replace("#", "")} className={baseSectionClass}>
      {bgComponents.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {bgComponents.map((c) => (
            <ComponentBuilder
              key={c.id}
              component={c}
              registryDef={cmsData.componentRegistry[c.typeId]}
              groupDef={cmsData.groupCategories[c.groupId]}
              cmsData={cmsData}
              contextPageId={section.pageId}
            />
          ))}
        </div>
      )}
      <div className={`relative z-10 mx-auto w-full ${maxWidthClass}`}>
        <div className="flex flex-col gap-12">
          {sortedGroupKeys.map((key) => renderGroup(key, fgGroups[key]))}
        </div>
      </div>
    </section>
  );
};
