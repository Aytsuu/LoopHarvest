'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Globe as GlobeIcon, List as ListIcon, Map as MapIcon, Search } from 'lucide-react';

import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';
import { useCategories } from '@/components/common/CategoriesProvider';
import CategoryChip from '@/components/common/CategoryChip';
import Globe from '@/components/Globe';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel, toRequestCardModel } from '@/lib/api/mappers';
import type { CategorySlug } from '@/lib/categories';
import type { Listing, RequestItem } from '@/lib/api/types';

export default function BrowseMapPage() {
  const { categories } = useCategories();
  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests'>('listings');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<CategorySlug | null>(null);
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [requests, setRequests] = React.useState<RequestItem[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<Listing | RequestItem | null>(null);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const [showMapOnMobile, setShowMapOnMobile] = React.useState(false);
  const [mapProjection, setMapProjection] = React.useState<'globe' | 'mercator'>('globe');
  const [error, setError] = React.useState<string | null>(null);
  const categoriesRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);
  const checkScroll = React.useCallback(() => {
    const element = categoriesRef.current;
    if (!element) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = element;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  const scrollCategories = React.useCallback((direction: 'left' | 'right') => {
    const element = categoriesRef.current;
    if (!element) {
      return;
    }

    element.scrollTo({
      left: element.scrollLeft + (direction === 'left' ? -200 : 200),
      behavior: 'smooth',
    });
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      setError(null);
      const [listingRows, requestRows] = await Promise.all([
        apiClient.getListings(),
        apiClient.getRequests(),
      ]);
      setListings(listingRows.map(toListingCardModel));
      setRequests(requestRows.map(toRequestCardModel));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the marketplace map.');
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const [listingRows, requestRows] = await Promise.all([
          apiClient.getListings(),
          apiClient.getRequests(),
        ]);

        if (cancelled) {
          return;
        }

        setListings(listingRows.map(toListingCardModel));
        setRequests(requestRows.map(toRequestCardModel));
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load the marketplace map.');
        }
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
      checkScroll();
    };

    handleResize();
    // Initial check with a tiny delay to allow fonts & layout to settle
    const timer = setTimeout(() => {
      handleResize();
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll, categories]);



  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? listing.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? request.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleClaim = async (id: string) => {
    try {
      await apiClient.claimListing(id);
      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Listing claimed.' }));
      await loadData();
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to claim this listing.');
    }
  };

  const handleFulfill = async (id: string) => {
    try {
      await apiClient.fulfillRequest(id);
      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Request fulfilled.' }));
      await loadData();
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fulfill this request.');
    }
  };

  const renderHeaderFilters = () => {
    const activeView = showMapOnMobile
      ? (mapProjection === 'globe' ? 'globe' : 'flat')
      : 'list';

    return (
      <div className="space-y-4 border-b border-white/6 bg-[#0E0E0E] p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#A3A3A3]">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search local items..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/10 bg-[#141414] pl-10 pr-4 text-sm text-[#FFFFFF] placeholder-[#525252] focus:border-[#A8D97F] focus:outline-none"
            />
          </div>

          <div className="flex h-10 shrink-0 items-center gap-0.5 rounded-lg border border-white/6 bg-[#141414] p-0.5">
            {!isLargeScreen && (
              <button
                onClick={() => setShowMapOnMobile(false)}
                className={`flex h-8 items-center justify-center rounded-md px-2.5 ${activeView === 'list' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
              >
                <ListIcon size={14} />
              </button>
            )}
            <button
              onClick={() => {
                setMapProjection('mercator');
                if (!isLargeScreen) setShowMapOnMobile(true);
              }}
              className={`flex h-8 items-center justify-center rounded-md px-2.5 ${activeView === 'flat' || (isLargeScreen && mapProjection === 'mercator') ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
            >
              <MapIcon size={14} />
            </button>
            <button
              onClick={() => {
                setMapProjection('globe');
                if (!isLargeScreen) setShowMapOnMobile(true);
              }}
              className={`flex h-8 items-center justify-center rounded-md px-2.5 ${activeView === 'globe' || (isLargeScreen && mapProjection === 'globe') ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
            >
              <GlobeIcon size={14} />
            </button>
          </div>
        </div>

        <div className="flex rounded-md border border-white/6 bg-[#141414] p-0.5">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 rounded py-1.5 text-xs font-bold ${activeTab === 'listings' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
          >
            Food Waste
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 rounded py-1.5 text-xs font-bold ${activeTab === 'requests' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
          >
            Appeals
          </button>
        </div>

        <div className="relative">
          <div className={`pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex w-12 items-center pl-1 bg-gradient-to-r from-[#0E0E0E] to-transparent ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => scrollCategories('left')}
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3]"
              aria-label="Previous Categories"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          <div ref={categoriesRef} onScroll={checkScroll} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-wider ${selectedCategory === null ? 'border-[#A8D97F] bg-[rgba(168,217,127,0.1)] text-[#A8D97F]' : 'border-white/8 bg-[#141414] text-[#A3A3A3]'}`}
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

          <div className={`pointer-events-none absolute bottom-0 right-0 top-0 z-10 flex w-12 items-center justify-end pr-1 bg-gradient-to-l from-[#0E0E0E] to-transparent ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => scrollCategories('right')}
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3]"
              aria-label="Next Categories"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentListings = activeTab === 'listings' ? filteredListings : listings;
  const currentRequests = activeTab === 'requests' ? filteredRequests : requests;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#0A0A0A] text-[#FFFFFF]">
      {!isLargeScreen && <div className="z-20 flex-shrink-0">{renderHeaderFilters()}</div>}

      <div className="relative flex flex-1 overflow-hidden">
        <section className={`absolute inset-y-0 left-0 z-10 flex w-full shrink-0 transform flex-col border-r border-white/6 bg-[#0A0A0A] transition-transform md:relative md:w-95 md:translate-x-0 lg:w-110 ${showMapOnMobile ? '-translate-x-full' : 'translate-x-0'}`}>
          {isLargeScreen && renderHeaderFilters()}

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#0A0A0A] p-4 pb-24 scrollbar-none md:pb-6">
            {error && (
              <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
                {error}
              </div>
            )}

            {activeTab === 'listings'
              ? (currentListings.length > 0 ? currentListings.map((listing) => (
                  <div key={listing.id} onClick={() => setSelectedItem(listing)} className="cursor-pointer">
                    <ListingCard listing={listing} onClaim={handleClaim} />
                  </div>
                )) : <div className="py-12 text-center text-xs text-[#525252]">No matching listings on the map.</div>)
              : (currentRequests.length > 0 ? currentRequests.map((request) => (
                  <div key={request.id} onClick={() => setSelectedItem(request)} className="cursor-pointer">
                    <RequestCard request={request} onFulfill={handleFulfill} />
                  </div>
                )) : <div className="py-12 text-center text-xs text-[#525252]">No matching appeals on the map.</div>)}
          </div>
        </section>

        <section className="h-full w-full flex-1 bg-[#050505]">
          {(isLargeScreen || showMapOnMobile) && (
            <Globe
              focusedItemId={selectedItem?.id}
              projection={mapProjection}
              listings={filteredListings}
              requests={filteredRequests}
              onClaim={handleClaim}
              onFulfill={handleFulfill}
              onPinSelect={(pin) => {
                if (!pin) {
                  setSelectedItem(null);
                  return;
                }
                const item =
                  filteredListings.find((listing) => listing.id === pin.id) ??
                  filteredRequests.find((request) => request.id === pin.id) ??
                  null;
                setSelectedItem(item);
              }}
            />
          )}

          {showMapOnMobile && (
            <button
              onClick={() => setShowMapOnMobile(false)}
              className="absolute bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#A8D97F]/30 bg-[#0E0E0E]/90 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#A8D97F] backdrop-blur-md md:hidden"
            >
              <ListIcon size={14} strokeWidth={2.5} />
              <span>Back to List</span>
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
