// api/analytics/roles.ts
export const config = { runtime: "edge" };

const API = "https://api.clerk.com/v1";
const API_VERSION = "2025-04-10";

// 👇 allow localhost during dev + your production site
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://cpg-hub.vercel.app",
]);

function corsHeaders(origin: string | null) {
  const allow =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://cpg-hub.vercel.app";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
    "Content-Type": "application/json",
  };
}

const H = (secret: string) => ({
  Authorization: `Bearer ${secret}`,
  "Clerk-API-Version": API_VERSION,
});

type Role = "talent" | "service" | "brand";

function normalizeRoles(obj: any): Role[] {
  const arr =
    obj?.unsafe_metadata?.roles ??
    obj?.unsafeMetadata?.roles ??
    obj?.roles ??
    [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => String(r).trim().toLowerCase())
    .filter((r) => r === "talent" || r === "service" || r === "brand");
}

// Offset pagination (Edge-friendly)
async function listAllUsers(secret: string, cap = 50000) {
  const pageSize = 1000;
  let offset = 0;
  const all: any[] = [];

  while (offset < cap) {
    const r = await fetch(
      `${API}/users?order_by=-created_at&limit=${pageSize}&offset=${offset}`,
      {
        headers: H(secret),
        cache: "no-store",
      }
    );
    if (!r.ok) break;
    const data = await r.json();
    const chunk = Array.isArray(data) ? data : (data.data ?? []);
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export default async function handler(req: Request) {
  const origin = req.headers.get("Origin");
  const baseHeaders = corsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) {
    return new Response(JSON.stringify({ error: "Missing CLERK_SECRET_KEY" }), {
      status: 500,
      headers: baseHeaders,
    });
  }

  try {
    const users = await listAllUsers(secret);

    let total = 0,
      none = 0;
    let talentOnly = 0,
      serviceOnly = 0,
      brandOnly = 0;
    let talentService = 0,
      talentBrand = 0,
      brandService = 0,
      allThree = 0;
    let anyTalent = 0,
      anyService = 0,
      anyBrand = 0;

    for (const u of users) {
      total++;
      const roles = new Set(normalizeRoles(u));
      const hasT = roles.has("talent");
      const hasS = roles.has("service");
      const hasB = roles.has("brand");

      if (hasT) anyTalent++;
      if (hasS) anyService++;
      if (hasB) anyBrand++;

      const count = roles.size;
      if (count === 0) {
        none++;
        continue;
      }
      if (count === 1) {
        if (hasT) talentOnly++;
        else if (hasS) serviceOnly++;
        else if (hasB) brandOnly++;
        continue;
      }
      if (count === 2) {
        if (hasT && hasS) talentService++;
        else if (hasT && hasB) talentBrand++;
        else if (hasB && hasS) brandService++;
        continue;
      }
      if (count >= 3) allThree++;
    }

    const payload = {
      total,
      singles: { talentOnly, serviceOnly, brandOnly, none },
      combos: { talentService, talentBrand, brandService, allThree },
      any: { anyTalent, anyService, anyBrand },
    };

    return new Response(JSON.stringify(payload), {
      headers: baseHeaders,
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Internal error" }),
      {
        status: 500,
        headers: baseHeaders,
      }
    );
  }
}
