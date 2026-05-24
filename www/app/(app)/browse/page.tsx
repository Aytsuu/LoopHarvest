'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Globe as GlobeIcon, List as ListIcon, Map as MapIcon, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';
import { useCategories } from '@/components/common/CategoriesProvider';
import CategoryChip from '@/components/common/CategoryChip';
import Globe from '@/components/Globe';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel, toRequestCardModel } from '@/lib/api/mappers';
import type { CategorySlug } from '@/lib/categories';
import type { ApiListing, ApiRequest, Listing, RequestItem } from '@/lib/api/types';

export default function BrowseMapPage() {
  const { categories } = useCategories();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests'>('listings');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<CategorySlug | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<Listing | RequestItem | null>(null);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const [showMapOnMobile, setShowMapOnMobile] = React.useState(false);
  const [mapProjection, setMapProjection] = React.useState<'globe' | 'mercator'>('globe');
  const [error, setError] = React.useState<string | null>(null);
  const categoriesRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  // Queries
  const { data: listings = [], error: listingsError } = useQuery({
    queryKey: ['listings'],
    queryFn: apiClient.getListings,
    select: (data) => data.map(toListingCardModel),
  });

  const { data: requests = [], error: requestsError } = useQuery({
    queryKey: ['requests'],
    queryFn: apiClient.getRequests,
    select: (data) => data.map(toRequestCardModel),
  });

  const fetchError = listingsError || requestsError;
  const displayError = error || (fetchError instanceof Error ? fetchError.message : fetchError ? 'Unable to load the marketplace map.' : null);

  // Mutations
  const claimMutation = useMutation({
    mutationFn: (id: string) => apiClient.claimListing(id),
    onMutate: async (id) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      const previousListings = queryClient.getQueryData<ApiListing[]>(['listings']);
      const previousSelectedItem = selectedItem;

      queryClient.setQueryData<ApiListing[]>(['listings'], (old) =>
        old ? old.map((l) => (l.id === id ? { ...l, status: 'claimed' } : l)) : []
      );

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: 'claimed' });
      }

      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Listing claimed.' }));
      return { previousListings, previousSelectedItem };
    },
    onError: (err, id, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(['listings'], context.previousListings);
      }
      if (context?.previousSelectedItem !== undefined) {
        setSelectedItem(context.previousSelectedItem);
      }
      setError(err instanceof Error ? err.message : 'Unable to claim this listing.');
    },
    onSuccess: () => {
      setSelectedItem(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => apiClient.fulfillRequest(id),
    onMutate: async (id) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previousRequests = queryClient.getQueryData<ApiRequest[]>(['requests']);
      const previousSelectedItem = selectedItem;

      queryClient.setQueryData<ApiRequest[]>(['requests'], (old) =>
        old ? old.map((r) => (r.id === id ? { ...r, status: 'fulfilled' } : r)) : []
      );

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: 'completed' });
      }

      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Request fulfilled.' }));
      return { previousRequests, previousSelectedItem };
    },
    onError: (err, id, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(['requests'], context.previousRequests);
      }
      if (context?.previousSelectedItem !== undefined) {
        setSelectedItem(context.previousSelectedItem);
      }
      setError(err instanceof Error ? err.message : 'Unable to fulfill this request.');
    },
    onSuccess: () => {
      setSelectedItem(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
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

  React.useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
      checkScroll();
    };

    handleResize();
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
    const isOpen = listing.status === 'open';
    return matchesSearch && matchesCategory && isOpen;
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? request.category === selectedCategory : true;
    const isOpen = request.status === 'open';
    return matchesSearch && matchesCategory && isOpen;
  });

  const handleClaim = (id: string) => {
    claimMutation.mutate(id);
  };

  const handleFulfill = (id: string) => {
    fulfillMutation.mutate(id);
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
            className={`flex-1 rounded-sm py-1.5 text-xs font-bold ${activeTab === 'listings' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
          >
            Food Waste
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 rounded-sm py-1.5 text-xs font-bold ${activeTab === 'requests' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
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
            {displayError && (
              <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
                {displayError}
              </div>
            )}

            {activeTab === 'listings'
              ? (currentListings.length > 0 ? currentListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClaim={handleClaim}
                    onClick={() => setSelectedItem(listing)}
                    hideImage={true}
                  />
                )) : <div className="py-12 text-center text-xs text-[#525252]">No matching listings on the map.</div>)
              : (currentRequests.length > 0 ? currentRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onFulfill={handleFulfill}
                    onClick={() => setSelectedItem(request)}
                  />
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
