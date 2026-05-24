'use client';

import * as React from 'react';
import { 
  Camera,
  Loader2,
  Save 
} from 'lucide-react';

export interface AccountProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  email: string;
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
  avatarPreviewUrl: string | null;
  isAvatarUploading: boolean;
  avatarUploadError: string | null;
  onAvatarFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  savePending: boolean;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
}

export default function Account({
  displayName,
  setDisplayName,
  email,
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
  avatarPreviewUrl,
  isAvatarUploading,
  avatarUploadError,
  onAvatarFileSelect,
  savePending,
  handleSaveProfile,
}: AccountProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "L";
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">Account Information</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">Update your public credentials, profile image, and profile description.</p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Profile Image</label>
        <div className="rounded-2xl border border-white/6 bg-[#111111] p-4">
          <div className="flex items-center gap-4">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={onAvatarFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isAvatarUploading}
              className="group relative shrink-0 rounded-full transition disabled:cursor-wait disabled:opacity-80"
              aria-label="Choose profile image"
            >
              {avatarPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreviewUrl}
                  alt="Profile preview"
                  className="h-16 w-16 rounded-full border border-white/10 bg-[#141414] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#1B1B1B] text-lg font-black text-[#A8D97F]">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
                {isAvatarUploading ? (
                  <Loader2 size={18} className="animate-spin text-[#A8D97F]" />
                ) : (
                  <Camera size={18} className="text-[#A8D97F]" />
                )}
              </div>
            </button>
            <div>
              <p className="text-xs font-bold text-[#FFFFFF]">
                {avatarPreviewUrl ? "Profile image selected" : "No profile image on this account"}
              </p>
              <p className="mt-1 text-[11px] text-[#8C8F7E]">
                {avatarPreviewUrl
                  ? "Click the avatar to replace it. Uploading updates the preview immediately; save profile to persist it."
                  : "Click the avatar to choose an image. Uploading updates the preview immediately; save profile to persist it."}
              </p>
              {avatarUploadError ? (
                <p className="mt-2 text-[10px] font-medium text-[#F87171]">{avatarUploadError}</p>
              ) : (
                <p className="mt-2 text-[10px] font-medium text-[#8C8F7E]">
                  Recommended: square image, under 4 MB.
                </p>
              )}
            </div>
          </div>
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
            disabled
            readOnly
            className="w-full h-11 cursor-not-allowed bg-white/3 border border-white/6 rounded-xl px-4 text-sm font-semibold text-[#8C8F7E] focus:outline-none"
          />
          <p className="text-[10px] font-medium text-[#8C8F7E]">Email is verified during signup and cannot be changed here.</p>
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
          disabled={savePending}
          className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md cursor-pointer"
        >
          <Save size={16} />
          <span>{savePending ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>
    </form>
  );
}
