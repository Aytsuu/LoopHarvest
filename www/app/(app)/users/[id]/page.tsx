'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, Scale, Heart, Award, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel, toRequestCardModel, toUserAvatarUrl } from '@/lib/api/mappers';
import type { Listing, RequestItem } from '@/lib/api/types';
import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';

interface DynamicUserProfile {
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

export default function UserProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<DynamicUserProfile | null>(null);
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [requests, setRequests] = React.useState<RequestItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadProfileData = async () => {
      if (!rawId) return;
      try {
        setLoading(true);
        setError(null);

        // Fetch all active listings, requests, and current logged-in user
        const [listingRows, requestRows, currentUser] = await Promise.all([
          apiClient.getListings(),
          apiClient.getRequests(),
          apiClient.getCurrentUser().catch(() => null),
        ]);

        const mappedListings = listingRows.map(toListingCardModel);
        const mappedRequests = requestRows.map(toRequestCardModel);

        // 1. Check if the user is the current logged in user
        const isCurrentUser = currentUser && currentUser.id === rawId;

        // 2. Filter listings/requests for this target user ID
        const userListings = mappedListings.filter((l) => {
          const row = listingRows.find((r) => r.id === l.id);
          return row?.donor_id === rawId || (isCurrentUser && l.donorName.includes('You'));
        });

        const userRequests = mappedRequests.filter((r) => {
          const row = requestRows.find((item) => item.id === r.id);
          return row?.requester_id === rawId || (isCurrentUser && r.requesterName.includes('You'));
        });

        setListings(userListings);
        setRequests(userRequests);

        // 3. Extract profile details
        let name = 'LoopHarvest Member';
        let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rawId)}`;
        let city = 'San Francisco';
        let role = 'Circular Contributor';
        let verified = false;
        let joined = 'Jan 2025';

        if (isCurrentUser) {
          name = currentUser.display_name ?? 'You (Current User)';
          avatar = toUserAvatarUrl(currentUser);
          city = currentUser.city ?? 'San Francisco';
          role = 'Core Loop Node';
          verified = true;
          joined = 'May 2026';
        } else if (userListings.length > 0) {
          const firstListing = userListings[0];
          name = firstListing.donorName;
          avatar = firstListing.donorAvatar;
          city = firstListing.city;
          role = 'Compost Artisan';
          verified = true;
        } else if (userRequests.length > 0) {
          const firstRequest = userRequests[0];
          name = firstRequest.requesterName;
          avatar = firstRequest.requesterAvatar;
          city = firstRequest.city;
          role = 'Zero-Waste Partner';
          verified = true;
        } else {
          // Backward compatibility for mock names or seed URLs
          const fallbackNames: Record<string, string> = {
            Hannelore: 'Hannelore Schmidt',
            Andytown: 'Andytown Coffee',
            BiRite: 'Bi-Rite Market',
            Tartine: 'Tartine Bakery',
            FeatherFarm: 'Feather & Comb Farm',
            EcoSanct: 'EcoSanctuary Cleaning',
          };

          const foundKey = Object.keys(fallbackNames).find(
            (key) => rawId.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(rawId.toLowerCase())
          );

          if (foundKey) {
            name = fallbackNames[foundKey];
            avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundKey}`;
            role = foundKey.includes('Farm') || foundKey.includes('Market') ? 'Zero-Waste Partner' : 'Compost Artisan';
            verified = true;
          } else {
            // Seed name from the rawId itself
            name = rawId.charAt(0).toUpperCase() + rawId.slice(1);
          }
        }

        // Calculate stats dynamically
        const listingsPosted = userListings.length;
        const requestsFulfilled = userRequests.filter((r) => r.status !== 'open').length;
        const totalKg = userListings.reduce((sum, l) => sum + l.quantity, 0) + 
                         userRequests.reduce((sum, r) => sum + r.minQuantity, 0);
        
        const kgDiverted = totalKg > 0 ? Number(totalKg.toFixed(1)) : 12.5; // default fallback if brand new
        const co2Saved = Number((kgDiverted * 0.5).toFixed(1));
        const points = Math.round(kgDiverted * 10 + requestsFulfilled * 30 + listingsPosted * 15);

        setProfile({
          name,
          avatar,
          role,
          city,
          points,
          kgDiverted,
          co2Saved,
          joined,
          verified,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve profile data.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfileData();
  }, [rawId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-sm text-[#A3A3A3]">
        <div className="space-y-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2A4A10] border-t-[#A8D97F] mx-auto" />
          <p>Syncing circular node profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#FFFFFF]">
        <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] hover:bg-white/8 transition cursor-pointer"
          >
            Back
          </button>
          <span className="font-display text-lg font-bold tracking-tight">User Profile</span>
          <span className="w-13" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <span className="text-4xl mb-4">👤</span>
          <h3 className="font-display text-lg font-bold">User profile not found</h3>
          <p className="text-xs text-[#A3A3A3] mt-2 max-w-xs">{error ?? 'This circular node has not been registered yet.'}</p>
          <button 
            onClick={() => router.push('/home')}
            className="mt-6 rounded-lg bg-[#2A4A10] px-4 py-2 text-xs font-bold text-[#A8D97F] cursor-pointer"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-[#0A0A0A] text-[#FFFFFF] min-h-screen">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] hover:bg-white/8 transition cursor-pointer"
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
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
                    {profile.name}
                  </h2>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 self-center md:self-auto rounded bg-[#2A4A10] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#A8D97F] uppercase border border-[#A8D97F]/10">
                      <ShieldCheck size={11} />
                      <span>Verified Circular Node</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A3A3A3] mt-1 font-semibold">{profile.role} · {profile.city}</p>
              </div>

              <button
                onClick={() => alert(`Direct messaging to ${profile.name} will be connected in the next platform release.`)}
                className="rounded-xl bg-[#A8D97F] px-5 py-2.5 text-xs font-black text-[#1A3A05] hover:brightness-105 transition flex items-center justify-center gap-2 self-center md:self-auto cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>Message Node</span>
              </button>
            </div>

            <div className="text-xs text-[#A3A3A3] font-bold">
              Joined {profile.joined}
            </div>
          </div>
        </div>

        {/* stats dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Scale size={18} className="text-[#A8D97F] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#FFFFFF]">{profile.kgDiverted} kg</div>
            <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Scraps Diverted</div>
          </div>

          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Heart size={18} className="text-[#E8A838] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#FFFFFF]">{profile.co2Saved} kg</div>
            <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">CO2 Mitigated</div>
          </div>

          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Award size={18} className="text-[#4ECDC4] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#FFFFFF]">{profile.points} XP</div>
            <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Community Score</div>
          </div>

          <div className="bg-[#141414] p-4 rounded-2xl border border-white/6 text-center">
            <Calendar size={18} className="text-[#C4F09A] mx-auto mb-2" />
            <div className="font-mono text-lg font-black text-[#C4F09A]">{listings.length + requests.length}</div>
            <div className="text-[10px] font-bold text-[#A3A3A3] uppercase mt-0.5">Active Posts</div>
          </div>

        </div>

        {/* Display active listings and requests */}
        <div className="space-y-6">
          {listings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">Available Donations ({listings.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          )}

          {requests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">Active Material Appeals ({requests.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {requests.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          )}

          {listings.length === 0 && requests.length === 0 && (
            <div className="py-12 text-center text-xs text-[#525252] bg-[#141414] border border-white/6 rounded-2xl">
              🍂 This node doesn&apos;t have any active public listings or appeals right now.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
