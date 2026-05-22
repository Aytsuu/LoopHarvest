'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Award, Calendar, MapPin, MessageSquare, Scale } from 'lucide-react';

import { useCategories } from '@/components/common/CategoriesProvider';
import { apiClient } from '@/lib/api/client';
import { toRequestCardModel } from '@/lib/api/mappers';
import CategoryChip from '@/components/common/CategoryChip';
import type { RequestItem } from '@/lib/api/types';

export default function RequestDetailPage() {
  const { getCategory } = useCategories();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [request, setRequest] = React.useState<RequestItem | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadRequest = async () => {
      try {
        setError(null);
        const requestRow = await apiClient.getRequest(id);
        setRequest(toRequestCardModel(requestRow));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this request.');
      }
    };

    if (id) {
      void loadRequest();
    }
  }, [id]);

  const handleFulfill = async () => {
    if (!request) return;

    try {
      await apiClient.fulfillRequest(request.id);
      window.dispatchEvent(new CustomEvent('post-created', {
        detail: `Successfully offered to fulfill ${request.requesterName}'s appeal!`
      }));
      const requestRow = await apiClient.getRequest(request.id);
      setRequest(toRequestCardModel(requestRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fulfill this request.');
    }
  };

  if (error && !request) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-6 text-[#FFFFFF]">
        <button onClick={() => router.back()} className="mb-6 w-fit rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold">
          Back
        </button>
        <div className="rounded-2xl border border-[#E05656]/30 bg-[#7A1010]/20 p-6 text-sm text-[#FFB4AB]">{error}</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-sm text-[#A3A3A3]">
        Loading request...
      </div>
    );
  }

  const category = getCategory(request.category);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-32">
        <button onClick={() => router.back()} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold">
          Back
        </button>

        <div className="rounded-2xl border border-white/6 bg-[#141414] p-6">
          <div className="mb-4 flex items-center justify-between">
            <CategoryChip categorySlug={request.category} interactive={false} />
            <div className="rounded-xl border border-[#E8A838]/30 bg-[#4A3200] px-3 py-1 text-xs font-black uppercase text-[#FFDF9E]">
              {request.frequency}
            </div>
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{request.title}</h1>
          <p className="mt-2 text-sm text-[#A3A3A3]">{request.description}</p>
        </div>

        {error && (
          <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <Scale size={18} className="mb-2 text-[#4ECDC4]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Requested Range</span>
            <span className="font-mono text-base font-black text-[#FFFFFF]">{request.minQuantity}-{request.maxQuantity} {request.unit}</span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <MapPin size={18} className="mb-2 text-[#E8A838]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Location</span>
            <span className="font-mono text-base font-black text-[#FFFFFF]">{request.city}</span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <Calendar size={18} className="mb-2 text-[#A8D97F]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Cadence</span>
            <span className="font-mono text-base font-black text-[#FFFFFF] capitalize">{request.frequency}</span>
          </div>
          <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
            <Award size={18} className="mb-2 text-[#7EF8EF]" />
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Category</span>
            <span className="font-mono text-base font-black text-[#FFFFFF]">{category?.label ?? 'Other'}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/6 bg-[#141414] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={request.requesterAvatar} alt={request.requesterName} className="h-11 w-11 rounded-full border border-white/10" />
              <div>
                <h4 className="text-sm font-bold text-[#FFFFFF]">{request.requesterName}</h4>
                <span className="text-xs text-[#A3A3A3]">{request.timeAgo}</span>
              </div>
            </div>
            <button className="rounded-lg border border-white/10 bg-white/4 p-2.5 text-[#FFFFFF]">
              <MessageSquare size={18} />
            </button>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/6 bg-[#141414] px-6 py-4">
        {request.status === 'open' ? (
          <button
            onClick={() => void handleFulfill()}
            className="h-12 w-full rounded-xl bg-[#4ECDC4] text-sm font-black text-[#003733]"
          >
            Fulfill this Appeal
          </button>
        ) : (
          <button disabled className="h-12 w-full rounded-xl bg-[#004D48] text-sm font-black text-[#4ECDC4] opacity-70">
            Appeal Already Filled
          </button>
        )}
      </footer>
    </main>
  );
}
