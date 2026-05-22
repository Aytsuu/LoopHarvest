"use client";

import type { CategorySlug } from "@/lib/categories";
import type { NotificationItem } from "./types";

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "New waste match nearby",
    body: "Someone near you just posted 1.5kg of Vegetable Scraps.",
    time: "5m ago",
    type: "request_matched",
    status: "unread",
    category: "vegetable-scraps"
  },
  {
    id: "n-2",
    title: "Listing claimed!",
    body: "Baker's Bistro claimed your stale sourdough listing.",
    time: "1h ago",
    type: "listing_claimed",
    status: "unread",
    category: "bread-stale"
  },
  {
    id: "n-3",
    title: "Review received",
    body: "Hannelore Schmidt left you a 5-star review for organic compost.",
    time: "Yesterday",
    type: "review_received",
    status: "read"
  }
];

const STORAGE_KEY = "fl_notifications";
const isClient = typeof window !== "undefined";

function getStoredNotifications(): NotificationItem[] {
  if (!isClient) return INITIAL_NOTIFICATIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
  } catch (e) {
    console.warn("Storage access failed:", e);
    return INITIAL_NOTIFICATIONS;
  }
}

function setStoredNotifications(notifications: NotificationItem[]): void {
  if (isClient) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Writing to storage failed:", e);
    }
  }
}

export const notificationService = {
  getNotifications(): NotificationItem[] {
    return getStoredNotifications();
  },

  addNotification(
    title: string,
    body: string,
    type: NotificationItem["type"],
    category?: CategorySlug
  ): NotificationItem {
    const notifications = this.getNotifications();
    const newNotification: NotificationItem = {
      id: `n-${Date.now()}`,
      title,
      body,
      time: "Just now",
      type,
      status: "unread",
      category
    };
    const updated = [newNotification, ...notifications];
    setStoredNotifications(updated);
    
    // Trigger custom event to notify components/badges
    if (isClient) {
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
    
    return newNotification;
  },

  markAllNotificationsAsRead(): void {
    const notifications = this.getNotifications();
    const updated = notifications.map((n) => ({ ...n, status: "read" as const }));
    setStoredNotifications(updated);
    
    if (isClient) {
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
  },

  deleteNotification(id: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.filter((n) => n.id !== id);
    setStoredNotifications(updated);
    
    if (isClient) {
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    }
  }
};
