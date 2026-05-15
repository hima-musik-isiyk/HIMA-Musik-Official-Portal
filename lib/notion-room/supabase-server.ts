export function getSupabaseServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server env.");
  }

  return { url, key };
}

export async function supabaseRestFetch(path: string, init: RequestInit = {}) {
  const { url, key } = getSupabaseServerConfig();
  const requestUrl = new URL(path, url);
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("authorization", `Bearer ${key}`);

  return fetch(requestUrl, {
    ...init,
    headers,
    cache: "no-store",
  });
}
