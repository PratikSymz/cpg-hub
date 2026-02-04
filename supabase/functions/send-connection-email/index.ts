import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // ✅ Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  const {
    target_email,
    sender_email,
    message,
    target_name,
    sender_name,
    job_title,
    job_url,
  } = payload;

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

  // Build job context section if job info provided
  const jobContext = job_title
    ? `
      <div style="background-color: #f0fdfa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #5f6368;">Regarding your job posting:</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600; color: #0d9488;">
          ${job_url ? `<a href="${job_url}" style="color: #0d9488; text-decoration: none;">${escapeHtml(job_title)}</a>` : escapeHtml(job_title)}
        </p>
      </div>
    `
    : '';

  try {
    const { data, error } = await resend.emails.send({
      from: `CPG Hub <no-reply@mycpghub.com>`,
      to: target_email,
      reply_to: sender_email,
      subject: job_title
        ? `${sender_name} is interested in your "${job_title}" position`
        : `${sender_name} wants to connect with you on CPG Hub`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0d9488 0%, #7c6c4f 100%); padding: 32px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">CPG Hub</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">New Connection Request</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 24px 0; font-size: 16px; color: #1f2937;">
                        Hi ${escapeHtml(target_name)},
                      </p>

                      <p style="margin: 0 0 24px 0; font-size: 16px; color: #1f2937;">
                        <strong style="color: #0d9488;">${escapeHtml(sender_name)}</strong> would like to connect with you on CPG Hub.
                      </p>

                      ${jobContext}

                      <!-- Message Box -->
                      <div style="background-color: #f9fafb; border-left: 4px solid #0d9488; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Their Message</p>
                        <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${sanitizedMessage}</p>
                      </div>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 24px 0;">
                            <a href="mailto:${sender_email}?subject=Re: CPG Hub Connection"
                               style="display: inline-block; background-color: #0d9488; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Reply to ${escapeHtml(sender_name.split(' ')[0])}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                        Or email them directly at <a href="mailto:${sender_email}" style="color: #0d9488; text-decoration: none;">${sender_email}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                        This email was sent via <a href="https://mycpghub.com" style="color: #0d9488; text-decoration: none;">CPG Hub</a> — connecting CPG brands with fractional talent.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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