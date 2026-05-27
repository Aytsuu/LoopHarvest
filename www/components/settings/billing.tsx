'use client';

import * as React from 'react';
import { Sparkles, CheckCircle, Clock } from 'lucide-react';

export interface BillingProps {
  isPremium: boolean;
  handleUpgradePremium: () => void;
}

export default function Billing({
  isPremium,
  handleUpgradePremium,
}: BillingProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">Sponsorship & Plans</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">Unlock premium 3D graphics mapping tools and help fund zero-waste logistics.</p>
      </div>

      {/* Plan tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Free Tier Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] relative overflow-hidden ${
          !isPremium ? 'bg-[#1B1B1B] border-[#2A4A10]' : 'bg-white/2 border-white/6 opacity-60'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase bg-[#141414] px-2.5 py-0.5 rounded border border-white/6 text-[#A3A3A3]">FREE TIER</span>
              {!isPremium && <span className="text-[10px] font-bold text-[#A8D97F] flex items-center gap-1"><CheckCircle size={12} /> Active</span>}
            </div>
            <h4 className="text-lg font-bold text-[#FFFFFF] mt-3">Eco Supporter</h4>
            <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">Basic scrap listings, browse community globe pins, view standard metrics.</p>
          </div>
          <div className="text-sm font-mono font-black text-[#FFFFFF] mt-4">$0.00 <span className="text-[10px] font-semibold text-[#8C8F7E]">/ month</span></div>
        </div>

        {/* Premium Tier Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] relative overflow-hidden ${
          isPremium ? 'bg-[#1B1B1B] border-[#A8D97F]' : 'bg-[#2A4A10]/10 border-[#A8D97F]/20'
        }`}>
          {/* Glow badge overlay */}
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-16 w-16 bg-[#A8D97F]/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase bg-[#A8D97F] px-2.5 py-0.5 rounded text-[#1A3A05] flex items-center gap-1">
                <Sparkles size={11} /> Community Patron
              </span>
              {isPremium && <span className="text-[10px] font-bold text-[#A8D97F] flex items-center gap-1"><CheckCircle size={12} /> Active</span>}
            </div>
            <h4 className="text-lg font-bold text-[#FFFFFF] mt-3">Loop Advocate</h4>
            <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">Unlimited 3D map flying queries, priority pickup labels, custom page skins, monthly CO2 certifications.</p>
          </div>
          
          {isPremium ? (
            <div className="text-sm font-mono font-black text-[#A8D97F] mt-4">$4.99 <span className="text-[10px] font-semibold text-[#87B85E]">/ month</span></div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-sm font-mono font-black text-[#FFFFFF]">$4.99 <span className="text-[10px] font-semibold text-[#8C8F7E]">/ mo</span></span>
              <button
                type="button"
                onClick={handleUpgradePremium}
                className="cursor-pointer rounded-lg bg-[#A8D97F] px-3.5 py-1.5 text-xs font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Logs table */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Billing History Logs</label>
        
        <div className="border border-white/6 rounded-xl overflow-hidden bg-white/2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1B1B1B] border-b border-white/6 text-[#A3A3A3] font-bold">
                <th className="p-3">Billing Date</th>
                <th className="p-3">Reference / Plan</th>
                <th className="p-3">Amount Charged</th>
                <th className="p-3 text-right">Invoice State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4 text-[#FFFFFF]">
              {isPremium && (
                <tr>
                  <td className="p-3 font-mono font-semibold flex items-center gap-1.5">
                    <Clock size={12} className="text-[#A8D97F]" /> May 20, 2026
                  </td>
                  <td className="p-3 font-semibold">Loop Advocate Plan (Active)</td>
                  <td className="p-3 font-mono font-bold">$4.99 USD</td>
                  <td className="p-3 text-right text-xs text-[#A8D97F] font-bold">Paid</td>
                </tr>
              )}
              <tr>
                <td className="p-3 font-mono font-semibold text-[#A3A3A3]">May 01, 2026</td>
                <td className="p-3 font-semibold text-[#A3A3A3]">Account Setup / Registration</td>
                <td className="p-3 font-mono text-[#A3A3A3]">$0.00 USD</td>
                <td className="p-3 text-right text-xs text-[#A3A3A3] font-semibold">Processed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
