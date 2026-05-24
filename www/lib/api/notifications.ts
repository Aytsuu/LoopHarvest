"use client";

import type { NotificationItem, NotificationSettingsFormData } from "@/lib/api/types";
import { DEFAULT_NOTIFICATION_TYPE_PREFERENCES, mergeNotificationPreferences } from "@/lib/notifications/config";
import type { createClient } from "@/lib/supabase/client";

const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated";
const NOTIFICATION_FEED_PAGE_SIZE = 20;

type AppSupabaseClient = ReturnType<typeof createClient>;

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  category: string | null;
  priority: string | null;
  action_url: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationPreferencesRow = {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  email_digest: string;
  matching_radius_miles: number;
  eco_reports_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  preferences: Record<string, unknown>;
  updated_at: string;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsFormData = {
  alertRadius: 15,
  emailDigest: true,
  pushAlerts: false,
  ecoReports: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  emailDigestFrequency: "daily",
  typePreferences: DEFAULT_NOTIFICATION_TYPE_PREFERENCES,
};

function dispatchNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  }
}

function createNotificationChannelName(userId: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `notifications:${userId}:${suffix}`;
}

function formatTimeAgo(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) {
    return "Recently";
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - then) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function toNotificationItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title?.trim() || humanizeNotificationType(row.type),
    body: row.body?.trim() || "Open LoopHarvest to review this update.",
    time: formatTimeAgo(row.created_at),
    type: row.type,
    status: row.read_at ? "read" : "unread",
    actionUrl: row.action_url,
    category: row.category,
    priority: row.priority,
    createdAt: row.created_at,
  };
}

function humanizeNotificationType(type: string) {
  return type
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

async function requireCurrentUserId(supabase: AppSupabaseClient, providedUserId?: string) {
  if (providedUserId) {
    return providedUserId;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You need to be signed in to continue.");
  }

  return user.id;
}

async function ensurePreferencesRow(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(
      "user_id, push_enabled, email_enabled, email_digest, matching_radius_miles, eco_reports_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, preferences, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as NotificationPreferencesRow;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: userId,
        push_enabled: DEFAULT_NOTIFICATION_SETTINGS.pushAlerts,
        email_enabled: DEFAULT_NOTIFICATION_SETTINGS.emailDigest,
        email_digest: DEFAULT_NOTIFICATION_SETTINGS.emailDigestFrequency,
        matching_radius_miles: DEFAULT_NOTIFICATION_SETTINGS.alertRadius,
        eco_reports_enabled: DEFAULT_NOTIFICATION_SETTINGS.ecoReports,
        quiet_hours_enabled: DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnabled,
        quiet_hours_start: DEFAULT_NOTIFICATION_SETTINGS.quietHoursStart,
        quiet_hours_end: DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnd,
        preferences: DEFAULT_NOTIFICATION_SETTINGS.typePreferences,
      },
      {
        onConflict: "user_id",
      },
    )
    .select(
      "user_id, push_enabled, email_enabled, email_digest, matching_radius_miles, eco_reports_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, preferences, updated_at",
    )
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted as NotificationPreferencesRow;
}

function toNotificationSettings(row: NotificationPreferencesRow): NotificationSettingsFormData {
  return {
    alertRadius: row.matching_radius_miles,
    emailDigest: row.email_enabled && row.email_digest !== "never",
    pushAlerts: row.push_enabled,
    ecoReports: row.eco_reports_enabled,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start.slice(0, 5),
    quietHoursEnd: row.quiet_hours_end.slice(0, 5),
    emailDigestFrequency: (row.email_digest as NotificationSettingsFormData["emailDigestFrequency"]) ?? "daily",
    typePreferences: mergeNotificationPreferences(row.preferences),
  };
}

export const notificationService = {
  async getNotifications(supabase: AppSupabaseClient, userId?: string) {
    const resolvedUserId = await requireCurrentUserId(supabase, userId);
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, body, category, priority, action_url, reference_id, read_at, created_at")
      .eq("user_id", resolvedUserId)
      .order("created_at", { ascending: false })
      .limit(NOTIFICATION_FEED_PAGE_SIZE);

    if (error) {
      throw error;
    }

    return (data as NotificationRow[]).map(toNotificationItem);
  },

  async countUnreadNotifications(supabase: AppSupabaseClient, userId?: string) {
    const resolvedUserId = await requireCurrentUserId(supabase, userId);
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", resolvedUserId)
      .is("read_at", null);

    if (error) {
      throw error;
    }

    return count ?? 0;
  },

  async markAllNotificationsAsRead(supabase: AppSupabaseClient, userId?: string) {
    const resolvedUserId = await requireCurrentUserId(supabase, userId);
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", resolvedUserId)
      .is("read_at", null);

    if (error) {
      throw error;
    }

    dispatchNotificationsUpdated();
  },

  async markNotificationRead(supabase: AppSupabaseClient, notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .is("read_at", null);

    if (error) {
      throw error;
    }

    dispatchNotificationsUpdated();
  },

  async deleteNotification(supabase: AppSupabaseClient, notificationId: string) {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId);

    if (error) {
      throw error;
    }

    dispatchNotificationsUpdated();
  },

  subscribeToNotifications(
    supabase: AppSupabaseClient,
    userId: string,
    onChange: (notification?: NotificationItem) => void,
  ) {
    const channel = supabase
      .channel(createNotificationChannelName(userId))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "api",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          dispatchNotificationsUpdated();
          const nextNotification =
            payload.eventType === "INSERT" ? toNotificationItem(payload.new as NotificationRow) : undefined;
          onChange(nextNotification);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },

  async getSettings(supabase: AppSupabaseClient, userId?: string) {
    const resolvedUserId = await requireCurrentUserId(supabase, userId);
    const row = await ensurePreferencesRow(supabase, resolvedUserId);
    return toNotificationSettings(row);
  },

  async saveSettings(
    supabase: AppSupabaseClient,
    settings: NotificationSettingsFormData,
    userId?: string,
  ) {
    const resolvedUserId = await requireCurrentUserId(supabase, userId);
    const { error } = await supabase.from("notification_preferences").upsert(
      {
        user_id: resolvedUserId,
        push_enabled: settings.pushAlerts,
        email_enabled: settings.emailDigest,
        email_digest: settings.emailDigest ? settings.emailDigestFrequency : "never",
        matching_radius_miles: settings.alertRadius,
        eco_reports_enabled: settings.ecoReports,
        quiet_hours_enabled: settings.quietHoursEnabled,
        quiet_hours_start: settings.quietHoursStart,
        quiet_hours_end: settings.quietHoursEnd,
        preferences: settings.typePreferences,
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      throw error;
    }
  },
};
