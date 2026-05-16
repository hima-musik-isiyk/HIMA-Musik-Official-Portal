import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.CANVA_CLIENT_ID;
  const redirectUri =
    process.env.CANVA_REDIRECT_URI ||
    "http://localhost:3000/api/canva/callback";

  if (!clientId) {
    return NextResponse.json(
      { error: "Missing CANVA_CLIENT_ID" },
      { status: 500 },
    );
  }

  // Scopes required for the portal
  const scopes = [
    "design:content:read",
    "design:permission:write",
    "design:content:write",
    "folder:permission:read",
    "comment:write",
    "profile:read",
    "asset:read",
    "folder:write",
    "app:write",
    "app:read",
    "folder:permission:write",
    "brandtemplate:content:write",
    "comment:read",
    "asset:write",
    "design:permission:read",
    "brandtemplate:content:read",
    "brandtemplate:meta:read",
    "folder:read",
    "design:meta:read",
  ].join(" ");

  const authUrl = new URL("https://www.canva.com/api/oauth/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", "hima-musik-portal"); // In a real app, use a random string

  // Note: PKCE is recommended but omitted for simplicity in this helper route
  // unless the app settings require it.

  return NextResponse.redirect(authUrl.toString());
}
