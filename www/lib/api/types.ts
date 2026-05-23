export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface ApiUser {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country: string | null;
  bio: string | null;
  created_at: string | null;
}

export interface ApiListing {
  id: string;
  donor_id: string;
  donor_name: string | null;
  donor_avatar_url: string | null;
  title: string;
  description: string | null;
  category_slug: string;
  quantity_kg: string;
  claim_type: "direct" | "message";
  photo_url: string | null;
  pickup_address: string;
  city: string;
  country: string;
  pickup_window_start: string | null;
  pickup_window_end: string | null;
  status: "open" | "claimed" | "completed";
  claimed_by: string | null;
  created_at: string;
}

export interface ApiRequest {
  id: string;
  requester_id: string;
  requester_name: string | null;
  requester_avatar_url: string | null;
  title: string;
  description: string | null;
  category_slug: string;
  quantity_kg_min: string | null;
  quantity_kg_max: string | null;
  frequency: string;
  city: string;
  country: string;
  max_distance_km: string;
  status: "open" | "fulfilled" | "closed";
  created_at: string;
}

export interface ApiImpactSummary {
  total_kg_diverted: string;
  total_co2_saved_kg: string;
  total_water_saved_liters: string;
  active_listings: number;
  active_requests: number;
}

import type { CategorySlug } from "@/lib/categories";

export interface ApiCategory {
  slug: string;
  label: string;
  parent_slug: string | null;
  co2_factor_per_kg: string;
  water_saved_liters_per_kg: string;
}

export interface Listing {
  id: string;
  title: string;
  category: CategorySlug;
  quantity: number;
  unit: string;
  distance: number;
  city: string;
  pickupAddress: string;
  timeAgo: string;
  donorName: string;
  donorAvatar: string;
  description: string;
  status: "open" | "claimed" | "completed";
  photo: string;
  claimType: "direct" | "message";
  donorId: string;
  claimedBy?: string | null;
}

export interface RequestItem {
  id: string;
  title: string;
  category: CategorySlug;
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  frequency: "one-time" | "weekly" | "monthly";
  distance: number;
  city: string;
  timeAgo: string;
  requesterName: string;
  requesterAvatar: string;
  description: string;
  status: "open" | "claimed" | "completed" | "expired";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "match_found" | "listing_claimed" | "pickup_confirmed" | "request_matched" | "review_received";
  status: "unread" | "read";
  category?: CategorySlug;
}

export interface UserStats {
  kgDiverted: number;
  co2Saved: number;
  waterSaved: number;
  listingsPosted: number;
  requestsFulfilled: number;
  loopPoints: number;
}
