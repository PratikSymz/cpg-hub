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

  const raw = await req.text();
  console.log(raw);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error("Invalid JSON", err);
    return new Response("Invalid JSON", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  console.log("Payload:", payload);

  const { target_email, sender_email, message, target_name, sender_name } =
    payload;

  if (
    !target_email ||
    !sender_email ||
    !sender_name ||
    !target_name ||
    !message
  ) {
    return new Response("Missing parameters", { status: 400 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "CPG Hub <notifications@yourdomain.com>",
      to: target_email,
      reply_to: sender_email,
      subject: `${sender_name} sent you a connection request!`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <p>Hi ${target_name},</p>
          <p>You received a new connection request on <strong>CPG Hub</strong>.</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 4px solid #ccc; margin: 1em 0; padding-left: 1em;">${message}</blockquote>
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
