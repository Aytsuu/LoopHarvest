'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldX } from 'lucide-react';

import StarsBackground from "@/components/StarsBackground";

const STATUS_COPY: Record<string, { title: string; body: string; tone: string; icon: typeof CheckCircle2 }> = {
  cancelled: {
    title: 'Pending Registration Cancelled',
    body: 'The unverified LoopHarvest account request has been removed. If this signup was unauthorized, no further action is needed.',
    tone: 'border-[#A8D97F]/20 bg-[#11331D]/35 text-[#C4F09A]',
    icon: CheckCircle2,
  },
  verified: {
    title: 'Account Already Verified',
    body: 'This cancellation link is no longer active because the account has already been verified.',
    tone: 'border-[#E8A838]/20 bg-[#2A2410]/35 text-[#F3D28A]',
    icon: AlertTriangle,
  },
  expired: {
    title: 'Cancellation Link Expired',
    body: 'This cancellation link has expired. If you still need help, contact support or try resetting the account directly.',
    tone: 'border-[#E8A838]/20 bg-[#2A2410]/35 text-[#F3D28A]',
    icon: AlertTriangle,
  },
  invalid: {
    title: 'Invalid Cancellation Link',
    body: 'This cancellation link is invalid or has already been used.',
    tone: 'border-[#E05656]/20 bg-[#7A1010]/20 text-[#FFB4AB]',
    icon: ShieldX,
  },
  error: {
    title: 'Unable to Cancel Registration',
    body: 'LoopHarvest could not remove the pending registration right now. Please try the link again or contact support.',
    tone: 'border-[#E05656]/20 bg-[#7A1010]/20 text-[#FFB4AB]',
    icon: ShieldX,
  },
};

function CancelledContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'invalid';
  const copy = STATUS_COPY[status] ?? STATUS_COPY.invalid;
  const Icon = copy.icon;

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4">
      <div className="absolute inset-0 z-0 select-none opacity-50 pointer-events-none">
        <StarsBackground />
      </div>
      <div className="absolute inset-0 z-1 bg-gradient-to-tr from-[#0A0A0A] via-transparent to-[#0A0A0A]/90 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/8 bg-[#141414]/80 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-md text-center">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${copy.tone}`}>
          <Icon size={28} />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
          {copy.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#A3A3A3]">
          {copy.body}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push('/login')}
            className="flex-1 rounded-xl bg-[#A8D97F] px-5 py-3 text-sm font-black text-[#1A3A05] transition-transform active:scale-[0.98] cursor-pointer"
          >
            Go to Sign In
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#1B1B1B] hover:border-white/20 active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Landing</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function CancelledPage() {
  return (
    <React.Suspense fallback={null}>
      <CancelledContent />
    </React.Suspense>
  );
}
