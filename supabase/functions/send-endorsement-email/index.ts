import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const MAIL_FROM = "CPG Hub <notifications@mg.mycpghub.com>";

type Payload = {
  to_email: string;
  endorsee_name?: string | null;
  endorser_name?: string | null;
  message?: string | null;
  view_url?: string | null;
  endorse_back_url?: string | null;
  subject?: string | null;
};

function buildHtml(p: Payload) {
  const endorseeName = p.endorsee_name || "there";
  const endorserName = p.endorser_name || "Someone";
  const quote = p.message
    ? `<blockquote style="margin:12px 0;padding:10px 14px;border-left:4px solid #14b8a6;background:#f0fdfa;border-radius:6px;">${p.message}</blockquote>`
    : "";

  const viewCta = p.view_url
    ? `<p><a href="${p.view_url}" style="display:inline-block;padding:12px 18px;background:#5b4636;color:#fff;text-decoration:none;border-radius:10px;">See what they said</a></p>`
    : "";

  const endorseBackCta = p.endorse_back_url
    ? `<p><a href="${p.endorse_back_url}" style="display:inline-block;padding:10px 16px;border:1px solid #5b4636;border-radius:10px;">Endorse them back</a></p>`
    : "";

  return `
    <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto; font-size:16px; line-height:1.55;">
      <p>Hi ${endorseeName},</p>
      <p><strong>${endorserName}</strong> just endorsed you on CPG Hub.</p>
      ${quote}
      ${viewCta}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      ${endorseBackCta}
    </div>`;
}

serve(async (req) => {
  // ✅ Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  // Read and parse request
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response("Invalid JSON", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!payload?.to_email) {
      return new Response("Missing to_email", { status: 400 });
    }
    if (!resend) {
      return new Response("Missing RESEND_API_KEY", { status: 500 });
    }

    const subject =
      payload.subject ||
      `${payload.endorser_name || "Someone"} just endorsed you on CPG Hub 🎉`;

    const html = buildHtml(payload);

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resend}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [payload.to_email],
        subject,
        html,
      }),
    });

    if (!r.ok) {
      const body = await r.text();
      console.error("Resend error:", body);
      return new Response("Email failed", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Function error:", err);
    return new Response("Error", { status: 500 });
  }
});
