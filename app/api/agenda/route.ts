import { connection, NextResponse } from "next/server";

import { fetchEventsCollection, fetchKKMGroups } from "@/lib/notion";

export async function GET() {
  await connection();
  try {
    const [collection, kkmGroups] = await Promise.all([
      fetchEventsCollection(),
      fetchKKMGroups(),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        collection,
        kkmGroups,
      },
    });
  } catch (error) {
    console.error("[Agenda API GET] Error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data Agenda",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
