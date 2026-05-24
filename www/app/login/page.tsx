'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

import StarsBackground from "@/components/StarsBackground";
import { buildAuthCallbackUrl } from "@/lib/auth/redirect-url";
import { createClient } from "@/lib/supabase/client";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState(() => searchParams.get('email') || '');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const notice = React.useMemo(() => {
    const signupState = searchParams.get('signup');
    const signupEmail = searchParams.get('email');
    if (signupState === 'check-email') {
      return signupEmail
        ? `Account created for ${signupEmail}. Confirm the email first, then sign in.`
        : 'Account created. Confirm the email first, then sign in.';
    }
    if (signupState === 'ready') {
      return 'Account created. You can sign in now.';
    }
    return '';
  }, [searchParams]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const authCode = searchParams.get('code');
    const next = searchParams.get('next') || '/home';

    if (authCode) {
      router.replace(`/auth/callback?code=${encodeURIComponent(authCode)}&next=${encodeURIComponent(next)}`);
    }
  }, [searchParams, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const next = searchParams.get('next') || '/home';
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "apple") => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const next = searchParams.get('next') || '/home';
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildAuthCallbackUrl(next),
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start single sign-on.');
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
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="LoopHarvest"
            width={48}
            height={48}
            className="mb-3 h-12 w-12 object-contain"
          />
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
            Sign in to LoopHarvest
          </h2>
          <p className="mt-1.5 max-w-xs text-xs text-[#A3A3A3]">
            Connect to the hyperlocal circular network and claim carbon diversion rewards.
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="chef@bistro.com"
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
                placeholder="Your password"
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
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A8D97F] text-sm font-black text-[#1A3A05] transition-transform hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A3A05] border-t-transparent" />
            ) : (
              <>
                <span>Sign In</span>
                <ShieldCheck size={16} />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#525252]">
          <div className="h-px flex-1 bg-white/6" />
          <span className="px-3 select-none">Or continue with</span>
          <div className="h-px flex-1 bg-white/6" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] text-xs font-bold text-[#FFFFFF] transition-all hover:bg-[#1B1B1B] hover:border-white/20 disabled:opacity-50"
          >
            <span>Google</span>
          </button>
          <button
            onClick={() => handleOAuthLogin('apple')}
            disabled={isLoading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] text-xs font-bold text-[#FFFFFF] transition-all hover:bg-[#1B1B1B] hover:border-white/20 disabled:opacity-50"
          >
            <span>Apple ID</span>
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-[#A3A3A3]">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => router.push('/signup')}
            className="font-bold text-[#A8D97F] hover:underline"
          >
            Create an account
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginPageContent />
    </React.Suspense>
  );
}
