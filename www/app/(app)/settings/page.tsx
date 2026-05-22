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
  ChevronRight 
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toListingCardModel, toRequestCardModel, toUserStats } from '@/lib/api/mappers';
import type { Listing, RequestItem, UserStats } from '@/lib/api/types';
import { createClient } from '@/lib/supabase/client';

// Import newly extracted sub-components
import MyProfileStats from '@/components/settings/my-profile-stats';
import Account, { type GeolocationPermissionState } from '@/components/settings/account';
import Notifications from '@/components/settings/notifications';
import Appearance from '@/components/settings/appearance';
import SDG from '@/components/settings/sdg';
import Billing from '@/components/settings/billing';

function buildAvatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

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

function splitLocation(value: string) {
  const [cityPart = '', countryPart = ''] = value.split(',', 2);

  return {
    city: cityPart.trim() || null,
    country: countryPart.trim() || null,
  };
}

function extractAvatarSeed(avatarUrl: string | null | undefined) {
  if (!avatarUrl || !avatarUrl.includes('seed=')) {
    return null;
  }

  return avatarUrl.split('seed=')[1]?.split('&')[0] ?? null;
}

async function getBrowserGeolocationPermission(): Promise<GeolocationPermissionState | null> {
  if (typeof window === 'undefined' || !navigator.permissions?.query) {
    return null;
  }

  try {
    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    return permissionStatus.state as GeolocationPermissionState;
  } catch {
    return null;
  }
}

async function reverseGeocodeLocation(latitude: number, longitude: number) {
  const response = await fetch(`/api/location/reverse?lat=${latitude}&lon=${longitude}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to resolve your current region.');
  }

  const payload = (await response.json()) as {
    location?: string;
    region?: string | null;
    country?: string | null;
  };

  if (!payload.location) {
    throw new Error('Unable to resolve your current region.');
  }

  return payload.location;
}

export default function ProfilePage() {
  // Stats and Active Listing States (from original profile page)
  const [stats, setStats] = React.useState<UserStats>({
    kgDiverted: 0,
    co2Saved: 0,
    waterSaved: 0,
    listingsPosted: 0,
    requestsFulfilled: 0,
    loopPoints: 0,
  });
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [requests, setRequests] = React.useState<RequestItem[]>([]);

  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests'>('listings');

  // Settings Forms & Inputs States
  // 1. Account details Form
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarSeed, setAvatarSeed] = React.useState('CurrentUser');
  const [sessionUserId, setSessionUserId] = React.useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = React.useState('');
  const [joinedLabel, setJoinedLabel] = React.useState('Joined recently');
  const [locationPermission, setLocationPermission] = React.useState<GeolocationPermissionState>('idle');
  const [locationPrompt, setLocationPrompt] = React.useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = React.useState(false);
  const [isManualLocation, setIsManualLocation] = React.useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = React.useState(false);

  // Refreshes listings / request stats
  const refreshData = React.useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();
      const metadata = sessionUser?.user_metadata ?? {};
      const sessionDisplayName =
        (typeof metadata.display_name === 'string' && metadata.display_name.trim()) ||
        (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
        null;
      const resolvedEmail = sessionUser?.email ?? '';
      const resolvedAvatarSeed =
        (typeof metadata.avatar_seed === 'string' && metadata.avatar_seed.trim()) ||
        extractAvatarSeed(typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null) ||
        sessionUser?.id ||
        'CurrentUser';
      const sessionLocation =
        (typeof metadata.city === 'string' && metadata.city.trim() && typeof metadata.country === 'string' && metadata.country.trim()
          ? `${metadata.city.trim()}, ${metadata.country.trim()}`
          : (typeof metadata.city === 'string' && metadata.city.trim()) ||
            (typeof metadata.country === 'string' && metadata.country.trim()) ||
            '');

      setSessionUserId(sessionUser?.id ?? null);
      setSessionEmail(resolvedEmail);
      setDisplayName(sessionDisplayName || (resolvedEmail ? resolvedEmail.split('@')[0] : 'LoopHarvest User'));
      setEmail(resolvedEmail);
      setLocation((currentValue) => currentValue || sessionLocation);
      setBio(typeof metadata.bio === 'string' ? metadata.bio : '');
      setAvatarSeed(resolvedAvatarSeed);
      setJoinedLabel(formatJoinedLabel(sessionUser?.created_at));
    } catch (err) {
      console.error('Failed to hydrate settings session data:', err);
    }

    try {
      const [user, listingRows, requestRows, impact] = await Promise.all([
        apiClient.getCurrentUser(),
        apiClient.getListings(),
        apiClient.getRequests(),
        apiClient.getImpactSummary(),
      ]);

      setSessionUserId(user.id);
      setDisplayName(user.display_name || user.email.split('@')[0] || 'LoopHarvest User');
      setEmail(user.email);
      setLocation((currentValue) => {
        if (currentValue) {
          return currentValue;
        }

        if (user.city && user.country) {
          return `${user.city}, ${user.country}`;
        }

        return user.city || user.country || '';
      });
      setAvatarSeed(extractAvatarSeed(user.avatar_url) || user.id || 'CurrentUser');

      const mappedListings = listingRows.map(toListingCardModel);
      const mappedRequests = requestRows.map(toRequestCardModel);

      const userListings = mappedListings.filter((listing) =>
        listingRows.some((row) => row.id === listing.id && row.donor_id === user.id),
      );
      const userRequests = mappedRequests.filter((request) =>
        requestRows.some((row) => row.id === request.id && row.requester_id === user.id),
      );

      setListings(userListings);
      setRequests(userRequests);

      // Dynamically calculate user's specific impact stats
      const listingsPosted = userListings.length;
      const requestsFulfilled = userRequests.filter(r => r.status !== 'open').length;
      setStats(toUserStats(impact, listingsPosted, requestsFulfilled));
    } catch (err) {
      console.error('Failed to refresh settings API data:', err);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void refreshData();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshData]);

  const requestBrowserLocation = React.useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationPermission('unsupported');
      setLocationPrompt('Location is unavailable in this browser. Enable it for a better local experience.');
      return;
    }

    setIsResolvingLocation(true);
    setLocationPrompt(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const resolvedLocation = await reverseGeocodeLocation(
        position.coords.latitude,
        position.coords.longitude,
      );

      setLocation(resolvedLocation);
      setLocationPermission('granted');
      setIsManualLocation(false);
      setLocationPrompt(null);
    } catch (error) {
      const permissionError = error as GeolocationPositionError | Error;

      if ('code' in permissionError && permissionError.code === 1) {
        const browserPermission = await getBrowserGeolocationPermission();
        if (browserPermission === 'granted') {
          setLocationPermission('granted');
          setShowTroubleshooting(true);
          setLocationPrompt(
            'Location access is allowed, but your device did not return coordinates. Check OS location services, then try again.',
          );
        } else {
          setLocationPermission('denied');
          setShowTroubleshooting(true);
          setLocationPrompt('Turn on browser location access for LoopHarvest to improve local discovery and pickup relevance.');
        }
      } else {
        setShowTroubleshooting(true);
        setLocationPrompt(
          permissionError instanceof Error
            ? permissionError.message
            : 'Unable to detect your current region.',
        );
      }
    } finally {
      setIsResolvingLocation(false);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!navigator.geolocation) {
      setTimeout(() => {
        setLocationPermission('unsupported');
        setLocationPrompt('Location is unavailable in this browser. Enable it for a better local experience.');
      }, 0);
      return;
    }

    if (!navigator.permissions?.query) {
      setTimeout(() => {
        setLocationPermission('prompt');
        setLocationPrompt('Allow location access to auto-detect your region for a better local experience.');
      }, 0);
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const syncPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (cancelled) {
          return;
        }

        const nextState = permissionStatus.state as GeolocationPermissionState;
        setLocationPermission(nextState);

        if (nextState === 'granted') {
          setIsManualLocation(false);
          void requestBrowserLocation();
        } else if (nextState === 'denied') {
          setLocationPrompt('Turn on browser location access for LoopHarvest to improve local discovery and pickup relevance.');
          setShowTroubleshooting(true);
        } else {
          setLocationPrompt('Allow location access to auto-detect your region for a better local experience.');
        }

        permissionStatus.onchange = () => {
          const changedState = permissionStatus?.state as GeolocationPermissionState;
          setLocationPermission(changedState);

          if (changedState === 'granted') {
            setIsManualLocation(false);
            void requestBrowserLocation();
          } else if (changedState === 'denied') {
            setLocationPrompt('Turn on browser location access for LoopHarvest to improve local discovery and pickup relevance.');
            setShowTroubleshooting(true);
          } else {
            setLocationPrompt('Allow location access to auto-detect your region for a better local experience.');
          }
        };
      } catch {
        if (!cancelled) {
          setLocationPermission('prompt');
          setLocationPrompt('Allow location access to auto-detect your region for a better local experience.');
        }
      }
    };

    void syncPermission();

    return () => {
      cancelled = true;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [requestBrowserLocation]);

  const handleClaim = async (id: string) => {
    try {
      await apiClient.claimListing(id);
      await refreshData();
      triggerNotification('Listing claimed!');
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : 'Unable to claim listing.');
    }
  };

  const handleFulfill = async (id: string) => {
    try {
      await apiClient.fulfillRequest(id);
      await refreshData();
      triggerNotification('Request fulfilled!');
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : 'Unable to fulfill request.');
    }
  };

  // Nav Settings Sidebar States
  const [activeSection, setActiveSection] = React.useState<string>('profile-stats');
  const [mobileActiveSection, setMobileActiveSection] = React.useState<string | null>(null);

  // 2. Notification Preferences
  const [emailDigest, setEmailDigest] = React.useState(true);
  const [pushAlerts, setPushAlerts] = React.useState(true);
  const [ecoReports, setEcoReports] = React.useState(false);
  const [alertRadius, setAlertRadius] = React.useState(15);

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

  // Community-wide helper to trigger layout toasts
  const triggerNotification = (message: string) => {
    const event = new CustomEvent('post-created', { detail: message });
    window.dispatchEvent(event);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createClient();
      const trimmedDisplayName = displayName.trim();
      const trimmedEmail = email.trim();
      const trimmedBio = bio.trim();
      const trimmedSeed = avatarSeed.trim() || sessionUserId || 'CurrentUser';
      const { city, country } = splitLocation(location);
      const updatePayload: {
        email?: string;
        data: {
          avatar_seed: string;
          avatar_url: string;
          bio: string;
          city: string | null;
          country: string | null;
          display_name: string;
        };
      } = {
        data: {
          display_name: trimmedDisplayName || trimmedEmail.split('@')[0] || 'LoopHarvest User',
          avatar_seed: trimmedSeed,
          avatar_url: buildAvatarUrl(trimmedSeed),
          city,
          country,
          bio: trimmedBio,
        },
      };

      if (trimmedEmail && trimmedEmail !== sessionEmail) {
        updatePayload.email = trimmedEmail;
      }

      const { error } = await supabase.auth.updateUser(updatePayload);
      if (error) {
        throw error;
      }

      await refreshData();
      triggerNotification(
        updatePayload.email
          ? 'Account profile saved. Check your email if Supabase requires reconfirmation.'
          : 'Account profile settings saved successfully!',
      );
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : 'Unable to save account profile settings.');
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotification('Notification configurations updated!');
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
  const sections = [
    { 
      id: 'profile-stats', 
      label: 'My Profile & Stats', 
      description: 'Your level progress, score metrics, and active posts', 
      icon: User 
    },
    { 
      id: 'account-details', 
      label: 'Account Settings', 
      description: 'Display name, location, contact, and custom avatar', 
      icon: ShieldCheck 
    },
    { 
      id: 'notifications', 
      label: 'Notifications Alert', 
      description: 'Nearby alert thresholds and digest channels', 
      icon: Bell 
    },
    { 
      id: 'appearance', 
      label: 'Appearance & Themes', 
      description: 'Tailored interfaces, layouts, and accessibility toggle', 
      icon: Palette 
    },
    { 
      id: 'sustainability', 
      label: 'Sustainability Goals', 
      description: 'Annual diversion targets and scrap preferences', 
      icon: Leaf 
    },
    { 
      id: 'billing', 
      label: 'Billing & Sponsorship', 
      description: 'Premium subscription models and invoice logs', 
      icon: CreditCard 
    }
  ];

  const handleSectionSelect = (id: string) => {
    setActiveSection(id);
    setMobileActiveSection(id);
  };

  // Render Subsidebar List
  const renderSidebarList = (isMobileView: boolean) => {
    return (
      <div className="space-y-1">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = isMobileView ? mobileActiveSection === sec.id : activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => handleSectionSelect(sec.id)}
              className={`group flex w-full items-start gap-3.5 rounded-xl px-3.5 py-3 text-left transition-all duration-200 border border-transparent ${
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
        })}
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
      case 'profile-stats':
        return (
          <MyProfileStats
            stats={stats}
            listings={listings}
            requests={requests}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            displayName={displayName}
            avatarSeed={avatarSeed}
            isPremium={isPremium}
            joinedLabel={joinedLabel}
            location={location}
            bio={bio}
            handleClaim={handleClaim}
            handleFulfill={handleFulfill}
          />
        );

      // 2. ACCOUNT PROFILE DETAILS EDIT
      case 'account-details':
        return (
          <Account
            displayName={displayName}
            setDisplayName={setDisplayName}
            email={email}
            setEmail={setEmail}
            location={location}
            setLocation={setLocation}
            bio={bio}
            setBio={setBio}
            avatarSeed={avatarSeed}
            setAvatarSeed={setAvatarSeed}
            locationPermission={locationPermission}
            locationPrompt={locationPrompt}
            isResolvingLocation={isResolvingLocation}
            isManualLocation={isManualLocation}
            setIsManualLocation={setIsManualLocation}
            showTroubleshooting={showTroubleshooting}
            setShowTroubleshooting={setShowTroubleshooting}
            requestBrowserLocation={requestBrowserLocation}
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
              className="flex items-center gap-2 text-xs font-black text-[#A8D97F] hover:underline mb-2 uppercase tracking-wider"
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
