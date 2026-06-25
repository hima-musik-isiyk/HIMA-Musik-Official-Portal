import { NextResponse } from "next/server";

function assertCronAuth(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!assertCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const table = process.env.SUPABASE_KEEPALIVE_TABLE ?? "keepalive";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Missing Supabase env" },
      { status: 500 },
    );
  }

  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  url.searchParams.set("on_conflict", "id");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${supabaseKey}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: "vercel-cron",
      touched_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  const body = await response.text();
  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Supabase keepalive failed",
        status: response.status,
        body,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    table,
    checkedAt: new Date().toISOString(),
  });
}
