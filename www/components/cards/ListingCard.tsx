'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Lock, Check, AlertCircle } from 'lucide-react';
import { Listing } from '@/lib/api/types';
import CategoryChip from '../common/CategoryChip';

interface ListingCardProps {
  listing: Listing;
  onClaim?: (id: string) => void;
  onClick?: () => void;
}

export default function ListingCard({ listing, onClaim, onClick }: ListingCardProps) {
  const router = useRouter();

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

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
          <Clock size={12} />
          <span>{listing.timeAgo}</span>
        </div>

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

        {/* Action Button Section */}
        {listing.status === 'open' && onClaim && (
          <div className="mt-4 pt-3 border-t border-white/6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClaim(listing.id);
              }}
              className="w-full rounded-lg bg-[#A8D97F] py-2 text-center text-xs font-bold text-[#1A3A05] transition-transform hover:brightness-105 active:scale-[0.98]"
            >
              Claim Listing
            </button>
          </div>
        )}

        {/* Claim Status Footer Section */}
        {listing.status !== 'open' && (
          <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-center text-xs">
            <div className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-white/40 tracking-wider`}>
              {listing.status === 'claimed' && <Lock size={10}/>}
              {listing.status === 'completed' && <Check size={10}/>}
              {listing.status === 'expired' && <AlertCircle size={10}/>}
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
