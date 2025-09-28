// api/analytics/roles.ts
export const config = { runtime: "edge" };

const API = "https://api.clerk.com/v1";
const API_VERSION = "2025-04-10";

// 👇 Allow dev & prod origins (edit to your domains)
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
type BucketName =
  | "total"
  | "none"
  | "talentOnly"
  | "serviceOnly"
  | "brandOnly"
  | "talentService"
  | "talentBrand"
  | "brandService"
  | "allThree"
  | "anyTalent"
  | "anyService"
  | "anyBrand";

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

// Offset pagination over Clerk users (Edge-friendly)
async function listAllUsers(secret: string, cap = 50000) {
  const pageSize = 500;
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

function toSummaryUser(u: any) {
  return {
    id: u.id,
    email: u.email_addresses?.[0]?.email_address ?? "",
    createdAt: u.created_at ?? u.createdAt,
    name: [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
  };
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
    const url = new URL(req.url);
    const bucketParam = (url.searchParams.get("bucket") || "").trim() as
      | BucketName
      | "";
    const limit = Math.max(
      1,
      Math.min(1000, Number(url.searchParams.get("limit") || "50"))
    );
    const offset = Math.max(0, Number(url.searchParams.get("offset") || "0"));
    const q = (url.searchParams.get("q") || "").toLowerCase(); // optional search

    const listing = !!bucketParam;

    const users = await listAllUsers(secret);

    // Counters
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

    const bucketMembers: any[] = [];

    function maybeCollect(bucket: BucketName, u: any) {
      if (!listing) return;
      if (bucketParam !== bucket) return;
      const s = toSummaryUser(u);
      if (q) {
        const hay = `${s.email} ${s.name || ""}`.toLowerCase();
        if (!hay.includes(q)) return;
      }
      bucketMembers.push(s);
    }

    for (const u of users) {
      total++;
      const roles = new Set(normalizeRoles(u));
      const hasT = roles.has("talent");
      const hasS = roles.has("service");
      const hasB = roles.has("brand");

      if (hasT) anyTalent++;
      if (hasS) anyService++;
      if (hasB) anyBrand++;

      const size = roles.size;

      if (size === 0) {
        none++;
        maybeCollect("none", u);
        continue;
      }

      if (size === 1) {
        if (hasT) {
          talentOnly++;
          maybeCollect("talentOnly", u);
        } else if (hasS) {
          serviceOnly++;
          maybeCollect("serviceOnly", u);
        } else if (hasB) {
          brandOnly++;
          maybeCollect("brandOnly", u);
        }
        // also collect into "any*" buckets
        if (hasT) maybeCollect("anyTalent", u);
        if (hasS) maybeCollect("anyService", u);
        if (hasB) maybeCollect("anyBrand", u);
        continue;
      }

      if (size === 2) {
        if (hasT && hasS) {
          talentService++;
          maybeCollect("talentService", u);
        } else if (hasT && hasB) {
          talentBrand++;
          maybeCollect("talentBrand", u);
        } else if (hasB && hasS) {
          brandService++;
          maybeCollect("brandService", u);
        }
        // any*
        if (hasT) maybeCollect("anyTalent", u);
        if (hasS) maybeCollect("anyService", u);
        if (hasB) maybeCollect("anyBrand", u);
        continue;
      }

      if (size >= 3) {
        allThree++;
        maybeCollect("allThree", u);
        // any*
        if (hasT) maybeCollect("anyTalent", u);
        if (hasS) maybeCollect("anyService", u);
        if (hasB) maybeCollect("anyBrand", u);
      }
    }

    // If listing, paginate the chosen bucket
    if (listing) {
      // special case: total = all users
      if (bucketParam === "total") {
        // map all users to the light shape
        let all = users.map(toSummaryUser);

        // optional search
        if (q) {
          const ql = q.toLowerCase();
          all = all.filter((u) =>
            `${u.email} ${u.name ?? ""}`.toLowerCase().includes(ql)
          );
        }

        // newest first
        all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const page = all.slice(offset, offset + limit);

        return new Response(
          JSON.stringify({
            bucket: "total",
            total: all.length,
            limit,
            offset,
            count: page.length,
            users: page,
          }),
          { headers: baseHeaders }
        );
      }

      const totalInBucket =
        bucketParam === "none"
          ? none
          : bucketParam === "talentOnly"
            ? talentOnly
            : bucketParam === "serviceOnly"
              ? serviceOnly
              : bucketParam === "brandOnly"
                ? brandOnly
                : bucketParam === "talentService"
                  ? talentService
                  : bucketParam === "talentBrand"
                    ? talentBrand
                    : bucketParam === "brandService"
                      ? brandService
                      : bucketParam === "allThree"
                        ? allThree
                        : bucketParam === "anyTalent"
                          ? anyTalent
                          : bucketParam === "anyService"
                            ? anyService
                            : bucketParam === "anyBrand"
                              ? anyBrand
                              : 0;

      // newest first
      bucketMembers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const page = bucketMembers.slice(offset, offset + limit);

      return new Response(
        JSON.stringify({
          bucket: bucketParam,
          total: totalInBucket,
          limit,
          offset,
          count: page.length,
          users: page,
        }),
        { headers: baseHeaders }
      );
    }

    const payload = {
      total,
      singles: { talentOnly, serviceOnly, brandOnly, none },
      combos: { talentService, talentBrand, brandService, allThree },
      any: { anyTalent, anyService, anyBrand },
    };

    return new Response(JSON.stringify(payload), { headers: baseHeaders });
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
