import { connection, NextResponse } from "next/server";

import { fetchDivisionsFromNotion } from "@/lib/notion";

export async function GET() {
  await connection();
  try {
    const data = await fetchDivisionsFromNotion();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Divisions API GET] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data divisi",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
