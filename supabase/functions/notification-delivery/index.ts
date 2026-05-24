import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  action_url: string | null;
  priority: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

type PreferenceRow = {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  email_digest: "realtime" | "daily" | "weekly" | "never";
  preferences: Record<string, { in_app?: boolean; push?: boolean; email?: boolean }>;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "api" },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseTimeMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map((segment) => Number(segment));
  return hours * 60 + minutes;
}

function isWithinQuietHours(preferences: PreferenceRow) {
  if (!preferences.quiet_hours_enabled) {
    return false;
  }

  const now = new Date();
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const start = parseTimeMinutes(preferences.quiet_hours_start);
  const end = parseTimeMinutes(preferences.quiet_hours_end);

  if (start === end) {
    return false;
  }

  if (start < end) {
    return nowMinutes >= start && nowMinutes < end;
  }

  return nowMinutes >= start || nowMinutes < end;
}

async function logDelivery(payload: {
  user_id: string;
  notification_id: string;
  channel: "push" | "email";
  type: string;
  reference_id: string | null;
  status: "sent" | "failed" | "skipped" | "queued";
  skip_reason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await supabase.from("delivery_log").insert({
    user_id: payload.user_id,
    notification_id: payload.notification_id,
    channel: payload.channel,
    type: payload.type,
    reference_id: payload.reference_id,
    status: payload.status,
    skip_reason: payload.skip_reason ?? null,
    metadata: payload.metadata ?? {},
  });
}

async function shouldSendPush(notification: NotificationRow, preferences: PreferenceRow) {
  if (!preferences.push_enabled) {
    return { allowed: false, reason: "push_disabled" };
  }

  const typePreference = preferences.preferences?.[notification.type];
  if (typePreference && typePreference.push === false) {
    return { allowed: false, reason: "type_push_disabled" };
  }

  if (notification.priority !== "critical" && isWithinQuietHours(preferences)) {
    return { allowed: false, reason: "quiet_hours" };
  }

  return { allowed: true };
}

async function shouldSendEmail(notification: NotificationRow, preferences: PreferenceRow) {
  if (!preferences.email_enabled) {
    return { allowed: false, reason: "email_disabled" };
  }

  const typePreference = preferences.preferences?.[notification.type];
  if (typePreference && typePreference.email === false) {
    return { allowed: false, reason: "type_email_disabled" };
  }

  if (preferences.email_digest !== "realtime" && notification.priority !== "critical") {
    return { allowed: false, reason: "digest_mode" };
  }

  return { allowed: true };
}

async function sendEmail(notification: NotificationRow, email: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [email],
      subject: notification.title ?? "LoopHarvest notification",
      html: `
        <div style="font-family: Arial, sans-serif; background:#0A0A0A; color:#FFFFFF; padding:24px;">
          <h1 style="font-size:20px;">${notification.title ?? "LoopHarvest notification"}</h1>
          <p style="line-height:1.6;">${notification.body ?? ""}</p>
          <p><a href="${supabaseUrl.replace(".supabase.co", "").replace("https://", "https://")}${notification.action_url ?? "/notifications"}">Open LoopHarvest</a></p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email failed with status ${response.status}`);
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase service role configuration is missing." }, 500);
  }

  const { notificationId } = await request.json();
  if (!notificationId) {
    return jsonResponse({ error: "notificationId is required." }, 400);
  }

  const { data: notification, error: notificationError } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, action_url, priority, reference_id, read_at, created_at")
    .eq("id", notificationId)
    .single<NotificationRow>();

  if (notificationError || !notification) {
    return jsonResponse({ error: "Notification not found." }, 404);
  }

  const [{ data: preferences }, { data: subscriptions }, { data: user }] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("user_id, push_enabled, email_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, email_digest, preferences")
      .eq("user_id", notification.user_id)
      .single<PreferenceRow>(),
    supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", notification.user_id),
    supabase
      .from("users")
      .select("email")
      .eq("id", notification.user_id)
      .single<{ email: string }>(),
  ]);

  if (!preferences) {
    return jsonResponse({ error: "Notification preferences not found." }, 404);
  }

  const pushDecision = await shouldSendPush(notification, preferences);
  if (pushDecision.allowed && vapidPublicKey && vapidPrivateKey) {
    for (const subscription of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: notification.action_url ?? "/notifications",
          }),
        );

        await logDelivery({
          user_id: notification.user_id,
          notification_id: notification.id,
          channel: "push",
          type: notification.type,
          reference_id: notification.reference_id,
          status: "sent",
          metadata: { endpoint: subscription.endpoint },
        });
      } catch (error) {
        await logDelivery({
          user_id: notification.user_id,
          notification_id: notification.id,
          channel: "push",
          type: notification.type,
          reference_id: notification.reference_id,
          status: "failed",
          skip_reason: error instanceof Error ? error.message : "push_failed",
        });
      }
    }
  } else {
    await logDelivery({
      user_id: notification.user_id,
      notification_id: notification.id,
      channel: "push",
      type: notification.type,
      reference_id: notification.reference_id,
      status: "skipped",
      skip_reason: pushDecision.reason ?? "push_not_configured",
    });
  }

  const emailDecision = await shouldSendEmail(notification, preferences);
  if (emailDecision.allowed && resendApiKey && resendFromEmail && user?.email) {
    try {
      await sendEmail(notification, user.email);
      await logDelivery({
        user_id: notification.user_id,
        notification_id: notification.id,
        channel: "email",
        type: notification.type,
        reference_id: notification.reference_id,
        status: "sent",
        metadata: { email: user.email },
      });
    } catch (error) {
      await logDelivery({
        user_id: notification.user_id,
        notification_id: notification.id,
        channel: "email",
        type: notification.type,
        reference_id: notification.reference_id,
        status: "failed",
        skip_reason: error instanceof Error ? error.message : "email_failed",
      });
    }
  } else {
    await logDelivery({
      user_id: notification.user_id,
      notification_id: notification.id,
      channel: "email",
      type: notification.type,
      reference_id: notification.reference_id,
      status: "skipped",
      skip_reason: emailDecision.reason ?? "email_not_configured",
    });
  }

  return jsonResponse({ success: true });
});
