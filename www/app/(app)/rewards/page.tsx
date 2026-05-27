'use client';

import * as React from 'react';

export default function RewardsStorePage() {
  return (
    <main className="min-h-screen flex-1 bg-[#0A0A0A] text-[#FFFFFF] font-sans antialiased relative flex items-center justify-center py-12 px-4">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#A8D97F]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-[#4ECDC4]/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-2xl w-full space-y-6 relative z-10 text-center">
        {/* Hero Header */}
        <div className="space-y-6">
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Circular Rewards Store, <span className="text-[#A8D97F]">Coming Soon!</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
            We are planting the seeds for our community rewards network. Soon, you will be able to turn your compost contributions and circular actions into tangible green items, local vouchers, and exclusive digital profile aesthetics.
          </p>
        </div>

      </div>
    </main>
  );
}
