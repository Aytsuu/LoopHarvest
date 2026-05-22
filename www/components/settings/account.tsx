'use client';

import * as React from 'react';
import { 
  Check, 
  CheckCircle, 
  Edit3, 
  MapPin, 
  Compass, 
  ShieldAlert, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  HelpCircle, 
  Save 
} from 'lucide-react';

export type GeolocationPermissionState = 'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface AccountProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  bio: string;
  setBio: (val: string) => void;
  avatarSeed: string;
  setAvatarSeed: (val: string) => void;
  locationPermission: GeolocationPermissionState;
  locationPrompt: string | null;
  isResolvingLocation: boolean;
  isManualLocation: boolean;
  setIsManualLocation: (val: boolean) => void;
  showTroubleshooting: boolean;
  setShowTroubleshooting: (val: boolean) => void;
  requestBrowserLocation: () => Promise<void>;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
}

export default function Account({
  displayName,
  setDisplayName,
  email,
  setEmail,
  location,
  setLocation,
  bio,
  setBio,
  avatarSeed,
  setAvatarSeed,
  locationPermission,
  locationPrompt,
  isResolvingLocation,
  isManualLocation,
  setIsManualLocation,
  showTroubleshooting,
  setShowTroubleshooting,
  requestBrowserLocation,
  handleSaveProfile,
}: AccountProps) {
  return (
    <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">Account Information</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">Update your public credentials, display seed, and profile description.</p>
      </div>

      {/* Avatar seeds selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Choose Avatar</label>
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
          <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors"
          />
        </div>

        <div className="space-y-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">
              Location (Region)
            </label>
            {locationPermission === 'granted' && !isManualLocation ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#2A4A10] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#A8D97F] border border-[#A8D97F]/10 animate-fade-in">
                <CheckCircle size={10} />
                <span>Auto-Detected</span>
              </span>
            ) : isManualLocation ? (
              <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#A8D97F] border border-[#A8D97F]/10 animate-fade-in">
                <Edit3 size={10} />
                <span>Manual Input Active</span>
              </span>
            ) : null}
          </div>

          <div className="relative">
            <input
              type="text"
              value={isResolvingLocation ? "Detecting current region..." : location}
              readOnly={!isManualLocation}
              onChange={isManualLocation ? (e) => setLocation(e.target.value) : undefined}
              placeholder="e.g. San Francisco, CA"
              className={`w-full h-11 bg-white/4 border rounded-xl pl-11 pr-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none transition-all duration-200 ${
                isManualLocation 
                  ? 'border-[#A8D97F]/40 focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/20' 
                  : 'border-white/8 focus:border-white/20'
              }`}
            />
            <span className="absolute inset-y-0 left-3.5 flex items-center text-[#A3A3A3]">
              <MapPin size={16} className={locationPermission === 'granted' && !isManualLocation ? "text-[#A8D97F]" : "text-[#A3A3A3]"} />
            </span>
          </div>

          {/* Manual override and auto-detect triggers */}
          <div className="flex items-center gap-4 text-[10px] font-bold text-[#A3A3A3] px-1 select-none">
            {isManualLocation ? (
              <button
                type="button"
                onClick={() => {
                  setIsManualLocation(false);
                  void requestBrowserLocation();
                }}
                className="text-[#A8D97F] hover:text-[#B8E890] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Compass size={11} />
                <span>Switch to Auto-Detection</span>
              </button>
            ) : (
              locationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={() => setIsManualLocation(true)}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} />
                  <span>Enter region manually instead</span>
                </button>
              )
            )}
          </div>

          {locationPermission === 'granted' && !isManualLocation ? (
            /* Premium Granted State Callout */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#2A4A10]/40 bg-[#2A4A10]/10 p-4 shadow-md backdrop-blur-sm animate-fade-in">
              <div className="flex gap-3 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2A4A10] border border-[#A8D97F]/20 text-[#A8D97F]">
                  <Compass size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#FFFFFF]">Regional Clustering Active</h4>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A3A3]">
                    Marketplace search metrics, dynamic carbon routings, and nearest pickup lists are customized for <span className="font-semibold text-white">{location || "your region"}</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void requestBrowserLocation()}
                disabled={isResolvingLocation}
                className="shrink-0 self-start sm:self-center rounded-xl border border-white/10 bg-[#141414] px-3.5 py-1.5 text-[10px] font-bold text-white hover:border-[#A8D97F]/30 hover:bg-[#1B1B1B] active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isResolvingLocation ? 'Syncing...' : 'Refresh Location'}
              </button>
            </div>
          ) : (
            /* Premium Promotion and Prompt Callout Box */
            <div className="rounded-2xl border border-white/6 bg-[#141414]/50 p-4 sm:p-5 relative overflow-hidden transition-all duration-300 hover:border-white/10 shadow-lg group">
              <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 h-24 w-24 rounded-full bg-[#A8D97F]/5 blur-2xl pointer-events-none select-none" />
              
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2A4A10]/10 border border-[#A8D97F]/10 text-[#A8D97F] group-hover:border-[#A8D97F]/20 transition-all shadow-inner relative">
                    <MapPin size={18} className="animate-pulse text-[#A8D97F]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Enable Real-Time Clustering</h4>
                    <p className="text-[11px] leading-relaxed text-[#A3A3A3] max-w-xl">
                      {locationPrompt || 'Allow secure region-detection to instantly map local organic waste listings, optimize pickup logistics, and view active composting partners within your community.'}
                    </p>
                    <p className="text-[9px] text-[#525252] font-semibold flex items-center gap-1 pt-1">
                      <span>🛡️ Privacy-first: We only geocode your city/region. We never trace or log your exact GPS coordinates.</span>
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 self-stretch md:self-center flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (locationPermission === 'denied') {
                        setShowTroubleshooting(!showTroubleshooting);
                        void requestBrowserLocation();
                      } else {
                        void requestBrowserLocation();
                      }
                    }}
                    disabled={isResolvingLocation || locationPermission === 'unsupported'}
                    className={`w-full md:w-auto rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isResolvingLocation
                        ? 'bg-white/5 text-[#A3A3A3] border border-white/8 cursor-not-allowed'
                        : locationPermission === 'denied'
                        ? 'bg-[#7A1010]/20 text-[#FFB4AB] border border-[#E05656]/20 hover:border-[#E05656]/40 hover:bg-[#7A1010]/30'
                        : 'bg-[#A8D97F] text-[#1A3A05] hover:brightness-105 shadow-md shadow-[#A8D97F]/10'
                    }`}
                  >
                    {isResolvingLocation ? (
                      <>
                        <Clock size={14} className="animate-spin" />
                        <span>Detecting...</span>
                      </>
                    ) : locationPermission === 'denied' ? (
                      <>
                        <ShieldAlert size={14} />
                        <span>Permission Blocked</span>
                      </>
                    ) : (
                      <>
                        <Compass size={14} />
                        <span>Auto-Detect Region</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Premium Troubleshooting Guide for Geolocation Blocked States */}
              {(locationPermission === 'denied' || showTroubleshooting) && (
                <div className="mt-4 border-t border-white/6 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                    className="flex w-full items-center justify-between text-xs font-bold text-white hover:text-[#A8D97F] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={14} className="text-[#A3A3A3]" />
                      <span>
                        {locationPermission === 'denied'
                          ? 'Turned location ON but still showing blocked?'
                          : 'Location allowed but still not detecting your region?'}
                      </span>
                    </span>
                    {showTroubleshooting ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showTroubleshooting && (
                    <div className="mt-3.5 space-y-4 rounded-xl bg-white/2 p-4 text-[11px] leading-relaxed text-[#A3A3A3] border border-white/4 animate-fade-in">
                      <div className="space-y-1">
                        <h5 className="font-bold text-white flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#A8D97F]/10 text-[#A8D97F] text-[9px] font-black">1</span>
                          <span>Reset Browser Permissions & Refresh</span>
                        </h5>
                        <p className="pl-5 text-[#A3A3A3]">
                          Click the <span className="font-semibold text-white">Lock or Tune icon 🔒</span> directly on the left of your browser address bar. Set <span className="font-semibold text-white">Location</span> to <span className="font-semibold text-[#A8D97F]">Allow</span>. 
                          <span className="block mt-1 text-white font-semibold">⚠️ Crucial: Refresh the page (Ctrl + R or ⌘ + R) to synchronize the browser context!</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#A8D97F]/10 text-[#A8D97F] text-[9px] font-black">2</span>
                          <span>Check Windows Privacy Settings (Your OS)</span>
                        </h5>
                        <div className="pl-5 text-[#A3A3A3] space-y-1">
                          <p>If system-wide location is blocked, the browser cannot read GPS even if you set it to Allow.</p>
                          <div className="block mt-1 bg-[#1A1A1A] p-2 rounded-lg border border-white/6 font-mono text-[10px] text-white leading-relaxed">
                            Go to <span className="font-bold text-[#A8D97F]">Windows Settings (Win + I)</span> &gt; <span className="font-bold text-[#A8D97F]">Privacy & security</span> &gt; <span className="font-bold text-[#A8D97F]">Location</span>.<br />
                            1. Toggle <span className="font-semibold">&quot;Location services&quot;</span> to <span className="text-[#A8D97F]">ON</span>.<br />
                            2. Toggle <span className="font-semibold">&quot;Let apps access your location&quot;</span> to <span className="text-[#A8D97F]">ON</span>.<br />
                            3. Verify your web browser is enabled in the list below.
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-bold text-white flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#A8D97F]/10 text-[#A8D97F] text-[9px] font-black">3</span>
                          <span>Check macOS Privacy Settings</span>
                        </h5>
                        <div className="pl-5 text-[#A3A3A3] space-y-1">
                          <div className="block bg-[#1A1A1A] p-2 rounded-lg border border-white/6 font-mono text-[10px] text-white leading-relaxed">
                            Go to <span className="font-bold text-[#A8D97F]">System Settings</span> &gt; <span className="font-bold text-[#A8D97F]">Privacy & Security</span> &gt; <span className="font-bold text-[#A8D97F]">Location Services</span>. Toggle Location Services <span className="text-[#A8D97F]">ON</span> and enable your browser.
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-white/4">
                        <h5 className="font-bold text-white">Still having trouble? Override with Manual Entry</h5>
                        <p className="text-[#A3A3A3]">
                          If corporate security profiles, VPN services, or firewalls block automated lookup, you can type your region directly:
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsManualLocation(true)}
                          className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3.5 py-1.5 text-[10px] font-bold text-white hover:bg-white/10 hover:border-[#A8D97F]/30 active:scale-98 transition-all cursor-pointer"
                        >
                          <Edit3 size={12} className="text-[#A8D97F]" />
                          <span>Switch to Manual Input</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Public Biography</label>
          <textarea
            value={bio}
            rows={3}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-white/4 border border-white/8 rounded-xl p-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors resize-none"
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
}
