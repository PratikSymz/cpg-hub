import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

  const { target_email, sender_email, message, target_name, sender_name } =
    payload;

  // Validate required fields
  if (
    !target_email ||
    !sender_email ||
    !sender_name ||
    !target_name ||
    !message
  ) {
    return new Response("Missing parameters", { status: 400 });
  }

  // Sanitize message (basic)
  const sanitizedMessage = escapeHtml(message);

  try {
    const { data, error } = await resend.emails.send({
      from: `${sender_name} via CPG HUB <no-reply@mycpghub.com>`,
      to: target_email,
      reply_to: sender_email,
      subject: `${sender_name} sent you a connection request!`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <p>Hi ${target_name},</p>
          <p>${sender_name} is interested to connect with you.</p>
          <p>Reach out via ${sender_email}.</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 4px solid #ccc; margin: 1em 0; padding-left: 1em;">${sanitizedMessage}</blockquote>
        </div>
      `,
    });

    if (error) {
      console.error("Catch error:", error);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    console.error("Catch error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
});

// Basic HTML escaping to avoid injection
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}