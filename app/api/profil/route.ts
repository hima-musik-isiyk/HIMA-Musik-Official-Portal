import { NextResponse } from "next/server";

import { fetchProfilModularDataCached } from "@/lib/notion";

export const revalidate = 0; // Dynamic API route

export async function GET() {
  try {
    const pageId =
      process.env.NOTION_PROFIL_PAGE_ID || "36e3b26dc3be80f2b542ced846ba8edb";
    const data = await fetchProfilModularDataCached(pageId);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Profil API GET] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data Profil",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
