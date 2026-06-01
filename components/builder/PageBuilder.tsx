import { notFound } from "next/navigation";
import React from "react";

import { getRequestPathname } from "@/lib/cms-route";
import {
  CMSPage,
  ContainerCMSData,
  fetchContainerCMSCached,
  findCmsPageForPath,
  normalizeCmsSlug,
} from "@/lib/notion-builder";

import PageEntranceWrapper from "./PageEntranceWrapper";
import { SectionBuilder } from "./SectionBuilder";

interface PageBuilderProps {
  pageData?: ContainerCMSData;
  injectedProps?: Record<string, unknown>;
  overridePage?: CMSPage;
  /** Full-page single component (detail routes, forms not in Master Page). */
  overrideComponent?: string;
}

function createOverridePage(pathname: string, componentName: string): CMSPage {
  return {
    id: `override-${componentName}`,
    name: componentName,
    slug: pathname,
    type: "Page",
    showInNav: false,
    urutan: "",
    showFooter: true,
    sections: [
      {
        id: `override-section-${componentName}`,
        pageId: `override-${componentName}`,
        sectionName: componentName,
        slug: "",
        order: "0",
        show: true,
        height: "Fit Content",
        components: [
          {
            id: `override-comp-${componentName}`,
            typeId: componentName,
            variation: "",
            groupId: "",
            show: true,
            orderOrGroup: "0",
            value: "",
            value2: "",
            value3: "",
          },
        ],
      },
    ],
  };
}

export const PageBuilder: React.FC<PageBuilderProps> = async ({
  pageData,
  injectedProps,
  overridePage,
  overrideComponent,
}) => {
  const pathname = await getRequestPathname();
  const cmsData = pageData || (await fetchContainerCMSCached());

  const page =
    overridePage ||
    (overrideComponent
      ? createOverridePage(pathname, overrideComponent)
      : findCmsPageForPath(cmsData.pages, pathname));

  if (!page) {
    return notFound();
  }

  const visibleSections = page.sections.filter((s) => s.show);
  const entranceSlug = normalizeCmsSlug(page.slug || pathname);

  return (
    <PageEntranceWrapper slug={entranceSlug}>
      <div className="w-full">
        {visibleSections.map((section) => (
          <SectionBuilder
            key={section.id}
            section={section}
            cmsData={cmsData}
            injectedProps={injectedProps}
          />
        ))}
      </div>
    </PageEntranceWrapper>
  );
};
