import { connection, NextResponse } from "next/server";

import { fetchKKMModularDataCached } from "@/lib/notion";

export async function GET() {
  await connection();
  try {
    const pageId = "02 KKM";
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
