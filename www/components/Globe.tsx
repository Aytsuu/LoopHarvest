'use client';

import * as React from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import { Leaf, HelpCircle, X, Clock, Globe as GlobeIcon, Map as MapIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface UserPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  avatar: string;
  type: 'request' | 'listing';
}

const MOCK_USERS: UserPin[] = [
  { id: '1', name: 'Alice', latitude: 37.7749, longitude: -122.4194, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', type: 'listing' },
  { id: '2', name: 'Bob', latitude: 51.5074, longitude: -0.1276, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', type: 'request' },
  { id: '3', name: 'Charlie', latitude: 35.6762, longitude: 139.6503, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie', type: 'listing' },
  { id: '4', name: 'Diana', latitude: -33.8688, longitude: 151.2093, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana', type: 'request' },
  { id: '5', name: 'Ethan', latitude: 40.7128, longitude: -74.0060, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan', type: 'listing' },
  { id: '6', name: 'Fiona', latitude: -23.5505, longitude: -46.6333, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona', type: 'request' },
  { id: '7', name: 'George', latitude: 48.8566, longitude: 2.3522, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George', type: 'listing' },
];

interface GlobeProps {
  accessToken?: string;
}

export default function Globe({ accessToken }: GlobeProps) {
  const [projection, setProjection] = React.useState<'globe' | 'mercator'>('globe');
  const [selectedUser, setSelectedUser] = React.useState<UserPin | null>(null);
  const token = accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-stone-900/10 bg-stone-100 p-6 text-center text-stone-500 shadow-inner">
        <div>
          <p className="font-semibold">Mapbox Token Missing</p>
          <p className="text-sm mt-1">Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#050505] font-sans">
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: projection === 'globe' ? 1.8 : 1.2
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        projection={{ name: projection }}
        fog={projection === 'globe' ? {
          'range': [0.5, 10],
          'color': '#f8f0e3',
          'high-color': '#245cdf',
          'space-color': '#050505',
          'horizon-blend': 0.02,
          'star-intensity': 0.15
        } : undefined}
        reuseMaps
      >
        {MOCK_USERS.map((user) => (
          <Marker
            key={user.id}
            latitude={user.latitude}
            longitude={user.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedUser(user);
            }}
          >
            <div className="group relative flex flex-col items-center cursor-pointer">
              <div className="relative">
                <div className="overflow-hidden rounded-full border-2 border-white bg-white shadow-lg transition-transform duration-200 group-hover:scale-125">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 object-cover"
                  />
                </div>
                
                {/* Type Indicator Badge - Floating Outside */}
                <div className={`absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-110 ${
                  user.type === 'listing' ? 'bg-emerald-500' : 'bg-orange-500'
                }`}>
                  {user.type === 'listing' ? (
                    <Leaf size={12} strokeWidth={2.5} color="white" fill="white" />
                  ) : (
                    <HelpCircle size={12} strokeWidth={2.5} color="white" />
                  )}
                </div>
              </div>
              <div className="mt-1 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {user.name}
              </div>
              <div className="h-2 w-0.5 bg-white/50" />
            </div>
          </Marker>
        ))}
      </Map>

      {/* Projection Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => setProjection(prev => prev === 'globe' ? 'mercator' : 'globe')}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-stone-900/80 px-4 py-2 text-sm font-medium text-white shadow-2xl backdrop-blur-md transition hover:bg-stone-800 active:scale-95"
        >
          {projection === 'globe' ? (
            <>
              <MapIcon size={19} strokeWidth={2} />
              Switch to Flat
            </>
          ) : (
            <>
              <GlobeIcon size={19} strokeWidth={2} />
              Switch to Globe
            </>
          )}
        </button>
      </div>

      {/* Event Modal */}
      {selectedUser && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-sm p-6" onClick={() => setSelectedUser(null)}>
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-[0_32px_64px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
            >
              <X size={23} strokeWidth={2} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-stone-50 bg-stone-50 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="h-full w-full object-cover" />
                </div>
                <div className={`absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                  selectedUser.type === 'listing' ? 'bg-emerald-500' : 'bg-orange-500'
                }`}>
                  {selectedUser.type === 'listing' ? (
                    <Leaf size={16} strokeWidth={2.5} color="white" fill="white" />
                  ) : (
                    <HelpCircle size={16} strokeWidth={2.5} color="white" />
                  )}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-stone-900">{selectedUser.name}</h3>
              <p className="mt-1 text-sm font-medium uppercase tracking-wider text-stone-500">
                {selectedUser.type === 'listing' ? 'Active Listing' : 'Open Request'}
              </p>

              <div className="mt-6 w-full space-y-4 text-left">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Item Details</p>
                  <p className="mt-1 text-stone-700 font-medium">
                    {selectedUser.type === 'listing' 
                      ? "Fresh garden produce: Organic tomatoes and basil available for pickup." 
                      : "Looking for excess sourdough starter or bread flour."}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 px-1 text-sm text-stone-500 font-medium">
                  <Clock size={18} strokeWidth={2} />
                  Expires in 4 hours
                </div>
              </div>

              <button className={`mt-8 w-full rounded-2xl py-4 text-sm font-bold text-white transition-transform active:scale-95 ${
                selectedUser.type === 'listing' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}>
                {selectedUser.type === 'listing' ? 'Reserve Item' : 'Offer Help'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
