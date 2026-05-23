'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Scale, User } from 'lucide-react';
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
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Location</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">{listing.city}</span>
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
                  {listing.status === 'open' ? 'Available for pickup' : 'Already claimed'}
                </p>
              </div>

              {listing.status === 'open' ? (
                <button
                  onClick={() => void handleClaim()}
                  disabled={claimMutation.isPending}
                  className="h-11 w-full rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] transition duration-200 hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#A8D97F]/10 cursor-pointer"
                >
                  {claimMutation.isPending ? 'Claiming...' : 'Claim Listing'}
                </button>
              ) : (
                <button disabled className="h-11 w-full rounded-xl bg-[#2A4A10] text-xs font-black text-[#87B85E] opacity-60 cursor-not-allowed">
                  Already Claimed
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
        
        {listing.status === 'open' ? (
          <button
            onClick={() => void handleClaim()}
            disabled={claimMutation.isPending}
            className="h-10 px-5 rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] shadow-lg transition active:scale-[0.98] shrink-0 cursor-pointer"
          >
            {claimMutation.isPending ? 'Claiming...' : 'Claim'}
          </button>
        ) : (
          <button disabled className="h-10 px-5 rounded-xl bg-[#2A4A10] text-xs font-black text-[#87B85E] opacity-60 shrink-0 cursor-not-allowed">
            Claimed
          </button>
        )}
      </div>
    </main>
  );
}
