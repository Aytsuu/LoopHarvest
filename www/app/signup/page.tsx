'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, PlusCircle, ArrowLeft } from 'lucide-react';

import StarsBackground from "@/components/StarsBackground";
import { buildAuthCallbackUrl } from "@/lib/auth/redirect-url";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'donor' | 'recipient'>('donor');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setNotice('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
          },
          emailRedirectTo: buildAuthCallbackUrl('/home'),
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.replace('/home');
        router.refresh();
        return;
      }

      setNotice('Account created. Redirecting you to sign in instructions...');
      router.replace(`/login?signup=check-email&email=${encodeURIComponent(email)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4">
      {/* Back to landing button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 rounded-full border border-white/6 bg-[#141414]/60 px-4 py-2 text-xs font-bold text-[#A3A3A3] backdrop-blur-md transition-all hover:bg-white/4 hover:text-[#FFFFFF] active:scale-95 group"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Landing</span>
      </button>

      <div className="absolute inset-0 z-0 select-none opacity-50 pointer-events-none">
        <StarsBackground />
      </div>

      <div className="absolute inset-0 z-1 bg-gradient-to-tr from-[#0A0A0A] via-transparent to-[#0A0A0A]/90 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/8 bg-[#141414]/80 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="LoopHarvest" className="mb-3 h-12 w-12 rounded-2xl object-contain shadow-lg" />
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
            Create Loop Account
          </h2>
          <p className="mt-1.5 max-w-xs text-xs text-[#A3A3A3]">
            Start saving organic scrap materials and claim your carbon diversion awards.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#E05656]/30 bg-[#7A1010]/30 p-3.5 text-xs font-semibold text-[#FFB4AB]">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-xl border border-[#A8D97F]/20 bg-[#11331D]/40 p-3.5 text-xs font-semibold text-[#C4F09A]">
            {notice}
          </div>
        )}

        <div className="mb-5 space-y-1.5">
          <span className="text-xs font-bold text-[#A3A3A3]">Select Your Primary Role</span>
          <div className="flex rounded-xl border border-white/6 bg-[#0A0A0A]/60 p-1">
            <button
              type="button"
              onClick={() => setRole('donor')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                role === 'donor'
                  ? 'bg-[#2A4A10] text-[#A8D97F]'
                  : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
              }`}
            >
              Waste Donor
            </button>
            <button
              type="button"
              onClick={() => setRole('recipient')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                role === 'recipient'
                  ? 'bg-[#2A4A10] text-[#A8D97F]'
                  : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
              }`}
            >
              Waste Recipient
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A3A3A3]" htmlFor="name">
              Organization or Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-[#525252]">
                <User size={16} />
              </span>
              <input
                id="name"
                type="text"
                placeholder="Tartine Bakery"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0A0A]/60 pl-10 pr-4 text-sm text-[#FFFFFF] placeholder-[#525252] transition-all focus:border-[#A8D97F] focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A3A3A3]" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-[#525252]">
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="compost@farm.org"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0A0A]/60 pl-10 pr-4 text-sm text-[#FFFFFF] placeholder-[#525252] transition-all focus:border-[#A8D97F] focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A3A3A3]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-[#525252]">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0A0A]/60 pl-10 pr-4 text-sm text-[#FFFFFF] placeholder-[#525252] transition-all focus:border-[#A8D97F] focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition-transform active:scale-[0.98] disabled:opacity-50 bg-[#A8D97F] text-[#1A3A05]`}
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

        <div className="mt-6 text-center text-xs text-[#A3A3A3]">
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
