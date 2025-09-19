import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

type EndorsementRow = {
  from_user_id: string; // endorser
  to_user_id: string; // endorsee
  message: string | null;
  created_at: string;
};

type UserRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  profile_picture_url?: string | null;
};

const {
  RESEND_API_KEY, // required
  SUPABASE_URL, // required (https://<ref>.supabase.co)
  SUPABASE_SERVICE_ROLE_KEY, // required (for REST lookup)
  APP_BASE_URL, // required (e.g., https://mycpghub.com)
  MAIL_FROM = "CPG Hub <notifications@mg.mycpghub.com>",
} = Deno.env.toObject();

// function json(data: any, status = 200, headers: Record<string, string> = {}) {
//   return new Response(JSON.stringify(data), {
//     status,
//     headers: { "Content-Type": "application/json", ...CORS, ...headers },
//   });
// }

// function json(data: any, status = 200, headers: Record<string, string> = {}) {
//   return new Response(JSON.stringify(data), {
//     status,
//     headers: { "Content-Type": "application/json", ...CORS, ...headers },
//   });
// }

// function htmlBody({
//   endorsee_name,
//   endorser_name,
//   message,
//   view_url,
//   endorse_back_url,
// }: {
//   endorsee_name?: string | null;
//   endorser_name?: string | null;
//   message?: string | null;
//   view_url?: string | null;
//   endorse_back_url?: string | null;
// }) {
//   const toName = endorsee_name || "there";
//   const fromName = endorser_name || "Someone";
//   const quote = message
//     ? `<blockquote style="margin:12px 0;padding:10px 14px;border-left:4px solid #14b8a6;background:#f0fdfa;border-radius:6px;">${message}</blockquote>`
//     : "";
//   const viewCta = view_url
//     ? `<p><a href="${view_url}" style="display:inline-block;padding:12px 18px;background:#5b4636;color:#fff;text-decoration:none;border-radius:10px;">See what they said</a></p>`
//     : "";
//   const endorseBackCta = endorse_back_url
//     ? `<p><a href="${endorse_back_url}" style="display:inline-block;padding:10px 16px;border:1px solid #5b4636;border-radius:10px;">Endorse them back</a></p>`
//     : "";

//   return `
//     <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto; font-size:16px; line-height:1.55;">
//       <p>Hi ${toName},</p>
//       <p><strong>${fromName}</strong> just endorsed you on CPG Hub.</p>
//       ${quote}
//       ${viewCta}
//       <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
//       ${endorseBackCta}
//     </div>`;
// }

// async function sendResendEmail({
//   to_email,
//   subject,
//   html,
// }: {
//   to_email: string;
//   subject: string;
//   html: string;
// }) {
//   if (!RESEND_API_KEY) {
//     console.error("[ERR] Missing RESEND_API_KEY");
//     throw new Error("MISSING_RESEND_API_KEY");
//   }
//   const r = await fetch("https://api.resend.com/emails", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${RESEND_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ from: MAIL_FROM, to: [to_email], subject, html }),
//   });
//   const text = await r.text();
//   if (!r.ok) {
//     console.error("[Resend error]", r.status, text);
//     throw new Error(`RESEND_${r.status}: ${text}`);
//   }
//   return text;
// }

// /** DB-trigger helper */
// async function fetchUsers(ids: string[]) {
//   if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
//     console.error("[ERR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
//     throw new Error("MISSING_SUPABASE_REST_CONFIG");
//   }
//   const inList = ids.map(encodeURIComponent).join(",");
//   const url = `${SUPABASE_URL}/rest/v1/users?select=user_id,full_name,email,profile_picture_url&user_id=in.(${inList})`;
//   const r = await fetch(url, {
//     headers: {
//       apiKey: SUPABASE_SERVICE_ROLE_KEY,
//       Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
//     },
//   });
//   const text = await r.text();
//   if (!r.ok) {
//     console.error("[Users lookup error]", r.status, text);
//     throw new Error(`USERS_${r.status}: ${text}`);
//   }
//   return JSON.parse(text) as UserRow[];
// }

// serve(async (req) => {
//   try {
//     if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

//     // Always log basic info + raw body for debugging
//     const raw = await req.text();
//     console.log("[endorsement-email] method:", req.method, "url:", req.url);
//     console.log("[endorsement-email] raw:", raw);

//     // Re-create request for JSON parsing after reading raw
//     const jreq = new Request(req.url, {
//       method: req.method,
//       headers: req.headers,
//       body: raw,
//     });
//     const body = raw ? await jreq.json() : {};

//     // 1) PAYLOAD-DRIVEN (direct POST): requires `to_email`. No DB calls.
//     if (body?.to_email) {
//       const subject =
//         body.subject ||
//         `${body.endorser_name || "Someone"} just endorsed you on CPG Hub 🎉`;
//       const html = htmlBody(body);
//       await sendResendEmail({ to_email: body.to_email, subject, html });
//       return json({ ok: true, mode: "payload", detail: "Email sent" });
//     }

//     // 2) DB-TRIGGERED: expects { type: "INSERT", record: EndorsementRow }
//     if (body?.type === "INSERT" && body?.record) {
//       if (!APP_BASE_URL) {
//         console.error("[ERR] Missing APP_BASE_URL env var");
//         throw new Error("MISSING_APP_BASE_URL");
//       }
//       const e = body.record as EndorsementRow;

//       // look up users
//       const users = await fetchUsers([e.to_user_id, e.from_user_id]);
//       const to = users.find((u) => u.user_id === e.to_user_id);
//       const from = users.find((u) => u.user_id === e.from_user_id);

//       if (!to?.email) {
//         console.warn("[WARN] No recipient email for to_user_id", e.to_user_id);
//         return json({ ok: true, mode: "trigger", warn: "no recipient email" });
//       }

//       const subject = `${from?.full_name || "A CPG Hub member"} just endorsed you on CPG Hub 🎉`;
//       const html = htmlBody({
//         endorsee_name: to?.full_name || "there",
//         endorser_name: from?.full_name || "Someone",
//         message: e.message,
//         view_url: `${APP_BASE_URL}/talent/${e.to_user_id}?highlightEndorsement=${e.id}`,
//         endorse_back_url: `${APP_BASE_URL}/endorse?to=${e.from_user_id}`,
//       });

//       await sendResendEmail({ to_email: to.email, subject, html });
//       return json({ ok: true, mode: "trigger", detail: "Email sent" });
//     }

//     // Unknown payload
//     console.error("[ERR] Unsupported payload", body);
//     return json({ ok: false, error: "Unsupported payload" }, 400);
//   } catch (err) {
//     console.error("[FUNC ERROR]", err);
//     return json({ ok: false, error: String(err?.message || err) }, 500);
//   }
// });

serve((req) => {
  return new Response("Hello from endorsement test!", {
    headers: { "Content-Type": "text/plain" },
  });
});