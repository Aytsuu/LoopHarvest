'use client';

import * as React from 'react';
import { Search, List as ListIcon, Map as MapIcon, Globe as GlobeIcon, ChevronLeft, ChevronRight, Apple, HeartHandshake } from 'lucide-react';
import { mockStore, Listing, RequestItem } from '@/lib/mockStore';
import { CATEGORIES, CategorySlug } from '@/lib/categories';
import CategoryChip from '@/components/common/CategoryChip';
import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';
import Globe from '@/components/Globe';

export default function BrowseMapPage() {
  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests'>('listings');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<CategorySlug | null>(null);
  const [listings, setListings] = React.useState<Listing[]>(() => mockStore.getListings());
  const [requests, setRequests] = React.useState<RequestItem[]>(() => mockStore.getRequests());
  const [selectedItem, setSelectedUserItem] = React.useState<Listing | RequestItem | null>(null);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const [showMapOnMobile, setShowMapOnMobile] = React.useState(false);
  const [mapProjection, setMapProjection] = React.useState<'globe' | 'mercator'>('globe');

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

  const scroll = React.useCallback((direction: 'left' | 'right') => {
    const el = categoriesRef.current;
    if (!el) return;
    const scrollAmount = 200;
    const target = el.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    el.scrollTo({
      left: target,
      behavior: 'smooth',
    });
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768); // md breakpoint is 768px
      checkScroll();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScroll]);

  // Load store data
  const refreshData = React.useCallback(() => {
    setListings(mockStore.getListings());
    setRequests(mockStore.getRequests());
  }, []);

  // Filter lists based on inputs
  const filteredListings = listings.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? l.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? r.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Select item to fly to its position on the Globe
  const flyToItem = (id: string, isListing: boolean) => {
    const itemsList = isListing ? listings : requests;
    const item = itemsList.find(i => i.id === id);
    if (item) {
      setSelectedUserItem(item);
      setShowMapOnMobile(true);
    }
  };

  const handleClaim = (id: string) => {
    const success = mockStore.claimListing(id);
    if (success) {
      const event = new CustomEvent('post-created', {
        detail: 'Listing claimed!'
      });
      window.dispatchEvent(event);
      refreshData();
      setSelectedUserItem(null);
    }
  };

  const handleFulfill = (id: string) => {
    const success = mockStore.fulfillRequest(id);
    if (success) {
      const event = new CustomEvent('post-created', {
        detail: 'Offering to fulfill request!'
      });
      window.dispatchEvent(event);
      refreshData();
      setSelectedUserItem(null);
    }
  };

  const renderHeaderFilters = () => {
    const activeView = showMapOnMobile
      ? (mapProjection === 'globe' ? 'globe' : 'flat')
      : 'list';

    return (
      <div className="p-4 space-y-4 bg-[#0E0E0E] border-b border-white/6">
        
        {/* Search Input */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#A8AA98]">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search local items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-[#141414] text-sm text-[#E8EAD8] placeholder-[#5A5C50] focus:border-[#A8D97F] focus:outline-none"
            />
          </div>

          {/* Beautiful Segmented Selection Control with High-Fidelity Vector Icons */}
          <div className="flex rounded-lg bg-[#141414] p-0.5 border border-white/6 shrink-0 h-10 items-center gap-0.5">
            
            {/* List View Option (Mobile Only) */}
            {!isLargeScreen && (
              <button
                onClick={() => {
                  setShowMapOnMobile(false);
                }}
                title="List View"
                aria-label="List View"
                className={`flex h-8 px-2.5 items-center justify-center rounded-md transition-all duration-200 gap-1.5 group ${
                  activeView === 'list'
                    ? 'bg-[#2A4A10] text-[#A8D97F] border border-[#A8D97F]/20 shadow-[0_0_12px_rgba(168,217,127,0.15)]'
                    : 'text-[#A8AA98] hover:text-[#E8EAD8] hover:bg-white/5 border border-transparent'
                }`}
              >
                <ListIcon size={14} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline-block">List</span>
              </button>
            )}

            {/* Flat Map Option */}
            <button
              onClick={() => {
                setMapProjection('mercator');
                if (!isLargeScreen) {
                  setShowMapOnMobile(true);
                }
              }}
              title="Flat Map View"
              aria-label="Flat Map View"
              className={`flex h-8 px-2.5 items-center justify-center rounded-md transition-all duration-200 gap-1.5 group ${
                activeView === 'flat' || (isLargeScreen && mapProjection === 'mercator')
                  ? 'bg-[#2A4A10] text-[#A8D97F] border border-[#A8D97F]/20 shadow-[0_0_12px_rgba(168,217,127,0.15)]'
                  : 'text-[#A8AA98] hover:text-[#E8EAD8] hover:bg-white/5 border border-transparent'
              }`}
            >
              <MapIcon size={14} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline-block">Flat</span>
            </button>

            {/* 3D Globe Option */}
            <button
              onClick={() => {
                setMapProjection('globe');
                if (!isLargeScreen) {
                  setShowMapOnMobile(true);
                }
              }}
              title="3D Globe View"
              aria-label="3D Globe View"
              className={`flex h-8 px-2.5 items-center justify-center rounded-md transition-all duration-200 gap-1.5 group ${
                activeView === 'globe' || (isLargeScreen && mapProjection === 'globe')
                  ? 'bg-[#2A4A10] text-[#A8D97F] border border-[#A8D97F]/20 shadow-[0_0_12px_rgba(168,217,127,0.15)]'
                  : 'text-[#A8AA98] hover:text-[#E8EAD8] hover:bg-white/5 border border-transparent'
              }`}
            >
              <GlobeIcon size={14} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline-block">Globe</span>
            </button>
          </div>
        </div>

        {/* Selector tabs */}
        <div className="flex rounded-md bg-[#141414] p-0.5 border border-white/6">
          <button
            onClick={() => { setActiveTab('listings'); setSelectedUserItem(null); }}
            className={`flex-1 rounded py-1.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'listings'
                ? 'bg-[#2A4A10] text-[#A8D97F] border rounded-sm border-white/6 shadow-[0_0_12px_rgba(168,217,127,0.15)]'
                : 'text-[#A8AA98] hover:text-[#E8EAD8] border border-transparent'
            }`}
          >
            <Apple size={14} className="shrink-0" />
            <span>Food Waste</span>
          </button>
          <button
            onClick={() => { setActiveTab('requests'); setSelectedUserItem(null); }}
            className={`flex-1 rounded py-1.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-[#2A4A10] text-[#A8D97F] border rounded-sm border-white/6 shadow-[0_0_12px_rgba(168,217,127,0.15)]'
                : 'text-[#A8AA98] hover:text-[#E8EAD8] border border-transparent'
            }`}
          >
            <HeartHandshake size={14} className="shrink-0" />
            <span>Appeals</span>
          </button>
        </div>

        {/* Horizontal Categories with Scroll Chevrons and Fade Masks */}
        <div className="relative group/categories">
          {/* Left Fading Edge & Chevron */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0E0E0E] to-transparent z-10 flex items-center pl-1 transition-opacity duration-300 pointer-events-none ${
              showLeftArrow ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={() => scroll('left')}
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
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          >
            <button
              onClick={() => setSelectedCategory(null)}
              style={
                selectedCategory === null
                  ? {
                      borderColor: '#A8D97F',
                      backgroundColor: 'rgba(168, 217, 127, 0.1)',
                      color: '#A8D97F',
                      boxShadow: '0 0 10px rgba(168, 217, 127, 0.15)'
                    }
                  : {
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      backgroundColor: '#141414',
                      color: '#A8AA98'
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
            className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0E0E0E] to-transparent z-10 flex items-center justify-end pr-1 transition-opacity duration-300 pointer-events-none ${
              showRightArrow ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={() => scroll('right')}
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A8AA98] hover:text-[#E8EAD8] hover:bg-[#2A4A10]/95 hover:border-[#A8D97F]/40 shadow-md backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#A8D97F]"
              aria-label="Next Categories"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex h-screen flex-col bg-[#0A0A0A] text-[#E8EAD8] overflow-hidden">
      {/* Mobile-only header (static, high z-index overlay, does not translate/slide) */}
      {!isLargeScreen && (
        <div className="flex-shrink-0 z-20">
          {renderHeaderFilters()}
        </div>
      )}

      {/* Main Grid: Split map/list on desktop, stacked sliding panel on mobile */}
      <div className="relative flex flex-1 overflow-hidden">
        
        {/* SIDEBAR: Search & Filters list */}
        <section className={`absolute inset-y-0 left-0 z-10 flex w-full flex-col border-r border-white/6 bg-[#0A0A0A] md:relative md:w-95 lg:w-110 shrink-0 transform transition-transform md:translate-x-0 ${
          showMapOnMobile ? '-translate-x-full' : 'translate-x-0'
        }`}>
          
          {/* Desktop-only header inside sidebar */}
          {isLargeScreen && renderHeaderFilters()}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none pb-24 md:pb-6 bg-[#0A0A0A]">
            {activeTab === 'listings' ? (
              filteredListings.length > 0 ? (
                filteredListings.map((listing, index) => (
                  <div 
                    key={listing.id} 
                    onClick={() => flyToItem(listing.id, true)}
                    className="cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
                  >
                    <ListingCard listing={listing} onClaim={handleClaim} />
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#5A5C50] animate-fade-in">
                  No matching listings on the globe.
                </div>
              )
            ) : (
              filteredRequests.length > 0 ? (
                filteredRequests.map((request, index) => (
                  <div 
                    key={request.id} 
                    onClick={() => flyToItem(request.id, false)}
                    className="cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
                  >
                    <RequestCard request={request} onFulfill={handleFulfill} />
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-[#5A5C50] animate-fade-in">
                  No matching appeals on the globe.
                </div>
              )
            )}
          </div>
        </section>

        {/* MAP PANEL: Interactive 3D Globe with dynamic flight and modal control */}
        <section className="flex-1 h-full w-full bg-[#050505]">
          {(isLargeScreen || showMapOnMobile) && (
            <Globe
              focusedItemId={selectedItem?.id}
              projection={mapProjection}
              onPinSelect={(pin) => {
                if (pin) {
                  const item = listings.find(l => l.id === pin.id) || requests.find(r => r.id === pin.id);
                  if (item) {
                    setSelectedUserItem(item);
                  }
                } else {
                  setSelectedUserItem(null);
                }
              }}
            />
          )}
          {showMapOnMobile && (
            <button
              onClick={() => setShowMapOnMobile(false)}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex md:hidden items-center gap-2 rounded-full border border-[#A8D97F]/30 bg-[#0E0E0E]/90 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#A8D97F] shadow-2xl backdrop-blur-md transition hover:bg-[#0E0E0E] active:scale-95 animate-fade-in"
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
