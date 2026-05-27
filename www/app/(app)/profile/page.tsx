'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import MyProfileStats from '@/components/settings/my-profile-stats';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel, toRequestCardModel, toUserStats } from '@/lib/api/mappers';
import type { ApiListing, ApiRequest, UserStats } from '@/lib/api/types';
import { createClient } from '@/lib/supabase/client';
import { isGeneratedAvatarUrl } from '@/lib/users/avatar';

const EMPTY_STATS: UserStats = {
  kgDiverted: 0,
  co2Saved: 0,
  waterSaved: 0,
  listingsPosted: 0,
  requestsFulfilled: 0,
  loopPoints: 0,
};

function formatJoinedLabel(value: string | null | undefined) {
  if (!value) {
    return 'Joined recently';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Joined recently';
  }

  return `Joined ${parsed.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests' | 'claims'>('listings');

  const triggerNotification = React.useCallback((message: string) => {
    window.dispatchEvent(new CustomEvent('post-created', { detail: message }));
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const dbUser = await apiClient.getCurrentUser();
      const supabase = createClient();
      const { data: { user: sessionUser } } = await supabase.auth.getUser();

      const identities = (sessionUser as { identities?: Array<{ identity_data?: Record<string, unknown> | null }> } | null)?.identities ?? [];
      let providerAvatarUrl: string | null = null;

      for (const identity of identities) {
        const identityData = identity.identity_data;
        if (!identityData) {
          continue;
        }

        const avatarUrl = identityData.avatar_url;
        if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
          providerAvatarUrl = avatarUrl;
          break;
        }

        const picture = identityData.picture;
        if (typeof picture === 'string' && picture.trim()) {
          providerAvatarUrl = picture;
          break;
        }
      }

      if (!providerAvatarUrl) {
        const metadataAvatarUrl = sessionUser?.user_metadata?.avatar_url;
        providerAvatarUrl = typeof metadataAvatarUrl === 'string' && metadataAvatarUrl.trim() ? metadataAvatarUrl : null;
      }

      return {
        ...dbUser,
        createdAt: dbUser.created_at ?? sessionUser?.created_at ?? null,
        providerAvatarUrl,
      };
    },
  });

  const { data: listingRows = [] } = useQuery({
    queryKey: ['listings'],
    queryFn: apiClient.getListings,
  });

  const { data: requestRows = [] } = useQuery({
    queryKey: ['requests'],
    queryFn: apiClient.getRequests,
  });

  const { data: impactSummary } = useQuery({
    queryKey: ['impact'],
    queryFn: apiClient.getImpactSummary,
  });

  const listings = React.useMemo(() => {
    if (!user) {
      return [];
    }

    const mapped = listingRows.map(toListingCardModel);
    return mapped.filter((listing) =>
      listingRows.some((row) => row.id === listing.id && row.donor_id === user.id),
    );
  }, [listingRows, user]);

  const requests = React.useMemo(() => {
    if (!user) {
      return [];
    }

    const mapped = requestRows.map(toRequestCardModel);
    return mapped.filter((request) =>
      requestRows.some((row) => row.id === request.id && row.requester_id === user.id),
    );
  }, [requestRows, user]);

  const claimedListings = React.useMemo(() => {
    if (!user) {
      return [];
    }

    const mapped = listingRows.map(toListingCardModel);
    return mapped.filter((listing) => listing.claimedBy === user.id);
  }, [listingRows, user]);

  const fulfilledRequests = React.useMemo(() => {
    if (!user) {
      return [];
    }

    const mapped = requestRows.map(toRequestCardModel);
    return mapped.filter((request) => request.fulfilledBy === user.id);
  }, [requestRows, user]);

  const stats = React.useMemo<UserStats>(() => {
    if (!impactSummary) {
      return EMPTY_STATS;
    }

    return toUserStats(
      impactSummary,
      listings.length,
      requests.filter((request) => request.status !== 'open').length,
    );
  }, [impactSummary, listings.length, requests]);

  const providerAvatarRecoveryStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (!user?.providerAvatarUrl || !isGeneratedAvatarUrl(user.avatar_url) || providerAvatarRecoveryStartedRef.current) {
      return;
    }

    providerAvatarRecoveryStartedRef.current = true;

    void apiClient.updateCurrentUser({
      email: user.email,
      display_name: user.display_name || user.email.split('@')[0] || 'LoopHarvest User',
      avatar_url: user.providerAvatarUrl,
      city: user.city,
      state_region: user.state_region,
      postal_code: user.postal_code,
      country: user.country,
      bio: user.bio,
    }).then(() => {
      void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      triggerNotification('Restored your provider profile image.');
    }).catch(() => {
      providerAvatarRecoveryStartedRef.current = false;
    });
  }, [queryClient, triggerNotification, user]);

  const claimMutation = useMutation({
    mutationFn: (id: string) => apiClient.claimListing(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      const previousListings = queryClient.getQueryData<ApiListing[]>(['listings']);

      queryClient.setQueryData<ApiListing[]>(['listings'], (old) =>
        old ? old.map((listing) => (listing.id === id ? { ...listing, status: 'claimed' } : listing)) : [],
      );

      triggerNotification('Listing claimed!');
      return { previousListings };
    },
    onError: (err, _id, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(['listings'], context.previousListings);
      }
      triggerNotification(err instanceof Error ? err.message : 'Unable to claim listing.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => apiClient.fulfillRequest(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previousRequests = queryClient.getQueryData<ApiRequest[]>(['requests']);

      queryClient.setQueryData<ApiRequest[]>(['requests'], (old) =>
        old ? old.map((request) => (request.id === id ? { ...request, status: 'fulfilled' } : request)) : [],
      );

      triggerNotification('Request fulfilled!');
      return { previousRequests };
    },
    onError: (err, _id, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(['requests'], context.previousRequests);
      }
      triggerNotification(err instanceof Error ? err.message : 'Unable to fulfill request.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['impact'] });
    },
  });

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-3xl border border-white/6 bg-[#141414] p-8 text-sm text-[#A3A3A3]">
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  const location = [user.city, user.state_region, user.country].filter(Boolean).join(', ') || 'No location specified';
  const avatarUrl = user.avatar_url ?? user.providerAvatarUrl ?? null;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-28 md:pb-10">
        <MyProfileStats
          stats={stats}
          listings={listings}
          requests={requests}
          claimedListings={claimedListings}
          fulfilledRequests={fulfilledRequests}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          displayName={user.display_name || user.email.split('@')[0] || 'LoopHarvest User'}
          avatarUrl={avatarUrl}
          isPremium={false}
          joinedLabel={formatJoinedLabel(user.createdAt)}
          location={location}
          bio={user.bio || 'No profile bio added yet.'}
          handleClaim={async (id: string) => {
            claimMutation.mutate(id);
          }}
          handleFulfill={async (id: string) => {
            fulfillMutation.mutate(id);
          }}
        />
      </div>
    </main>
  );
}
