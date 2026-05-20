"use client";

import * as React from "react";
import { Search, Sparkles, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { mockStore, Listing, RequestItem } from "@/lib/mockStore";
import { CATEGORIES, CategorySlug } from "@/lib/categories";
import CategoryChip from "@/components/common/CategoryChip";
import ListingCard from "@/components/cards/ListingCard";
import RequestCard from "@/components/cards/RequestCard";

export default function HomeFeed() {
  const [activeTab, setActiveTab] = React.useState<"listings" | "requests">(
    "listings",
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategorySlug | null>(null);
  const [listings, setListings] = React.useState<Listing[]>(() =>
    mockStore.getListings(),
  );
  const [requests, setRequests] = React.useState<RequestItem[]>(() =>
    mockStore.getRequests(),
  );
  const [stats, setStats] = React.useState(() => mockStore.getUserStats());

  const categoriesRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = categoriesRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  const setCategoriesRef = React.useCallback((node: HTMLDivElement | null) => {
    categoriesRef.current = node;
    if (node) {
      setTimeout(() => {
        const { scrollLeft, scrollWidth, clientWidth } = node;
        setShowLeftArrow(scrollLeft > 2);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
      }, 100);
    }
  }, []);

  const scroll = React.useCallback((direction: "left" | "right") => {
    const el = categoriesRef.current;
    if (!el) return;
    const scrollAmount = 200;
    const target =
      el.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);
    el.scrollTo({
      left: target,
      behavior: "smooth",
    });
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      checkScroll();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScroll]);

  // Load initial store data
  const refreshData = React.useCallback(() => {
    setListings(mockStore.getListings());
    setRequests(mockStore.getRequests());
    setStats(mockStore.getUserStats());
  }, []);

  React.useEffect(() => {
    // Add event listener to refresh data if a post is created elsewhere
    const handleRefresh = () => {
      refreshData();
    };
    window.addEventListener("post-created", handleRefresh);
    return () => window.removeEventListener("post-created", handleRefresh);
  }, [refreshData]);

  // Handle claiming a listing
  const handleClaim = (id: string) => {
    const success = mockStore.claimListing(id);
    if (success) {
      // Trigger toast through the CustomEvent that layout.tsx listens to
      const event = new CustomEvent("post-created", {
        detail: "Listing claimed! Points added to your profile.",
      });
      window.dispatchEvent(event);
      refreshData();
    }
  };

  // Handle fulfilling a request
  const handleFulfill = (id: string) => {
    const success = mockStore.fulfillRequest(id);
    if (success) {
      const event = new CustomEvent("post-created", {
        detail: "Offering to fulfill request! Requester has been notified.",
      });
      window.dispatchEvent(event);
      refreshData();
    }
  };

  // Filter listings based on search and category selection
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? l.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  // Filter requests based on search and category selection
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? r.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  // Matches carousel data (e.g. low-distance items or featured)
  const matches = React.useMemo(() => {
    if (activeTab === "listings") {
      return listings.filter((l) => l.status === "open").slice(0, 3);
    } else {
      return requests.filter((r) => r.status === "open").slice(0, 3);
    }
  }, [listings, requests, activeTab]);

  return (
    <main className="flex-1 bg-[#0A0A0A] text-[#E8EAD8] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 pb-24 md:pb-8">
        {/* Search & Filter Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#A8AA98]">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search listings, locations, materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/10 bg-[#141414] text-[#E8EAD8] placeholder-[#5A5C50] text-sm focus:border-[#A8D97F] focus:outline-none transition-all"
            />
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center gap-4 bg-[#141414] px-4 py-2.5 rounded-xl border border-white/6 overflow-x-auto self-start md:self-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <Sparkles size={14} className="text-[#A8D97F]" />
              <span className="text-[11px] font-bold text-[#A8AA98]">
                Points:
              </span>
              <span className="text-xs font-black font-mono text-[#A8D97F]">
                {stats.loopPoints} XP
              </span>
            </div>
            <div className="h-4 w-px bg-white/10 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <Heart size={14} className="text-[#E8A838]" />
              <span className="text-[11px] font-bold text-[#A8AA98]">
                Diverted:
              </span>
              <span className="text-xs font-black font-mono text-[#E8A838]">
                {stats.kgDiverted} kg
              </span>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Scroll with Chevrons & Gradient Fade Masks */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#A8AA98]">
            Browse by Category
          </h3>
          <div className="relative group/categories">
            {/* Left Fading Edge & Chevron */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 flex items-center pl-1 transition-opacity duration-300 pointer-events-none ${
                showLeftArrow ? "opacity-100" : "opacity-0"
              }`}
            >
              <button
                onClick={() => scroll("left")}
                className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A8AA98] hover:text-[#E8EAD8] hover:bg-[#2A4A10]/95 hover:border-[#A8D97F]/40 shadow-md backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#A8D97F]"
                aria-label="Previous Categories"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            {/* Scrolling Categories List */}
            <div
              ref={setCategoriesRef}
              onScroll={checkScroll}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
            >
              <button
                onClick={() => setSelectedCategory(null)}
                style={
                  selectedCategory === null
                    ? {
                        borderColor: "#A8D97F",
                        backgroundColor: "rgba(168, 217, 127, 0.1)",
                        color: "#A8D97F",
                        boxShadow: "0 0 10px rgba(168, 217, 127, 0.15)",
                      }
                    : {
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        backgroundColor: "#141414",
                        color: "#A8AA98",
                      }
                }
                className="inline-flex items-center gap-2 h-8 px-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-200 select-none border shrink-0 cursor-pointer hover:text-[#E8EAD8] hover:border-white/20 hover:bg-white/5 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A8D97F]"
              >
                {/* Circle globe emoji container to keep it structured and visually consistent */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs shadow-inner">
                  🌐
                </span>
                <span className="pr-0.5">All</span>
              </button>
              {CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat.slug}
                  categorySlug={cat.slug}
                  selected={selectedCategory === cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                />
              ))}
            </div>

            {/* Right Fading Edge & Chevron */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 flex items-center justify-end pr-1 transition-opacity duration-300 pointer-events-none ${
                showRightArrow ? "opacity-100" : "opacity-0"
              }`}
            >
              <button
                onClick={() => scroll("right")}
                className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A8AA98] hover:text-[#E8EAD8] hover:bg-[#2A4A10]/95 hover:border-[#A8D97F]/40 shadow-md backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#A8D97F]"
                aria-label="Next Categories"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Matched for You (Carousel) */}
        {matches.length > 0 && !searchQuery && !selectedCategory && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#A8D97F]" />
                <h2 className="font-display text-lg font-bold tracking-tight text-[#E8EAD8]">
                  Highly Compatible Matches
                </h2>
              </div>
              <span className="text-xs text-[#A8D97F] font-bold">
                Based on distance
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none">
              {activeTab === "listings"
                ? (matches as Listing[]).map((listing, index) => (
                    <div 
                      key={listing.id} 
                      className="w-80 shrink-0 snap-start animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <ListingCard listing={listing} onClaim={handleClaim} />
                    </div>
                  ))
                : (matches as RequestItem[]).map((request, index) => (
                    <div 
                      key={request.id} 
                      className="w-80 shrink-0 snap-start animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      <RequestCard
                        request={request}
                        onFulfill={handleFulfill}
                      />
                    </div>
                  ))}
            </div>
          </div>
        )}

        {/* Listings vs Requests Selector */}
        <div className="flex flex-col gap-4 border-t border-white/6 pt-6">
          <div className="flex justify-between items-center">
            {/* Tab switch */}
            <div className="flex rounded-lg bg-[#141414] p-1 border border-white/6">
              <button
                onClick={() => setActiveTab("listings")}
                className={`rounded-md px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "listings"
                    ? "bg-[#2A4A10] text-[#A8D97F]"
                    : "text-[#A8AA98] hover:text-[#E8EAD8]"
                }`}
              >
                Available waste (
                {listings.filter((l) => l.status === "open").length})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`rounded-md px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === "requests"
                    ? "bg-[#2A4A10] text-[#A8D97F]"
                    : "text-[#A8AA98] hover:text-[#E8EAD8]"
                }`}
              >
                Urgent Appeals (
                {requests.filter((r) => r.status === "open").length})
              </button>
            </div>

            <span className="text-xs font-medium text-[#A8AA98]">
              Showing{" "}
              {activeTab === "listings"
                ? filteredListings.length
                : filteredRequests.length}{" "}
              items
            </span>
          </div>

          {/* Grid Layout of Items */}
          {activeTab === "listings" ? (
            filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing, index) => (
                  <div 
                    key={listing.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
                  >
                    <ListingCard
                      listing={listing}
                      onClaim={handleClaim}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-[#141414] rounded-2xl border border-white/6 p-6 animate-blur-in">
                <span className="text-4xl mb-4">🍂</span>
                <h4 className="font-display text-base font-bold text-[#E8EAD8]">
                  No available waste found
                </h4>
                <p className="text-xs text-[#A8AA98] mt-1 max-w-xs">
                  Try adjusting your search queries or selecting a different
                  material category.
                </p>
              </div>
            )
          ) : filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests.map((request, index) => (
                <div 
                  key={request.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
                >
                  <RequestCard
                    request={request}
                    onFulfill={handleFulfill}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-[#141414] rounded-2xl border border-white/6 p-6 animate-blur-in">
              <span className="text-4xl mb-4">🙏</span>
              <h4 className="font-display text-base font-bold text-[#E8EAD8]">
                No active appeals found
              </h4>
              <p className="text-xs text-[#A8AA98] mt-1 max-w-xs">
                Nobody is asking for materials matching your criteria right now.
                Check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
