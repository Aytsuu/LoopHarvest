'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Scale, Clock, MessageSquare, ShieldAlert, Award } from 'lucide-react';
import Map, { Marker } from 'react-map-gl/mapbox';
import { mockStore, RequestItem } from '@/lib/mockStore';
import { catMap } from '@/lib/categories';
import CategoryChip from '@/components/common/CategoryChip';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [request, setRequest] = React.useState<RequestItem | undefined>(() => {
    return id ? mockStore.getRequest(id) : undefined;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fl_sidebar_collapsed');
        return stored === 'true';
      } catch (e) {
        console.warn("Storage access failed:", e);
      }
    }
    return false;
  });

  React.useEffect(() => {
    const handleCollapsedChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsSidebarCollapsed(customEvent.detail);
    };

    window.addEventListener('sidebar-collapsed-change', handleCollapsedChange);
    return () => {
      window.removeEventListener('sidebar-collapsed-change', handleCollapsedChange);
    };
  }, []);

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#E8EAD8]">
        <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#E8EAD8] hover:bg-white/8 transition"
          >
            Back
          </button>
          <span className="font-display text-lg font-bold tracking-tight">Request Detail</span>
          <span className="w-[52px]" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-4">🔍</span>
          <h3 className="font-display text-lg font-bold">Request not found</h3>
          <p className="text-xs text-[#A8AA98] mt-1">
            This appeal may have been completed, filled, or removed.
          </p>
          <button 
            onClick={() => router.push('/home')}
            className="mt-6 rounded-lg bg-[#2A4A10] px-4 py-2 text-xs font-bold text-[#A8D97F]"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const cat = catMap[request.category];
  const color = cat ? cat.color : '#4ECDC4';
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const handleFulfill = () => {
    const success = mockStore.fulfillRequest(request.id);
    if (success) {
      const event = new CustomEvent('post-created', {
        detail: `Successfully offered to fulfill ${request.requesterName}'s appeal!`
      });
      window.dispatchEvent(event);
      setRequest(mockStore.getRequest(request.id));
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#E8EAD8]">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#E8EAD8] hover:bg-white/8 transition"
        >
          Back
        </button>
        <span className="font-display text-lg font-bold tracking-tight">Appeal Details</span>
        <span className="w-[52px]" />
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6 pb-32">
        
        {/* Color Block Header matching category */}
        <div 
          style={{ borderColor: `${color}3F`, backgroundColor: `${color}0C` }}
          className="relative h-44 w-full overflow-hidden rounded-2xl border bg-[#141414] p-6 flex flex-col justify-between shadow-xl"
        >
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none select-none text-[15rem]">
            {cat?.emoji || '🙏'}
          </div>

          <div className="flex items-center justify-between">
            <CategoryChip categorySlug={request.category} interactive={false} />
            <div className="rounded-xl bg-[#4A3200] border border-[#E8A838]/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#FFDF9E]">
              {request.frequency}
            </div>
          </div>
          
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-black uppercase text-[#A8AA98]">Urgent Material Request</span>
            <h1 className="font-display text-xl md:text-2xl font-extrabold tracking-tight leading-snug">
              {request.title}
            </h1>
          </div>
        </div>

        {/* Info detail row */}
        <div className="flex items-center gap-2 text-xs text-[#A8AA98] px-1">
          <Clock size={14} />
          <span>Active Appeal posted {request.timeAgo}</span>
        </div>

        {/* 2x2 Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#141414] p-4 rounded-xl border border-white/6 flex flex-col justify-between">
            <Scale size={18} className="text-[#4ECDC4] mb-2" />
            <div>
              <span className="text-[10px] font-bold text-[#A8AA98] block uppercase tracking-wider">Requested Range</span>
              <span className="font-mono text-base font-black text-[#E8EAD8]">{request.minQuantity}-{request.maxQuantity} {request.unit}</span>
            </div>
          </div>

          <div className="bg-[#141414] p-4 rounded-xl border border-white/6 flex flex-col justify-between">
            <MapPin size={18} className="text-[#E8A838] mb-2" />
            <div>
              <span className="text-[10px] font-bold text-[#A8AA98] block uppercase tracking-wider">Distance</span>
              <span className="font-mono text-base font-black text-[#E8EAD8]">{request.distance} km away</span>
            </div>
          </div>

          <div className="bg-[#141414] p-4 rounded-xl border border-white/6 flex flex-col justify-between">
            <Calendar size={18} className="text-[#A8D97F] mb-2" />
            <div>
              <span className="text-[10px] font-bold text-[#A8AA98] block uppercase tracking-wider">Cadence</span>
              <span className="font-mono text-base font-black text-[#E8EAD8] capitalize">{request.frequency} Post</span>
            </div>
          </div>

          <div className="bg-[#141414] p-4 rounded-xl border border-white/6 flex flex-col justify-between">
            <Award size={18} className="text-[#7EF8EF] mb-2" />
            <div>
              <span className="text-[10px] font-bold text-[#A8AA98] block uppercase tracking-wider">Rewards</span>
              <span className="font-mono text-base font-black text-[#7EF8EF]">+30 XP</span>
            </div>
          </div>
        </div>

        {/* Main Columns: Details vs Maps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Details & Requester Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#A8AA98]">Description of Need</h3>
              <p className="text-sm text-[#E8EAD8] leading-relaxed bg-[#141414] p-5 rounded-xl border border-white/6">
                {request.description}
              </p>
            </div>

            {/* Requester Metadata */}
            <div className="bg-[#141414] p-4 rounded-xl border border-white/6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.requesterAvatar}
                  alt={request.requesterName}
                  className="h-11 w-11 rounded-full border border-white/10"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#E8EAD8]">{request.requesterName}</h4>
                  <span className="inline-flex items-center gap-1 rounded bg-[#004D48] px-1.5 py-0.5 text-[9px] font-bold text-[#4ECDC4]">
                    ✓ Verified Recipient
                  </span>
                </div>
              </div>
              <button 
                onClick={() => alert(`Messaging is disabled in initial mock mode! Contact: ${request.requesterName}`)}
                className="rounded-lg border border-white/10 bg-white/4 p-2.5 text-[#E8EAD8] hover:bg-white/8 transition"
              >
                <MessageSquare size={18} />
              </button>
            </div>

            {/* Regulatory compliance help card */}
            <div className="rounded-xl border border-white/6 bg-[#222222]/50 p-4 flex gap-3 text-xs text-[#A8AA98] leading-relaxed">
              <ShieldAlert size={18} className="text-[#E8A838] shrink-0" />
              <div>
                <span className="font-bold text-[#E8EAD8] block mb-0.5">Fulfillment Guidelines</span>
                Ensure organic matter meets the donor&apos;s standard. Separate non-organic packaging or metals prior to transport, keeping all resource lots food-safe.
              </div>
            </div>

          </div>

          {/* Location Area & Map */}
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#A8AA98]">Location</h3>
            <div className="h-56 rounded-xl overflow-hidden border border-white/6 bg-[#141414] relative">
              {token ? (
                <Map
                  initialViewState={{
                    longitude: -122.4194 + (request.distance * 0.003),
                    latitude: 37.7749 + (request.distance * 0.002),
                    zoom: 14
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                  mapboxAccessToken={token}
                  interactive={false}
                >
                  <Marker 
                    latitude={37.7749 + (request.distance * 0.002)} 
                    longitude={-122.4194 + (request.distance * 0.003)}
                  >
                    <div className="h-6 w-6 rounded-full border-2 border-[#4ECDC4] bg-[#141414] flex items-center justify-center text-xs shadow-lg animate-bounce">
                      🐓
                    </div>
                  </Marker>
                </Map>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-xs text-[#5A5C50] p-4">
                  Map hidden (No Token)
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#A8AA98] px-1">
              <MapPin size={13} className="text-[#4ECDC4]" />
              <span>SF Bay Area, CA</span>
            </div>
          </div>

        </div>

      </div>

      {/* Sticky Action Footer */}
      <footer className={`fixed bottom-0 right-0 z-40 bg-[#141414] border-t border-white/6 px-6 py-4 flex items-center justify-between pb-safe transition-all duration-300 ease-in-out left-0 ${
        isSidebarCollapsed ? 'md:left-20' : 'md:left-64'
      }`}>
        <div className="hidden sm:block">
          <span className="text-[10px] font-black uppercase text-[#A8AA98]">Target Handoff weight</span>
          <div className="font-mono text-base font-black text-[#E8EAD8]">{request.minQuantity} {request.unit} minimum</div>
        </div>

        {request.status === 'open' ? (
          <button
            onClick={handleFulfill}
            className="w-full sm:w-auto sm:px-12 h-12 rounded-xl bg-[#4ECDC4] text-sm font-black text-[#003733] transition hover:brightness-105 active:scale-98 shadow-lg flex items-center justify-center gap-2"
          >
            <span>Fulfill this Appeal</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full sm:w-auto sm:px-12 h-12 rounded-xl bg-[#004D48] text-sm font-black text-[#4ECDC4] opacity-70 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <span>Appeal Already Filled ({request.status})</span>
          </button>
        )}
      </footer>
    </main>
  );
}
