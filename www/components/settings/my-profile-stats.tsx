'use client';

import * as React from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Flame, 
  Heart, 
  BookOpen, 
  Award, 
  Sparkles,
  Inbox,
  Info,
  X
} from 'lucide-react';
import type { Listing, RequestItem, UserStats } from '@/lib/api/types';
import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';

export interface MyProfileStatsProps {
  stats: UserStats;
  listings: Listing[];
  requests: RequestItem[];
  claimedListings: Listing[];
  fulfilledRequests: RequestItem[];
  activeTab: 'listings' | 'requests' | 'claims';
  setActiveTab: (tab: 'listings' | 'requests' | 'claims') => void;
  displayName: string;
  avatarUrl: string | null;
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
  fulfilledRequests = [],
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
  const [selectedStat, setSelectedStat] = React.useState<string | null>(null);

  // Calculate levels based on score points (Points / 100 + 1)
  const userLevel = Math.floor(stats.loopPoints / 100) + 1;
  const currentLevelXP = stats.loopPoints % 100;
  const xpProgressPercent = currentLevelXP; // out of 100
  const getActiveStatDetails = () => {
    switch (selectedStat) {
      case 'kgDiverted':
        return {
          title: "Scraps Diverted",
          icon: <Scale size={28} className="text-[#A8D97F]" />,
          value: `${stats.kgDiverted} kg`,
          textColor: "text-[#A8D97F]",
          badgeColor: "bg-[#2A4A10]/30 text-[#A8D97F]",
          description: "This represents the total physical weight of organic materials you have successfully prevented from going to landfills by listing or reclaiming them on LoopHarvest.",
          howAccumulated: "Every completed listing handoff you participate in adds its physical weight directly to your stats.",
          formula: "Total Weight (kg) = Sum of Quantity of All Completed Listings",
          extraContent: null
        };
      case 'co2Saved':
        return {
          title: "CO₂ Mitigated",
          icon: <Flame size={28} className="text-[#E8A838]" />,
          value: `${stats.co2Saved} kg`,
          textColor: "text-[#E8A838]",
          badgeColor: "bg-[#5B3E07]/30 text-[#E8A838]",
          description: "When organic waste is buried in landfills, anaerobic decomposition generates methane, a highly destructive greenhouse gas. Diverting these scraps keeps organic matter in circular usage and avoids these emissions entirely.",
          howAccumulated: "Calculated dynamically based on category-specific environmental factors. Each kilogram diverted is multiplied by its category's CO₂ savings multiplier.",
          formula: "CO₂ Saved (kg) = Diverted Weight (kg) × Category Factor",
          extraContent: (
            <div className="space-y-3 mt-4">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">CO₂ Multipliers by Category</div>
              <div className="bg-[#141414] rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="bg-white/5 text-[#A3A3A3] border-b border-white/5">
                      <th className="p-2.5 font-bold">Category</th>
                      <th className="p-2.5 font-bold text-right">CO₂ Saved / kg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Surplus Meals</td>
                      <td className="p-2.5 text-right font-black text-[#E8A838]">2.5 kg / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Spent Grain</td>
                      <td className="p-2.5 text-right font-black text-[#E8A838]">1.2 kg / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Coffee Grounds</td>
                      <td className="p-2.5 text-right font-black text-[#E8A838]">0.8 kg / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Fruit Waste</td>
                      <td className="p-2.5 text-right font-black text-[#E8A838]">0.6 kg / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Food Scraps / Default</td>
                      <td className="p-2.5 text-right font-black text-[#E8A838]">0.5 kg / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Vegetable Scraps</td>
                      <td className="p-2.5 text-right font-black text-[#E8A838]">0.4 kg / kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        };
      case 'waterSaved':
        return {
          title: "Water Preserved",
          icon: <Heart size={28} className="text-[#4ECDC4]" />,
          value: `${stats.waterSaved} L`,
          textColor: "text-[#4ECDC4]",
          badgeColor: "bg-[#144D48]/30 text-[#4ECDC4]",
          description: "Producing organic materials requires a massive amount of virtual water (the water footprint). When we waste food or grain, we also throw away all the freshwater used to cultivate them. Diverting keeps that water value alive.",
          howAccumulated: "Each diverted kilogram is multiplied by the water preservation factor specific to that waste category.",
          formula: "Water Saved (Liters) = Diverted Weight (kg) × Category Factor",
          extraContent: (
            <div className="space-y-3 mt-4">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">Water Saved Multipliers</div>
              <div className="bg-[#141414] rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="bg-white/5 text-[#A3A3A3] border-b border-white/5">
                      <th className="p-2.5 font-bold">Category</th>
                      <th className="p-2.5 font-bold text-right">Water Saved / kg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Surplus Meals</td>
                      <td className="p-2.5 text-right font-black text-[#4ECDC4]">250 L / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Spent Grain</td>
                      <td className="p-2.5 text-right font-black text-[#4ECDC4]">120 L / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Coffee Grounds</td>
                      <td className="p-2.5 text-right font-black text-[#4ECDC4]">80 L / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Fruit Waste</td>
                      <td className="p-2.5 text-right font-black text-[#4ECDC4]">65 L / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Food Scraps / Default</td>
                      <td className="p-2.5 text-right font-black text-[#4ECDC4]">50 L / kg</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-sans font-semibold text-white">Vegetable Scraps</td>
                      <td className="p-2.5 text-right font-black text-[#4ECDC4]">40 L / kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        };
      case 'listingsPosted':
        return {
          title: "Donations Listed",
          icon: <BookOpen size={28} className="text-[#C4F09A]" />,
          value: `${stats.listingsPosted}`,
          textColor: "text-[#C4F09A]",
          badgeColor: "bg-[#334A1B]/30 text-[#C4F09A]",
          description: "Your active list posts of scraps, food remains, and waste resources. Creating listings powers the loop, giving other community members the resource opportunities they need.",
          howAccumulated: "Increments by 1 every time you successfully create and publish a new scrap post on LoopHarvest.",
          formula: "Total Listed Posts = Sum of All Published Listings",
          extraContent: null
        };
      case 'requestsFulfilled':
        return {
          title: "Appeals Fulfills",
          icon: <Award size={28} className="text-[#7EF8EF]" />,
          value: `${stats.requestsFulfilled}`,
          textColor: "text-[#7EF8EF]",
          badgeColor: "bg-[#1F4C49]/30 text-[#7EF8EF]",
          description: "Reflects how many times you have responded to help others or reclaimed available listings. Fulfilling active resource requests strengthens community ties and ensures local circularity.",
          howAccumulated: "Increments by 1 every time you successfully claim a listing or complete a fulfillment loop for another member's posted appeal.",
          formula: "Total Fulfillments = Active Claims Completed + Appeals Met",
          extraContent: null
        };
      case 'loopPoints':
        return {
          title: "Total Loop Score",
          icon: <Sparkles size={28} className="text-[#A8D97F]" />,
          value: `${stats.loopPoints} XP`,
          textColor: "text-[#A8D97F]",
          badgeColor: "bg-[#2A4A10]/30 text-[#A8D97F]",
          description: "Your Total Loop Score XP reflects your overall combined action score, circular involvement, and environmental mitigation footprint. Loop Score determines your community rank and level status.",
          howAccumulated: "Dynamically aggregated from three key areas of activity with different point-weight priorities.",
          formula: "Loop Score (XP) = (Diverted kg × 10) + (Appeals Fulfills × 30) + (Donations Listed × 15)",
          extraContent: (
            <div className="space-y-3 mt-4">
              <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">XP Reward Rules</div>
              <div className="bg-[#141414] rounded-xl border border-white/5 overflow-hidden divide-y divide-white/5">
                <div className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white">Diverting Organic Materials</span>
                    <span className="text-[10px] text-[#A3A3A3]">Per physical kilogram (kg) diverted</span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#A8D97F]">+10 XP</span>
                </div>
                <div className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white">Fulfilling Appeals / Claims</span>
                    <span className="text-[10px] text-[#A3A3A3]">Per active handoff or request claim</span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#A8D97F]">+30 XP</span>
                </div>
                <div className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white">Publishing New Donations</span>
                    <span className="text-[10px] text-[#A3A3A3]">Per listing posted to the network</span>
                  </div>
                  <span className="font-mono text-xs font-black text-[#A8D97F]">+15 XP</span>
                </div>
              </div>
            </div>
          )
        };
      default:
        return null;
    }
  };

  const initial = displayName.trim().charAt(0).toUpperCase() || "L";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header profile intro */}
      <div className="bg-[#1B1B1B] p-6 rounded-3xl border border-white/6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 h-36 w-36 rounded-full bg-[#A8D97F]/10 blur-3xl pointer-events-none select-none" />
        
        <div className="relative shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-24 w-24 rounded-full border-4 border-[#2A4A10] bg-[#141414] object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#2A4A10] bg-[#141414] text-3xl font-black text-[#A8D97F]">
              {initial}
            </div>
          )}
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
        <button
          type="button"
          onClick={() => setSelectedStat('kgDiverted')}
          className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center hover:bg-[#222222] hover:border-[#A8D97F]/40 active:scale-[0.98] transition-all duration-200 group relative flex flex-col items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-[#A8D97F]/50 cursor-pointer"
        >
          <div className="absolute top-2 right-2 text-white/20 group-hover:text-[#A8D97F] transition-colors">
            <Info size={14} />
          </div>
          <Scale size={20} className="text-[#A8D97F] mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.kgDiverted} kg</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Scraps Diverted</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStat('co2Saved')}
          className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center hover:bg-[#222222] hover:border-[#E8A838]/40 active:scale-[0.98] transition-all duration-200 group relative flex flex-col items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-[#E8A838]/50 cursor-pointer"
        >
          <div className="absolute top-2 right-2 text-white/20 group-hover:text-[#E8A838] transition-colors">
            <Info size={14} />
          </div>
          <Flame size={20} className="text-[#E8A838] mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.co2Saved} kg</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">CO2 Mitigated</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStat('waterSaved')}
          className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center col-span-2 sm:col-span-1 hover:bg-[#222222] hover:border-[#4ECDC4]/40 active:scale-[0.98] transition-all duration-200 group relative flex flex-col items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]/50 cursor-pointer"
        >
          <div className="absolute top-2 right-2 text-white/20 group-hover:text-[#4ECDC4] transition-colors">
            <Info size={14} />
          </div>
          <Heart size={20} className="text-[#4ECDC4] mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.waterSaved} L</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Water Preserved</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStat('listingsPosted')}
          className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center hover:bg-[#222222] hover:border-[#C4F09A]/40 active:scale-[0.98] transition-all duration-200 group relative flex flex-col items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-[#C4F09A]/50 cursor-pointer"
        >
          <div className="absolute top-2 right-2 text-white/20 group-hover:text-[#C4F09A] transition-colors">
            <Info size={14} />
          </div>
          <BookOpen size={20} className="text-[#C4F09A] mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.listingsPosted}</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Donations Listed</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStat('requestsFulfilled')}
          className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center hover:bg-[#222222] hover:border-[#7EF8EF]/40 active:scale-[0.98] transition-all duration-200 group relative flex flex-col items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-[#7EF8EF]/50 cursor-pointer"
        >
          <div className="absolute top-2 right-2 text-white/20 group-hover:text-[#7EF8EF] transition-colors">
            <Info size={14} />
          </div>
          <Award size={20} className="text-[#7EF8EF] mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
          <div className="font-mono text-xl font-black text-[#FFFFFF]">{stats.requestsFulfilled}</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Appeals Fulfills</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStat('loopPoints')}
          className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center col-span-2 sm:col-span-1 hover:bg-[#222222] hover:border-[#A8D97F]/40 active:scale-[0.98] transition-all duration-200 group relative flex flex-col items-center justify-center w-full focus:outline-none focus:ring-2 focus:ring-[#A8D97F]/50 cursor-pointer"
        >
          <div className="absolute top-2 right-2 text-white/20 group-hover:text-[#A8D97F] transition-colors">
            <Info size={14} />
          </div>
          <Sparkles size={20} className="text-[#A8D97F] mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
          <div className="font-mono text-xl font-black text-[#A8D97F]">{stats.loopPoints} XP</div>
          <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Total Loop Score</div>
        </button>
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
              Your Claims ({claimedListings.length + fulfilledRequests.length})
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox size={40} className="mb-3 stroke-1 text-neutral-600" />
              <span className="text-xs text-[#525252]">
                You haven&apos;t posted any waste materials yet. Select Create Post to get started.
              </span>
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox size={40} className="mb-3 stroke-1 text-neutral-600" />
              <span className="text-xs text-[#525252]">
                You haven&apos;t requested any scraps yet.
              </span>
            </div>
          )
        ) : (
          claimedListings.length > 0 || fulfilledRequests.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {claimedListings.map((l) => (
                <ListingCard key={l.id} listing={l} onClaim={handleClaim} />
              ))}
              {fulfilledRequests.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox size={40} className="mb-3 stroke-1 text-neutral-600" />
              <span className="text-xs text-[#525252]">
                You haven&apos;t claimed listings or fulfilled requests yet. Browse active loops to start harvesting!
              </span>
            </div>
          )
        )}
      </div>

      {/* Interactive Details Modal & Mobile Bottom Sheet */}
      {selectedStat && (() => {
        const detail = getActiveStatDetails();
        if (!detail) return null;

        return (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-quick cursor-pointer"
            onClick={() => setSelectedStat(null)}
          >
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-slide-up {
                animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              .animate-fade-in-quick {
                animation: fadeIn 0.2s ease-out forwards;
              }
            `}} />
            <div 
              className="bg-[#1B1B1B] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:max-h-[90vh] animate-slide-up cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Gradient Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#A8D97F] via-[#E8A838] to-[#4ECDC4]" />
              
              {/* Drag Handle for Mobile */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 sm:hidden" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedStat(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFFFFF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#A8D97F]/30 z-10 cursor-pointer"
                aria-label="Close details"
              >
                <X size={18} />
              </button>

              {/* Scrollable Content Container */}
              <div className="p-6 pb-10 max-sm:pb-16 overflow-y-auto space-y-6 select-text">
                {/* Header info */}
                <div className="flex items-center gap-4 border-b border-white/5 pb-5">
                  <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden`}>
                    {detail.icon}
                  </div>
                  <div className="text-left">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase mb-1.5 ${detail.badgeColor}`}>
                      Metric breakdown
                    </span>
                    <h3 className="font-display text-2xl font-black text-white tracking-tight leading-none">
                      {detail.title}
                    </h3>
                  </div>
                </div>

                {/* Stat Display Box */}
                <div className="bg-[#141414] p-4.5 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-1">Your Total Accumulation</span>
                  <div className={`font-mono text-3xl font-black ${detail.textColor}`}>
                    {detail.value}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">What it is</h4>
                  <p className="text-sm text-[#A3A3A3] leading-relaxed font-medium">
                    {detail.description}
                  </p>
                </div>

                {/* Accumulation Method */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">How it accumulates</h4>
                  <p className="text-sm text-[#A3A3A3] leading-relaxed font-medium">
                    {detail.howAccumulated}
                  </p>
                </div>

                {/* Formula Section */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Calculation Formula</h4>
                  <div className="bg-[#141414] p-4 rounded-xl border border-white/5 flex items-center justify-between font-mono text-xs text-[#FFFFFF]">
                    <div className="w-full text-center py-1.5 font-bold border-l-2 border-[#A8D97F] pl-3 bg-white/2 rounded-r-lg text-left">
                      {detail.formula}
                    </div>
                  </div>
                </div>

                {/* Custom Tables or points details if available */}
                {detail.extraContent}
              </div>


            </div>
          </div>
        );
      })()}
    </div>
  );
}
