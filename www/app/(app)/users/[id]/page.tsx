'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, Scale, Heart, Award, MessageSquare } from 'lucide-react';
import { mockStore } from '@/lib/mockStore';
import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';

interface MockUserProfile {
  name: string;
  avatar: string;
  role: string;
  city: string;
  points: number;
  kgDiverted: number;
  co2Saved: number;
  joined: string;
  verified: boolean;
}

const MOCK_PROFILES: Record<string, MockUserProfile> = {
  'Hannelore': {
    name: 'Hannelore Schmidt',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannelore',
    role: 'Compost Artisan',
    city: 'San Francisco',
    points: 480,
    kgDiverted: 48.5,
    co2Saved: 24.2,
    joined: 'Jan 2025',
    verified: true
  },
  'Andytown': {
    name: 'Andytown Coffee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andytown',
    role: 'Zero-Waste Cafe',
    city: 'San Francisco',
    points: 1250,
    kgDiverted: 145.0,
    co2Saved: 72.5,
    joined: 'Sep 2024',
    verified: true
  },
  'BiRite': {
    name: 'Bi-Rite Market',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BiRite',
    role: 'Regenerative Grocer',
    city: 'San Francisco',
    points: 890,
    kgDiverted: 92.4,
    co2Saved: 46.2,
    joined: 'Mar 2025',
    verified: true
  },
  'Tartine': {
    name: 'Tartine Bakery',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tartine',
    role: 'Circular Bakery',
    city: 'San Francisco',
    points: 1540,
    kgDiverted: 182.5,
    co2Saved: 91.2,
    joined: 'Jul 2024',
    verified: true
  },
  'FeatherFarm': {
    name: 'Feather & Comb Farm',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FeatherFarm',
    role: 'Laying Poultry Farm',
    city: 'San Francisco',
    points: 340,
    kgDiverted: 35.0,
    co2Saved: 17.5,
    joined: 'Feb 2026',
    verified: true
  },
  'EcoSanct': {
    name: 'EcoSanctuary Cleaning',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EcoSanct',
    role: 'Bio-Cleaners Designer',
    city: 'San Francisco',
    points: 210,
    kgDiverted: 12.0,
    co2Saved: 6.0,
    joined: 'Apr 2026',
    verified: false
  }
};

export default function UserProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  
  // Extract key seed name from dicebear URL if applicable or id
  const profileKey = React.useMemo(() => {
    if (!rawId) return '';
    // Look up directly
    if (MOCK_PROFILES[rawId]) return rawId;
    // Look up based on substrings
    const matched = Object.keys(MOCK_PROFILES).find(key => 
      rawId.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(rawId.toLowerCase())
    );
    return matched || 'Hannelore';
  }, [rawId]);

  const profile = MOCK_PROFILES[profileKey];

  const listings = React.useMemo(() => {
    if (!profile) return [];
    return mockStore.getListings().filter(l => 
      l.donorName.toLowerCase().includes(profile.name.toLowerCase()) ||
      profile.name.toLowerCase().includes(l.donorName.toLowerCase())
    );
  }, [profile]);

  const requests = React.useMemo(() => {
    if (!profile) return [];
    return mockStore.getRequests().filter(r => 
      r.requesterName.toLowerCase().includes(profile.name.toLowerCase()) ||
      profile.name.toLowerCase().includes(r.requesterName.toLowerCase())
    );
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#E8EAD8]">
        <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#E8EAD8] hover:bg-white/8 transition"
          >
            Back
          </button>
          <span className="font-display text-lg font-bold tracking-tight">User Profile</span>
          <span className="w-13" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-4">👤</span>
          <h3 className="font-display text-lg font-bold">User profile not found</h3>
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

  return (
    <main className="flex-1 bg-[#0A0A0A] text-[#E8EAD8] min-h-screen">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#E8EAD8] hover:bg-white/8 transition"
        >
          Back
        </button>
        <span className="font-display text-lg font-bold tracking-tight">Circular Profile</span>
          <span className="w-13" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-24 md:pb-8">
        
        {/* Profile Card Header */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 h-36 w-36 rounded-full bg-[#A8D97F]/10 blur-3xl pointer-events-none select-none" />

          {/* Avatar Ring */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-24 w-24 rounded-full border-4 border-[#2A4A10] bg-[#1B1B1B]"
            />
          </div>

          {/* Copy and Actions */}
          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#E8EAD8]">
                    {profile.name}
                  </h2>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 self-center md:self-auto rounded bg-[#2A4A10] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#A8D97F] uppercase border border-[#A8D97F]/10">
                      <ShieldCheck size={11} />
                      <span>Verified Circular Node</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A8AA98] mt-1 font-semibold">{profile.role} · {profile.city}</p>
              </div>

              <button
                onClick={() => alert(`Messaging is disabled in mock state! Contacting: ${profile.name}`)}
                className="rounded-xl bg-[#A8D97F] px-5 py-2.5 text-xs font-black text-[#1A3A05] hover:brightness-105 transition flex items-center justify-center gap-2 self-center md:self-auto"
              >
                <MessageSquare size={14} />
                <span>Message Node</span>
              </button>
            </div>

            <div className="text-xs text-[#A8AA98] font-bold">
              Joined {profile.joined}
            </div>
          </div>
        </div>

        {/* stats dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Scale size={18} className="text-[#A8D97F] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#E8EAD8]">{profile.kgDiverted} kg</div>
            <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Scraps Diverted</div>
          </div>

          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Heart size={18} className="text-[#E8A838] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#E8EAD8]">{profile.co2Saved} kg</div>
            <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">CO2 Mitigated</div>
          </div>

          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Award size={18} className="text-[#4ECDC4] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#E8EAD8]">{profile.points} XP</div>
            <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Community Score</div>
          </div>

          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Calendar size={18} className="text-[#C4F09A] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#C4F09A]">{listings.length + requests.length}</div>
            <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Active Posts</div>
          </div>

        </div>

        {/* Display active listings and requests */}
        <div className="space-y-6">
          {listings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A8AA98]">Available Donations ({listings.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {listings.map(l => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          )}

          {requests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A8AA98]">Active Material Appeals ({requests.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {requests.map(r => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          )}

          {listings.length === 0 && requests.length === 0 && (
            <div className="py-12 text-center text-xs text-[#5A5C50] bg-[#141414] border border-white/6 rounded-2xl">
              🍂 This node doesn&apos;t have any active public listings or appeals right now.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
