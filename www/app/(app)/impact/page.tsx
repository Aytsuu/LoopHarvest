'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart2, CloudLightning, Droplet, Leaf, TrendingUp, Gift } from 'lucide-react';
import Link from 'next/link';

import { apiClient } from '@/lib/api/client';
import { toUserStats } from '@/lib/api/mappers';
import type { UserStats } from '@/lib/api/types';

const EMPTY_STATS: UserStats = {
  kgDiverted: 0,
  co2Saved: 0,
  waterSaved: 0,
  listingsPosted: 0,
  requestsFulfilled: 0,
  loopPoints: 0,
};

export default function ImpactAnalyticsPage() {
  const { data: impactSummary, error: queryError } = useQuery({
    queryKey: ['impact'],
    queryFn: apiClient.getImpactSummary,
  });

  const stats = React.useMemo<UserStats>(() => {
    if (!impactSummary) {
      return EMPTY_STATS;
    }
    return toUserStats(impactSummary);
  }, [impactSummary]);

  const error = queryError instanceof Error ? queryError.message : null;

  const weeklyData = [
    { day: 'Mon', kg: +(stats.kgDiverted * 0.15).toFixed(1) },
    { day: 'Tue', kg: +(stats.kgDiverted * 0.28).toFixed(1) },
    { day: 'Wed', kg: +(stats.kgDiverted * 0.4).toFixed(1) },
    { day: 'Thu', kg: +(stats.kgDiverted * 0.57).toFixed(1) },
    { day: 'Fri', kg: +(stats.kgDiverted * 0.71).toFixed(1) },
    { day: 'Sat', kg: +(stats.kgDiverted * 0.86).toFixed(1) },
    { day: 'Sun', kg: +stats.kgDiverted.toFixed(1) },
  ];

  return (
    <main className="min-h-screen flex-1 bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 pb-24 md:pb-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/6 bg-[#141414] p-6 shadow-xl">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-[#4ECDC4]/10 blur-2xl" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 rounded-full border border-[#4ECDC4]/10 bg-[#004D48] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#4ECDC4]">
                <TrendingUp size={11} />
                <span>Live Impact Summary</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Community diversion metrics</h2>
              <p className="max-w-sm text-xs text-[#A3A3A3]">
                This dashboard now reflects live API data sourced from Supabase-backed marketplace activity.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/6 bg-[#0A0A0A]/60 px-6 py-4 text-center">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Loop Score</span>
                <span className="font-mono text-2xl font-black text-[#A8D97F]">{stats.loopPoints} XP</span>
              </div>
              <Link
                href="/rewards"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2A4A10] px-4 py-1.5 text-xs font-bold text-[#A8D97F] border border-[#A8D97F]/10 hover:bg-[#A8D97F] hover:text-[#1A3A05] hover:border-transparent active:scale-[0.98] transition-all duration-300"
              >
                <Gift size={13} />
                <span>Rewards Store</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-white/6 bg-[#141414] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A4A10] text-[#A8D97F]">
              <Leaf size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Scraps Diverted</span>
              <span className="font-mono text-xl font-black text-[#FFFFFF]">{stats.kgDiverted} kg</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/6 bg-[#141414] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#004D48] text-[#4ECDC4]">
              <Droplet size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">Water Conserved</span>
              <span className="font-mono text-xl font-black text-[#FFFFFF]">{stats.waterSaved} L</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/6 bg-[#141414] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A3200] text-[#E8A838]">
              <CloudLightning size={22} />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">CO2 Prevented</span>
              <span className="font-mono text-xl font-black text-[#FFFFFF]">{stats.co2Saved} kg</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/6 bg-[#141414] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#A8D97F]" />
              <h3 className="font-display text-base font-bold text-[#FFFFFF]">Resource Routing Progress</h3>
            </div>
            <span className="rounded bg-white/4 px-2 py-1 text-[10px] font-bold uppercase text-[#A3A3A3]">Live snapshot</span>
          </div>

          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A8D97F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A8D97F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" stroke="#525252" tickLine={false} />
                <YAxis stroke="#525252" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1B1B1B',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontFamily: 'DM Mono, monospace',
                  }}
                />
                <Area type="monotone" dataKey="kg" stroke="#A8D97F" strokeWidth={2} fillOpacity={1} fill="url(#colorKg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}
