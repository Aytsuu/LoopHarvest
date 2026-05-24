'use client';

import * as React from 'react';
import { Check, Save } from 'lucide-react';

export interface ScrapPrefs {
  fruitVeg: boolean;
  coffeeTea: boolean;
  eggshells: boolean;
  yardWaste: boolean;
  bakery: boolean;
}

export interface SDGProps {
  diversionGoal: number;
  setDiversionGoal: (val: number) => void;
  purpose: string;
  setPurpose: (val: string) => void;
  scrapPrefs: ScrapPrefs;
  setScrapPrefs: React.Dispatch<React.SetStateAction<ScrapPrefs>>;
  handleSaveSustainability: (e: React.FormEvent) => void;
}

export default function SDG({
  diversionGoal,
  setDiversionGoal,
  purpose,
  setPurpose,
  scrapPrefs,
  setScrapPrefs,
  handleSaveSustainability,
}: SDGProps) {
  return (
    <form onSubmit={handleSaveSustainability} className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">Sustainability Preferences</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">Manage target annual bio-mass diversions and configure your favorite scrap streams.</p>
      </div>

      {/* Annual goal slider */}
      <div className="bg-[#1B1B1B] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-bold text-[#FFFFFF]">Annual Waste Diversion Target</h4>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Set a metric target for the mass of organic matter you aim to salvage/compost.</p>
          </div>
          <span className="font-mono text-base font-black text-[#A8D97F] bg-[#2A4A10]/30 px-3 py-1 rounded-lg border border-[#A8D97F]/10 shrink-0">
            {diversionGoal} kg / year
          </span>
        </div>
        
        <div className="space-y-1">
          <input
            type="range"
            min="100"
            max="5000"
            step="50"
            value={diversionGoal}
            onChange={(e) => setDiversionGoal(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-[#141414] appearance-none cursor-pointer accent-[#A8D97F]"
          />
          <div className="flex justify-between text-[10px] font-bold text-[#8C8F7E] font-mono">
            <span>100 kg</span>
            <span>2500 kg</span>
            <span>5000 kg</span>
          </div>
        </div>
      </div>

      {/* Scrap Type checklist */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Preferred Material Streams</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'fruitVeg', label: 'Fruits & Veggies Scraps', desc: 'Compost feed, high nitrogen' },
            { id: 'coffeeTea', label: 'Coffee Grounds & Tea', desc: 'Great for acidic soil mixing' },
            { id: 'eggshells', label: 'Crushed Eggshells', desc: 'Calcium rich additive sources' },
            { id: 'yardWaste', label: 'Yard clippings & Leaves', desc: 'Carbon-heavy dry matter brown source' },
            { id: 'bakery', label: 'Bakery & Grain Excess', desc: 'Valuable animal feeds, chicken feed' }
          ].map((scrap) => {
            const key = scrap.id as keyof ScrapPrefs;
            const isChecked = scrapPrefs[key];
            return (
              <button
                key={scrap.id}
                type="button"
                onClick={() => setScrapPrefs(prev => ({ ...prev, [key]: !isChecked }))}
                className={`p-4 rounded-xl border text-left flex items-start justify-between transition-colors ${
                  isChecked 
                    ? 'bg-[#2A4A10]/20 border-[#A8D97F]/30 text-[#A8D97F]' 
                    : 'bg-white/4 border-white/6 hover:bg-white/6 text-[#A3A3A3]'
                }`}
              >
                <div className="pr-4">
                  <span className="text-sm font-bold text-[#FFFFFF]">{scrap.label}</span>
                  <p className="text-[10px] text-[#A3A3A3] mt-1 font-semibold">{scrap.desc}</p>
                </div>
                <div className={`h-5 w-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                  isChecked ? 'bg-[#A8D97F] border-transparent text-[#1A3A05]' : 'border-white/20'
                }`}>
                  {isChecked && <Check size={12} strokeWidth={4} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Usage Select options */}
      <div className="space-y-1.5 pt-2 max-w-sm">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Primary Scrap Utilization</label>
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full h-11 bg-white/4 border border-white/8 rounded-xl px-4 text-sm font-semibold text-[#FFFFFF] focus:outline-none focus:border-[#A8D97F] transition-colors cursor-pointer"
        >
          {['Composting', 'Animal Feed', 'Biogas / Biofuel Energy', 'Urban Crop Cultivation'].map((pur) => (
            <option key={pur} value={pur} className="bg-[#141414] text-[#FFFFFF] font-semibold">{pur}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-white/6 pt-4 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
        >
          <Save size={16} />
          <span>Save Environmental Goals</span>
        </button>
      </div>
    </form>
  );
}
