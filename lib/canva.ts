const CANVA_API_BASE = "https://api.canva.com/rest/v1";

export interface CanvaPage {
  index: number;
  name?: string;
}

export async function resolveCanvaLink(url: string): Promise<string> {
  if (url.includes("canva.link")) {
    try {
      const response = await fetch(url, { method: "HEAD", redirect: "manual" });
      const location = response.headers.get("location");
      if (location) return location;
    } catch (e) {
      console.error("[Canva] Failed to resolve short link:", e);
    }
  }
  return url;
}

export function extractDesignId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");
    const designIndex = parts.indexOf("design");
    if (designIndex !== -1 && parts[designIndex + 1]) {
      return parts[designIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

async function canvaFetch(endpoint: string, options: RequestInit = {}) {
  const token = process.env.CANVA_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing CANVA_ACCESS_TOKEN environment variable.");
  }

  console.warn(`[Canva] Fetching: ${endpoint}`, {
    method: options.method || "GET",
  });
  const response = await fetch(`${CANVA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error(`[Canva] API Error: ${response.status}`, error);
    throw new Error(error.message || `Canva API error: ${response.status}`);
  }

  return response.json();
}

export async function getDesignPages(designId: string): Promise<CanvaPage[]> {
  const data = await canvaFetch(`/designs/${designId}/pages`);
  const pages = data.items || [];
  console.warn(`[Canva] Found ${pages.length} pages for design ${designId}`);
  console.warn(
    `[Canva] Page Names:`,
    pages.map((p) => `"${p.name}"`).join(", "),
  );
  return pages;
}

export async function exportPagesAsPng(
  designId: string,
  pageIndices: number[],
): Promise<string[]> {
  if (pageIndices.length === 0) return [];

  const body = {
    design_id: designId,
    format: {
      type: "png",
      pages: pageIndices, // directly use the 1-based indices from the API
    },
  };
  console.warn(`[Canva] Creating Export Job:`, JSON.stringify(body, null, 2));

  // Create export job
  const job = await canvaFetch("/exports", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const exportId = job.job.id;

  // Poll for completion
  let status = job.job.status;
  let resultJob = job.job;

  while (status === "in_progress") {
    console.warn(`[Canva] Export ${exportId} in progress...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const poll = await canvaFetch(`/exports/${exportId}`);
    resultJob = poll.job;
    status = resultJob.status;
  }

  console.warn(`[Canva] Export ${exportId} finished with status: ${status}`);

  if (status === "failed") {
    throw new Error("Canva export job failed.");
  }

  return resultJob.urls || [];
}

export function filterPagesForColumn(
  pages: CanvaPage[],
  column: number,
  totalColumns: number = 3,
  customMapping?: string,
): number[] {
  if (customMapping && customMapping.trim() !== "") {
    const specifiedIndices = customMapping
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (specifiedIndices.length > 0) {
      const filtered = pages
        .filter((p) => specifiedIndices.includes(p.index))
        .sort(
          (a, b) =>
            specifiedIndices.indexOf(a.index) -
            specifiedIndices.indexOf(b.index),
        )
        .map((p) => p.index);
      console.warn(
        `[Canva] Column ${column} mapped by Custom Config to ${filtered.length} pages`,
      );
      return filtered;
    }
  }

  // Since Canva API doesn't support page names, we use Index-based mapping.
  // Column 0 (Left): Pages 1, 4, 7...
  // Column 1 (Center): Pages 2, 5, 8...
  // Column 2 (Right): Pages 3, 6, 9...

  // If we are doing a single cell fetch (totalColumns = 1), we just take everything.
  if (totalColumns === 1) {
    return pages.map((p) => p.index);
  }

  const filtered = pages
    .filter((p) => (p.index - 1) % totalColumns === column)
    .sort((a, b) => a.index - b.index)
    .map((p) => p.index);

  console.warn(
    `[Canva] Column ${column} mapped by Index to ${filtered.length} pages`,
  );
  return filtered;
}

export function filterPagesForRow(
  pages: CanvaPage[],
): Record<number, number[]> {
  const result: Record<number, number[]> = {
    0: filterPagesForColumn(pages, 0),
    1: filterPagesForColumn(pages, 1),
    2: filterPagesForColumn(pages, 2),
  };
  return result;
}
