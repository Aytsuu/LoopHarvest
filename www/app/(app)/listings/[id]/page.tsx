'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Scale, User, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import CategoryChip from '@/components/common/CategoryChip';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel } from '@/lib/api/mappers';
import type { Listing } from '@/lib/api/types';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const { data: listing, isLoading, error: queryError } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const data = await apiClient.getListing(id);
      return toListingCardModel(data);
    },
    enabled: !!id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser().catch(() => null),
  });

  const isOwner = currentUser && listing ? currentUser.id === listing.donorId : false;
  const isRecipient = currentUser && listing ? currentUser.id === listing.claimedBy : false;
  const canComplete = listing && listing.status === 'claimed' && (isOwner || isRecipient);
  const canMessageClaimParticipant = !!listing && listing.claimType === 'direct' && listing.status === 'claimed' && (isOwner || isRecipient);

  const handleMessageDonor = () => {
    if (!listing) return;
    router.push(
      `/chat?listingId=${listing.id}&recipientId=${listing.donorId}&recipientName=${encodeURIComponent(listing.donorName)}&recipientAvatar=${encodeURIComponent(listing.donorAvatar)}`
    );
  };

  const handleMessageClaimParticipant = () => {
    if (!listing || !currentUser) {
      return;
    }

    const recipientId = isOwner ? listing.claimedBy : listing.donorId;
    if (!recipientId) {
      return;
    }

    const recipientName = isOwner ? 'Recipient' : listing.donorName;
    const recipientAvatar = isOwner ? '' : listing.donorAvatar;

    router.push(
      `/chat?listingId=${listing.id}&recipientId=${recipientId}&recipientName=${encodeURIComponent(recipientName)}&recipientAvatar=${encodeURIComponent(recipientAvatar)}`
    );
  };

  const displayError = error || (queryError instanceof Error ? queryError.message : queryError ? 'Unable to load this listing.' : null);

  const claimMutation = useMutation({
    mutationFn: () => apiClient.claimListing(id),
    onMutate: async () => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['listing', id] });
      const previousListing = queryClient.getQueryData<Listing>(['listing', id]);

      queryClient.setQueryData<Listing>(['listing', id], (old) =>
        old ? { ...old, status: 'claimed' } : undefined
      );

      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Listing claimed.' }));
      return { previousListing };
    },
    onError: (err, variables, context) => {
      if (context?.previousListing) {
        queryClient.setQueryData(['listing', id], context.previousListing);
      }
      setError(err instanceof Error ? err.message : 'Unable to claim this listing.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['listing', id] });
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  const handleClaim = () => {
    claimMutation.mutate();
  };

  const completeMutation = useMutation({
    mutationFn: () => apiClient.completeListing(id),
    onMutate: async () => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['listing', id] });
      const previousListing = queryClient.getQueryData<Listing>(['listing', id]);

      queryClient.setQueryData<Listing>(['listing', id], (old) =>
        old ? { ...old, status: 'completed' } : undefined
      );

      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Loop finalized! Handoff completed. +25 XP' }));
      return { previousListing };
    },
    onError: (err, variables, context) => {
      if (context?.previousListing) {
        queryClient.setQueryData(['listing', id], context.previousListing);
      }
      setError(err instanceof Error ? err.message : 'Unable to complete this listing handoff.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['listing', id] });
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  if (displayError && !listing) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-6 text-[#FFFFFF]">
        <button onClick={() => router.back()} className="mb-6 w-fit rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold">
          Back
        </button>
        <div className="rounded-2xl border border-[#E05656]/30 bg-[#7A1010]/20 p-6 text-sm text-[#FFB4AB]">{displayError}</div>
      </div>
    );
  }

  if (isLoading || !listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-sm text-[#A3A3A3]">
        Loading listing...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-36 md:pb-12">
        <button onClick={() => router.back()} className="mb-6 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white/4">
          Back
        </button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Core Listing Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Horizontal Stepper Progress Tracker */}
            <div className="rounded-2xl border border-white/6 bg-[#141414] p-6 shadow-lg space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-24 w-24 rounded-full bg-[#A8D97F]/5 blur-2xl pointer-events-none select-none" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black tracking-wider text-[#A8D97F] uppercase">Harvest Circular Loop</h2>
                  <p className="text-[10px] text-[#8C8F7E] font-medium mt-0.5">Tracking the journey of this organic matter</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  listing.status === 'open' 
                    ? 'bg-[#A8D97F]/10 text-[#A8D97F]' 
                    : listing.status === 'claimed' 
                    ? 'bg-[#E8A838]/10 text-[#E8A838]' 
                    : 'bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/10'
                }`}>
                  {listing.status === 'open' ? 'Step 1: Open' : listing.status === 'claimed' ? 'Step 2: Claimed' : 'Step 3: Completed'}
                </span>
              </div>

              {/* Progress Line and Nodes */}
              <div className="relative flex items-center justify-between">
                {/* Connecting Progress Lines */}
                <div className="absolute left-10 right-10 top-5 h-0.5 bg-[#222222] -translate-y-1/2 z-0">
                  <div 
                    className="h-full bg-gradient-to-r from-[#A8D97F] to-[#E8A838] transition-all duration-500" 
                    style={{ 
                      width: listing.status === 'open' ? '0%' : listing.status === 'claimed' ? '50%' : '100%',
                      background: listing.status === 'completed' ? 'linear-gradient(to right, #A8D97F, #E8A838, #4ECDC4)' : undefined
                    }}
                  />
                </div>

                {/* Step 1: Posted */}
                <div className="flex flex-col items-center text-center z-10 w-24">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    listing.status === 'open' 
                      ? 'border-[#A8D97F] bg-[#1A3A05] text-[#A8D97F] shadow-[0_0_12px_rgba(168,217,127,0.3)]' 
                      : 'border-[#A8D97F] bg-[#2A4A10] text-[#FFFFFF]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
                  </div>
                  <span className="text-[10px] font-black text-[#FFFFFF] mt-2 block">1. Posted</span>
                  <span className="text-[9px] text-[#8C8F7E] font-medium leading-tight block mt-0.5">Available online</span>
                </div>

                {/* Step 2: Claimed */}
                <div className="flex flex-col items-center text-center z-10 w-24">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    listing.status === 'open' 
                      ? 'border-white/10 bg-[#141414] text-[#525252]' 
                      : listing.status === 'claimed'
                      ? 'border-[#E8A838] bg-[#4D3105] text-[#E8A838] shadow-[0_0_12px_rgba(232,168,56,0.3)]'
                      : 'border-[#E8A838] bg-[#6E4E0A] text-[#FFFFFF]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <span className={`text-[10px] font-black mt-2 block ${listing.status === 'open' ? 'text-[#525252]' : 'text-[#FFFFFF]'}`}>2. Claimed</span>
                  <span className="text-[9px] text-[#8C8F7E] font-medium leading-tight block mt-0.5">Coordinating handoff</span>
                </div>

                {/* Step 3: Loop Established */}
                <div className="flex flex-col items-center text-center z-10 w-24">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    listing.status !== 'completed' 
                      ? 'border-white/10 bg-[#141414] text-[#525252]' 
                      : 'border-[#4ECDC4] bg-[#0E3E3B] text-[#4ECDC4] shadow-[0_0_12px_rgba(78,205,196,0.3)]'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
                  </div>
                  <span className={`text-[10px] font-black mt-2 block ${listing.status !== 'completed' ? 'text-[#525252]' : 'text-[#FFFFFF]'}`}>3. Loop Closed</span>
                  <span className="text-[9px] text-[#8C8F7E] font-medium leading-tight block mt-0.5">Organic recycled!</span>
                </div>
              </div>
            </div>

            {/* Finalize Handoff Completion Banner */}
            {canComplete && (
              <div className="rounded-2xl border border-[#A8D97F]/20 bg-[#1A3A05]/20 p-6 space-y-4 shadow-lg animate-fade-in relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 h-20 w-24 rounded-full bg-[#A8D97F]/5 blur-xl pointer-events-none select-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black tracking-wider text-[#A8D97F] uppercase">Confirm Loop Finalization</h3>
                    <p className="text-[11px] text-[#8C8F7E] leading-relaxed font-medium">
                      Has the organic matter successfully reached its destination? Mark the handoff completed to close the circular loop!
                    </p>
                  </div>
                  <button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="h-10 px-5 shrink-0 rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] transition duration-200 hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#A8D97F]/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {completeMutation.isPending ? 'Closing loop...' : 'Establish Circular Loop'}
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-white/6 bg-[#141414] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.photo} alt={listing.title} className="aspect-video w-full object-cover" />
              <div className="space-y-4 p-6">
                <CategoryChip categorySlug={listing.category} interactive={false} />
                <h1 className="font-display text-2xl font-extrabold tracking-tight">{listing.title}</h1>
                <p className="text-sm text-[#A3A3A3] leading-relaxed">{listing.description}</p>
              </div>
            </div>

            {displayError && (
              <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
                {displayError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <Scale size={18} className="mb-2 text-[#A8D97F]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Quantity</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">{listing.quantity} {listing.unit}</span>
              </div>
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <MapPin size={18} className="mb-2 text-[#E8A838]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Pickup</span>
                <span className="block text-sm font-black text-[#FFFFFF]">{listing.city}</span>
                <span className="mt-1 block text-xs leading-relaxed text-[#A3A3A3]">{listing.pickupAddress}</span>
              </div>
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <Calendar size={18} className="mb-2 text-[#A8D97F]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Posted</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">{listing.timeAgo}</span>
              </div>
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <User size={18} className="mb-2 text-[#C4F09A]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Donor</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">{listing.donorName}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Desktop Action Sidebar */}
          <div className="hidden md:block">
            <div className="sticky top-6 rounded-2xl border border-white/6 bg-[#141414] p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">Listing Status</h3>
                <p className="text-xs text-[#8C8F7E] font-medium">
                  {listing.status === 'open' 
                    ? 'Available for pickup' 
                    : listing.status === 'claimed' 
                    ? 'Claimed & Coordinating' 
                    : 'Circular Loop Closed!'}
                </p>
              </div>

              {listing.status === 'claimed' && canMessageClaimParticipant ? (
                <button
                  onClick={handleMessageClaimParticipant}
                  className="h-11 w-full rounded-xl bg-[#2A4A10] border border-[#A8D97F]/20 text-xs font-black text-[#A8D97F] transition duration-200 hover:bg-[#2A4A10]/80 hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>{isOwner ? 'Message Recipient' : 'Message Donor'}</span>
                </button>
              ) : isOwner ? (
                <button disabled className="h-11 w-full rounded-xl bg-[#222222] border border-white/10 text-xs font-bold text-[#A3A3A3] opacity-80 cursor-not-allowed">
                  Your Listing
                </button>
              ) : listing.status === 'open' ? (
                listing.claimType === 'message' ? (
                  <button
                    onClick={handleMessageDonor}
                    className="h-11 w-full rounded-xl bg-[#2A4A10] border border-[#A8D97F]/20 text-xs font-black text-[#A8D97F] transition duration-200 hover:bg-[#2A4A10]/80 hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>Message Donor</span>
                  </button>
                ) : (
                  <button
                    onClick={() => void handleClaim()}
                    disabled={claimMutation.isPending}
                    className="h-11 w-full rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] transition duration-200 hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#A8D97F]/10 cursor-pointer"
                  >
                    {claimMutation.isPending ? 'Claiming...' : 'Claim Listing'}
                  </button>
                )
              ) : listing.status === 'claimed' ? (
                <button disabled className="h-11 w-full rounded-xl bg-[#2A4A10] text-xs font-black text-[#87B85E] opacity-60 cursor-not-allowed">
                  Already Claimed
                </button>
              ) : (
                <button disabled className="h-11 w-full rounded-xl bg-[#0E3E3B] text-xs font-black text-[#4ECDC4] opacity-80 cursor-not-allowed">
                  Loop Closed 🎉
                </button>
              )}

              <div className="border-t border-white/6 pt-4 space-y-2">
                <span className="block text-[9px] font-bold text-[#8C8F7E] uppercase tracking-wider">Donor Details</span>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C4F09A]/10 text-[#C4F09A] font-black text-[10px]">
                    {listing.donorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold text-[#FFFFFF] truncate">{listing.donorName}</span>
                    <span className="block text-[9px] text-[#8C8F7E] font-medium truncate">LoopHarvest Member</span>
                  </div>
                </div>
                <div className="pt-2 text-[9px] text-[#8C8F7E] leading-relaxed font-medium">
                  By claiming this listing, you commit to establishing a safe compost loop by collecting the materials from <span className="text-[#FFFFFF]">{listing.city}</span> in a timely manner.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating CTA Footer */}
      <div className="fixed bottom-24 left-4 right-4 z-40 md:hidden rounded-2xl border border-white/8 bg-[#141414]/90 backdrop-blur-md p-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 animate-scale-in">
        <div className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Quantity</span>
          <span className="block text-xs font-black font-mono text-[#FFFFFF]">{listing.quantity} {listing.unit}</span>
        </div>
        
        {listing.status === 'claimed' && canMessageClaimParticipant ? (
          <button
            onClick={handleMessageClaimParticipant}
            className="h-10 px-5 rounded-xl bg-[#2A4A10] border border-[#A8D97F]/20 text-xs font-black text-[#A8D97F] transition hover:brightness-105 active:scale-[0.98] shrink-0 cursor-pointer flex items-center gap-1"
          >
            <MessageSquare size={12} />
            <span>{isOwner ? 'Message Recipient' : 'Message Donor'}</span>
          </button>
        ) : isOwner ? (
          <button disabled className="h-10 px-5 rounded-xl bg-[#222222] border border-white/10 text-xs font-bold text-[#A3A3A3] opacity-80 cursor-not-allowed shrink-0">
            Your Listing
          </button>
        ) : listing.status === 'open' ? (
          listing.claimType === 'message' ? (
            <button
              onClick={handleMessageDonor}
              className="h-10 px-5 rounded-xl bg-[#2A4A10] border border-[#A8D97F]/20 text-xs font-black text-[#A8D97F] transition hover:brightness-105 active:scale-[0.98] shrink-0 cursor-pointer flex items-center gap-1"
            >
              <MessageSquare size={12} />
              <span>Message</span>
            </button>
          ) : (
            <button
              onClick={() => void handleClaim()}
              disabled={claimMutation.isPending}
              className="h-10 px-5 rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] shadow-lg transition active:scale-[0.98] shrink-0 cursor-pointer"
            >
              {claimMutation.isPending ? 'Claiming...' : 'Claim'}
            </button>
          )
        ) : listing.status === 'claimed' ? (
          <button disabled className="h-10 px-5 rounded-xl bg-[#2A4A10] text-xs font-black text-[#87B85E] opacity-60 shrink-0 cursor-not-allowed">
            Claimed
          </button>
        ) : (
          <button disabled className="h-10 px-5 rounded-xl bg-[#0E3E3B] text-xs font-black text-[#4ECDC4] opacity-80 shrink-0 cursor-not-allowed">
            Completed
          </button>
        )}
      </div>
    </main>
  );
}
