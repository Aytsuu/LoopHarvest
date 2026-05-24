"use client";

import { createClient } from "@/lib/supabase/client";

import type {
  ApiCategory,
  ApiEnvelope,
  ApiImpactSummary,
  ApiListing,
  ApiRequest,
  ApiSurvey,
  ApiSurveyPayload,
  ApiUser,
} from "@/lib/api/types";

const DEFAULT_API_BASE_URL = "/api/v1";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You need to be signed in to continue.");
  }

  return session.access_token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  const payload = await parseApiPayload<T>(response);
  if (!response.ok || !("data" in payload)) {
    const message =
      ("error" in payload && payload.error?.message) || "The request could not be completed.";
    throw new Error(message);
  }

  return payload.data;
}

async function publicRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
  });
  const payload = await parseApiPayload<T>(response);
  if (!response.ok || !("data" in payload)) {
    const message =
      ("error" in payload && payload.error?.message) || "The request could not be completed.";
    throw new Error(message);
  }

  return payload.data;
}

async function parseApiPayload<T>(
  response: Response,
): Promise<ApiEnvelope<T> | { error?: { message?: string } }> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("The API returned an unexpected non-JSON response.");
  }

  return (await response.json()) as ApiEnvelope<T> | { error?: { message?: string } };
}

export const apiClient = {
  getCategories() {
    return publicRequest<ApiCategory[]>("/categories");
  },
  getCurrentUser() {
    return request<ApiUser>("/auth/me");
  },
  updateCurrentUser(payload: {
    email: string;
    display_name: string;
    avatar_url: string | null;
    city: string | null;
    state_region: string | null;
    postal_code: string | null;
    country: string | null;
    bio: string | null;
  }) {
    return request<ApiUser>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  getListings() {
    return publicRequest<ApiListing[]>("/listings");
  },
  getListing(listingId: string) {
    return publicRequest<ApiListing>(`/listings/${listingId}`);
  },
  createListing(payload: {
    title: string;
    description: string;
    category_slug: string;
    quantity_kg: number;
    claim_type: "direct" | "message";
    photo_url?: string;
    pickup_address: string;
    city: string;
    country: string;
  }) {
    return request<ApiListing>("/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  claimListing(listingId: string) {
    return request<ApiListing>(`/listings/${listingId}/claim`, {
      method: "POST",
    });
  },
  completeListing(listingId: string) {
    return request<ApiListing>(`/listings/${listingId}/complete`, {
      method: "POST",
    });
  },
  getRequests() {
    return publicRequest<ApiRequest[]>("/requests");
  },
  getRequest(requestId: string) {
    return publicRequest<ApiRequest>(`/requests/${requestId}`);
  },
  createRequest(payload: {
    title: string;
    description: string;
    category_slug: string;
    quantity_kg_min: number;
    quantity_kg_max: number;
    frequency: string;
    city: string;
    country: string;
    max_distance_km: number;
  }) {
    return request<ApiRequest>("/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  fulfillRequest(requestId: string) {
    return request<ApiRequest>(`/requests/${requestId}/fulfill`, {
      method: "POST",
    });
  },
  getImpactSummary() {
    return publicRequest<ApiImpactSummary>("/impact/summary");
  },
  getCurrentUserSurvey() {
    return request<ApiSurvey | null>("/survey/me");
  },
  saveCurrentUserSurvey(payload: ApiSurveyPayload) {
    return request<ApiSurvey>("/survey/me", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
