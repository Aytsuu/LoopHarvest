'use client';
 
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker, MapRef } from 'react-map-gl/mapbox';
import { Leaf, HelpCircle, X, Clock, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
  claimType?: 'direct' | 'message';
  donorId?: string;
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
  const router = useRouter();
  const projection = controlledProjection || 'globe';
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [selectedPin, setSelectedPin] = React.useState<GlobePin | null>(null);
  const [webGlSupported, setWebGlSupported] = React.useState<boolean | null>(null);
  const [zoom, setZoom] = React.useState(projection === 'globe' ? 1.6 : 1.1);
  const token = accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser().catch(() => null),
  });

  const isOwner = currentUser && selectedPin && selectedPin.type === 'listing'
    ? currentUser.id === selectedPin.donorId
    : false;

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
        status: l.status,
        claimType: l.claimType,
        donorId: l.donorId
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

  // Client-side clustering of pins by city when highly zoomed out
  const mapElements = React.useMemo(() => {
    interface MapElement {
      key: string;
      isCluster: boolean;
      latitude: number;
      longitude: number;
      pin?: GlobePin;
      cluster?: {
        city: string;
        latitude: number;
        longitude: number;
        pins: GlobePin[];
        listingCount: number;
        requestCount: number;
      };
    }

    // If zoom is high, don't cluster: show individual pins with radial dispersion
    if (zoom >= 4.0) {
      return pins.map((pin): MapElement => ({
        key: `pin-${pin.id}`,
        isCluster: false,
        latitude: pin.latitude,
        longitude: pin.longitude,
        pin
      }));
    }

    // Otherwise, cluster pins by city
    const groups: Record<string, GlobePin[]> = {};
    pins.forEach(pin => {
      const key = pin.city || 'San Francisco';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(pin);
    });

    const elements: MapElement[] = [];

    Object.entries(groups).forEach(([city, groupPins]) => {
      if (groupPins.length === 1) {
        const pin = groupPins[0];
        elements.push({
          key: `pin-${pin.id}`,
          isCluster: false,
          latitude: pin.latitude,
          longitude: pin.longitude,
          pin
        });
      } else {
        const base = CITY_COORDS[city] || CITY_COORDS['San Francisco'];
        const listingCount = groupPins.filter(p => p.type === 'listing').length;
        const requestCount = groupPins.filter(p => p.type === 'request').length;

        elements.push({
          key: `cluster-${city}`,
          isCluster: true,
          latitude: base.lat,
          longitude: base.lng,
          cluster: {
            city,
            latitude: base.lat,
            longitude: base.lng,
            pins: groupPins,
            listingCount,
            requestCount
          }
        });
      }
    });

    return elements;
  }, [pins, zoom]);

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

  const handleClusterClick = (
    cluster: { latitude: number; longitude: number },
    e: { originalEvent?: { stopPropagation: () => void }; stopPropagation?: () => void }
  ) => {
    if (e && e.originalEvent) {
      e.originalEvent.stopPropagation();
    } else if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    // Zoom in on the cluster center
    mapRef.current?.flyTo({
      center: [cluster.longitude, cluster.latitude],
      zoom: 5.5,
      duration: 1200,
      essential: true
    });
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
    <div ref={containerRef} className="relative h-full w-full bg-[#030602]">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          longitude: -30,
          latitude: 25,
          zoom: projection === 'globe' ? 1.6 : 1.1
        }}
        onMove={(evt) => {
          setZoom(evt.viewState.zoom);
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
        {mapElements.map((el) => {
          if (el.isCluster && el.cluster) {
            const cluster = el.cluster;
            return (
              <Marker
                key={el.key}
                latitude={el.latitude}
                longitude={el.longitude}
                anchor="bottom"
                onClick={(e) => handleClusterClick(cluster, e)}
              >
                <div className="group relative flex flex-col items-center cursor-pointer">
                  {/* Cluster Badge */}
                  <div className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-xl transition-all duration-300 group-hover:scale-110 ${
                    cluster.requestCount === 0 
                      ? 'border-[#A8D97F] bg-[#1A3A05]/90 text-[#A8D97F] shadow-[0_0_15px_rgba(168,217,127,0.45)]' 
                      : cluster.listingCount === 0
                      ? 'border-[#E8A838] bg-[#4D3105]/90 text-[#E8A838] shadow-[0_0_15px_rgba(232,168,56,0.45)]'
                      : 'border-transparent bg-gradient-to-br from-[#A8D97F] to-[#E8A838] shadow-[0_0_15px_rgba(168,217,127,0.3)]'
                  }`}>
                    {cluster.listingCount > 0 && cluster.requestCount > 0 ? (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0E0E0E]/90 text-white font-black text-xs">
                        {cluster.pins.length}
                      </div>
                    ) : (
                      <span className="text-xs font-black text-white">
                        {cluster.pins.length}
                      </span>
                    )}
                    
                    {/* Visual Category Icon Badges on the sides or top */}
                    <div className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0E0E0E] border border-white/10 text-white text-[8px] font-black">
                      {cluster.listingCount > 0 && cluster.requestCount > 0 ? (
                        <div className="flex gap-0.5 items-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#A8D97F]" />
                          <div className="h-1.5 w-1.5 rounded-full bg-[#E8A838]" />
                        </div>
                      ) : cluster.requestCount === 0 ? (
                        <Leaf size={8} className="text-[#A8D97F]" fill="currentColor" />
                      ) : (
                        <HelpCircle size={8} className="text-[#E8A838]" />
                      )}
                    </div>
                  </div>

                  {/* City Label */}
                  <div className="mt-1.5 rounded-md bg-[#0E0E0E]/90 border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-[#FFFFFF] shadow-2xl backdrop-blur-md">
                    {cluster.city}
                  </div>
                  
                  {/* Dynamic tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-[#0E0E0E] border border-white/10 rounded-lg p-2 text-[10px] text-white whitespace-nowrap shadow-2xl backdrop-blur-md space-y-0.5">
                      <div className="font-bold text-center border-b border-white/5 pb-1 mb-1">{cluster.city} Cluster</div>
                      {cluster.listingCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[#A8D97F]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#A8D97F]" />
                          <span>{cluster.listingCount} Donations Available</span>
                        </div>
                      )}
                      {cluster.requestCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[#E8A838]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E8A838]" />
                          <span>{cluster.requestCount} Appeals Needed</span>
                        </div>
                      )}
                      <div className="text-[8px] text-[#8C8F7E] text-center pt-1 mt-1 border-t border-white/5 font-medium">Click to zoom and inspect</div>
                    </div>
                    <div className="w-1.5 h-1.5 bg-[#0E0E0E] border-r border-b border-white/10 rotate-45 -mt-1" />
                  </div>
                </div>
              </Marker>
            );
          } else if (el.pin) {
            const pin = el.pin;
            return (
              <Marker
                key={el.key}
                latitude={el.latitude}
                longitude={el.longitude}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedPin(pin);
                  onPinSelect?.(pin);
                }}
              >
                <div className="group relative flex flex-col items-center cursor-pointer">
                  <div className="relative">
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
            );
          }
          return null;
        })}
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

              <div className="mt-6 w-full space-y-2">
                {selectedPin.status === 'open' ? (
                  isOwner ? (
                    <button 
                      disabled
                      className="w-full rounded-xl py-3.5 text-xs font-bold tracking-wider bg-[#222222] border border-white/10 text-[#A3A3A3] opacity-80 cursor-not-allowed text-center"
                    >
                      Your Listing
                    </button>
                  ) : selectedPin.type === 'listing' && selectedPin.claimType === 'message' ? (
                    <button 
                      onClick={() => router.push(
                        `/chat?listingId=${selectedPin.id}&recipientId=${selectedPin.donorId}&recipientName=${encodeURIComponent(selectedPin.name)}&recipientAvatar=${encodeURIComponent(selectedPin.avatar || '')}`
                      )}
                      className="w-full rounded-xl py-3.5 text-xs font-bold tracking-wider shadow-lg bg-[#2A4A10] border border-[#A8D97F]/20 text-[#A8D97F] hover:bg-[#2A4A10]/80 transition duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>Message Donor</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleAction}
                      className={`w-full rounded-xl py-3.5 text-xs font-bold tracking-wider shadow-lg transition duration-200 active:scale-95 ${
                        selectedPin.type === 'listing' 
                          ? 'bg-[#A8D97F] hover:bg-[#92cc63] text-[#1A3A05]' 
                          : 'bg-[#E8A838] hover:bg-[#d89225] text-[#3D2800]'
                      }`}
                    >
                      {selectedPin.type === 'listing' ? 'Reserve Waste Item' : 'Offer Help / Fulfill'}
                    </button>
                  )
                ) : (
                  <button 
                    disabled
                    className="w-full rounded-xl py-3.5 text-xs font-medium tracking-wider bg-[#141414]/50 text-white/30 border border-white/5 cursor-not-allowed"
                  >
                    Loop Solved / Claimed
                  </button>
                )}

                <button 
                  onClick={() => router.push(selectedPin.type === 'listing' ? `/listings/${selectedPin.id}` : `/requests/${selectedPin.id}`)}
                  className="w-full rounded-xl py-3.5 text-xs font-medium tracking-wider border border-white/10 hover:bg-white/5 text-[#FFFFFF] hover:text-[#A8D97F] hover:border-[#A8D97F]/30 transition duration-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>View Full Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
