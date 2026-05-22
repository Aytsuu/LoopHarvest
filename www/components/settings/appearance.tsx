'use client';

import * as React from 'react';
import { CheckCircle, Save } from 'lucide-react';

export interface AppearanceProps {
  selectedTheme: string;
  setSelectedTheme: (val: string) => void;
  selectedDensity: string;
  setSelectedDensity: (val: string) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
  handleSaveAppearance: (e: React.FormEvent) => void;
}

export default function Appearance({
  selectedTheme,
  setSelectedTheme,
  selectedDensity,
  setSelectedDensity,
  highContrast,
  setHighContrast,
  reduceMotion,
  setReduceMotion,
  handleSaveAppearance,
}: AppearanceProps) {
  return (
    <form onSubmit={handleSaveAppearance} className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">Appearance & Themes</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">Adjust graphics, fonts, container contrast scales, and interface density options.</p>
      </div>

      {/* Theme selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Theme Palette</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'Forest HSL', desc: 'Default (Eco-Green)', css: 'bg-[#141414] border-[#A8D97F] text-[#A8D97F]' },
            { name: 'Classic Dark', desc: 'Charcoal Minimal', css: 'bg-[#121212] border-white/10 text-white' },
            { name: 'Light Mode', desc: 'Disabled (Dark First)', css: 'bg-white border-black/10 text-black opacity-50 cursor-not-allowed' }
          ].map((th) => (
            <button
              key={th.name}
              type="button"
              disabled={th.name === 'Light Mode'}
              onClick={() => th.name !== 'Light Mode' && setSelectedTheme(th.name)}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                selectedTheme === th.name && th.name !== 'Light Mode'
                  ? 'bg-[#2A4A10]/20 border-[#A8D97F] ring-2 ring-[#A8D97F]/20'
                  : 'bg-white/4 border-white/6 hover:bg-white/8'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#FFFFFF]">{th.name}</span>
                {selectedTheme === th.name && th.name !== 'Light Mode' && (
                  <CheckCircle size={14} className="text-[#A8D97F]" />
                )}
              </div>
              <p className="text-[10px] text-[#A3A3A3] mt-1 font-semibold">{th.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Density Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Interface Density</label>
        <div className="flex gap-2 bg-[#141414] p-1.5 rounded-xl border border-white/6 max-w-sm">
          {['Comfortable', 'Compact', 'Spacious'].map((den) => (
            <button
              key={den}
              type="button"
              onClick={() => setSelectedDensity(den)}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                selectedDensity === den
                  ? 'bg-[#A8D97F] text-[#1A3A05]'
                  : 'text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-white/2'
              }`}
            >
              {den}
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility toggles */}
      <div className="space-y-4 pt-2">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Accessibility Toggles</label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
            <div className="flex-1 pr-4">
              <h5 className="text-sm font-bold text-[#FFFFFF]">High Contrast Typography</h5>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5">Increases text color luminance threshold to support screen readers and clarity.</p>
            </div>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                highContrast ? 'bg-[#A8D97F]' : 'bg-white/10'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                highContrast ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
            <div className="flex-1 pr-4">
              <h5 className="text-sm font-bold text-[#FFFFFF]">Reduce UI Motions</h5>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5">Disables fluid sidebar slides, globe spins, and transitions for enhanced accessibility.</p>
            </div>
            <button
              type="button"
              onClick={() => setReduceMotion(!reduceMotion)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                reduceMotion ? 'bg-[#A8D97F]' : 'bg-white/10'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                reduceMotion ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/6 pt-4 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] transition hover:bg-[#B8E890] active:scale-95 shadow-md"
        >
          <Save size={16} />
          <span>Apply Appearance</span>
        </button>
      </div>
    </form>
  );
}
