"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Heart, Search, Sparkles, Inbox } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import ListingCard from "@/components/cards/ListingCard";
import RequestCard from "@/components/cards/RequestCard";
import { useCategories } from "@/components/common/CategoriesProvider";
import CategoryChip from "@/components/common/CategoryChip";
import { apiClient } from "@/lib/api/client";
import { toListingCardModel, toRequestCardModel, toUserStats } from "@/lib/api/mappers";
import type { CategorySlug } from "@/lib/categories";
import type { ApiListing, ApiRequest, Listing, RequestItem, UserStats } from "@/lib/api/types";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const EMPTY_STATS: UserStats = {
  kgDiverted: 0,
  co2Saved: 0,
  waterSaved: 0,
  listingsPosted: 0,
  requestsFulfilled: 0,
  loopPoints: 0,
};

export default function HomeFeed() {
  const { categories } = useCategories();
  const queryClient = useQueryClient();
  const [supabase] = React.useState(() => createSupabaseClient());
  const [activeTab, setActiveTab] = React.useState<"listings" | "requests">("listings");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<CategorySlug | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const categoriesRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  // Queries
  const { data: listings = [], isLoading: listingsLoading, error: listingsError } = useQuery({
    queryKey: ["listings"],
    queryFn: apiClient.getListings,
    select: (data) => data.map(toListingCardModel),
  });

  const { data: requests = [], isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ["requests"],
    queryFn: apiClient.getRequests,
    select: (data) => data.map(toRequestCardModel),
  });

  const { data: impactSummary, isLoading: impactLoading, error: impactError } = useQuery({
    queryKey: ["impact"],
    queryFn: apiClient.getImpactSummary,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["home-current-user"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return user;
    },
  });

  const stats = React.useMemo(() => {
    if (!impactSummary) {
      return EMPTY_STATS;
    }
    return toUserStats(
      impactSummary,
      listings.length,
      requests.filter((request) => request.status !== "open").length,
    );
  }, [impactSummary, listings, requests]);

  const loading = listingsLoading || requestsLoading || impactLoading;
  const fetchError = listingsError || requestsError || impactError;
  const displayError = error || (fetchError instanceof Error ? fetchError.message : fetchError ? "Unable to load the marketplace." : null);

  // Mutations
  const claimMutation = useMutation({
    mutationFn: (id: string) => apiClient.claimListing(id),
    onMutate: async (id) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ["listings"] });
      const previousListings = queryClient.getQueryData<ApiListing[]>(["listings"]);

      queryClient.setQueryData<ApiListing[]>(["listings"], (old) =>
        old ? old.map((l) => (l.id === id ? { ...l, status: "claimed" } : l)) : [],
      );

      window.dispatchEvent(new CustomEvent("post-created", { detail: "Listing claimed." }));
      return { previousListings };
    },
    onError: (err, id, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(["listings"], context.previousListings);
      }
      setError(err instanceof Error ? err.message : "Unable to claim this listing.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
      void queryClient.invalidateQueries({ queryKey: ["impact"] });
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => apiClient.fulfillRequest(id),
    onMutate: async (id) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ["requests"] });
      const previousRequests = queryClient.getQueryData<ApiRequest[]>(["requests"]);

      queryClient.setQueryData<ApiRequest[]>(["requests"], (old) =>
        old ? old.map((r) => (r.id === id ? { ...r, status: "fulfilled" } : r)) : [],
      );

      window.dispatchEvent(new CustomEvent("post-created", { detail: "Request fulfilled." }));
      return { previousRequests };
    },
    onError: (err, id, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(["requests"], context.previousRequests);
      }
      setError(err instanceof Error ? err.message : "Unable to fulfill this request.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void queryClient.invalidateQueries({ queryKey: ["impact"] });
    },
  });

  const checkScroll = React.useCallback(() => {
    const element = categoriesRef.current;
    if (!element) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = element;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  React.useEffect(() => {
    const handleResize = () => checkScroll();
    
    handleResize();
    const timer = setTimeout(() => {
      handleResize();
    }, 100);

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [checkScroll, categories]);

  const scrollCategories = React.useCallback((direction: "left" | "right") => {
    const element = categoriesRef.current;
    if (!element) {
      return;
    }
    element.scrollTo({
      left: element.scrollLeft + (direction === "left" ? -200 : 200),
      behavior: "smooth",
    });
  }, []);

  const handleClaim = (id: string) => {
    claimMutation.mutate(id);
  };

  const handleFulfill = (id: string) => {
    fulfillMutation.mutate(id);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? listing.category === selectedCategory : true;
    const isOpen = listing.status === "open";
    return matchesSearch && matchesCategory && isOpen;
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? request.category === selectedCategory : true;
    const isOpen = request.status === "open";
    return matchesSearch && matchesCategory && isOpen;
  });

  return (
    <main className="min-h-screen flex-1 bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 pb-24 md:pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-lg flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#A3A3A3]">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search listings, locations, materials..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-[#141414] pl-10 pr-4 text-sm text-[#FFFFFF] placeholder-[#525252] transition-all focus:border-[#A8D97F] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 overflow-x-auto rounded-xl border border-white/6 bg-[#141414] px-4 py-2.5">
            <div className="flex shrink-0 items-center gap-1.5">
              <Sparkles size={14} className="text-[#A8D97F]" />
              <span className="text-[11px] font-bold text-[#A3A3A3]">Points:</span>
              <span className="font-mono text-xs font-black text-[#A8D97F]">{stats.loopPoints} XP</span>
            </div>
            <div className="h-4 w-px shrink-0 bg-white/10" />
            <div className="flex shrink-0 items-center gap-1.5">
              <Heart size={14} className="text-[#E8A838]" />
              <span className="text-[11px] font-bold text-[#A3A3A3]">Diverted:</span>
              <span className="font-mono text-xs font-black text-[#E8A838]">{stats.kgDiverted} kg</span>
            </div>
          </div>
        </div>

        {displayError && (
          <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
            {displayError}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">Browse by Category</h3>
          <div className="relative">
            <div className={`pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex w-12 items-center pl-1 bg-gradient-to-r from-[#0A0A0A] to-transparent ${showLeftArrow ? "opacity-100" : "opacity-0"}`}>
              <button
                onClick={() => scrollCategories("left")}
                className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3] cursor-pointer"
                aria-label="Previous Categories"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            <div ref={categoriesRef} onScroll={checkScroll} className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${selectedCategory === null ? "border-[#A8D97F] bg-[rgba(168,217,127,0.1)] text-[#A8D97F]" : "border-white/8 bg-[#141414] text-[#A3A3A3]"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/globe.svg" alt="" className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                <span>All</span>
              </button>
              {categories.map((category) => (
                <CategoryChip
                  key={category.slug}
                  categorySlug={category.slug}
                  selected={selectedCategory === category.slug}
                  onClick={() => setSelectedCategory(category.slug)}
                />
              ))}
            </div>

            <div className={`pointer-events-none absolute bottom-0 right-0 top-0 z-10 flex w-12 items-center justify-end pr-1 bg-gradient-to-l from-[#0A0A0A] to-transparent ${showRightArrow ? "opacity-100" : "opacity-0"}`}>
              <button
                onClick={() => scrollCategories("right")}
                className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3] cursor-pointer"
                aria-label="Next Categories"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>


        <div className="flex flex-col gap-4 border-t border-white/6 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex rounded-lg border border-white/6 bg-[#141414] p-1">
              <button
                onClick={() => setActiveTab("listings")}
                className={`rounded-md px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "listings" ? "bg-[#2A4A10] text-[#A8D97F]" : "text-[#A3A3A3]"}`}
              >
                Available waste ({listings.filter((listing) => listing.status === "open").length})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`rounded-md px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "requests" ? "bg-[#2A4A10] text-[#A8D97F]" : "text-[#A3A3A3]"}`}
              >
                Active appeals ({requests.filter((request) => request.status === "open").length})
              </button>
            </div>
            <span className="text-xs font-medium text-[#A3A3A3]">
              Showing {activeTab === "listings" ? filteredListings.length : filteredRequests.length} items
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Inbox size={40} className="mb-3 stroke-1 text-neutral-600 animate-pulse" />
              <span className="text-xs text-white">Loading marketplace...</span>
            </div>
          ) : activeTab === "listings" ? (
            filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} onClaim={handleClaim} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Inbox size={40} className="mb-3 stroke-1 text-neutral-600" />
                <span className="text-xs text-white">No listings match your current filters.</span>
              </div>
            )
          ) : filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onFulfill={request.requesterId === currentUser?.id ? undefined : handleFulfill}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Inbox size={40} className="mb-3 stroke-1 text-neutral-600" />
              <span className="text-xs text-white">No requests match your current filters.</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
