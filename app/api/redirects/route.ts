import { connection, NextResponse } from "next/server";

import { fetchRedirects } from "@/lib/notion";

export async function GET() {
  await connection();
  try {
    const data = await fetchRedirects();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Redirects API GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil data redirect",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
