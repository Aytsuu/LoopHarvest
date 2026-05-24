"use client";

export function buildAuthCallbackUrl(next = "/home") {
  if (typeof window === "undefined") {
    return `/auth/callback?next=${encodeURIComponent(next)}`;
  }

  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
