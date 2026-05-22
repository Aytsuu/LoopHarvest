'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Scale, User } from 'lucide-react';

import CategoryChip from '@/components/common/CategoryChip';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel } from '@/lib/api/mappers';
import type { Listing } from '@/lib/api/types';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = React.useState<Listing | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadListing = async () => {
      try {
        setError(null);
        const listingRow = await apiClient.getListing(id);
        setListing(toListingCardModel(listingRow));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this listing.');
      }
    };

    if (id) {
      void loadListing();
    }
  }, [id]);

  const handleClaim = async () => {
    if (!listing) return;

    try {
      await apiClient.claimListing(listing.id);
      window.dispatchEvent(new CustomEvent('post-created', { detail: 'Listing claimed.' }));
      const listingRow = await apiClient.getListing(listing.id);
      setListing(toListingCardModel(listingRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to claim this listing.');
    }
  };

  if (error && !listing) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-6 text-[#FFFFFF]">
        <button onClick={() => router.back()} className="mb-6 w-fit rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold">
          Back
        </button>
        <div className="rounded-2xl border border-[#E05656]/30 bg-[#7A1010]/20 p-6 text-sm text-[#FFB4AB]">{error}</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-sm text-[#A3A3A3]">
        Loading listing...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-32">
        <button onClick={() => router.back()} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold">
          Back
        </button>

        <div className="overflow-hidden rounded-2xl border border-white/6 bg-[#141414]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listing.photo} alt={listing.title} className="aspect-video w-full object-cover" />
          <div className="space-y-4 p-6">
            <CategoryChip categorySlug={listing.category} interactive={false} />
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{listing.title}</h1>
            <p className="text-sm text-[#A3A3A3]">{listing.description}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <Scale size={18} className="mb-2 text-[#A8D97F]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Quantity</span>
            <span className="font-mono text-base font-black text-[#FFFFFF]">{listing.quantity} {listing.unit}</span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <MapPin size={18} className="mb-2 text-[#E8A838]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Location</span>
            <span className="font-mono text-base font-black text-[#FFFFFF]">{listing.city}</span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <Calendar size={18} className="mb-2 text-[#4ECDC4]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Posted</span>
            <span className="font-mono text-base font-black text-[#FFFFFF]">{listing.timeAgo}</span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <User size={18} className="mb-2 text-[#C4F09A]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Donor</span>
            <span className="font-mono text-base font-black text-[#FFFFFF]">{listing.donorName}</span>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/6 bg-[#141414] px-6 py-4">
        {listing.status === 'open' ? (
          <button onClick={() => void handleClaim()} className="h-12 w-full rounded-xl bg-[#A8D97F] text-sm font-black text-[#1A3A05]">
            Claim Listing
          </button>
        ) : (
          <button disabled className="h-12 w-full rounded-xl bg-[#2A4A10] text-sm font-black text-[#A8D97F] opacity-70">
            Listing Not Available
          </button>
        )}
      </footer>
    </main>
  );
}
