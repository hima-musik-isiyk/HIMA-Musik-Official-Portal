import { revalidatePath, revalidateTag } from "next/cache";

import {
  fetchAgendaDatabaseIdCached,
  fetchKaryaDatabaseIdCached,
  fetchKKMDatabaseIdCached,
  fetchRedirectDatabaseIdCached,
  getNotionClient,
  resolveBerandaDatabasesCached,
  resolveFAQDatabaseCached,
  resolveProfilDatabasesCached,
  resolveSekretariatDatabasesCached,
} from "@/lib/notion";

export type WebhookEntityType = "page" | "database" | "data_source" | "block";

export type NotionWebhookPayload = {
  verification_token?: string;
  type?: string;
  timestamp?: string;
  entity?: {
    id?: string;
    type?: WebhookEntityType;
  };
  data?: {
    parent?: {
      id?: string;
      type?: string;
      data_source_id?: string;
    };
  };
};

export type ContentScope =
  | "docs"
  | "events"
  | "kkm"
  | "karya"
  | "faq"
  | "profil"
  | "beranda"
  | "redirects";

const NOTION_BERANDA_PAGE_ID = process.env.NOTION_BERANDA_PAGE_ID ?? "";
const NOTION_PROFIL_PAGE_ID = process.env.NOTION_PROFIL_PAGE_ID ?? "";
const NOTION_KKM_PAGE_ID = process.env.NOTION_KKM_PAGE_ID ?? "";
const NOTION_AGENDA_PAGE_ID = process.env.NOTION_AGENDA_PAGE_ID ?? "";
const KARYA_PAGE_ID = process.env.NOTION_KARYA_PAGE_ID ?? "";
const NOTION_SEKRETARIAT_PAGE_ID = process.env.NOTION_SEKRETARIAT_PAGE_ID ?? "";
const NOTION_FAQ_PAGE_ID = process.env.NOTION_FAQ_PAGE_ID ?? "";
const REDIRECT_PAGE_ID = process.env.NOTION_REDIRECT_PAGE_ID ?? "";

const dataSourceIdCache = new Map<string, string | null>();
const parentChainCache = new Map<
  string,
  { databaseId: string | null; dataSourceId: string | null }
>();

function normalizeNotionId(id: string): string {
  const compact = id.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(compact)) return id;
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

async function resolvePrimaryDataSourceId(
  databaseId: string,
): Promise<string | null> {
  if (!databaseId) return null;

  const normalizedId = normalizeNotionId(databaseId);
  const cached = dataSourceIdCache.get(normalizedId);
  if (cached !== undefined) return cached;

  try {
    const client = getNotionClient();
    if (!client) return null;

    const database = await client.databases.retrieve({
      database_id: normalizedId,
    });
    const dataSourceId = (database as { data_sources?: Array<{ id: string }> })
      .data_sources?.[0]?.id;

    const normalizedDataSourceId = dataSourceId
      ? normalizeNotionId(dataSourceId)
      : null;
    dataSourceIdCache.set(normalizedId, normalizedDataSourceId);
    return normalizedDataSourceId;
  } catch (error) {
    console.error("Failed to resolve Notion data source id:", error);
    dataSourceIdCache.set(normalizedId, null);
    return null;
  }
}

async function buildScopeMatchers() {
  const [
    docsDbIdResolved,
    agendaDbIdResolved,
    kkmDbIdResolved,
    profilDbResolved,
    berandaDbResolved,
    faqDbIdResolved,
  ] = await Promise.all([
    NOTION_SEKRETARIAT_PAGE_ID
      ? resolveSekretariatDatabasesCached(NOTION_SEKRETARIAT_PAGE_ID)
      : {
          docsDbId: "36f3b26d-c3be-8017-ba07-e3a418fa4366",
          categoriesDbId: "",
        },
    NOTION_AGENDA_PAGE_ID
      ? fetchAgendaDatabaseIdCached(NOTION_AGENDA_PAGE_ID)
      : "36e3b26d-c3be-80dc-aa20-e1ee3940b466",
    NOTION_KKM_PAGE_ID
      ? fetchKKMDatabaseIdCached(NOTION_KKM_PAGE_ID)
      : "36e3b26d-c3be-8065-94be-f94365699c8d",
    NOTION_PROFIL_PAGE_ID
      ? resolveProfilDatabasesCached(NOTION_PROFIL_PAGE_ID)
      : {
          sectionDbId: "36e3b26d-c3be-8076-9a94-d776ed290943",
          kabinetDbId: "36e3b26d-c3be-804e-b7da-f0a1f98f218e",
          sdmDbId: "35c3b26d-c3be-8021-b84a-df0a98e7b1e1",
        },
    NOTION_BERANDA_PAGE_ID
      ? resolveBerandaDatabasesCached(NOTION_BERANDA_PAGE_ID)
      : {
          heroDbId: "36e3b26d-c3be-802c-aac0-c7dbcd40ef36",
          jelajahiDbId: "36e3b26d-c3be-802c-91ac-e5ed573d89f6",
        },
    NOTION_FAQ_PAGE_ID
      ? resolveFAQDatabaseCached(NOTION_FAQ_PAGE_ID)
      : "36d3b26d-c3be-8041-b2bd-d9b7f746e06e",
  ]);

  const docsDbId = docsDbIdResolved.docsDbId;
  const categoriesDbId = docsDbIdResolved.categoriesDbId;
  const agendaDbId = agendaDbIdResolved;
  const kkmDbId = kkmDbIdResolved;
  const faqDbId = faqDbIdResolved;

  const karyaDbId = KARYA_PAGE_ID
    ? await fetchKaryaDatabaseIdCached(KARYA_PAGE_ID)
    : "";

  const redirectDbId = REDIRECT_PAGE_ID
    ? await fetchRedirectDatabaseIdCached(REDIRECT_PAGE_ID)
    : "";

  const [
    docsDataSourceId,
    categoriesDataSourceId,
    eventsDataSourceId,
    kkmDataSourceId,
    karyaDataSourceId,
    faqDataSourceId,
    profilSectionDataSourceId,
    profilKabinetDataSourceId,
    profilSdmDataSourceId,
    berandaHeroDataSourceId,
    berandaJelajahiDataSourceId,
    redirectDataSourceId,
  ] = await Promise.all([
    resolvePrimaryDataSourceId(docsDbId),
    resolvePrimaryDataSourceId(categoriesDbId),
    resolvePrimaryDataSourceId(agendaDbId),
    resolvePrimaryDataSourceId(kkmDbId),
    resolvePrimaryDataSourceId(karyaDbId),
    resolvePrimaryDataSourceId(faqDbId),
    resolvePrimaryDataSourceId(profilDbResolved.sectionDbId),
    resolvePrimaryDataSourceId(profilDbResolved.kabinetDbId),
    resolvePrimaryDataSourceId(profilDbResolved.sdmDbId),
    resolvePrimaryDataSourceId(berandaDbResolved.heroDbId),
    resolvePrimaryDataSourceId(berandaDbResolved.jelajahiDbId),
    resolvePrimaryDataSourceId(redirectDbId),
  ]);

  return {
    docs: {
      databaseId: docsDbId ? normalizeNotionId(docsDbId) : null,
      dataSourceId: docsDataSourceId,
      categoriesDatabaseId: categoriesDbId
        ? normalizeNotionId(categoriesDbId)
        : null,
      categoriesDataSourceId: categoriesDataSourceId,
    },
    events: {
      databaseId: agendaDbId ? normalizeNotionId(agendaDbId) : null,
      dataSourceId: eventsDataSourceId,
    },
    kkm: {
      databaseId: kkmDbId ? normalizeNotionId(kkmDbId) : null,
      dataSourceId: kkmDataSourceId,
    },
    karya: {
      databaseId: karyaDbId ? normalizeNotionId(karyaDbId) : null,
      dataSourceId: karyaDataSourceId,
    },
    faq: {
      databaseId: faqDbId ? normalizeNotionId(faqDbId) : null,
      dataSourceId: faqDataSourceId,
    },
    profil: {
      databaseId: [
        profilDbResolved.sectionDbId,
        profilDbResolved.kabinetDbId,
        profilDbResolved.sdmDbId,
      ]
        .filter(Boolean)
        .map(normalizeNotionId),
      dataSourceId: [
        profilSectionDataSourceId,
        profilKabinetDataSourceId,
        profilSdmDataSourceId,
      ]
        .filter(Boolean)
        .map(normalizeNotionId),
    },
    beranda: {
      databaseId: [berandaDbResolved.heroDbId, berandaDbResolved.jelajahiDbId]
        .filter(Boolean)
        .map(normalizeNotionId),
      dataSourceId: [berandaHeroDataSourceId, berandaJelajahiDataSourceId]
        .filter(Boolean)
        .map(normalizeNotionId),
    },
    redirects: {
      databaseId: redirectDbId ? normalizeNotionId(redirectDbId) : null,
      dataSourceId: redirectDataSourceId,
    },
  };
}

type ScopeHints = {
  databaseId: string | null;
  dataSourceId: string | null;
};

type ParentRef = {
  type?: string;
  id?: string;
  data_source_id?: string;
};

function emptyScopeHints(): ScopeHints {
  return { databaseId: null, dataSourceId: null };
}

function cacheScopeHints(key: string, hints: ScopeHints): ScopeHints {
  parentChainCache.set(key, hints);
  return hints;
}

async function resolveParentScopeHints(
  parent: ParentRef | null | undefined,
  depth = 0,
): Promise<ScopeHints> {
  if (!parent || depth > 8) {
    return emptyScopeHints();
  }

  const parentType = parent.type?.trim();
  const parentId = parent.id?.trim();
  const parentDataSourceId = parent.data_source_id?.trim();

  if (parentDataSourceId) {
    return {
      databaseId:
        parentType === "database" && parentId
          ? normalizeNotionId(parentId)
          : null,
      dataSourceId: normalizeNotionId(parentDataSourceId),
    };
  }

  if (!parentType || !parentId) {
    return emptyScopeHints();
  }

  const normalizedParentId = normalizeNotionId(parentId);
  const cacheKey = `${parentType}:${normalizedParentId}`;
  const cached = parentChainCache.get(cacheKey);
  if (cached) return cached;

  if (parentType === "database") {
    return cacheScopeHints(cacheKey, {
      databaseId: normalizedParentId,
      dataSourceId: await resolvePrimaryDataSourceId(normalizedParentId),
    });
  }

  if (parentType === "data_source") {
    return cacheScopeHints(cacheKey, {
      databaseId: null,
      dataSourceId: normalizedParentId,
    });
  }

  try {
    const client = getNotionClient();
    if (!client) return emptyScopeHints();

    if (parentType === "page") {
      const page = (await client.pages.retrieve({
        page_id: normalizedParentId,
      })) as { parent?: ParentRef };
      const hints = await resolveParentScopeHints(page.parent, depth + 1);
      return cacheScopeHints(cacheKey, hints);
    }

    if (parentType === "block") {
      const block = (await client.blocks.retrieve({
        block_id: normalizedParentId,
      })) as { parent?: ParentRef };
      const hints = await resolveParentScopeHints(block.parent, depth + 1);
      return cacheScopeHints(cacheKey, hints);
    }
  } catch (error) {
    console.error("Failed to resolve Notion parent scope hints:", {
      parentType,
      parentId: normalizedParentId,
      error,
    });
  }

  return cacheScopeHints(cacheKey, emptyScopeHints());
}

async function resolveEntityScopeHints(
  entity: NotionWebhookPayload["entity"],
): Promise<ScopeHints> {
  if (!entity?.type || !entity.id) {
    return emptyScopeHints();
  }

  return resolveParentScopeHints(
    {
      type: entity.type,
      id: entity.id,
    },
    0,
  );
}

export function revalidateScope(scope: ContentScope) {
  if (scope === "docs") {
    revalidateTag("notion-docs", { expire: 0 });
    revalidateTag("notion-archives", { expire: 0 });
    revalidatePath("/sekretariat");
    revalidatePath("/sekretariat/[slug]", "page");
    revalidatePath("/sekretariat/archives");
    revalidatePath("/sekretariat/archives/[id]", "page");
    return;
  }

  if (scope === "events") {
    revalidateTag("notion-events", { expire: 0 });
    revalidatePath("/agenda");
    revalidatePath("/agenda/[slug]", "page");
    revalidatePath("/agenda/repost/[slug]", "page");
    return;
  }

  if (scope === "kkm") {
    revalidateTag("notion-kkm", { expire: 0 });
    revalidatePath("/kkm");
    revalidatePath("/kkm/[slug]", "page");
    revalidatePath("/agenda");
    return;
  }

  if (scope === "karya") {
    revalidateTag("notion-karya", { expire: 0 });
    revalidatePath("/karya");
    return;
  }

  if (scope === "faq") {
    revalidateTag("notion-faq", { expire: 0 });
    revalidatePath("/faq");
    return;
  }

  if (scope === "profil") {
    revalidateTag("notion-profil", { expire: 0 });
    revalidatePath("/profil");
    return;
  }

  if (scope === "beranda") {
    revalidateTag("notion-beranda", { expire: 0 });
    revalidatePath("/");
    return;
  }

  if (scope === "redirects") {
    revalidateTag("notion-redirects", { expire: 0 });
    return;
  }
}

function matchId(
  target: string | null | undefined,
  matcherValue: string | string[] | null | undefined,
): boolean {
  if (!target || !matcherValue) return false;
  if (Array.isArray(matcherValue)) {
    return matcherValue.includes(target);
  }
  return matcherValue === target;
}

export async function inferScopes(
  payload: NotionWebhookPayload,
): Promise<ContentScope[]> {
  const matches = await buildScopeMatchers();
  const scopeSet = new Set<ContentScope>();
  const normalizedEntityId = payload.entity?.id
    ? normalizeNotionId(payload.entity.id)
    : null;
  const normalizedParentId = payload.data?.parent?.id
    ? normalizeNotionId(payload.data.parent.id)
    : null;
  const normalizedParentDataSourceId = payload.data?.parent?.data_source_id
    ? normalizeNotionId(payload.data.parent.data_source_id)
    : null;
  const entityScopeHints = await resolveEntityScopeHints(payload.entity);
  const parentScopeHints = await resolveParentScopeHints(payload.data?.parent);

  for (const scope of [
    "docs",
    "events",
    "kkm",
    "karya",
    "faq",
    "profil",
    "beranda",
    "redirects",
  ] as const) {
    const matcher = matches[scope];

    if (
      normalizedParentDataSourceId &&
      matchId(normalizedParentDataSourceId, matcher.dataSourceId)
    ) {
      scopeSet.add(scope);
    }

    if (payload.entity?.type === "data_source" && normalizedEntityId) {
      if (matchId(normalizedEntityId, matcher.dataSourceId)) {
        scopeSet.add(scope);
      }
    }

    if (payload.entity?.type === "database" && normalizedEntityId) {
      if (matchId(normalizedEntityId, matcher.databaseId)) {
        scopeSet.add(scope);
      }
    }

    if (
      payload.data?.parent?.type === "database" &&
      normalizedParentId &&
      matchId(normalizedParentId, matcher.databaseId)
    ) {
      scopeSet.add(scope);
    }

    if (
      parentScopeHints.dataSourceId &&
      matchId(parentScopeHints.dataSourceId, matcher.dataSourceId)
    ) {
      scopeSet.add(scope);
    }

    if (
      parentScopeHints.databaseId &&
      matchId(parentScopeHints.databaseId, matcher.databaseId)
    ) {
      scopeSet.add(scope);
    }

    if (
      entityScopeHints.dataSourceId &&
      matchId(entityScopeHints.dataSourceId, matcher.dataSourceId)
    ) {
      scopeSet.add(scope);
    }

    if (
      entityScopeHints.databaseId &&
      matchId(entityScopeHints.databaseId, matcher.databaseId)
    ) {
      scopeSet.add(scope);
    }

    // For docs scope, also match categoriesDatabaseId and categoriesDataSourceId
    const catMatcher = matcher as {
      categoriesDatabaseId?: string | null;
      categoriesDataSourceId?: string | null;
    };
    if (catMatcher.categoriesDataSourceId) {
      if (
        (normalizedParentDataSourceId &&
          matchId(
            normalizedParentDataSourceId,
            catMatcher.categoriesDataSourceId,
          )) ||
        (payload.entity?.type === "data_source" &&
          normalizedEntityId &&
          matchId(normalizedEntityId, catMatcher.categoriesDataSourceId)) ||
        (parentScopeHints.dataSourceId &&
          matchId(
            parentScopeHints.dataSourceId,
            catMatcher.categoriesDataSourceId,
          )) ||
        (entityScopeHints.dataSourceId &&
          matchId(
            entityScopeHints.dataSourceId,
            catMatcher.categoriesDataSourceId,
          ))
      ) {
        scopeSet.add(scope);
      }
    }

    if (catMatcher.categoriesDatabaseId) {
      if (
        (payload.entity?.type === "database" &&
          normalizedEntityId &&
          matchId(normalizedEntityId, catMatcher.categoriesDatabaseId)) ||
        (payload.data?.parent?.type === "database" &&
          normalizedParentId &&
          matchId(normalizedParentId, catMatcher.categoriesDatabaseId)) ||
        (parentScopeHints.databaseId &&
          matchId(
            parentScopeHints.databaseId,
            catMatcher.categoriesDatabaseId,
          )) ||
        (entityScopeHints.databaseId &&
          matchId(entityScopeHints.databaseId, catMatcher.categoriesDatabaseId))
      ) {
        scopeSet.add(scope);
      }
    }
  }

  return [...scopeSet];
}
