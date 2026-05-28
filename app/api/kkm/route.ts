import { NextResponse } from "next/server";

import { fetchKKMModularDataCached } from "@/lib/notion";

export const revalidate = 0; // Dynamic API route

export async function GET() {
  try {
    const pageId = process.env.NOTION_KKM_PAGE_ID || "";
    const data = await fetchKKMModularDataCached(pageId);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[KKM API GET] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data KKM",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
