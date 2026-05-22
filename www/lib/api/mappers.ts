import type { ApiImpactSummary, ApiListing, ApiRequest, Listing, RequestItem, UserStats } from "@/lib/api/types";

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
  return `${diffDays}d ago`;
}

export function toListingCardModel(listing: ApiListing): Listing {
  return {
    id: listing.id,
    title: listing.title,
    category: listing.category_slug as Listing["category"],
    quantity: Number(listing.quantity_kg),
    unit: "kg",
    distance: 0,
    city: listing.city,
    timeAgo: formatTimeAgo(listing.created_at),
    donorName: listing.donor_name ?? "LoopHarvest Member",
    donorAvatar:
      listing.donor_avatar_url ??
      "https://api.dicebear.com/7.x/avataaars/svg?seed=LoopHarvestMember",
    description: listing.description ?? "",
    status: listing.status,
    photo:
      listing.photo_url ??
      "https://images.unsplash.com/photo-1557844352-761f2565b576?q=80&w=600&auto=format&fit=crop",
  };
}

export function toRequestCardModel(request: ApiRequest): RequestItem {
  const minQuantity = Number(request.quantity_kg_min ?? "0");
  const maxQuantity = Number(request.quantity_kg_max ?? request.quantity_kg_min ?? "0");

  return {
    id: request.id,
    title: request.title,
    category: request.category_slug as RequestItem["category"],
    minQuantity,
    maxQuantity,
    unit: "kg",
    frequency: (request.frequency as RequestItem["frequency"]) ?? "one-time",
    distance: 0,
    city: request.city,
    timeAgo: formatTimeAgo(request.created_at),
    requesterName: request.requester_name ?? "LoopHarvest Member",
    requesterAvatar:
      request.requester_avatar_url ??
      "https://api.dicebear.com/7.x/avataaars/svg?seed=LoopHarvestRequester",
    description: request.description ?? "",
    status: request.status === "fulfilled" ? "claimed" : request.status === "closed" ? "expired" : "open",
  };
}

export function toUserStats(summary: ApiImpactSummary, listingsPosted = 0, requestsFulfilled = 0): UserStats {
  const kgDiverted = Number(summary.total_kg_diverted);
  const co2Saved = Number(summary.total_co2_saved_kg);
  const waterSaved = Number(summary.total_water_saved_liters);

  return {
    kgDiverted,
    co2Saved,
    waterSaved,
    listingsPosted,
    requestsFulfilled,
    loopPoints: Math.round(kgDiverted * 10 + requestsFulfilled * 30 + listingsPosted * 15),
  };
}
