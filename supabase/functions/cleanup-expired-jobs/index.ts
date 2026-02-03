import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

const {
  RESEND_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  MAIL_FROM = "CPG Hub <no-reply@mycpghub.com>",
} = Deno.env.toObject();

const resend = new Resend(RESEND_API_KEY);

type JobRow = {
  id: string;
  job_title: string;
  poster_id: string;
  created_at: string;
};

type UserRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function fetchExpiredJobs(): Promise<JobRow[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  // Calculate date 30 days ago
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const isoDate = cutoffDate.toISOString();

  const url = `${SUPABASE_URL}/rest/v1/job_listings?select=id,job_title,poster_id,created_at&created_at=lt.${isoDate}`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch expired jobs: ${response.status} ${text}`);
  }

  return response.json();
}

async function fetchUser(userId: string): Promise<UserRow | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const url = `${SUPABASE_URL}/rest/v1/user_profiles?select=user_id,full_name,email&user_id=eq.${encodeURIComponent(userId)}`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch user ${userId}`);
    return null;
  }

  const users = await response.json();
  return users[0] || null;
}

async function deleteJob(jobId: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const url = `${SUPABASE_URL}/rest/v1/job_listings?id=eq.${jobId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to delete job ${jobId}: ${response.status} ${text}`);
  }
}

async function sendExpirationEmail(user: UserRow, jobTitle: string): Promise<void> {
  if (!user.email) {
    console.warn(`No email for user ${user.user_id}`);
    return;
  }

  const userName = user.full_name || "there";

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: user.email,
    subject: "Your job post has been removed",
    html: `
      <div style="font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.6; color: #333; max-width: 600px;">
        <p>Hi ${userName},</p>
        <p>Your job post titled <strong>"${jobTitle}"</strong> has automatically been deleted after 30 days.</p>
        <p>If you'd like to keep it active, you can re-submit it on <a href="https://mycpghub.com/post-job" style="color: #14b8a6;">CPG Hub</a>.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #666; font-size: 14px;">The CPG Hub Team</p>
      </div>
    `,
  });

  if (error) {
    console.error(`Failed to send email to ${user.email}:`, error);
    throw error;
  }
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: CORS });
    }

    console.log("[cleanup-expired-jobs] Starting cleanup...");

    // Fetch jobs older than 30 days
    const expiredJobs = await fetchExpiredJobs();
    console.log(`[cleanup-expired-jobs] Found ${expiredJobs.length} expired jobs`);

    const results = {
      processed: 0,
      emailsSent: 0,
      deleted: 0,
      errors: [] as string[],
    };

    for (const job of expiredJobs) {
      results.processed++;

      try {
        // Fetch the poster's info
        const user = await fetchUser(job.poster_id);

        if (user?.email) {
          // Send notification email
          await sendExpirationEmail(user, job.job_title);
          results.emailsSent++;
          console.log(`[cleanup-expired-jobs] Sent email for job "${job.job_title}" to ${user.email}`);
        }

        // Delete the job
        await deleteJob(job.id);
        results.deleted++;
        console.log(`[cleanup-expired-jobs] Deleted job ${job.id}: "${job.job_title}"`);
      } catch (err) {
        const errorMsg = `Error processing job ${job.id}: ${err.message}`;
        console.error(`[cleanup-expired-jobs] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log("[cleanup-expired-jobs] Cleanup complete:", results);
    return json({ ok: true, ...results });
  } catch (err) {
    console.error("[cleanup-expired-jobs] Fatal error:", err);
    return json({ ok: false, error: String(err?.message || err) }, 500);
  }
});
