import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
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

  const { name, email, message } = payload;

  if (!name || !email || !message) {
    return new Response("Missing fields", { status: 400 });
  }

  try {
    const { error } = await resend.emails.send({
      from: "Feedback <feedback@mycpghub.com>",
      to: "geneve@cpgrow.com",
      reply_to: email,
      subject: `New Feedback from ${name}`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `,
    });

    if (error) {
      console.error(error);
      return new Response("Failed to send email", { status: 500 });
    }

    return new Response("Feedback email sent", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
});
