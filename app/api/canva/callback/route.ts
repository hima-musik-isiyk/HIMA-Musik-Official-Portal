import { NextResponse } from "next/server";

import { saveSession } from "../../../lib/canva";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri =
    process.env.CANVA_REDIRECT_URI ||
    "http://localhost:3000/api/canva/callback";

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing Canva credentials" },
      { status: 500 },
    );
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Save tokens to session storage (Local FS + Supabase)
    await saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    return new NextResponse(
      `<html><body>
        <h1>Authentication Successful!</h1>
        <p>Your Canva session has been linked and saved to Supabase.</p>
        <p>You can close this window now.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  } catch (err) {
    console.error("[Canva] Callback Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
