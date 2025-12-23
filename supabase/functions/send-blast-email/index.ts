import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface BlastEmailRequest {
  from: string;
  subject: string;
  message: string;
  recipients: string[];
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

  const { from, subject, message, recipients }: BlastEmailRequest = payload;

  // Validate required fields
  if (!subject || !message || !recipients || recipients.length === 0) {
    return new Response("Subject, message, and recipients are required", {
      status: 400,
    });
  }

  // Sanitize message (basic)
  const sanitizedMessage = escapeHtml(message);

  try {
    const { data, error } = await resend.emails.send({
      from: `CPG HUB <no-reply@mycpghub.com>`,
      to: recipients, // Resend can handle arrays
      subject: subject,
      html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: #6b3a2d;
                  color: white;
                  padding: 20px;
                  border-radius: 8px 8px 0 0;
                  text-align: center;
                }
                .content {
                  background: #ffffff;
                  padding: 30px;
                  border: 1px solid #e0e0e0;
                  border-radius: 0 0 8px 8px;
                }
                .footer {
                  text-align: center;
                  padding: 20px;
                  font-size: 12px;
                  color: #666;
                }
                .message {
                  white-space: pre-wrap;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0;">CPG Hub Newsletter</h1>
              </div>
              <div class="content">
                <div class="message">${sanitizedMessage}</div>
              </div>
              <div class="footer">
                <p>You're receiving this because you're a member of CPG Hub.</p>
                <p>© ${new Date().getFullYear()} CPG Hub. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      text: sanitizedMessage, // Plain text fallback
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
