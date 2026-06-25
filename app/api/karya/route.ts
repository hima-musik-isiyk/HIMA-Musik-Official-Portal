import { connection, NextResponse } from "next/server";

import { fetchKaryaEntries } from "@/lib/notion";

export async function GET() {
  await connection();
  try {
    const data = await fetchKaryaEntries();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Karya API GET] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data Karya",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
