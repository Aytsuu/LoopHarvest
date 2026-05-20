'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, PlusCircle } from 'lucide-react';
import Globe from "@/components/Globe";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'donor' | 'recipient'>('donor');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate signup loading delay
    setTimeout(() => {
      setIsLoading(false);
      document.cookie = "fl_logged_in=true; path=/; max-age=86400";
      router.push('/home');
    }, 1200);
  };

  return (
    <main className="relative flex h-screen w-screen items-center justify-center bg-[#0A0A0A] px-4 overflow-hidden">
      
      {/* Background Interactive Globe - low opacity */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none select-none scale-105">
        {isLargeScreen && <Globe />}
      </div>

      {/* Dark Ambient Vignette overlay */}
      <div className="absolute inset-0 z-1 bg-gradient-to-tr from-[#0A0A0A] via-transparent to-[#0A0A0A]/90 pointer-events-none" />

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/8 bg-[#141414]/80 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="LoopHarvest" className="h-12 w-12 object-contain rounded-2xl shadow-lg mb-3" />
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#E8EAD8]">
            Create Loop Account
          </h2>
          <p className="text-xs text-[#A8AA98] mt-1.5 max-w-xs">
            Start saving organic scrap materials and claim your carbon diversion awards.
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-4 rounded-xl bg-[#7A1010]/30 border border-[#E05656]/30 p-3.5 text-xs font-semibold text-[#FFB4AB] flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Role Segment Button */}
        <div className="mb-5 space-y-1.5">
          <span className="text-xs font-bold text-[#A8AA98]">Select Your Primary Role</span>
          <div className="flex rounded-xl bg-[#0A0A0A]/60 p-1 border border-white/6">
            <button
              type="button"
              onClick={() => setRole('donor')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                role === 'donor'
                  ? 'bg-[#2A4A10] text-[#A8D97F]'
                  : 'text-[#A8AA98] hover:text-[#E8EAD8]'
              }`}
            >
              🍉 Waste Donor
            </button>
            <button
              type="button"
              onClick={() => setRole('recipient')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                role === 'recipient'
                  ? 'bg-[#004D48] text-[#4ECDC4]'
                  : 'text-[#A8AA98] hover:text-[#E8EAD8]'
              }`}
            >
              🐓 Waste Recipient
            </button>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A8AA98]" htmlFor="name">
              Organization or Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-[#5A5C50]">
                <User size={16} />
              </span>
              <input
                id="name"
                type="text"
                placeholder="Tartine Bakery"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-[#0A0A0A]/60 text-sm text-[#E8EAD8] placeholder-[#5A5C50] focus:border-[#A8D97F] focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A8AA98]" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-[#5A5C50]">
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="compost@farm.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-[#0A0A0A]/60 text-sm text-[#E8EAD8] placeholder-[#5A5C50] focus:border-[#A8D97F] focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A8AA98]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-[#5A5C50]">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-[#0A0A0A]/60 text-sm text-[#E8EAD8] placeholder-[#5A5C50] focus:border-[#A8D97F] focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-12 rounded-xl text-sm font-black transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-6 disabled:opacity-50 ${
              role === 'donor' ? 'bg-[#A8D97F] text-[#1A3A05]' : 'bg-[#4ECDC4] text-[#003733]'
            }`}
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <span>Create Account</span>
                <PlusCircle size={16} />
              </>
            )}
          </button>
        </form>

        {/* Log in prompt */}
        <div className="text-center mt-6 text-xs text-[#A8AA98]">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="font-bold text-[#A8D97F] hover:underline"
          >
            Sign in
          </button>
        </div>

      </div>
    </main>
  );
}
