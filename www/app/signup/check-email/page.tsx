'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MailCheck } from 'lucide-react';

import StarsBackground from "@/components/StarsBackground";

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your inbox';

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4">
      <div className="absolute inset-0 z-0 select-none opacity-50 pointer-events-none">
        <StarsBackground />
      </div>

      <div className="absolute inset-0 z-1 bg-gradient-to-tr from-[#0A0A0A] via-transparent to-[#0A0A0A]/90 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/8 bg-[#141414]/80 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#A8D97F]/20 bg-[#2A4A10]/20 text-[#A8D97F]">
            <MailCheck size={28} />
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
            Verify Your Email
          </h2>
          <p className="mt-2 max-w-md text-sm text-[#A3A3A3]">
            We sent a verification email to <span className="font-bold text-white">{email}</span>. Open that message and click the verification link to activate your LoopHarvest account.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push(`/login?signup=check-email&email=${encodeURIComponent(email)}`)}
            className="flex-1 rounded-xl bg-[#A8D97F] px-5 py-3 text-sm font-black text-[#1A3A05] transition-transform active:scale-[0.98]"
          >
            Go to Sign In
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#1B1B1B] hover:border-white/20 active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            <span>Back to Sign Up</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SignupCheckEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <CheckEmailContent />
    </React.Suspense>
  );
}
