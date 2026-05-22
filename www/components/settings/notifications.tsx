'use client';

import * as React from 'react';
import { Save } from 'lucide-react';

export interface NotificationsProps {
  alertRadius: number;
  setAlertRadius: (val: number) => void;
  emailDigest: boolean;
  setEmailDigest: (val: boolean) => void;
  pushAlerts: boolean;
  setPushAlerts: (val: boolean) => void;
  ecoReports: boolean;
  setEcoReports: (val: boolean) => void;
  handleSaveNotifications: (e: React.FormEvent) => void;
}

export default function Notifications({
  alertRadius,
  setAlertRadius,
  emailDigest,
  setEmailDigest,
  pushAlerts,
  setPushAlerts,
  ecoReports,
  setEcoReports,
  handleSaveNotifications,
}: NotificationsProps) {
  return (
    <form onSubmit={handleSaveNotifications} className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">Notification Settings</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">Configure your real-time alerts and set maximum geographic search parameters.</p>
      </div>

      {/* Radius alert slider */}
      <div className="bg-[#1B1B1B] p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-sm font-bold text-[#FFFFFF]">Alert Radius Parameter</h4>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Receive immediate notifications when new scraps are listed within this radius.</p>
          </div>
          <span className="font-mono text-base font-black text-[#A8D97F] bg-[#2A4A10]/30 px-3 py-1 rounded-lg border border-[#A8D97F]/10 shrink-0">
            {alertRadius} miles
          </span>
        </div>
        
        <div className="space-y-1">
          <input
            type="range"
            min="1"
            max="50"
            value={alertRadius}
            onChange={(e) => setAlertRadius(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-[#141414] appearance-none cursor-pointer accent-[#A8D97F]"
          />
          <div className="flex justify-between text-[10px] font-bold text-[#8C8F7E] font-mono">
            <span>1 mile</span>
            <span>25 miles</span>
            <span>50 miles</span>
          </div>
        </div>
      </div>

      {/* Toggle alert options */}
      <div className="space-y-4 pt-2">
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">Communication Channels</label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
            <div className="flex-1 pr-4">
              <h5 className="text-sm font-bold text-[#FFFFFF]">Email Weekly Digest</h5>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5">A condensed summary of loop achievements, CO2 savings, and top regional donors.</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailDigest(!emailDigest)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                emailDigest ? 'bg-[#A8D97F]' : 'bg-white/10'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                emailDigest ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
            <div className="flex-1 pr-4">
              <h5 className="text-sm font-bold text-[#FFFFFF]">Real-time Push Alerts</h5>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5">Instant browser notifications for nearby listings, chats, and request acceptances.</p>
            </div>
            <button
              type="button"
              onClick={() => setPushAlerts(!pushAlerts)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                pushAlerts ? 'bg-[#A8D97F]' : 'bg-white/10'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                pushAlerts ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-white/6 hover:bg-white/2 transition">
            <div className="flex-1 pr-4">
              <h5 className="text-sm font-bold text-[#FFFFFF]">Socio-Environmental Achievements</h5>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5">Notify me immediately when I reach milestones, divert goals, or level up.</p>
            </div>
            <button
              type="button"
              onClick={() => setEcoReports(!ecoReports)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                ecoReports ? 'bg-[#A8D97F]' : 'bg-white/10'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
                ecoReports ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
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
          <span>Save Alert Configurations</span>
        </button>
      </div>
    </form>
  );
}
