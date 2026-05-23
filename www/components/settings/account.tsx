'use client';

import * as React from 'react';
import { 
  Check, 
  Save 
} from 'lucide-react';

export interface AccountProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  stateProv: string;
  setStateProv: (val: string) => void;
  postalCode: string;
  setPostalCode: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  avatarSeed: string;
  setAvatarSeed: (val: string) => void;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
}

export default function Account({
  displayName,
  setDisplayName,
  email,
  setEmail,
  city,
  setCity,
  stateProv,
  setStateProv,
  postalCode,
  setPostalCode,
  country,
  setCountry,
  bio,
  setBio,
  avatarSeed,
  setAvatarSeed,
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

        {/* Complete Location Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2 pt-2 border-t border-white/6">
          <div className="sm:col-span-2">
            <h4 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">Coverage & Location</h4>
            <p className="text-[10px] text-[#A3A3A3] mt-0.5">Please provide your precise region credentials for community routing.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Francisco"
              className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">State / Region</label>
            <input
              type="text"
              value={stateProv}
              onChange={(e) => setStateProv(e.target.value)}
              placeholder="e.g. California"
              className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Postal / Zip Code</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 94103"
              className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States"
              className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-white/6">
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
          className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md cursor-pointer"
        >
          <Save size={16} />
          <span>Save Profile</span>
        </button>
      </div>
    </form>
  );
}
