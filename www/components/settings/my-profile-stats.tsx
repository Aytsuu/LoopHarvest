'use client';

import * as React from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Flame, 
  Heart, 
  BookOpen, 
  Award, 
  Sparkles 
} from 'lucide-react';
import type { Listing, RequestItem, UserStats } from '@/lib/api/types';
import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';

export interface MyProfileStatsProps {
  stats: UserStats;
  listings: Listing[];
  requests: RequestItem[];
  claimedListings: Listing[];
  activeTab: 'listings' | 'requests' | 'claims';
  setActiveTab: (tab: 'listings' | 'requests' | 'claims') => void;
  displayName: string;
  avatarUrl: string;
  isPremium: boolean;
  joinedLabel: string;
  location: string;
  bio: string;
  handleClaim: (id: string) => Promise<void>;
  handleFulfill: (id: string) => Promise<void>;
}

export default function MyProfileStats({
  stats,
  listings,
  requests,
  claimedListings = [],
  activeTab,
  setActiveTab,
  displayName,
  avatarUrl,
  isPremium,
  joinedLabel,
  location,
  bio,
  handleClaim,
  handleFulfill,
}: MyProfileStatsProps) {
  // Calculate levels based on score points (Points / 100 + 1)
  const userLevel = Math.floor(stats.loopPoints / 100) + 1;
  const currentLevelXP = stats.loopPoints % 100;
  const xpProgressPercent = currentLevelXP; // out of 100
  console.log(avatarUrl)
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header profile intro */}
      <div className="bg-[#1B1B1B] p-6 rounded-3xl border border-white/6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 h-36 w-36 rounded-full bg-[#A8D97F]/10 blur-3xl pointer-events-none select-none" />
        
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-24 w-24 rounded-full border-4 border-[#2A4A10] bg-[#141414]"
          />
          <span className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#A8D97F] text-xs font-black text-[#1A3A05] border-2 border-[#1B1B1B] shadow-md font-mono">
            {userLevel}
          </span>
        </div>

        <div className="flex-1 space-y-4 text-center sm:text-left w-full">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 self-center sm:self-auto rounded bg-[#2A4A10] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#A8D97F] uppercase border border-[#A8D97F]/10">
                <ShieldCheck size={11} />
                <span>{isPremium ? 'Community Patron' : 'Loop Master'}</span>
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] mt-1 font-semibold">{joinedLabel} · {location}</p>
            <p className="text-xs text-[#8C8F7E] mt-1.5 font-medium italic-none max-w-lg">&ldquo;{bio}&rdquo;</p>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto sm:mx-0">
            <div className="flex justify-between text-[11px] font-bold text-[#A3A3A3]">
              <span>Level Progress</span>
              <span className="font-mono text-[#A8D97F]">{currentLevelXP} / 100 XP</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#141414] overflow-hidden border border-white/5">
              <div 
                style={{ width: `${xpProgressPercent}%` }}
                className="h-full bg-[#A8D97F] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,217,127,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard metrics widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
          <Scale size={20} className="text-[#A8D97F] mx-auto mb-2" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.kgDiverted} kg</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Scraps Diverted</div>
        </div>

        <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
          <Flame size={20} className="text-[#E8A838] mx-auto mb-2" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.co2Saved} kg</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">CO2 Mitigated</div>
        </div>

        <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center col-span-2 sm:col-span-1">
          <Heart size={20} className="text-[#4ECDC4] mx-auto mb-2" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.waterSaved} L</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Water Preserved</div>
        </div>

        <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
          <BookOpen size={20} className="text-[#C4F09A] mx-auto mb-2" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.listingsPosted}</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Donations Listed</div>
        </div>

        <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
          <Award size={20} className="text-[#7EF8EF] mx-auto mb-2" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.requestsFulfilled}</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Appeals Fulfills</div>
        </div>

        <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center col-span-2 sm:col-span-1">
          <Sparkles size={20} className="text-[#A8D97F] mx-auto mb-2" />
          <div className="font-mono text-xl font-black text-[#A8D97F]">{stats.loopPoints} XP</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Total Loop Score</div>
        </div>
      </div>

      {/* User listings / requests feed tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-white/6 pb-2 items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('listings')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 relative ${
                activeTab === 'listings' 
                  ? 'border-[#A8D97F] text-[#A8D97F]' 
                  : 'border-transparent text-[#A3A3A3] hover:text-[#FFFFFF]'
              }`}
            >
              Your Listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 relative ${
                activeTab === 'requests' 
                  ? 'border-[#A8D97F] text-[#A8D97F]' 
                  : 'border-transparent text-[#A3A3A3] hover:text-[#FFFFFF]'
              }`}
            >
              Your Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 relative ${
                activeTab === 'claims' 
                  ? 'border-[#A8D97F] text-[#A8D97F]' 
                  : 'border-transparent text-[#A3A3A3] hover:text-[#FFFFFF]'
              }`}
            >
              Your Claims ({claimedListings.length})
            </button>
          </div>
          <span className="text-[11px] text-[#A3A3A3] font-bold hidden sm:inline">Only you can view active publishes</span>
        </div>

        {activeTab === 'listings' ? (
          listings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} onClaim={handleClaim} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#525252] bg-[#1B1B1B] border border-white/6 rounded-2xl">
              You haven&apos;t posted any waste materials yet. Select Create Post to get started.
            </div>
          )
        ) : activeTab === 'requests' ? (
          requests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {requests.map((r) => (
                <RequestCard key={r.id} request={r} onFulfill={handleFulfill} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#525252] bg-[#1B1B1B] border border-white/6 rounded-2xl">
              You haven&apos;t requested any scraps yet.
            </div>
          )
        ) : (
          claimedListings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {claimedListings.map((l) => (
                <ListingCard key={l.id} listing={l} onClaim={handleClaim} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#525252] bg-[#1B1B1B] border border-white/6 rounded-2xl">
              You haven&apos;t claimed any waste materials yet. Browse available scraps to start harvesting!
            </div>
          )
        )}
      </div>
    </div>
  );
}
