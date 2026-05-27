'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { RequestItem } from '@/lib/api/types';
import CategoryChip from '../common/CategoryChip';

interface RequestCardProps {
  request: RequestItem;
  onFulfill?: (id: string) => void;
  onClick?: () => void;
}

export default function RequestCard({ request, onFulfill, onClick }: RequestCardProps) {
  const router = useRouter();

  return (
    <article
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          router.push(`/requests/${request.id}`);
        }
      }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/6 bg-[#141414] p-4 text-[#FFFFFF] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#1B1B1B] hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] cursor-pointer"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CategoryChip categorySlug={request.category} interactive={false} />
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#E8A838] bg-[#4A3200] px-2 py-0.5 rounded">
            {request.frequency}
          </span>
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-[#FFFFFF] line-clamp-1 group-hover:text-[#A8D97F] mt-1">
          {request.title}
        </h3>

        <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
          {request.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={request.requesterAvatar}
            alt={request.requesterName}
            className="h-6 w-6 rounded-full border border-white/10"
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#FFFFFF]">{request.requesterName}</span>
            <span className="text-[9px] text-[#A3A3A3]">
              {request.city} | up to {request.preferredMaxDistanceKm} km
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-[#2A4A10] px-2 py-0.5 font-mono text-[10px] font-black text-[#C4F09A]">
            {request.minQuantity}-{request.maxQuantity} {request.unit}
          </span>
          {request.status === 'open' && onFulfill ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFulfill(request.id);
              }}
              className="rounded-lg bg-[#A8D97F] px-3 py-1.5 text-xs font-bold text-[#1A3A05] transition hover:brightness-105 active:scale-[0.98] cursor-pointer"
            >
              Fulfill
            </button>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/4 text-[#A8D97F] group-hover:bg-[#A8D97F] group-hover:text-[#1A3A05] transition-all">
              <ArrowRight size={14} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
