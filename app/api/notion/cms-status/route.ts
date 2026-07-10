import { NextResponse } from "next/server";

import { readContainerCMSSnapshotMeta } from "@/lib/cms-snapshot";

export async function GET() {
  const meta = await readContainerCMSSnapshotMeta();

  return NextResponse.json(
    {
      ok: Boolean(meta),
      snapshot: meta,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
