import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "api" },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const { digest = "daily" } = await request.json().catch(() => ({ digest: "daily" }));

  const { data: preferences, error } = await supabase
    .from("notification_preferences")
    .select("user_id, email_digest")
    .eq("email_enabled", true)
    .eq("email_digest", digest);

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  for (const preference of preferences ?? []) {
    const [{ data: notifications }, { data: user }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, title, body, action_url, type, created_at")
        .eq("user_id", preference.user_id)
        .is("read_at", null)
        .gte("created_at", new Date(Date.now() - (digest === "weekly" ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(25),
      supabase.from("users").select("email").eq("id", preference.user_id).single<{ email: string }>(),
    ]);

    if (!notifications?.length || !user?.email || !resendApiKey || !resendFromEmail) {
      continue;
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [user.email],
        subject: `LoopHarvest ${digest} digest`,
        html: `
          <div style="font-family: Arial, sans-serif; background:#0A0A0A; color:#FFFFFF; padding:24px;">
            <h1 style="font-size:20px;">Your LoopHarvest ${digest} digest</h1>
            <ul>
              ${notifications
                .map(
                  (notification) =>
                    `<li style="margin: 0 0 12px;"><strong>${notification.title ?? notification.type}</strong><br />${notification.body ?? ""}</li>`,
                )
                .join("")}
            </ul>
          </div>
        `,
      }),
    });
  }

  return jsonResponse({ success: true, digest });
});
