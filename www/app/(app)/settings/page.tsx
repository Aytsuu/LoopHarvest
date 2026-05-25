'use client';

import * as React from 'react';
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Palette, 
  Leaf, 
  CreditCard, 
  LogOut, 
  ArrowLeft, 
  ChevronRight,
  Megaphone,
  Rss
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { notificationService } from '@/lib/api/notifications';
import { ensurePushSubscription, removePushSubscription } from '@/lib/notifications/push';
import { toListingCardModel, toRequestCardModel, toUserStats } from '@/lib/api/mappers';
import type { ApiListing, ApiRequest, NotificationSettingsFormData, UserStats } from '@/lib/api/types';
import { createClient } from '@/lib/supabase/client';
import { getProfileAvatarsBucket } from '@/lib/supabase/storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Import newly extracted sub-components
import MyProfileStats from '@/components/settings/my-profile-stats';
import Account from '@/components/settings/account';
import Notifications from '@/components/settings/notifications';
import Appearance from '@/components/settings/appearance';
import SDG from '@/components/settings/sdg';
import Billing from '@/components/settings/billing';
import AdminBroadcasts from '@/components/settings/admin-broadcasts';
import AdminReleases from '@/components/settings/admin-releases';
import { isGeneratedAvatarUrl } from '@/lib/users/avatar';

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

function isLegacyCartoonAvatarUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return isGeneratedAvatarUrl(value);
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [supabase] = React.useState(() => createClient());
  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests' | 'claims'>('listings');

  // Form hydration state indicator
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Community-wide helper to trigger layout toasts
  const triggerNotification = (message: string) => {
    const event = new CustomEvent('post-created', { detail: message });
    window.dispatchEvent(event);
  };

  // Settings Forms & Inputs States
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateProv, setStateProv] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [persistedAvatarUrl, setPersistedAvatarUrl] = React.useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);
  const [avatarUploadError, setAvatarUploadError] = React.useState<string | null>(null);

  // Queries
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

  const { data: notificationSettings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => notificationService.getSettings(supabase),
  });

  // Dynamically compute user's specific listings
  const listings = React.useMemo(() => {
    if (!user || !listingRows) return [];
    const mapped = listingRows.map(toListingCardModel);
    return mapped.filter((listing) =>
      listingRows.some((row) => row.id === listing.id && row.donor_id === user.id)
    );
  }, [user, listingRows]);

  // Dynamically compute user's specific requests
  const requests = React.useMemo(() => {
    if (!user || !requestRows) return [];
    const mapped = requestRows.map(toRequestCardModel);
    return mapped.filter((request) =>
      requestRows.some((row) => row.id === request.id && row.requester_id === user.id)
    );
  }, [user, requestRows]);

  // Dynamically compute listings claimed by the current user
  const claimedListings = React.useMemo(() => {
    if (!user || !listingRows) return [];
    const mapped = listingRows.map(toListingCardModel);
    return mapped.filter((listing) => listing.claimedBy === user.id);
  }, [user, listingRows]);

  // Dynamically calculate user's specific impact stats
  const stats = React.useMemo<UserStats>(() => {
    if (!impactSummary) {
      return {
        kgDiverted: 0,
        co2Saved: 0,
        waterSaved: 0,
        listingsPosted: 0,
        requestsFulfilled: 0,
        loopPoints: 0,
      };
    }
    const listingsPosted = listings.length;
    const requestsFulfilled = requests.filter(r => r.status !== 'open').length;
    return toUserStats(impactSummary, listingsPosted, requestsFulfilled);
  }, [impactSummary, listings, requests]);

  // Hydrate settings form states safely from active query cache
  React.useEffect(() => {
    if (!user || isHydrated) return;

    const timer = setTimeout(() => {
      setDisplayName(user.display_name || user.email.split('@')[0] || 'LoopHarvest User');
      setEmail(user.email || '');
      setCity(user.city || '');
      setCountry(user.country || '');
      setStateProv(user.state_region || '');
      setPostalCode(user.postal_code || '');
      setBio(user.bio || '');
      setAvatarUploadError(null);
      setPersistedAvatarUrl(
        isLegacyCartoonAvatarUrl(user.avatar_url) && user.providerAvatarUrl
          ? user.providerAvatarUrl
          : user.avatar_url
      );
      setIsHydrated(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [user, isHydrated]);

  const providerAvatarRecoveryStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (!user?.providerAvatarUrl || !isLegacyCartoonAvatarUrl(user.avatar_url) || providerAvatarRecoveryStartedRef.current) {
      return;
    }

    providerAvatarRecoveryStartedRef.current = true;
    setPersistedAvatarUrl(user.providerAvatarUrl);

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
  }, [queryClient, user]);

  // Mutations
  const claimMutation = useMutation({
    mutationFn: (id: string) => apiClient.claimListing(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['listings'] });
      const previousListings = queryClient.getQueryData<ApiListing[]>(['listings']);

      queryClient.setQueryData<ApiListing[]>(['listings'], (old) =>
        old ? old.map((l) => (l.id === id ? { ...l, status: 'claimed' } : l)) : []
      );

      triggerNotification('Listing claimed!');
      return { previousListings };
    },
    onError: (err, id, context) => {
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
        old ? old.map((r) => (r.id === id ? { ...r, status: 'fulfilled' } : r)) : []
      );

      triggerNotification('Request fulfilled!');
      return { previousRequests };
    },
    onError: (err, id, context) => {
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

  const handleClaim = async (id: string) => {
    claimMutation.mutate(id);
  };

  const handleFulfill = async (id: string) => {
    fulfillMutation.mutate(id);
  };

  const handleAvatarFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please choose an image file.');
      event.target.value = '';
      return;
    }

    const maxFileSizeBytes = 4 * 1024 * 1024;
    if (file.size > maxFileSizeBytes) {
      setAvatarUploadError('Please upload an image smaller than 4 MB.');
      event.target.value = '';
      return;
    }

    setAvatarUploadError(null);
    setIsAvatarUploading(true);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        throw new Error('You need to be signed in to upload a profile image.');
      }

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const bucket = getProfileAvatarsBucket();
      const filePath = `${authUser.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadFailure } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

      if (uploadFailure) {
        throw uploadFailure;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Avatar upload succeeded, but no public URL was returned.');
      }

      const trimmedDisplayName = displayName.trim();
      const trimmedEmail = email.trim();
      const trimmedBio = bio.trim();
      const trimmedCity = city.trim();
      const trimmedCountry = country.trim();
      const trimmedState = stateProv.trim();
      const trimmedPostal = postalCode.trim();

      const updatedUser = await apiClient.updateCurrentUser({
        email: trimmedEmail,
        display_name: trimmedDisplayName || trimmedEmail.split('@')[0] || 'LoopHarvest User',
        avatar_url: publicUrl,
        city: trimmedCity || null,
        state_region: trimmedState || null,
        postal_code: trimmedPostal || null,
        country: trimmedCountry || null,
        bio: trimmedBio || null,
      });

      setPersistedAvatarUrl(updatedUser.avatar_url);
      void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      triggerNotification('Profile image updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to upload the profile image.';
      setAvatarUploadError(
        `${message} Make sure the Supabase bucket exists, is public, and allows authenticated uploads.`,
      );
    } finally {
      setIsAvatarUploading(false);
      event.target.value = '';
    }
  };

  // Nav Settings Sidebar States
  const [activeSection, setActiveSection] = React.useState<string>('profile-stats');
  const [mobileActiveSection, setMobileActiveSection] = React.useState<string | null>(null);

  // 2. Notification Preferences
  const [emailDigest, setEmailDigest] = React.useState(true);
  const [pushAlerts, setPushAlerts] = React.useState(false);
  const [ecoReports, setEcoReports] = React.useState(false);
  const [alertRadius, setAlertRadius] = React.useState(15);
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(false);
  const [quietHoursStart, setQuietHoursStart] = React.useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = React.useState('08:00');
  const [emailDigestFrequency, setEmailDigestFrequency] = React.useState<'realtime' | 'daily' | 'weekly' | 'never'>('daily');
  const [typePreferences, setTypePreferences] = React.useState<NotificationSettingsFormData['typePreferences']>({});

  React.useEffect(() => {
    if (!notificationSettings) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAlertRadius(notificationSettings.alertRadius);
      setEmailDigest(notificationSettings.emailDigest);
      setPushAlerts(notificationSettings.pushAlerts);
      setEcoReports(notificationSettings.ecoReports);
      setQuietHoursEnabled(notificationSettings.quietHoursEnabled);
      setQuietHoursStart(notificationSettings.quietHoursStart);
      setQuietHoursEnd(notificationSettings.quietHoursEnd);
      setEmailDigestFrequency(notificationSettings.emailDigestFrequency);
      setTypePreferences(notificationSettings.typePreferences);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [notificationSettings]);

  // 3. Appearance & Theme Preferences
  const [selectedTheme, setSelectedTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fl_appearance_theme') || 'Forest HSL';
      } catch {
        return 'Forest HSL';
      }
    }
    return 'Forest HSL';
  });

  const [selectedDensity, setSelectedDensity] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fl_appearance_density') || 'Comfortable';
      } catch {
        return 'Comfortable';
      }
    }
    return 'Comfortable';
  });

  const [highContrast, setHighContrast] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fl_high_contrast') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [reduceMotion, setReduceMotion] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fl_reduce_motion') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  // 4. Sustainability & Eco Preferences
  const [diversionGoal, setDiversionGoal] = React.useState(500);
  const [purpose, setPurpose] = React.useState('Composting');
  const [scrapPrefs, setScrapPrefs] = React.useState({
    fruitVeg: true,
    coffeeTea: true,
    eggshells: false,
    yardWaste: false,
    bakery: true
  });

  // 5. Billing & Subscription Tiers
  const [isPremium, setIsPremium] = React.useState(false);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const trimmedDisplayName = displayName.trim();
      const trimmedEmail = email.trim();
      const trimmedBio = bio.trim();
      const trimmedCity = city.trim();
      const trimmedCountry = country.trim();
      const trimmedState = stateProv.trim();
      const trimmedPostal = postalCode.trim();
      const nextAvatarUrl = persistedAvatarUrl ?? user?.avatar_url ?? null;

      return apiClient.updateCurrentUser({
        email: trimmedEmail,
        display_name: trimmedDisplayName || trimmedEmail.split('@')[0] || 'LoopHarvest User',
        avatar_url: nextAvatarUrl,
        city: trimmedCity || null,
        state_region: trimmedState || null,
        postal_code: trimmedPostal || null,
        country: trimmedCountry || null,
        bio: trimmedBio || null,
      });
    },
    onSuccess: (updatedUser) => {
      setPersistedAvatarUrl(updatedUser.avatar_url);
      void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      void queryClient.invalidateQueries({ queryKey: ['listings'] });
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      triggerNotification('Account profile settings saved successfully!');
    },
    onError: (err) => {
      triggerNotification(err instanceof Error ? err.message : 'Unable to save account profile settings.');
    },
  });

  const saveNotificationSettingsMutation = useMutation({
    mutationFn: async (settings: NotificationSettingsFormData) => {
      if (settings.pushAlerts) {
        await ensurePushSubscription(supabase);
      } else {
        await removePushSubscription(supabase);
      }

      return notificationService.saveSettings(supabase, settings);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      triggerNotification('Notification configurations updated!');
    },
    onError: (err) => {
      triggerNotification(err instanceof Error ? err.message : 'Unable to save notification settings.');
    },
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate();
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    saveNotificationSettingsMutation.mutate({
      alertRadius,
      emailDigest,
      pushAlerts,
      ecoReports,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      emailDigestFrequency,
      typePreferences,
    });
  };

  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('fl_appearance_theme', selectedTheme);
      localStorage.setItem('fl_appearance_density', selectedDensity);
      localStorage.setItem('fl_high_contrast', String(highContrast));
      localStorage.setItem('fl_reduce_motion', String(reduceMotion));

      // Dispatch event to trigger ThemeSync across the entire application immediately
      window.dispatchEvent(new CustomEvent('theme-change'));

      triggerNotification('Appearance theme configurations applied!');
    } catch (err) {
      console.warn("Could not save appearance settings to localStorage", err);
      triggerNotification('Failed to apply appearance settings.');
    }
  };

  const handleSaveSustainability = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotification('Sustainability diversion targets updated!');
  };

  const handleUpgradePremium = () => {
    setIsPremium(true);
    triggerNotification('🎉 Upgraded to Premium Patron! Thank you for supporting organic loops.');
  };

  // Sections configuration mapping
  interface SettingsSection {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }

  const sections: SettingsSection[] = [
    { 
      id: 'profile-stats', 
      label: 'My Profile & Stats', 
      description: 'Your level progress, score metrics, and active posts', 
      icon: User,
    },
    { 
      id: 'account-details', 
      label: 'Account Settings', 
      description: 'Display name, location, contact, and custom avatar', 
      icon: ShieldCheck,
    },
    { 
      id: 'notifications', 
      label: 'Notifications Alert', 
      description: 'Nearby alert thresholds and digest channels', 
      icon: Bell,
    },
    { 
      id: 'appearance', 
      label: 'Appearance & Themes', 
      description: 'Tailored interfaces, layouts, and accessibility toggle', 
      icon: Palette,
    },
    { 
      id: 'sustainability', 
      label: 'Sustainability Goals', 
      description: 'Annual diversion targets and scrap preferences', 
      icon: Leaf,
    },
    { 
      id: 'billing', 
      label: 'Billing & Sponsorship', 
      description: 'Premium subscription models and invoice logs', 
      icon: CreditCard,
    },
    ...(user?.role === 'admin'
      ? [
          {
            id: 'admin-broadcasts',
            label: 'Admin Broadcasts',
            description: 'Configure delivery dispatch and send system-wide notices',
            icon: Megaphone,
          },
          {
            id: 'admin-releases',
            label: 'Admin Releases',
            description: 'Publish release banners, notices, and blocking updates',
            icon: Rss,
          },
        ]
      : []),
    ];

  const handleSectionSelect = (id: string) => {
    setActiveSection(id);
    setMobileActiveSection(id);
  };

  // Render Subsidebar List
  const renderSidebarList = (isMobileView: boolean) => {
    const isAdmin = user?.role === 'admin';
    const generalSections = sections.filter((sec) => !sec.id.startsWith('admin-'));
    const adminSections = sections.filter((sec) => sec.id.startsWith('admin-'));

    const renderSectionItem = (sec: SettingsSection) => {
      const Icon = sec.icon;
      const isActive = isMobileView ? mobileActiveSection === sec.id : activeSection === sec.id;
      return (
        <button
          key={sec.id}
          onClick={() => handleSectionSelect(sec.id)}
          className={`group flex w-full items-start gap-3.5 rounded-xl px-3.5 py-3 text-left transition-all duration-200 border border-transparent cursor-pointer ${
            isActive
              ? 'bg-[#2A4A10] text-[#A8D97F] border-[#A8D97F]/10'
              : 'hover:bg-white/4 text-[#A3A3A3] hover:text-[#FFFFFF]'
          }`}
        >
          <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${isActive ? 'bg-[#1A3A05] text-[#A8D97F]' : 'bg-white/4 text-[#A3A3A3] group-hover:text-[#FFFFFF]'}`}>
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold block ${isActive ? 'text-[#A8D97F]' : 'text-[#FFFFFF]'}`}>
                {sec.label}
              </span>
              <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-[#A8D97F]' : 'text-[#A3A3A3]'}`} />
            </div>
            <p className={`text-[10px] mt-0.5 leading-relaxed truncate font-medium ${isActive ? 'text-[#87B85E]' : 'text-[#8C8F7E]'}`}>
              {sec.description}
            </p>
          </div>
        </button>
      );
    };

    return (
      <div className="space-y-4">
        {/* General Settings */}
        <div className="space-y-1">
          {isAdmin && (
            <div className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#8C8F7E]">
              General Settings
            </div>
          )}
          {generalSections.map(renderSectionItem)}
        </div>

        {/* Administrative Controls */}
        {isAdmin && adminSections.length > 0 && (
          <div className="space-y-1 pt-3 border-t border-white/6">
            <div className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#8C8F7E]">
              Administrative
            </div>
            {adminSections.map(renderSectionItem)}
          </div>
        )}

        {isMobileView && (
          <div className="pt-4 border-t border-white/6 mt-4 px-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-signout'))}
              className="group flex w-full items-start gap-3.5 rounded-xl px-3.5 py-3 text-left transition-all duration-200 border border-transparent hover:bg-[#E05656]/10 text-[#E05656] cursor-pointer"
            >
              <div className="mt-0.5 p-1 rounded-lg shrink-0 bg-[#E05656]/10 text-[#E05656] border border-[#E05656]/20">
                <LogOut size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold block text-[#E05656]">Sign Out</span>
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#E05656]/70" />
                </div>
                <p className="text-[10px] mt-0.5 leading-relaxed text-[#E05656]/70 font-medium">
                  Exit from your LoopHarvest account
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render active layout form blocks
  const renderActiveSectionContent = (id: string) => {
    switch (id) {
      // 1. ORIGINAL PROFILE & STATISTICS VIEW
      case 'profile-stats': {
        const computedLocation = [city, stateProv, country].filter(Boolean).join(', ') || 'No location specified';
        const avatarUrl = persistedAvatarUrl ?? user?.avatar_url ?? null;
        return (
          <MyProfileStats
            stats={stats}
            listings={listings}
            requests={requests}
            claimedListings={claimedListings}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            displayName={displayName}
            avatarUrl={avatarUrl}
            isPremium={isPremium}
            joinedLabel={formatJoinedLabel(user?.createdAt)}
            location={computedLocation}
            bio={bio}
            handleClaim={handleClaim}
            handleFulfill={handleFulfill}
          />
        );
      }

      // 2. ACCOUNT PROFILE DETAILS EDIT
      case 'account-details':
        const avatarPreviewUrl = persistedAvatarUrl ?? user?.avatar_url ?? null;
        return (
          <Account
            displayName={displayName}
            setDisplayName={setDisplayName}
            email={email}
            city={city}
            setCity={setCity}
            stateProv={stateProv}
            setStateProv={setStateProv}
            postalCode={postalCode}
            setPostalCode={setPostalCode}
            country={country}
            setCountry={setCountry}
            bio={bio}
            setBio={setBio}
            avatarPreviewUrl={avatarPreviewUrl}
            isAvatarUploading={isAvatarUploading}
            avatarUploadError={avatarUploadError}
            onAvatarFileSelect={handleAvatarFileSelect}
            savePending={saveProfileMutation.isPending}
            handleSaveProfile={handleSaveProfile}
          />
        );

      // 3. NOTIFICATION RADII & CHANNELS
      case 'notifications':
        return (
          <Notifications
            alertRadius={alertRadius}
            setAlertRadius={setAlertRadius}
            emailDigest={emailDigest}
            setEmailDigest={setEmailDigest}
            pushAlerts={pushAlerts}
            setPushAlerts={setPushAlerts}
            ecoReports={ecoReports}
            setEcoReports={setEcoReports}
            quietHoursEnabled={quietHoursEnabled}
            setQuietHoursEnabled={setQuietHoursEnabled}
            quietHoursStart={quietHoursStart}
            setQuietHoursStart={setQuietHoursStart}
            quietHoursEnd={quietHoursEnd}
            setQuietHoursEnd={setQuietHoursEnd}
            emailDigestFrequency={emailDigestFrequency}
            setEmailDigestFrequency={setEmailDigestFrequency}
            typePreferences={typePreferences}
            setTypePreferences={setTypePreferences}
            savePending={saveNotificationSettingsMutation.isPending}
            handleSaveNotifications={handleSaveNotifications}
          />
        );

      // 4. THEMES, ACCESSIBILITY, GRAPHICS
      case 'appearance':
        return (
          <Appearance
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
            selectedDensity={selectedDensity}
            setSelectedDensity={setSelectedDensity}
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            reduceMotion={reduceMotion}
            setReduceMotion={setReduceMotion}
            handleSaveAppearance={handleSaveAppearance}
          />
        );

      // 5. ECO GOALS, WASTE DIVERSIONS & PREFERENCES
      case 'sustainability':
        return (
          <SDG
            diversionGoal={diversionGoal}
            setDiversionGoal={setDiversionGoal}
            purpose={purpose}
            setPurpose={setPurpose}
            scrapPrefs={scrapPrefs}
            setScrapPrefs={setScrapPrefs}
            handleSaveSustainability={handleSaveSustainability}
          />
        );

      // 6. PREMIUM TIERS, PAYMENTS & LOGS
      case 'billing':
        return (
          <Billing
            isPremium={isPremium}
            handleUpgradePremium={handleUpgradePremium}
          />
        );

      // 7. ADMIN-ONLY SYSTEM BROADCASTS CONFIGURATION
      case 'admin-broadcasts':
        return <AdminBroadcasts />;

      // 8. ADMIN-ONLY SYSTEM RELEASES MANAGEMENT
      case 'admin-releases':
        return <AdminReleases />;

      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen md:h-screen flex-col bg-[#0A0A0A] text-[#FFFFFF] md:overflow-hidden">
      <div className="relative flex flex-1 overflow-y-auto md:overflow-hidden md:h-full w-full">
        
        {/* Subsidebar Desktop Panel (Left Pane) - Stuck flush to the left, no margins, no rounded corners */}
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col border-r border-white/6 bg-[#0E0E0E] h-full overflow-y-auto p-4 scrollbar-none">
          <div className="mb-4 px-3 pt-2">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-[#FFFFFF]">
              Settings
            </h1>
            <p className="text-[11px] text-[#A3A3A3] mt-1 font-semibold">
              Manage your community profile & configs
            </p>
          </div>
          <hr className="border-white/6 my-2" />
          <div className="space-y-1">
            {renderSidebarList(false)}
          </div>
        </aside>

        {/* Desktop Right Side Panel content - Scrolls independently, flush to the top/bottom */}
        <div className="hidden md:block flex-1 bg-[#0A0A0A] overflow-y-auto h-full p-8 pb-12 scrollbar-none">
          <div className="max-w-3xl w-full mx-auto">
            {renderActiveSectionContent(activeSection)}
          </div>
        </div>

        {/* MOBILE RESPONSIVE SINGLE-COLUMN FLOW */}
        {/* 1. Category selector menu if no section chosen */}
        {mobileActiveSection === null && (
          <div className="block md:hidden w-full h-full overflow-y-auto bg-[#0A0A0A] p-4 pb-28">
            <div className="mb-4 px-1">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
                Settings
              </h1>
              <p className="text-xs text-[#A3A3A3] mt-1 font-semibold">
                Manage your community profile & configs
              </p>
            </div>
            <div className="bg-[#141414] p-4 rounded-3xl border border-white/6 shadow-xl space-y-2">
              <h4 className="text-xs font-black text-[#8C8F7E] uppercase tracking-wider px-1 mb-2">Configure Categories</h4>
              {renderSidebarList(true)}
            </div>
          </div>
        )}

        {/* 2. Slide view showing current chosen category settings form */}
        {mobileActiveSection !== null && (
          <div className="block md:hidden w-full h-full overflow-y-auto bg-[#0A0A0A] p-4 pb-28 space-y-5">
            <button 
              onClick={() => setMobileActiveSection(null)}
              className="flex items-center gap-2 text-xs font-black text-[#A8D97F] hover:underline mb-2 uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              <span>Back to Categories</span>
            </button>
            
            <div className="bg-[#141414] p-6 rounded-3xl border border-white/6 shadow-xl min-h-[420px]">
              {renderActiveSectionContent(mobileActiveSection)}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
