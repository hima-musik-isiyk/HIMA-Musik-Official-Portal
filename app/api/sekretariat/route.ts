import { NextResponse } from "next/server";

import { fetchAllDocs } from "@/lib/notion";

export const revalidate = 0; // Dynamic API route

export async function GET() {
  try {
    const docs = await fetchAllDocs();
    return NextResponse.json({
      success: true,
      data: docs,
    });
  } catch (error) {
    console.error("[Sekretariat API GET] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data Sekretariat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
