"use client";

import React from "react";

import { resolveCmsHref } from "@/lib/cms-links";
import {
  CMSComponent,
  CMSComponentRegistry,
  CMSGroupCategory,
  ContainerCMSData,
} from "@/lib/notion-builder";

import { componentRegistry } from "./Registry";

interface ComponentBuilderProps {
  component: CMSComponent;
  registryDef: CMSComponentRegistry | undefined;
  groupDef: CMSGroupCategory | undefined;
  cmsData: ContainerCMSData;
  contextPageId?: string;
  injectedProps?: Record<string, unknown>;
}

export const ComponentBuilder: React.FC<ComponentBuilderProps> = ({
  component,
  registryDef,
  groupDef,
  cmsData,
  contextPageId,
  injectedProps,
}) => {
  if (!component.show) return null;

  // If the component is missing from Notion registry but its typeId directly matches a hardcoded component string
  const registryDefOrRaw = registryDef;
  const ComponentToRender = registryDef
    ? componentRegistry[registryDef.name]
    : componentRegistry[component.typeId];

  if (!ComponentToRender) {
    console.warn(
      `No component found in registry for: ${registryDef?.name || component.typeId}`,
    );
    return null;
  }

  // Merge values: The component instance overrides the registry defaults if present
  const value1 = component.value || registryDefOrRaw?.value1;
  const value2 = component.value2 || registryDefOrRaw?.value2;
  const value3 = component.value3 || registryDefOrRaw?.value3;
  const variation1 = component.variation || registryDefOrRaw?.variation1;
  const variation2 = registryDefOrRaw?.variation2;
  const variation3 = registryDefOrRaw?.variation3;

  const extraProps =
    injectedProps?.[registryDefOrRaw?.name || component.typeId] || {};

  const componentName = registryDefOrRaw?.name || component.typeId;
  const resolvesLink =
    componentName === "Button Span" || componentName === "Button";
  const href = resolvesLink
    ? resolveCmsHref(value3 || "", cmsData, contextPageId)
    : undefined;

  const props = {
    value1,
    value2,
    value3,
    href,
    variation1,
    variation2,
    variation3,
    groupId: groupDef?.id,
    ...extraProps,
  };

  const renderedComponent = <ComponentToRender {...props} />;

  // Wrap in group div if needed
  if (groupDef) {
    let groupClass = "";
    if (groupDef.type === "Flex") {
      groupClass = "flex w-full";
      switch (groupDef.name) {
        case "Vertically Align Center":
          groupClass += " flex-col items-center justify-center text-center";
          break;
        case "Horizontally Align Center":
          groupClass += " flex-row items-center justify-center text-center";
          break;
        case "Space Between":
          groupClass += " flex-row items-center justify-between";
          break;
        case "Vertically Align Bottom":
          groupClass += " flex-col justify-end";
          break;
        case "Vertically Align Top":
          groupClass += " flex-col justify-start";
          break;
        case "Horizontally Align Left":
          groupClass += " flex-row items-center justify-start text-left";
          break;
        case "Horizontally Align Right":
          groupClass += " flex-row items-center justify-end text-right";
          break;
        default:
          break;
      }
    } else if (groupDef.type === "Position" && groupDef.name === "Background") {
      groupClass = "absolute inset-0 w-full h-full z-0";
    }

    return <div className={groupClass}>{renderedComponent}</div>;
  }

  return renderedComponent;
};
