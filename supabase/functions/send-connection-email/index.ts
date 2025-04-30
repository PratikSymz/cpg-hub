import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const { target_email, message, sender_name } = await req.json();

  try {
    const { data, error } = await resend.emails.send({
      from: "CPG Hub <notifications@yourdomain.com>",
      to: target_email,
      subject: `${sender_name} sent you a connection request!`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; color: #333;">
          <p>Hi there,</p>
          <p>You received a new connection request on <strong>CPG Hub</strong>.</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 4px solid #ccc; margin: 1em 0; padding-left: 1em;">${message}</blockquote>
          <p>Visit your profile to respond.</p>
        </div>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
