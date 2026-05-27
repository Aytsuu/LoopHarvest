'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe as GlobeIcon,
  List as ListIcon,
  Map as MapIcon,
  Search,
  Sparkles,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';
import { useCategories } from '@/components/common/CategoriesProvider';
import CategoryChip from '@/components/common/CategoryChip';
import Globe from '@/components/Globe';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel, toPersonalizedMatches, toRequestCardModel } from '@/lib/api/mappers';
import type { CategorySlug } from '@/lib/categories';
import type {
  ApiListing,
  ApiRequest,
  Listing,
  ListingMatchGroup,
  PersonalizedMatches,
  RequestItem,
  RequestMatchGroup,
} from '@/lib/api/types';

type BrowseMode = 'marketplace' | 'matches';
type MatchScope = 'requests' | 'listings';

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default function BrowseMapPage() {
  const { categories } = useCategories();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests'>('listings');
  const [browseMode, setBrowseMode] = React.useState<BrowseMode>('marketplace');
  const [matchScope, setMatchScope] = React.useState<MatchScope>('requests');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<CategorySlug | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<Listing | RequestItem | null>(null);
  const [selectedRequestGroupId, setSelectedRequestGroupId] = React.useState<string | null>(null);
  const [selectedListingGroupId, setSelectedListingGroupId] = React.useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const [showMapOnMobile, setShowMapOnMobile] = React.useState(false);
  const [mapProjection, setMapProjection] = React.useState<'globe' | 'mercator'>('globe');
  const [error, setError] = React.useState<string | null>(null);
  const categoriesRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);
  const hasInitializedMatchMode = React.useRef(false);

  const { data: currentUser } = useQuery({
    queryKey: ['browse-current-user'],
    queryFn: () => apiClient.getCurrentUser().catch(() => null),
  });

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

  const { data: rawMatches, error: matchesError } = useQuery({
    queryKey: ['matches', 'me'],
    queryFn: apiClient.getMyMatches,
    enabled: Boolean(currentUser),
  });

  const matches = React.useMemo<PersonalizedMatches | null>(() => {
    if (!rawMatches) {
      return null;
    }
    return toPersonalizedMatches(rawMatches);
  }, [rawMatches]);

  React.useEffect(() => {
    if (!matches || hasInitializedMatchMode.current) {
      return;
    }

    hasInitializedMatchMode.current = true;
    setBrowseMode(matches.autoMode);

    if (matches.requestMatches.length > 0) {
      setMatchScope('requests');
      setSelectedRequestGroupId(matches.requestMatches[0].sourceRequest.id);
    } else if (matches.listingMatches.length > 0) {
      setMatchScope('listings');
      setSelectedListingGroupId(matches.listingMatches[0].sourceListing.id);
    }
  }, [matches]);

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
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
      checkScroll();
    };

    handleResize();
    const timer = setTimeout(handleResize, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll, categories]);

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

  const claimMutation = useMutation({
    mutationFn: (id: string) => apiClient.claimListing(id),
    onMutate: async (id) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      const previousListings = queryClient.getQueryData<ApiListing[]>(['listings']);
      const previousSelectedItem = selectedItem;

      queryClient.setQueryData<ApiListing[]>(['listings'], (old) =>
        old ? old.map((listing) => (listing.id === id ? { ...listing, status: 'claimed' } : listing)) : [],
      );

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: 'claimed' });
      }

      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Listing claimed.' }));
      return { previousListings, previousSelectedItem };
    },
    onError: (mutationError, _id, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(['listings'], context.previousListings);
      }
      if (context?.previousSelectedItem !== undefined) {
        setSelectedItem(context.previousSelectedItem);
      }
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to claim this listing.');
    },
    onSuccess: () => {
      setSelectedItem(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['matches', 'me'] });
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
        old ? old.map((request) => (request.id === id ? { ...request, status: 'fulfilled' } : request)) : [],
      );

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: 'completed' });
      }

      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Request fulfilled.' }));
      return { previousRequests, previousSelectedItem };
    },
    onError: (mutationError, _id, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(['requests'], context.previousRequests);
      }
      if (context?.previousSelectedItem !== undefined) {
        setSelectedItem(context.previousSelectedItem);
      }
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to fulfill this request.');
    },
    onSuccess: () => {
      setSelectedItem(null);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['matches', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  const fetchError = listingsError || requestsError || matchesError;
  const displayError =
    error ||
    (fetchError instanceof Error
      ? fetchError.message
      : fetchError
        ? 'Unable to load the marketplace map.'
        : null);

  const filteredListings = listings.filter((listing) => {
    const matchesText =
      matchesSearch(listing.title, searchQuery) ||
      matchesSearch(listing.description, searchQuery) ||
      matchesSearch(listing.city, searchQuery);
    const matchesCategory = selectedCategory ? listing.category === selectedCategory : true;
    return matchesText && matchesCategory && listing.status === 'open';
  });

  const filteredRequests = requests.filter((request) => {
    const matchesText =
      matchesSearch(request.title, searchQuery) ||
      matchesSearch(request.description, searchQuery) ||
      matchesSearch(request.city, searchQuery);
    const matchesCategory = selectedCategory ? request.category === selectedCategory : true;
    return matchesText && matchesCategory && request.status === 'open';
  });

  const requestMatchGroups = React.useMemo<RequestMatchGroup[]>(() => {
    if (!matches) {
      return [];
    }
    return matches.requestMatches.filter((group) => {
      const matchesCategory = selectedCategory ? group.sourceRequest.category === selectedCategory : true;
      const matchesText =
        matchesSearch(group.sourceRequest.title, searchQuery) ||
        matchesSearch(group.sourceRequest.description, searchQuery) ||
        group.matches.some(
          (match) =>
            matchesSearch(match.listing.title, searchQuery) ||
            matchesSearch(match.listing.description, searchQuery) ||
            matchesSearch(match.listing.city, searchQuery),
        );
      return matchesCategory && matchesText;
    });
  }, [matches, searchQuery, selectedCategory]);

  const listingMatchGroups = React.useMemo<ListingMatchGroup[]>(() => {
    if (!matches) {
      return [];
    }
    return matches.listingMatches.filter((group) => {
      const matchesCategory = selectedCategory ? group.sourceListing.category === selectedCategory : true;
      const matchesText =
        matchesSearch(group.sourceListing.title, searchQuery) ||
        matchesSearch(group.sourceListing.description, searchQuery) ||
        group.matches.some(
          (match) =>
            matchesSearch(match.request.title, searchQuery) ||
            matchesSearch(match.request.description, searchQuery) ||
            matchesSearch(match.request.city, searchQuery),
        );
      return matchesCategory && matchesText;
    });
  }, [matches, searchQuery, selectedCategory]);

  React.useEffect(() => {
    if (matchScope === 'requests' && requestMatchGroups.length > 0 && !requestMatchGroups.some((group) => group.sourceRequest.id === selectedRequestGroupId)) {
      setSelectedRequestGroupId(requestMatchGroups[0].sourceRequest.id);
    }
    if (matchScope === 'listings' && listingMatchGroups.length > 0 && !listingMatchGroups.some((group) => group.sourceListing.id === selectedListingGroupId)) {
      setSelectedListingGroupId(listingMatchGroups[0].sourceListing.id);
    }
  }, [listingMatchGroups, matchScope, requestMatchGroups, selectedListingGroupId, selectedRequestGroupId]);

  const selectedRequestGroup =
    requestMatchGroups.find((group) => group.sourceRequest.id === selectedRequestGroupId) ?? requestMatchGroups[0] ?? null;
  const selectedListingGroup =
    listingMatchGroups.find((group) => group.sourceListing.id === selectedListingGroupId) ?? listingMatchGroups[0] ?? null;

  const marketplaceListings = activeTab === 'listings' ? filteredListings : listings;
  const marketplaceRequests = activeTab === 'requests' ? filteredRequests : requests;

  const matchModeListings =
    matchScope === 'requests'
      ? selectedRequestGroup?.matches.map((match) => match.listing) ?? []
      : selectedListingGroup
        ? [selectedListingGroup.sourceListing]
        : [];
  const matchModeRequests =
    matchScope === 'requests'
      ? selectedRequestGroup
        ? [selectedRequestGroup.sourceRequest]
        : []
      : selectedListingGroup?.matches.map((match) => match.request) ?? [];

  const mapListings = browseMode === 'matches' ? matchModeListings : filteredListings;
  const mapRequests = browseMode === 'matches' ? matchModeRequests : filteredRequests;

  const handleClaim = (id: string) => {
    claimMutation.mutate(id);
  };

  const handleFulfill = (id: string) => {
    fulfillMutation.mutate(id);
  };

  const renderHeaderFilters = () => {
    const activeView = showMapOnMobile ? (mapProjection === 'globe' ? 'globe' : 'flat') : 'list';
    const canShowMatches = Boolean(currentUser && matches && (matches.requestMatches.length > 0 || matches.listingMatches.length > 0));

    return (
      <div className="space-y-4 border-b border-white/6 bg-[#0E0E0E] p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#A3A3A3]">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={browseMode === 'matches' ? 'Search your matches...' : 'Search local items...'}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-lg border border-white/10 bg-[#141414] pl-10 pr-4 text-sm text-[#FFFFFF] placeholder-[#525252] focus:border-[#A8D97F] focus:outline-none"
            />
          </div>

          <div className="flex h-10 shrink-0 items-center gap-0.5 rounded-lg border border-white/6 bg-[#141414] p-0.5">
            {!isLargeScreen && (
              <button
                onClick={() => setShowMapOnMobile(false)}
                className={`flex h-8 items-center justify-center rounded-md px-2.5 cursor-pointer ${activeView === 'list' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
              >
                <ListIcon size={14} />
              </button>
            )}
            <button
              onClick={() => {
                setMapProjection('mercator');
                if (!isLargeScreen) setShowMapOnMobile(true);
              }}
              className={`flex h-8 items-center justify-center rounded-md px-2.5 cursor-pointer ${activeView === 'flat' || (isLargeScreen && mapProjection === 'mercator') ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
            >
              <MapIcon size={14} />
            </button>
            <button
              onClick={() => {
                setMapProjection('globe');
                if (!isLargeScreen) setShowMapOnMobile(true);
              }}
              className={`flex h-8 items-center justify-center rounded-md px-2.5 cursor-pointer ${activeView === 'globe' || (isLargeScreen && mapProjection === 'globe') ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
            >
              <GlobeIcon size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex rounded-md border border-white/6 bg-[#141414] p-0.5">
            <button
              onClick={() => setBrowseMode('marketplace')}
              className={`flex-1 rounded-sm py-1.5 text-xs font-bold cursor-pointer ${browseMode === 'marketplace' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
            >
              Marketplace
            </button>
            <button
              onClick={() => canShowMatches && setBrowseMode('matches')}
              disabled={!canShowMatches}
              className={`flex-1 rounded-sm py-1.5 text-xs font-bold transition ${browseMode === 'matches' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'} ${canShowMatches ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              Matches
            </button>
          </div>

          {browseMode === 'marketplace' ? (
            <div className="flex rounded-md border border-white/6 bg-[#141414] p-0.5">
              <button
                onClick={() => setActiveTab('listings')}
                className={`flex-1 rounded-sm py-1.5 text-xs font-bold cursor-pointer ${activeTab === 'listings' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
              >
                Food Waste
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 rounded-sm py-1.5 text-xs font-bold cursor-pointer ${activeTab === 'requests' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'}`}
              >
                Appeals
              </button>
            </div>
          ) : (
            <div className="flex rounded-md border border-white/6 bg-[#141414] p-0.5">
              <button
                onClick={() => setMatchScope('requests')}
                disabled={requestMatchGroups.length === 0}
                className={`flex-1 rounded-sm py-1.5 text-xs font-bold transition ${matchScope === 'requests' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'} ${requestMatchGroups.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                For My Requests
              </button>
              <button
                onClick={() => setMatchScope('listings')}
                disabled={listingMatchGroups.length === 0}
                className={`flex-1 rounded-sm py-1.5 text-xs font-bold transition ${matchScope === 'listings' ? 'bg-[#2A4A10] text-[#A8D97F]' : 'text-[#A3A3A3]'} ${listingMatchGroups.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                For My Listings
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className={`pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex w-12 items-center pl-1 bg-gradient-to-r from-[#0E0E0E] to-transparent ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => scrollCategories('left')}
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3] cursor-pointer"
              aria-label="Previous Categories"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          <div ref={categoriesRef} onScroll={checkScroll} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${selectedCategory === null ? 'border-[#A8D97F] bg-[rgba(168,217,127,0.1)] text-[#A8D97F]' : 'border-white/8 bg-[#141414] text-[#A3A3A3]'}`}
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
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3] cursor-pointer"
              aria-label="Next Categories"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMatchGroups = () => {
    if (matchScope === 'requests') {
      if (requestMatchGroups.length === 0) {
        return (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#121212] p-4 text-sm leading-6 text-[#A3A3A3]">
            No match groups are available for this side yet. Keep your request open and the marketplace will switch here automatically when a compatible listing appears.
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            {requestMatchGroups.map((group) => {
              const isSelected = selectedRequestGroup?.sourceRequest.id === group.sourceRequest.id;
              return (
                <button
                  key={group.sourceRequest.id}
                  onClick={() => {
                    setSelectedItem(null);
                    setSelectedRequestGroupId(group.sourceRequest.id);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${isSelected ? 'border-[#A8D97F]/30 bg-[#17210F]' : 'border-white/6 bg-[#141414] hover:bg-[#181818]'} cursor-pointer`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-white">{group.sourceRequest.title}</div>
                      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#A3A3A3]">
                        Request source • {group.sourceRequest.city}
                      </div>
                    </div>
                    <div className="rounded-full border border-[#4ECDC4]/20 bg-[#0E3E3B]/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#4ECDC4]">
                      {group.totalMatches} match{group.totalMatches === 1 ? '' : 'es'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedRequestGroup && (
            <div className="rounded-2xl border border-white/6 bg-[#101010] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-[#A8D97F]" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8D97F]">
                  Matched listings
                </span>
              </div>

              <div className="space-y-4">
                {selectedRequestGroup.matches.map((match) => (
                  <div key={match.listing.id} className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {match.reasons.map((reason) => (
                        <span
                          key={`${match.listing.id}-${reason.code}`}
                          className="rounded-full border border-white/8 bg-[#171717] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#A3A3A3]"
                        >
                          {reason.label}
                        </span>
                      ))}
                      {match.distanceKm !== null && (
                        <span className="rounded-full border border-[#4ECDC4]/20 bg-[#0E3E3B]/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#4ECDC4]">
                          {match.distanceKm} km away
                        </span>
                      )}
                    </div>
                    <ListingCard
                      listing={match.listing}
                      onClaim={handleClaim}
                      onClick={() => setSelectedItem(match.listing)}
                      hideImage={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (listingMatchGroups.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#121212] p-4 text-sm leading-6 text-[#A3A3A3]">
          No match groups are available for this side yet. Keep your listing open and the marketplace will switch here automatically when a compatible request appears.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {listingMatchGroups.map((group) => {
            const isSelected = selectedListingGroup?.sourceListing.id === group.sourceListing.id;
            return (
              <button
                key={group.sourceListing.id}
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedListingGroupId(group.sourceListing.id);
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${isSelected ? 'border-[#A8D97F]/30 bg-[#17210F]' : 'border-white/6 bg-[#141414] hover:bg-[#181818]'} cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-white">{group.sourceListing.title}</div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#A3A3A3]">
                      Listing source • {group.sourceListing.city}
                    </div>
                  </div>
                  <div className="rounded-full border border-[#4ECDC4]/20 bg-[#0E3E3B]/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#4ECDC4]">
                    {group.totalMatches} match{group.totalMatches === 1 ? '' : 'es'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedListingGroup && (
          <div className="rounded-2xl border border-white/6 bg-[#101010] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-[#A8D97F]" />
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#A8D97F]">
                Matched requests
              </span>
            </div>

            <div className="space-y-4">
              {selectedListingGroup.matches.map((match) => (
                <div key={match.request.id} className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {match.reasons.map((reason) => (
                      <span
                        key={`${match.request.id}-${reason.code}`}
                        className="rounded-full border border-white/8 bg-[#171717] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#A3A3A3]"
                      >
                        {reason.label}
                      </span>
                    ))}
                    {match.distanceKm !== null && (
                      <span className="rounded-full border border-[#4ECDC4]/20 bg-[#0E3E3B]/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#4ECDC4]">
                        {match.distanceKm} km away
                      </span>
                    )}
                  </div>
                  <RequestCard
                    request={match.request}
                    onFulfill={handleFulfill}
                    onClick={() => setSelectedItem(match.request)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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

            {browseMode === 'marketplace' ? (
              activeTab === 'listings' ? (
                marketplaceListings.length > 0 ? (
                  marketplaceListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onClaim={handleClaim}
                      onClick={() => setSelectedItem(listing)}
                      hideImage={true}
                    />
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-[#525252]">No matching listings on the map.</div>
                )
              ) : marketplaceRequests.length > 0 ? (
                marketplaceRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onFulfill={request.requesterId === currentUser?.id ? undefined : handleFulfill}
                    onClick={() => setSelectedItem(request)}
                  />
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#525252]">No matching appeals on the map.</div>
              )
            ) : (
              renderMatchGroups()
            )}
          </div>
        </section>

        <section className="h-full w-full flex-1 bg-[#050505]">
          {(isLargeScreen || showMapOnMobile) && (
            <Globe
              focusedItemId={selectedItem?.id}
              projection={mapProjection}
              listings={mapListings}
              requests={mapRequests}
              onClaim={handleClaim}
              onFulfill={handleFulfill}
              onPinSelect={(pin) => {
                if (!pin) {
                  setSelectedItem(null);
                  return;
                }

                const item =
                  mapListings.find((listing) => listing.id === pin.id) ??
                  mapRequests.find((request) => request.id === pin.id) ??
                  null;
                setSelectedItem(item);
              }}
            />
          )}

          {showMapOnMobile && (
            <button
              onClick={() => setShowMapOnMobile(false)}
              className="absolute bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#A8D97F]/30 bg-[#0E0E0E]/90 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#A8D97F] backdrop-blur-md md:hidden cursor-pointer"
            >
              <ListIcon size={14} strokeWidth={2.5} />
              <span>Back to List</span>
            </button>
          )}

          {browseMode === 'matches' && (
            <div className="absolute left-4 top-4 z-30 hidden rounded-2xl border border-[#4ECDC4]/20 bg-[#0E0E0E]/92 px-4 py-3 text-xs font-bold text-[#D6D6D6] shadow-xl backdrop-blur-md md:block">
              <div className="flex items-center gap-2 text-[#4ECDC4]">
                <Compass size={14} />
                <span className="uppercase tracking-[0.18em]">Match mode</span>
              </div>
              <p className="mt-2 max-w-xs leading-5 text-[#A3A3A3]">
                The map is filtered to the active match group so you can inspect only the loops that already fit each other.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
