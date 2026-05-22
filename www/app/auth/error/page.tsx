'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import StarsBackground from "@/components/StarsBackground";

function ErrorCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const error = searchParams.get('error') || 'auth_error';
  const message = searchParams.get('message') || 'An unexpected error occurred during authentication. Please try again.';

  return (
    <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-red-500/20 bg-[#141414]/80 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-md text-center animate-blur-in">
      {/* Red Glowing Icon Aura */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_24px_rgba(224,86,86,0.15)]">
        <AlertCircle size={40} className="text-[#E05656]" />
      </div>

      <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
        Authentication Failed
      </h2>
      
      <p className="text-xs text-[#A3A3A3] mt-2 font-mono uppercase tracking-wider bg-black/40 py-1 px-3 rounded-full inline-block border border-white/5">
        Code: {error}
      </p>

      <div className="my-6 rounded-2xl bg-[#7A1010]/15 border border-[#E05656]/25 p-5 text-xs text-[#FFB4AB] leading-relaxed text-left font-sans">
        {message}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => router.push('/login')}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#E05656] to-[#C03636] hover:brightness-110 text-sm font-black text-white transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={16} />
          <span>Return to Sign In</span>
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full h-12 rounded-xl border border-white/10 bg-[#141414] hover:bg-[#1B1B1B] hover:border-white/20 text-sm font-bold text-[#FFFFFF] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Landing Page</span>
        </button>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="relative flex h-screen w-screen items-center justify-center bg-[#0A0A0A] px-4 overflow-hidden">
      {/* Background Starfield */}
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-none select-none">
        <StarsBackground />
      </div>

      {/* Dark Ambient Vignette overlay */}
      <div className="absolute inset-0 z-1 bg-gradient-to-tr from-[#0A0A0A] via-transparent to-[#0A0A0A]/90 pointer-events-none" />

      {/* Suspense wrapper to prevent Next.js build deopt */}
      <React.Suspense fallback={
        <div className="relative z-10 text-[#A3A3A3] flex flex-col items-center gap-4">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#A8D97F] border-t-transparent" />
          <span className="text-xs font-bold uppercase tracking-widest">Loading error context...</span>
        </div>
      }>
        <ErrorCard />
      </React.Suspense>
    </main>
  );
}
