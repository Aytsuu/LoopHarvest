'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Lock, Check, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Listing } from '@/lib/api/types';
import CategoryChip from '../common/CategoryChip';

interface ListingCardProps {
  listing: Listing;
  onClaim?: (id: string) => void;
  onClick?: () => void;
  hideImage?: boolean;
}

export default function ListingCard({ listing, onClaim, onClick, hideImage = false }: ListingCardProps) {
  const router = useRouter();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser().catch(() => null),
  });

  const isOwner = currentUser && listing ? currentUser.id === listing.donorId : false;

  return (
    <article
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          router.push(`/listings/${listing.id}`);
        }
      }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/6 bg-[#141414] text-[#FFFFFF] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#1B1B1B] hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] cursor-pointer"
    >
      {/* Photo header (16:9, bleeds) */}
      {!hideImage && (
        <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.photo}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Category Floating tag */}
          <div className="absolute left-3 top-3">
            <CategoryChip categorySlug={listing.category} interactive={false} />
          </div>
        </div>
      )}

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-4">
        {hideImage ? (
          <div className="flex items-center justify-between gap-2 text-xs text-[#A3A3A3]">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>{listing.timeAgo}</span>
            </div>
            <CategoryChip categorySlug={listing.category} interactive={false} />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
            <Clock size={12} />
            <span>{listing.timeAgo}</span>
          </div>
        )}

        <h3 className="mt-1 font-display text-lg font-bold leading-snug text-[#FFFFFF] line-clamp-1 group-hover:text-[#A8D97F]">
          {listing.title}
        </h3>

        <div className="mt-2 flex items-center justify-between text-xs text-[#A3A3A3]">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-[#A8D97F]" />
            <span>{listing.city} · {listing.distance} km</span>
          </div>
          {/* Quantity Badge */}
          <span className="rounded bg-[#2A4A10] px-2 py-0.5 font-mono text-[10px] font-black tracking-wider text-[#C4F09A]">
            {listing.quantity} {listing.unit}
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-[#8C8F7E] line-clamp-2">
          {listing.pickupAddress}
        </p>

        {/* Action Button Section */}
        {listing.status === 'open' && (
          <div className="mt-4 pt-3 border-t border-white/6">
            {isOwner ? (
              <button
                disabled
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-lg bg-[#1F1F1F] border border-white/5 py-2 text-center text-xs font-bold text-[#6F6F6F] cursor-not-allowed opacity-80"
              >
                Your Listing
              </button>
            ) : listing.claimType === 'message' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(
                    `/chat?listingId=${listing.id}&recipientId=${listing.donorId}&recipientName=${encodeURIComponent(listing.donorName)}&recipientAvatar=${encodeURIComponent(listing.donorAvatar || '')}`
                  );
                }}
                className="w-full rounded-lg bg-[#2A4A10] border border-[#A8D97F]/25 py-2 text-center text-xs font-bold text-[#A8D97F] transition duration-200 hover:bg-[#2A4A10]/80 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={12} />
                <span>Message Donor</span>
              </button>
            ) : onClaim ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim(listing.id);
                }}
                className="w-full rounded-lg bg-[#A8D97F] py-2 text-center text-xs font-bold text-[#1A3A05] transition-transform hover:brightness-105 active:scale-[0.98]"
              >
                Claim Listing
              </button>
            ) : null}
          </div>
        )}

        {/* Claim Status Footer Section */}
        {listing.status !== 'open' && (
          <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-center text-xs">
            <div className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-white/40 tracking-wider`}>
              {listing.status === 'claimed' && <Lock size={10}/>}
              {listing.status === 'completed' && <Check size={10}/>}
              <span>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
