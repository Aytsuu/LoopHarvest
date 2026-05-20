'use client';

import * as React from 'react';
import { 
  Award, 
  Sparkles, 
  Scale, 
  Heart, 
  ShieldCheck, 
  Flame, 
  BookOpen, 
  User, 
  Bell, 
  Palette, 
  Leaf, 
  CreditCard, 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  Save, 
  CheckCircle,
  Clock,
  LogOut
} from 'lucide-react';
import { mockStore, Listing, RequestItem } from '@/lib/mockStore';
import ListingCard from '@/components/cards/ListingCard';
import RequestCard from '@/components/cards/RequestCard';

export default function ProfilePage() {
  // Stats and Active Listing States (from original profile page)
  const [stats, setStats] = React.useState(() => mockStore.getUserStats());
  const [listings, setListings] = React.useState<Listing[]>(() => 
    mockStore.getListings().filter(l => l.donorName.includes('You'))
  );
  const [requests, setRequests] = React.useState<RequestItem[]>(() => 
    mockStore.getRequests().filter(r => r.requesterName.includes('You'))
  );
  const [activeTab, setActiveTab] = React.useState<'listings' | 'requests'>('listings');

  // Refreshes listings / request stats
  const refreshData = React.useCallback(() => {
    setStats(mockStore.getUserStats());
    setListings(mockStore.getListings().filter(l => l.donorName.includes('You')));
    setRequests(mockStore.getRequests().filter(r => r.requesterName.includes('You')));
  }, []);

  const handleClaim = (id: string) => {
    const success = mockStore.claimListing(id);
    if (success) {
      refreshData();
      triggerNotification('Listing claimed!');
    }
  };

  const handleFulfill = (id: string) => {
    const success = mockStore.fulfillRequest(id);
    if (success) {
      refreshData();
      triggerNotification('Request fulfilled!');
    }
  };

  // Nav Settings Sidebar States
  const [activeSection, setActiveSection] = React.useState<string>('profile-stats');
  const [mobileActiveSection, setMobileActiveSection] = React.useState<string | null>(null);

  // Settings Forms & Inputs States
  // 1. Account details Form
  const [displayName, setDisplayName] = React.useState('You (Current User)');
  const [email, setEmail] = React.useState('patty@loop-harvest.org');
  const [location, setLocation] = React.useState('San Francisco, CA');
  const [bio, setBio] = React.useState('Compost enthusiast and urban agriculture advocate.');
  const [avatarSeed, setAvatarSeed] = React.useState('CurrentUser');

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
      } catch (e) {
        return 'Forest HSL';
      }
    }
    return 'Forest HSL';
  });

  const [selectedDensity, setSelectedDensity] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fl_appearance_density') || 'Comfortable';
      } catch (e) {
        return 'Comfortable';
      }
    }
    return 'Comfortable';
  });

  const [highContrast, setHighContrast] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fl_high_contrast') === 'true';
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [reduceMotion, setReduceMotion] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fl_reduce_motion') === 'true';
      } catch (e) {
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotification('Account profile settings saved successfully!');
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

  // Calculate levels based on score points (Points / 100 + 1)
  const userLevel = Math.floor(stats.loopPoints / 100) + 1;
  const currentLevelXP = stats.loopPoints % 100;
  const xpProgressPercent = currentLevelXP; // out of 100

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
                  : 'hover:bg-white/4 text-[#A8AA98] hover:text-[#E8EAD8]'
              }`}
            >
              <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${isActive ? 'bg-[#1A3A05] text-[#A8D97F]' : 'bg-white/4 text-[#A8AA98] group-hover:text-[#E8EAD8]'}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold block ${isActive ? 'text-[#A8D97F]' : 'text-[#E8EAD8]'}`}>
                    {sec.label}
                  </span>
                  <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-[#A8D97F]' : 'text-[#A8AA98]'}`} />
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
          <div className="space-y-8 animate-fade-in">
            {/* Header profile intro */}
            <div className="bg-[#1B1B1B] p-6 rounded-3xl border border-white/6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 h-36 w-36 rounded-full bg-[#A8D97F]/10 blur-3xl pointer-events-none select-none" />
              
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full border-4 border-[#2A4A10] bg-[#141414]"
                />
                <span className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#A8D97F] text-xs font-black text-[#1A3A05] border-2 border-[#1B1B1B] shadow-md font-mono">
                  {userLevel}
                </span>
              </div>

              <div className="flex-1 space-y-4 text-center sm:text-left w-full">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#E8EAD8]">
                      {displayName}
                    </h2>
                    <span className="inline-flex items-center gap-1 self-center sm:self-auto rounded bg-[#2A4A10] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#A8D97F] uppercase border border-[#A8D97F]/10">
                      <ShieldCheck size={11} />
                      <span>{isPremium ? 'Community Patron' : 'Loop Master'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#A8AA98] mt-1 font-semibold">Joined May 2026 · {location}</p>
                  <p className="text-xs text-[#8C8F7E] mt-1.5 font-medium italic-none max-w-lg">&ldquo;{bio}&rdquo;</p>
                </div>

                <div className="space-y-1.5 max-w-md mx-auto sm:mx-0">
                  <div className="flex justify-between text-[11px] font-bold text-[#A8AA98]">
                    <span>Level Progress</span>
                    <span className="font-mono text-[#A8D97F]">{currentLevelXP} / 100 XP</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#141414] overflow-hidden border border-white/5">
                    <div 
                      style={{ width: `${xpProgressPercent}%` }}
                      className="h-full bg-[#A8D97F] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,217,127,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard metrics widgets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
                <Scale size={20} className="text-[#A8D97F] mx-auto mb-2" />
                <div className="font-mono text-xl font-black text-[#E8EAD8]">{stats.kgDiverted} kg</div>
                <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Scraps Diverted</div>
              </div>

              <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
                <Flame size={20} className="text-[#E8A838] mx-auto mb-2" />
                <div className="font-mono text-xl font-black text-[#E8EAD8]">{stats.co2Saved} kg</div>
                <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">CO2 Mitigated</div>
              </div>

              <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center col-span-2 sm:col-span-1">
                <Heart size={20} className="text-[#4ECDC4] mx-auto mb-2" />
                <div className="font-mono text-xl font-black text-[#E8EAD8]">{stats.waterSaved} L</div>
                <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Water Preserved</div>
              </div>

              <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
                <BookOpen size={20} className="text-[#C4F09A] mx-auto mb-2" />
                <div className="font-mono text-xl font-black text-[#E8EAD8]">{stats.listingsPosted}</div>
                <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Donations Listed</div>
              </div>

              <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center">
                <Award size={20} className="text-[#7EF8EF] mx-auto mb-2" />
                <div className="font-mono text-xl font-black text-[#E8EAD8]">{stats.requestsFulfilled}</div>
                <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Appeals Fulfills</div>
              </div>

              <div className="bg-[#1B1B1B] p-4 rounded-2xl border border-white/6 text-center col-span-2 sm:col-span-1">
                <Sparkles size={20} className="text-[#A8D97F] mx-auto mb-2" />
                <div className="font-mono text-xl font-black text-[#A8D97F]">{stats.loopPoints} XP</div>
                <div className="text-[10px] font-bold text-[#A8AA98] uppercase mt-0.5">Total Loop Score</div>
              </div>
            </div>

            {/* User listings / requests feed tabs */}
            <div className="space-y-4">
              <div className="flex border-b border-white/6 pb-2 items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('listings')}
                    className={`text-sm font-bold pb-2 transition-all border-b-2 relative ${
                      activeTab === 'listings' 
                        ? 'border-[#A8D97F] text-[#A8D97F]' 
                        : 'border-transparent text-[#A8AA98] hover:text-[#E8EAD8]'
                    }`}
                  >
                    Your Listings ({listings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`text-sm font-bold pb-2 transition-all border-b-2 relative ${
                      activeTab === 'requests' 
                        ? 'border-[#A8D97F] text-[#A8D97F]' 
                        : 'border-transparent text-[#A8AA98] hover:text-[#E8EAD8]'
                    }`}
                  >
                    Your Requests ({requests.length})
                  </button>
                </div>
                <span className="text-[11px] text-[#A8AA98] font-bold hidden sm:inline">Only you can view active publishes</span>
              </div>

              {activeTab === 'listings' ? (
                listings.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {listings.map((l) => (
                      <ListingCard key={l.id} listing={l} onClaim={handleClaim} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#5A5C50] bg-[#1B1B1B] border border-white/6 rounded-2xl">
                    You haven&apos;t posted any waste materials yet. Select Create Post to get started.
                  </div>
                )
              ) : (
                requests.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {requests.map((r) => (
                      <RequestCard key={r.id} request={r} onFulfill={handleFulfill} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#5A5C50] bg-[#1B1B1B] border border-white/6 rounded-2xl">
                    You haven&apos;t requested any scraps yet.
                  </div>
                )
              )}
            </div>
          </div>
        );

      // 2. ACCOUNT PROFILE DETAILS EDIT
      case 'account-details':
        return (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-[#E8EAD8] font-display">Account Information</h3>
              <p className="text-xs text-[#A8AA98] mt-1">Update your public credentials, display seed, and profile description.</p>
            </div>

            {/* Avatar seeds selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Choose Avatar</label>
              <div className="flex flex-wrap gap-4 items-center">
                {['CurrentUser', 'Patty', 'Composter', 'EcoGrower', 'HarvestHustler'].map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setAvatarSeed(seed)}
                    className={`relative p-1 rounded-full border-2 transition-all hover:scale-105 active:scale-95 ${
                      avatarSeed === seed ? 'border-[#A8D97F] bg-[#2A4A10]/20' : 'border-white/6 bg-white/4'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      alt={seed}
                      className="h-12 w-12 rounded-full"
                    />
                    {avatarSeed === seed && (
                      <span className="absolute -right-1.5 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#A8D97F] text-[#1A3A05] border border-[#141414]">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#E8EAD8] focus:outline-none focus:border-[#A8D97F] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#E8EAD8] focus:outline-none focus:border-[#A8D97F] transition-colors"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Location (Region)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#E8EAD8] focus:outline-none focus:border-[#A8D97F] transition-colors"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Public Biography</label>
                <textarea
                  value={bio}
                  rows={3}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white/4 border border-white/8 rounded-xl p-4 text-sm font-semibold text-[#E8EAD8] focus:outline-none focus:border-[#A8D97F] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="border-t border-white/6 pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
              >
                <Save size={16} />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        );

      // 3. NOTIFICATION RADII & CHANNELS
      case 'notifications':
        return (
          <form onSubmit={handleSaveNotifications} className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-[#E8EAD8] font-display">Notification Settings</h3>
              <p className="text-xs text-[#A8AA98] mt-1">Configure your real-time alerts and set maximum geographic search parameters.</p>
            </div>

            {/* Radius alert slider */}
            <div className="bg-[#1B1B1B] p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-[#E8EAD8]">Alert Radius Parameter</h4>
                  <p className="text-[11px] text-[#A8AA98] mt-0.5">Receive immediate notifications when new scraps are listed within this radius.</p>
                </div>
                <span className="font-mono text-base font-black text-[#A8D97F] bg-[#2A4A10]/30 px-3 py-1 rounded-lg border border-[#A8D97F]/10 shrink-0">
                  {alertRadius} miles
                </span>
              </div>
              
              <div className="space-y-1">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={alertRadius}
                  onChange={(e) => setAlertRadius(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-[#141414] appearance-none cursor-pointer accent-[#A8D97F]"
                />
                <div className="flex justify-between text-[10px] font-bold text-[#8C8F7E] font-mono">
                  <span>1 mile</span>
                  <span>25 miles</span>
                  <span>50 miles</span>
                </div>
              </div>
            </div>

            {/* Toggle alert options */}
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Communication Channels</label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
                  <div className="flex-1 pr-4">
                    <h5 className="text-sm font-bold text-[#E8EAD8]">Email Weekly Digest</h5>
                    <p className="text-[11px] text-[#A8AA98] mt-0.5">A condensed summary of loop achievements, CO2 savings, and top regional donors.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailDigest(!emailDigest)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      emailDigest ? 'bg-[#A8D97F]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                      emailDigest ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
                  <div className="flex-1 pr-4">
                    <h5 className="text-sm font-bold text-[#E8EAD8]">Real-time Push Alerts</h5>
                    <p className="text-[11px] text-[#A8AA98] mt-0.5">Instant browser notifications for nearby listings, chats, and request acceptances.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushAlerts(!pushAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pushAlerts ? 'bg-[#A8D97F]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                      pushAlerts ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
                  <div className="flex-1 pr-4">
                    <h5 className="text-sm font-bold text-[#E8EAD8]">Socio-Environmental Achievements</h5>
                    <p className="text-[11px] text-[#A8AA98] mt-0.5">Notify me immediately when I reach milestones, divert goals, or level up.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEcoReports(!ecoReports)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      ecoReports ? 'bg-[#A8D97F]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                      ecoReports ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-white/6 pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
              >
                <Save size={16} />
                <span>Save Alert Configurations</span>
              </button>
            </div>
          </form>
        );

      // 4. THEMES, ACCESSIBILITY, GRAPHICS
      case 'appearance':
        return (
          <form onSubmit={handleSaveAppearance} className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-[#E8EAD8] font-display">Appearance & Themes</h3>
              <p className="text-xs text-[#A8AA98] mt-1">Adjust graphics, fonts, container contrast scales, and interface density options.</p>
            </div>

            {/* Theme selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Theme Palette</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Forest HSL', desc: 'Default (Eco-Green)', css: 'bg-[#141414] border-[#A8D97F] text-[#A8D97F]' },
                  { name: 'Classic Dark', desc: 'Charcoal Minimal', css: 'bg-[#121212] border-white/10 text-white' },
                  { name: 'Light Mode', desc: 'Disabled (Dark First)', css: 'bg-white border-black/10 text-black opacity-50 cursor-not-allowed' }
                ].map((th) => (
                  <button
                    key={th.name}
                    type="button"
                    disabled={th.name === 'Light Mode'}
                    onClick={() => th.name !== 'Light Mode' && setSelectedTheme(th.name)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      selectedTheme === th.name && th.name !== 'Light Mode'
                        ? 'bg-[#2A4A10]/20 border-[#A8D97F] ring-2 ring-[#A8D97F]/20'
                        : 'bg-white/4 border-white/6 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#E8EAD8]">{th.name}</span>
                      {selectedTheme === th.name && th.name !== 'Light Mode' && (
                        <CheckCircle size={14} className="text-[#A8D97F]" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#A8AA98] mt-1 font-semibold">{th.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Density Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Interface Density</label>
              <div className="flex gap-2 bg-[#141414] p-1.5 rounded-xl border border-white/6 max-w-sm">
                {['Comfortable', 'Compact', 'Spacious'].map((den) => (
                  <button
                    key={den}
                    type="button"
                    onClick={() => setSelectedDensity(den)}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                      selectedDensity === den
                        ? 'bg-[#A8D97F] text-[#1A3A05]'
                        : 'text-[#A8AA98] hover:text-[#E8EAD8] hover:bg-white/2'
                    }`}
                  >
                    {den}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility toggles */}
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Accessibility Toggles</label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
                  <div className="flex-1 pr-4">
                    <h5 className="text-sm font-bold text-[#E8EAD8]">High Contrast Typography</h5>
                    <p className="text-[11px] text-[#A8AA98] mt-0.5">Increases text color luminance threshold to support screen readers and clarity.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      highContrast ? 'bg-[#A8D97F]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                      highContrast ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
                  <div className="flex-1 pr-4">
                    <h5 className="text-sm font-bold text-[#E8EAD8]">Reduce UI Motions</h5>
                    <p className="text-[11px] text-[#A8AA98] mt-0.5">Disables fluid sidebar slides, globe spins, and transitions for enhanced accessibility.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReduceMotion(!reduceMotion)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      reduceMotion ? 'bg-[#A8D97F]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                      reduceMotion ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-white/6 pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
              >
                <Save size={16} />
                <span>Apply Appearance</span>
              </button>
            </div>
          </form>
        );

      // 5. ECO GOALS, WASTE DIVERSIONS & PREFERENCES
      case 'sustainability':
        return (
          <form onSubmit={handleSaveSustainability} className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-[#E8EAD8] font-display">Sustainability Preferences</h3>
              <p className="text-xs text-[#A8AA98] mt-1">Manage target annual bio-mass diversions and configure your favorite scrap streams.</p>
            </div>

            {/* Annual goal slider */}
            <div className="bg-[#1B1B1B] p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-[#E8EAD8]">Annual Waste Diversion Target</h4>
                  <p className="text-[11px] text-[#A8AA98] mt-0.5">Set a metric target for the mass of organic matter you aim to salvage/compost.</p>
                </div>
                <span className="font-mono text-base font-black text-[#A8D97F] bg-[#2A4A10]/30 px-3 py-1 rounded-lg border border-[#A8D97F]/10 shrink-0">
                  {diversionGoal} kg / year
                </span>
              </div>
              
              <div className="space-y-1">
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="50"
                  value={diversionGoal}
                  onChange={(e) => setDiversionGoal(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-[#141414] appearance-none cursor-pointer accent-[#A8D97F]"
                />
                <div className="flex justify-between text-[10px] font-bold text-[#8C8F7E] font-mono">
                  <span>100 kg</span>
                  <span>2500 kg</span>
                  <span>5000 kg</span>
                </div>
              </div>
            </div>

            {/* Scrap Type checklist */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Preferred Material Streams</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'fruitVeg', label: 'Fruits & Veggies Scraps', desc: 'Compost feed, high nitrogen' },
                  { id: 'coffeeTea', label: 'Coffee Grounds & Tea', desc: 'Great for acidic soil mixing' },
                  { id: 'eggshells', label: 'Crushed Eggshells', desc: 'Calcium rich additive sources' },
                  { id: 'yardWaste', label: 'Yard clippings & Leaves', desc: 'Carbon-heavy dry matter brown source' },
                  { id: 'bakery', label: 'Bakery & Grain Excess', desc: 'Valuable animal feeds, chicken feed' }
                ].map((scrap) => {
                  const key = scrap.id as keyof typeof scrapPrefs;
                  const isChecked = scrapPrefs[key];
                  return (
                    <button
                      key={scrap.id}
                      type="button"
                      onClick={() => setScrapPrefs(prev => ({ ...prev, [key]: !isChecked }))}
                      className={`p-4 rounded-xl border text-left flex items-start justify-between transition-colors ${
                        isChecked 
                          ? 'bg-[#2A4A10]/20 border-[#A8D97F]/30 text-[#A8D97F]' 
                          : 'bg-white/4 border-white/6 hover:bg-white/6 text-[#A8AA98]'
                      }`}
                    >
                      <div className="pr-4">
                        <span className="text-sm font-bold text-[#E8EAD8]">{scrap.label}</span>
                        <p className="text-[10px] text-[#A8AA98] mt-1 font-semibold">{scrap.desc}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                        isChecked ? 'bg-[#A8D97F] border-transparent text-[#1A3A05]' : 'border-white/20'
                      }`}>
                        {isChecked && <Check size={12} strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Usage Select options */}
            <div className="space-y-1.5 pt-2 max-w-sm">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Primary Scrap Utilization</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#E8EAD8] focus:outline-none focus:border-[#A8D97F] transition-colors cursor-pointer"
              >
                {['Composting', 'Animal Feed', 'Biogas / Biofuel Energy', 'Urban Crop Cultivation'].map((pur) => (
                  <option key={pur} value={pur} className="bg-[#141414] text-[#E8EAD8] font-semibold">{pur}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-white/6 pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
              >
                <Save size={16} />
                <span>Save Environmental Goals</span>
              </button>
            </div>
          </form>
        );

      // 6. PREMIUM TIERS, PAYMENTS & LOGS
      case 'billing':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-[#E8EAD8] font-display">Sponsorship & Plans</h3>
              <p className="text-xs text-[#A8AA98] mt-1">Unlock premium 3D graphics mapping tools and help fund zero-waste logistics.</p>
            </div>

            {/* Plan tier cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Free Tier Card */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] relative overflow-hidden ${
                !isPremium ? 'bg-[#1B1B1B] border-[#2A4A10]' : 'bg-white/2 border-white/6 opacity-60'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider uppercase bg-[#141414] px-2.5 py-0.5 rounded border border-white/6 text-[#A8AA98]">FREE TIER</span>
                    {!isPremium && <span className="text-[10px] font-bold text-[#A8D97F] flex items-center gap-1"><CheckCircle size={12} /> Active</span>}
                  </div>
                  <h4 className="text-lg font-bold text-[#E8EAD8] mt-3">Eco Supporter</h4>
                  <p className="text-[11px] text-[#A8AA98] mt-1 leading-relaxed">Basic scrap listings, browse community globe pins, view standard metrics.</p>
                </div>
                <div className="text-sm font-mono font-black text-[#E8EAD8] mt-4">$0.00 <span className="text-[10px] font-semibold text-[#8C8F7E]">/ month</span></div>
              </div>

              {/* Premium Tier Card */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] relative overflow-hidden ${
                isPremium ? 'bg-[#1B1B1B] border-[#A8D97F]' : 'bg-[#2A4A10]/10 border-[#A8D97F]/20'
              }`}>
                {/* Glow badge overlay */}
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-16 w-16 bg-[#A8D97F]/10 rounded-full blur-xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider uppercase bg-[#A8D97F] px-2.5 py-0.5 rounded text-[#1A3A05] flex items-center gap-1">
                      <Sparkles size={11} /> Community Patron
                    </span>
                    {isPremium && <span className="text-[10px] font-bold text-[#A8D97F] flex items-center gap-1"><CheckCircle size={12} /> Active</span>}
                  </div>
                  <h4 className="text-lg font-bold text-[#E8EAD8] mt-3">Loop Advocate</h4>
                  <p className="text-[11px] text-[#A8AA98] mt-1 leading-relaxed">Unlimited 3D map flying queries, priority pickup labels, custom page skins, monthly CO2 certifications.</p>
                </div>
                
                {isPremium ? (
                  <div className="text-sm font-mono font-black text-[#A8D97F] mt-4">$4.99 <span className="text-[10px] font-semibold text-[#87B85E]">/ month</span></div>
                ) : (
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="text-sm font-mono font-black text-[#E8EAD8]">$4.99 <span className="text-[10px] font-semibold text-[#8C8F7E]">/ mo</span></span>
                    <button
                      type="button"
                      onClick={handleUpgradePremium}
                      className="rounded-lg bg-[#A8D97F] px-3.5 py-1.5 text-xs font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
                    >
                      Upgrade Plan
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Invoices Logs table */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-[#A8AA98] uppercase tracking-wider block">Billing History Logs</label>
              
              <div className="border border-white/6 rounded-xl overflow-hidden bg-white/2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1B1B1B] border-b border-white/6 text-[#A8AA98] font-bold">
                      <th className="p-3">Billing Date</th>
                      <th className="p-3">Reference / Plan</th>
                      <th className="p-3">Amount Charged</th>
                      <th className="p-3 text-right">Invoice State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4 text-[#E8EAD8]">
                    {isPremium && (
                      <tr>
                        <td className="p-3 font-mono font-semibold flex items-center gap-1.5">
                          <Clock size={12} className="text-[#A8D97F]" /> May 20, 2026
                        </td>
                        <td className="p-3 font-semibold">Loop Advocate Plan (Active)</td>
                        <td className="p-3 font-mono font-bold">$4.99 USD</td>
                        <td className="p-3 text-right text-xs text-[#A8D97F] font-bold">Paid</td>
                      </tr>
                    )}
                    <tr>
                      <td className="p-3 font-mono font-semibold text-[#A8AA98]">May 01, 2026</td>
                      <td className="p-3 font-semibold text-[#A8AA98]">Account Setup / Registration</td>
                      <td className="p-3 font-mono text-[#A8AA98]">$0.00 USD</td>
                      <td className="p-3 text-right text-xs text-[#A8AA98] font-semibold">Processed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen md:h-screen flex-col bg-[#0A0A0A] text-[#E8EAD8] md:overflow-hidden">
      <div className="relative flex flex-1 overflow-y-auto md:overflow-hidden md:h-full w-full">
        
        {/* Subsidebar Desktop Panel (Left Pane) - Stuck flush to the left, no margins, no rounded corners */}
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col border-r border-white/6 bg-[#0E0E0E] h-full overflow-y-auto p-4 scrollbar-none">
          <div className="mb-4 px-3 pt-2">
            <h1 className="font-display text-lg font-extrabold tracking-tight text-[#E8EAD8]">
              Settings
            </h1>
            <p className="text-[11px] text-[#A8AA98] mt-1 font-semibold">
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
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#E8EAD8]">
                Settings
              </h1>
              <p className="text-xs text-[#A8AA98] mt-1 font-semibold">
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
