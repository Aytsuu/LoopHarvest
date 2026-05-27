'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Award, Calendar, CheckCircle2, Loader2, MapPin, MessageSquare, Scale } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const { data: request, isLoading, error: queryError } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const data = await apiClient.getRequest(id);
      return toRequestCardModel(data);
    },
    enabled: !!id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser().catch(() => null),
  });

  const isRequester = currentUser?.id === request?.requesterId;
  const isFulfiller = currentUser?.id === request?.fulfilledBy;
  const canCloseLoop = request?.status === 'claimed' && isRequester;
  const canCancelFulfillment = request?.status === 'claimed' && (isRequester || isFulfiller);
  const canMessageRequester = !!request && !!currentUser && !isRequester;

  const handleMessageRequester = React.useCallback(() => {
    if (!request) {
      return;
    }

    router.push(
      `/chat?recipientId=${request.requesterId}&recipientName=${encodeURIComponent(request.requesterName)}&recipientAvatar=${encodeURIComponent(request.requesterAvatar)}`,
    );
  }, [request, router]);

  const displayError = error || (queryError instanceof Error ? queryError.message : queryError ? 'Unable to load this request.' : null);

  const fulfillMutation = useMutation({
    mutationFn: () => apiClient.fulfillRequest(id),
    onMutate: async () => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['request', id] });
      const previousRequest = queryClient.getQueryData<RequestItem>(['request', id]);

      queryClient.setQueryData<RequestItem>(['request', id], (old) =>
        old ? { ...old, status: 'claimed' } : undefined
      );

      window.dispatchEvent(new CustomEvent('post-created', {
        detail: `Successfully offered to fulfill ${request?.requesterName ?? 'composter'}'s appeal!`
      }));
      return { previousRequest };
    },
    onError: (err, variables, context) => {
      if (context?.previousRequest) {
        queryClient.setQueryData(['request', id], context.previousRequest);
      }
      setError(err instanceof Error ? err.message : 'Unable to fulfill this request.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['request', id] });
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  const handleFulfill = () => {
    fulfillMutation.mutate();
  };

  const closeMutation = useMutation({
    mutationFn: () => apiClient.closeRequest(id),
    onMutate: async () => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['request', id] });
      const previousRequest = queryClient.getQueryData<RequestItem>(['request', id]);

      queryClient.setQueryData<RequestItem>(['request', id], (old) =>
        old ? { ...old, status: 'completed' } : undefined,
      );

      window.dispatchEvent(new CustomEvent('post-created', {
        detail: 'Request loop closed.',
      }));
      return { previousRequest };
    },
    onError: (err, variables, context) => {
      if (context?.previousRequest) {
        queryClient.setQueryData(['request', id], context.previousRequest);
      }
      setError(err instanceof Error ? err.message : 'Unable to close this request loop.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['request', id] });
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.cancelRequestFulfillment(id),
    onMutate: async () => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ['request', id] });
      const previousRequest = queryClient.getQueryData<RequestItem>(['request', id]);

      queryClient.setQueryData<RequestItem>(['request', id], (old) =>
        old ? { ...old, status: 'open' } : undefined,
      );

      window.dispatchEvent(new CustomEvent('post-created', {
        detail: 'Request fulfillment cancelled.',
      }));
      return { previousRequest };
    },
    onError: (err, variables, context) => {
      if (context?.previousRequest) {
        queryClient.setQueryData(['request', id], context.previousRequest);
      }
      setError(err instanceof Error ? err.message : 'Unable to cancel this request fulfillment.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['request', id] });
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  if (displayError && !request) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0A] px-4 py-6 text-[#FFFFFF]">
        <button onClick={() => router.back()} className="mb-6 w-fit rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold cursor-pointer">
          Back
        </button>
        <div className="rounded-2xl border border-[#E05656]/30 bg-[#7A1010]/20 p-6 text-sm text-[#FFB4AB]">{displayError}</div>
      </div>
    );
  }

  if (isLoading || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-sm text-[#A3A3A3]">
        Loading request...
      </div>
    );
  }

  const category = getCategory(request.category);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-36 md:pb-12">
        <button onClick={() => router.back()} className="mb-6 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white/4 cursor-pointer">
          Back
        </button>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Core Request Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/6 bg-[#141414] p-6 shadow-lg space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-24 w-24 rounded-full bg-[#A8D97F]/5 blur-2xl pointer-events-none select-none" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black tracking-wider text-[#A8D97F] uppercase">Request Progress</h2>
                  <p className="text-[10px] text-[#8C8F7E] font-medium mt-0.5">Track this appeal from posting to closed loop</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  request.status === 'open'
                    ? 'bg-[#A8D97F]/10 text-[#A8D97F]'
                    : request.status === 'claimed'
                      ? 'bg-[#E8A838]/10 text-[#E8A838]'
                      : 'bg-[#4ECDC4]/10 text-[#4ECDC4] border border-[#4ECDC4]/10'
                }`}>
                  {request.status === 'open' ? 'Step 1: Posted' : request.status === 'claimed' ? 'Step 2: Fulfilling' : 'Step 3: Loop Closed'}
                </span>
              </div>

              <div className="relative flex items-center justify-between">
                <div className="absolute left-10 right-10 top-5 h-0.5 bg-[#222222] -translate-y-1/2 z-0">
                  <div
                    className="h-full bg-gradient-to-r from-[#A8D97F] to-[#E8A838] transition-all duration-500"
                    style={{
                      width: request.status === 'open' ? '0%' : request.status === 'claimed' ? '50%' : '100%',
                      background: request.status === 'completed'
                        ? 'linear-gradient(to right, #A8D97F, #E8A838, #4ECDC4)'
                        : undefined,
                    }}
                  />
                </div>

                <div className="flex flex-col items-center text-center z-10 w-24">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    request.status === 'open'
                      ? 'border-[#A8D97F] bg-[#1A3A05] text-[#A8D97F] shadow-[0_0_12px_rgba(168,217,127,0.3)]'
                      : 'border-[#A8D97F] bg-[#2A4A10] text-[#FFFFFF]'
                  }`}>
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[10px] font-black text-[#FFFFFF] mt-2 block">1. Posted</span>
                  <span className="text-[9px] text-[#8C8F7E] font-medium leading-tight block mt-0.5">Appeal is live</span>
                </div>

                <div className="flex flex-col items-center text-center z-10 w-24">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    request.status === 'open'
                      ? 'border-white/10 bg-[#141414] text-[#525252]'
                      : request.status === 'claimed'
                        ? 'border-[#E8A838] bg-[#4D3105] text-[#E8A838] shadow-[0_0_12px_rgba(232,168,56,0.3)]'
                        : 'border-[#E8A838] bg-[#6E4E0A] text-[#FFFFFF]'
                  }`}>
                    <MessageSquare size={16} />
                  </div>
                  <span className={`text-[10px] font-black mt-2 block ${request.status === 'open' ? 'text-[#525252]' : 'text-[#FFFFFF]'}`}>2. Fulfilling</span>
                  <span className="text-[9px] text-[#8C8F7E] font-medium leading-tight block mt-0.5">Coordinating delivery</span>
                </div>

                <div className="flex flex-col items-center text-center z-10 w-24">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    request.status !== 'completed'
                      ? 'border-white/10 bg-[#141414] text-[#525252]'
                      : 'border-[#4ECDC4] bg-[#0E3E3B] text-[#4ECDC4] shadow-[0_0_12px_rgba(78,205,196,0.3)]'
                  }`}>
                    <Award size={16} />
                  </div>
                  <span className={`text-[10px] font-black mt-2 block ${request.status !== 'completed' ? 'text-[#525252]' : 'text-[#FFFFFF]'}`}>3. Loop Closed</span>
                  <span className="text-[9px] text-[#8C8F7E] font-medium leading-tight block mt-0.5">Need fully matched</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/6 bg-[#141414] p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <CategoryChip categorySlug={request.category} interactive={false} />
                <div className="rounded-xl border border-[#E8A838]/30 bg-[#4A3200] px-3 py-1 text-xs font-black uppercase text-[#FFDF9E]">
                  {request.frequency}
                </div>
              </div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{request.title}</h1>
              <p className="mt-2 text-sm text-[#A3A3A3] leading-relaxed">{request.description}</p>
            </div>

            {displayError && (
              <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
                {displayError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <Scale size={18} className="mb-2 text-[#A8D97F]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Requested Range</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">{request.minQuantity}-{request.maxQuantity} {request.unit}</span>
              </div>
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <MapPin size={18} className="mb-2 text-[#E8A838]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Location</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">{request.city}</span>
              </div>
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <Calendar size={18} className="mb-2 text-[#A8D97F]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Cadence</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF] capitalize">{request.frequency}</span>
              </div>
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <Award size={18} className="mb-2 text-[#A8D97F]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Category</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">{category?.label ?? 'Other'}</span>
              </div>
              <div className="rounded-xl border border-white/6 bg-[#141414] p-4 transition hover:border-white/10">
                <MapPin size={18} className="mb-2 text-[#A8D97F]" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Preferred Radius</span>
                <span className="font-mono text-sm font-black text-[#FFFFFF]">Up to {request.preferredMaxDistanceKm} km</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/6 bg-[#141414] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={request.requesterAvatar} alt={request.requesterName} className="h-11 w-11 rounded-full border border-white/10" />
                  <div>
                    <h4 className="text-sm font-bold text-[#FFFFFF]">{request.requesterName}</h4>
                    <span className="text-[10px] text-[#A3A3A3] font-medium">{request.timeAgo}</span>
                  </div>
                </div>
                {canMessageRequester ? (
                  <button
                    type="button"
                    onClick={handleMessageRequester}
                    className="rounded-lg border border-[#A8D97F]/20 bg-[#2A4A10] p-2.5 text-[#A8D97F] transition hover:bg-[#315614] cursor-pointer"
                  >
                    <MessageSquare size={18} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Column: Desktop Action Sidebar */}
          <div className="hidden md:block">
            <div className="sticky top-6 rounded-2xl border border-white/6 bg-[#141414] p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">Appeal Status</h3>
                <p className="text-xs text-[#8C8F7E] font-medium">
                  {request.status === 'open' ? 'Posted and waiting for a match' : request.status === 'claimed' ? 'A supplier is fulfilling this request' : 'Loop closed and fulfilled'}
                </p>
              </div>

              {request.status === 'open' ? (
                <button
                  onClick={() => void handleFulfill()}
                  disabled={fulfillMutation.isPending || isRequester}
                  className="h-11 w-full rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] transition duration-200 hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#A8D97F]/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {fulfillMutation.isPending ? 'Fulfilling...' : isRequester ? 'Your Request' : 'Fulfill this Appeal'}
                </button>
              ) : request.status === 'claimed' ? (
                <div className="space-y-3">
                  {canCloseLoop ? (
                    <button
                      onClick={() => closeMutation.mutate()}
                      disabled={closeMutation.isPending}
                      className="h-11 w-full rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] transition duration-200 hover:brightness-105 active:scale-[0.98] shadow-md shadow-[#A8D97F]/10 cursor-pointer disabled:opacity-60"
                    >
                      {closeMutation.isPending ? 'Closing loop...' : 'Close Loop'}
                    </button>
                  ) : !canMessageRequester && !canCancelFulfillment ? (
                    <button disabled className="h-11 w-full rounded-xl bg-[#2A4A10] text-xs font-black text-[#A8D97F] opacity-70 cursor-not-allowed">
                      Fulfilling in Progress
                    </button>
                  ) : null}

                  {canMessageRequester ? (
                    <button
                      type="button"
                      onClick={handleMessageRequester}
                      className="h-11 w-full rounded-xl border border-[#A8D97F]/20 bg-[#2A4A10] text-xs font-black text-[#A8D97F] transition duration-200 hover:bg-[#315614] cursor-pointer"
                    >
                      Message Requestor
                    </button>
                  ) : null}

                  {canCancelFulfillment ? (
                    <button
                      type="button"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="h-11 w-full rounded-xl border border-[#E05656]/25 bg-[#7A1010]/20 text-xs font-black text-[#FFB4AB] transition duration-200 hover:bg-[#7A1010]/30 cursor-pointer disabled:opacity-60"
                    >
                      {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Fulfillment'}
                    </button>
                  ) : null}
                </div>
              ) : (
                <button disabled className="h-11 w-full rounded-xl bg-[#0E3E3B] text-xs font-black text-[#4ECDC4] opacity-80 cursor-not-allowed">
                  Loop Closed
                </button>
              )}

              <div className="border-t border-white/6 pt-4 space-y-2">
                <span className="block text-[9px] font-bold text-[#8C8F7E] uppercase tracking-wider">Requester Details</span>
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={request.requesterAvatar} alt={request.requesterName} className="h-7 w-7 rounded-full border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold text-[#FFFFFF] truncate">{request.requesterName}</span>
                    <span className="block text-[9px] text-[#8C8F7E] font-medium truncate">LoopHarvest Requester</span>
                  </div>
                </div>
                <div className="pt-2 text-[9px] text-[#8C8F7E] leading-relaxed font-medium">
                  By offering to fulfill this appeal, you agree to connect with <span className="text-[#FFFFFF]">{request.requesterName}</span> to coordinate delivery/drop-off of compliant organic material in <span className="text-[#FFFFFF]">{request.city}</span>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating CTA Footer */}
      <div className="fixed bottom-24 left-4 right-4 z-40 md:hidden rounded-2xl border border-white/8 bg-[#141414]/90 backdrop-blur-md p-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 animate-scale-in">
        <div className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Requested Range</span>
          <span className="block text-xs font-black font-mono text-[#FFFFFF] truncate">{request.minQuantity}-{request.maxQuantity} {request.unit}</span>
        </div>
        
        {request.status === 'open' ? (
          <button
            onClick={() => void handleFulfill()}
            disabled={fulfillMutation.isPending || isRequester}
            className="h-10 px-5 rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] shadow-lg transition active:scale-[0.98] shrink-0 cursor-pointer disabled:opacity-60"
          >
            {fulfillMutation.isPending ? 'Fulfilling...' : isRequester ? 'Your Request' : 'Fulfill'}
          </button>
        ) : request.status === 'claimed' ? (
          <div className="flex items-center gap-2 shrink-0">
            {canMessageRequester ? (
              <button
                type="button"
                onClick={handleMessageRequester}
                className="h-10 px-4 rounded-xl bg-[#2A4A10] border border-[#A8D97F]/20 text-xs font-black text-[#A8D97F] transition hover:brightness-105 active:scale-[0.98] cursor-pointer"
              >
                Message
              </button>
            ) : null}
            {canCloseLoop ? (
              <>
                <button
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                  className="h-10 px-4 rounded-xl bg-[#A8D97F] text-xs font-black text-[#1A3A05] shadow-lg transition active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  {closeMutation.isPending ? (
                    <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Closing</span>
                  ) : 'Close Loop'}
                </button>
                {canCancelFulfillment ? (
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="h-10 px-4 rounded-xl border border-[#E05656]/25 bg-[#7A1010]/20 text-xs font-black text-[#FFB4AB] transition active:scale-[0.98] cursor-pointer disabled:opacity-60"
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                  </button>
                ) : null}
              </>
            ) : canMessageRequester || canCancelFulfillment ? (
              <>
                {canCancelFulfillment ? (
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="h-10 px-4 rounded-xl border border-[#E05656]/25 bg-[#7A1010]/20 text-xs font-black text-[#FFB4AB] transition active:scale-[0.98] cursor-pointer disabled:opacity-60"
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                  </button>
                ) : null}
              </>
            ) : (
              <button disabled className="h-10 px-4 rounded-xl bg-[#2A4A10] text-xs font-black text-[#A8D97F] opacity-70 cursor-not-allowed">
                Fulfilling
              </button>
            )}
          </div>
        ) : (
          <button disabled className="h-10 px-5 rounded-xl bg-[#0E3E3B] text-xs font-black text-[#4ECDC4] opacity-80 shrink-0 cursor-not-allowed">
            Closed
          </button>
        )}
      </div>
    </main>
  );
}
