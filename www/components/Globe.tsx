'use client';

import * as React from 'react';
import Map, { Marker, MapRef } from 'react-map-gl/mapbox';
import { Leaf, HelpCircle, X, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import mapboxgl from 'mapbox-gl';

import type { Listing, RequestItem } from '@/lib/api/types';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface GlobePin {
  id: string;
  name: string;
  avatar: string;
  type: 'listing' | 'request';
  latitude: number;
  longitude: number;
  title: string;
  category: string;
  quantityText: string;
  city: string;
  timeAgo: string;
  description: string;
  status: 'open' | 'claimed' | 'completed' | 'expired';
}

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'London': { lat: 51.5074, lng: -0.1276 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Paris': { lat: 48.8566, lng: 2.3522 }
};

// Deterministic offsetting to prevent pins stacking on the same city
export function getItemCoords(city: string, id: string, index: number) {
  const base = CITY_COORDS[city] || CITY_COORDS['San Francisco'];
  // Calculate deterministic offset based on the character codes in the ID
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = (hash % 8) * (Math.PI / 4); // 8 directions
  const radius = 0.05 + (index % 3) * 0.025; // Radial rings for visual dispersion on the globe
  return {
    latitude: base.lat + Math.sin(angle) * radius,
    longitude: base.lng + Math.cos(angle) * radius
  };
}

interface GlobeProps {
  accessToken?: string;
  focusedItemId?: string | null;
  onPinSelect?: (pin: GlobePin | null) => void;
  projection?: 'globe' | 'mercator';
  listings?: Listing[];
  requests?: RequestItem[];
  onClaim?: (id: string) => Promise<void> | void;
  onFulfill?: (id: string) => Promise<void> | void;
}

export default function Globe({
  accessToken,
  focusedItemId,
  onPinSelect,
  projection: controlledProjection,
  listings: providedListings,
  requests: providedRequests,
  onClaim,
  onFulfill,
}: GlobeProps) {
  const mapRef = React.useRef<MapRef>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const projection = controlledProjection || 'globe';
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [selectedPin, setSelectedPin] = React.useState<GlobePin | null>(null);
  const [webGlSupported, setWebGlSupported] = React.useState<boolean | null>(null);
  const token = accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  React.useEffect(() => {
    setTimeout(() => {
      setWebGlSupported(mapboxgl.supported());
    }, 0);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  const pins = React.useMemo(() => {
    if (typeof window === 'undefined') return [];
    // Reference refreshTrigger to trigger re-calculation on claim/fulfill
    if (refreshTrigger) {
      // no-op
    }
    const listings = providedListings ?? [];
    const requests = providedRequests ?? [];
    const pinsList: GlobePin[] = [];

    // Map active listings
    listings.forEach((l, idx) => {
      const coords = getItemCoords(l.city || 'San Francisco', l.id, idx);
      pinsList.push({
        id: l.id,
        name: l.donorName,
        avatar: l.donorAvatar,
        type: 'listing',
        latitude: coords.latitude,
        longitude: coords.longitude,
        title: l.title,
        category: l.category,
        quantityText: `${l.quantity} ${l.unit}`,
        city: l.city || 'San Francisco',
        timeAgo: l.timeAgo,
        description: l.description,
        status: l.status
      });
    });

    // Map active requests
    requests.forEach((r, idx) => {
      const coords = getItemCoords(r.city || 'San Francisco', r.id, idx + listings.length);
      pinsList.push({
        id: r.id,
        name: r.requesterName,
        avatar: r.requesterAvatar,
        type: 'request',
        latitude: coords.latitude,
        longitude: coords.longitude,
        title: r.title,
        category: r.category,
        quantityText: `${r.minQuantity}-${r.maxQuantity} ${r.unit}`,
        city: r.city || 'San Francisco',
        timeAgo: r.timeAgo,
        description: r.description,
        status: r.status
      });
    });

    return pinsList;
  }, [providedListings, providedRequests, refreshTrigger]);

  React.useEffect(() => {
    if (!focusedItemId) return;
    const foundPin = pins.find(p => p.id === focusedItemId);
    if (foundPin) {
      // Defer the state update to avoid synchronous state trigger inside render/layout phase
      const timer = setTimeout(() => {
        setSelectedPin(foundPin);
      }, 0);
      
      // Smoothly fly to coordinates on the 3D globe / flat map
      mapRef.current?.flyTo({
        center: [foundPin.longitude, foundPin.latitude],
        zoom: projection === 'globe' ? 4.5 : 12,
        duration: 1800,
        essential: true
      });

      return () => clearTimeout(timer);
    }
  }, [focusedItemId, pins, projection]);

  const handleAction = async () => {
    if (!selectedPin) return;

    try {
      if (selectedPin.type === 'listing') {
        if (onClaim) {
          await onClaim(selectedPin.id);
        } else {
          await apiClient.claimListing(selectedPin.id);
          const event = new CustomEvent('post-created', {
            detail: `Successfully claimed ${selectedPin.quantityText} of "${selectedPin.title}"!`
          });
          window.dispatchEvent(event);
        }
        setRefreshTrigger(prev => prev + 1);
        setSelectedPin(prev => prev ? { ...prev, status: 'claimed' } : null);
      } else {
        if (onFulfill) {
          await onFulfill(selectedPin.id);
        } else {
          await apiClient.fulfillRequest(selectedPin.id);
          const event = new CustomEvent('post-created', {
            detail: `Offered to fulfill request for "${selectedPin.title}"!`
          });
          window.dispatchEvent(event);
        }
        setRefreshTrigger(prev => prev + 1);
        setSelectedPin(prev => prev ? { ...prev, status: 'claimed' } : null);
      }
    } catch (err) {
      console.error('Error executing map pin action:', err);
    }
  };

  const applyCustomColors = React.useCallback((map: mapboxgl.Map | undefined) => {
    if (!map) return;
    try {
      if (map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', '#12160a');
      }
      if (map.getLayer('water')) {
        map.setPaintProperty('water', 'fill-color', '#071a1e');
      }
      if (map.getLayer('landuse')) {
        map.setPaintProperty('landuse', 'fill-color', '#172210');
      }
    } catch {
      // Quiet fail if layers are not fully initialized yet
    }
  }, []);

  if (webGlSupported === false) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/10 bg-[#0E0E0E] p-6 text-center text-[#A3A3A3] shadow-inner">
        <div>
          <p className="font-extrabold text-base text-[#FFFFFF]">Interactive Map Unavailable</p>
          <p className="text-xs mt-1 max-w-xs leading-relaxed text-[#525252]">
            WebGL is not supported or is disabled in your browser. You can still use all platform features via the side listings.
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/10 bg-[#0E0E0E] p-6 text-center text-[#A3A3A3] shadow-inner">
        <div>
          <p className="font-extrabold text-base text-[#FFFFFF]">Mapbox Access Token Missing</p>
          <p className="text-xs mt-1 max-w-xs leading-relaxed text-[#525252]">
            Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN inside your .env.local file to initialize the 3D globe network mapping.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[#030602] font-sans">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          longitude: -30,
          latitude: 25,
          zoom: projection === 'globe' ? 1.6 : 1.1
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: projection }}
        fog={projection === 'globe' ? {
          'range': [0.5, 10],
          'color': '#163114', // Vibrant moss-green atmospheric horizon glow
          'high-color': '#061305', // Deep organic olive upper atmosphere transition
          'space-color': '#030602', // Midnight forest black cosmic background
          'horizon-blend': 0.04, // Soft, premium atmospheric blending
          'star-intensity': 0.65 // Beautiful sparkling background stars
        } : undefined}
        onLoad={() => applyCustomColors(mapRef.current?.getMap())}
        onStyleData={() => applyCustomColors(mapRef.current?.getMap())}
        reuseMaps
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            latitude={pin.latitude}
            longitude={pin.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedPin(pin);
              onPinSelect?.(pin);
            }}
          >
            <div className="group relative flex flex-col items-center cursor-pointer">
              <div className="relative">
                {/* Outer pulsing ring for active open loops */}
                {pin.status === 'open' && (
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                    pin.type === 'listing' ? 'bg-[#A8D97F]' : 'bg-[#E8A838]'
                  }`} style={{ animationDuration: '2.5s' }} />
                )}

                <div className={`overflow-hidden rounded-full border-2 bg-[#0E0E0E] p-0.5 shadow-lg transition-all duration-300 group-hover:scale-125 ${
                  pin.status === 'open' 
                    ? pin.type === 'listing' ? 'border-[#A8D97F]' : 'border-[#E8A838]'
                    : 'border-white/20'
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pin.avatar}
                    alt={pin.name}
                    className={`h-9 w-9 rounded-full object-cover bg-black/40 ${
                      pin.status !== 'open' ? 'grayscale opacity-55' : ''
                    }`}
                  />
                </div>
                
                {/* M3 Style Type Indicator Badge */}
                <div className={`absolute -right-1.5 -top-1.5 z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-[#0E0E0E] shadow-md transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110 ${
                  pin.status === 'open'
                    ? pin.type === 'listing' ? 'bg-[#A8D97F]' : 'bg-[#E8A838]'
                    : 'bg-[#525252]'
                }`}>
                  {pin.type === 'listing' ? (
                    <Leaf size={10} className={pin.status === 'open' ? 'text-[#1A3A05]' : 'text-white/60'} fill="currentColor" />
                  ) : (
                    <HelpCircle size={10} className={pin.status === 'open' ? 'text-[#3D2800]' : 'text-white/60'} />
                  )}
                </div>
              </div>
              <div className="mt-1 rounded-md bg-[#0E0E0E]/90 border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-[#FFFFFF] opacity-0 shadow-2xl transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-md">
                {pin.title}
              </div>
              <div className="h-2 w-0.5 bg-white/20" />
            </div>
          </Marker>
        ))}
      </Map>



      {/* Dynamic Glassmorphic Action Modal */}
      {selectedPin && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
          onClick={() => { setSelectedPin(null); onPinSelect?.(null); }}
        >
          <div 
            className="relative w-full max-w-sm rounded-3xl bg-[#0E0E0E]/95 border border-white/10 p-6 shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Trigger */}
            <button 
              onClick={() => { setSelectedPin(null); onPinSelect?.(null); }}
              className="absolute top-4 right-4 rounded-full p-1.5 text-[#A3A3A3] hover:bg-white/8 hover:text-[#FFFFFF] transition"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className={`h-20 w-20 overflow-hidden rounded-full border-2 bg-[#141414] p-1 shadow-md ${
                  selectedPin.status === 'open' 
                    ? selectedPin.type === 'listing' ? 'border-[#A8D97F]' : 'border-[#E8A838]'
                    : 'border-white/15'
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedPin.avatar} 
                    alt={selectedPin.name} 
                    className={`h-full w-full object-cover rounded-full bg-black/20 ${
                      selectedPin.status !== 'open' ? 'grayscale opacity-60' : ''
                    }`} 
                  />
                </div>
                <div className={`absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0E0E0E] shadow-sm ${
                  selectedPin.status === 'open'
                    ? selectedPin.type === 'listing' ? 'bg-[#A8D97F]' : 'bg-[#E8A838]'
                    : 'bg-[#525252]'
                }`}>
                  {selectedPin.type === 'listing' ? (
                    <Leaf size={14} className={selectedPin.status === 'open' ? 'text-[#1A3A05]' : 'text-white/70'} fill="currentColor" />
                  ) : (
                    <HelpCircle size={14} className={selectedPin.status === 'open' ? 'text-[#3D2800]' : 'text-white/70'} />
                  )}
                </div>
              </div>

              <h3 className="text-xl font-extrabold text-[#FFFFFF] leading-tight">{selectedPin.name}</h3>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#A3A3A3]">
                {selectedPin.type === 'listing' ? 'Waste Donation Loop' : 'Needs Fulfiller / Appeal'}
              </p>

              <div className="mt-5 w-full space-y-3.5 text-left">
                {/* Details card wrapper */}
                <div className="rounded-2xl bg-[#141414]/60 border border-white/5 p-4 space-y-1.5 shadow-inner">
                  <div className="text-sm font-extrabold text-[#FFFFFF]">
                    {selectedPin.title}
                  </div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                    {selectedPin.description}
                  </p>
                </div>
                
                {/* Quantities/Cities metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-[#222222]/30 border border-white/5 p-2.5 flex flex-col">
                    <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider">Quantity</span>
                    <span className="font-extrabold text-[#A8D97F] mt-0.5">{selectedPin.quantityText}</span>
                  </div>
                  <div className="rounded-xl bg-[#222222]/30 border border-white/5 p-2.5 flex flex-col">
                    <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider">Location</span>
                    <span className="font-extrabold text-[#FFFFFF] mt-0.5">{selectedPin.city}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-1 text-[11px] text-[#A3A3A3]">
                  <Clock size={13} />
                  <span>Posted {selectedPin.timeAgo} • Status: </span>
                  <span className={`font-black uppercase text-[10px] ${
                    selectedPin.status === 'open' ? 'text-[#A8D97F]' : 'text-[#525252]'
                  }`}>{selectedPin.status}</span>
                </div>
              </div>

              {selectedPin.status === 'open' ? (
                <button 
                  onClick={handleAction}
                  className={`mt-6 w-full rounded-xl py-3.5 text-xs font-black uppercase tracking-wider shadow-lg transition duration-200 active:scale-95 ${
                    selectedPin.type === 'listing' 
                      ? 'bg-[#A8D97F] hover:bg-[#92cc63] text-[#1A3A05]' 
                      : 'bg-[#E8A838] hover:bg-[#d89225] text-[#3D2800]'
                  }`}
                >
                  {selectedPin.type === 'listing' ? 'Reserve Waste Item' : 'Offer Help / Fulfill'}
                </button>
              ) : (
                <button 
                  disabled
                  className="mt-6 w-full rounded-xl py-3.5 text-xs font-black uppercase tracking-wider bg-[#141414] text-[#525252] border border-white/5 cursor-not-allowed"
                >
                  Loop Solved / Claimed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
