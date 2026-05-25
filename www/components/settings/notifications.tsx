'use client';

import * as React from 'react';
import { Save } from 'lucide-react';

import { NOTIFICATION_TYPE_DEFINITIONS, type NotificationChannel } from '@/lib/notifications/config';

type TypePreference = { in_app: boolean; push: boolean; email: boolean };

export interface NotificationsProps {
  alertRadius: number;
  setAlertRadius: (val: number) => void;
  emailDigest: boolean;
  setEmailDigest: (val: boolean) => void;
  pushAlerts: boolean;
  setPushAlerts: (val: boolean) => void;
  ecoReports: boolean;
  setEcoReports: (val: boolean) => void;
  quietHoursEnabled: boolean;
  setQuietHoursEnabled: (val: boolean) => void;
  quietHoursStart: string;
  setQuietHoursStart: (val: string) => void;
  quietHoursEnd: string;
  setQuietHoursEnd: (val: string) => void;
  emailDigestFrequency: 'realtime' | 'daily' | 'weekly' | 'never';
  setEmailDigestFrequency: (val: 'realtime' | 'daily' | 'weekly' | 'never') => void;
  typePreferences: Record<string, TypePreference>;
  setTypePreferences: React.Dispatch<React.SetStateAction<Record<string, TypePreference>>>;
  savePending: boolean;
  handleSaveNotifications: (e: React.FormEvent) => void;
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
        checked ? 'bg-[#A8D97F]' : 'bg-white/10'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#141414] shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5 bg-[#1A3A05]' : 'translate-x-0'
        }`}
      />
    </button>
  );
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
  quietHoursEnabled,
  setQuietHoursEnabled,
  quietHoursStart,
  setQuietHoursStart,
  quietHoursEnd,
  setQuietHoursEnd,
  emailDigestFrequency,
  setEmailDigestFrequency,
  typePreferences,
  setTypePreferences,
  savePending,
  handleSaveNotifications,
}: NotificationsProps) {
  type NotificationDefinition = (typeof NOTIFICATION_TYPE_DEFINITIONS)[number];

  const groupedDefinitions = React.useMemo(() => {
    return NOTIFICATION_TYPE_DEFINITIONS.reduce<Record<string, NotificationDefinition[]>>((groups, item) => {
      const existing = groups[item.category] ?? [];
      groups[item.category] = [...existing, item];
      return groups;
    }, {});
  }, []);

  const toggleTypePreference = (type: string, channel: NotificationChannel, locked: NotificationChannel[]) => {
    if (locked.includes(channel)) {
      return;
    }

    setTypePreferences((current) => ({
      ...current,
      [type]: {
        ...(current[type] ?? { in_app: true, push: false, email: false }),
        [channel]: !(current[type]?.[channel] ?? false),
      },
    }));
  };

  return (
    <form onSubmit={handleSaveNotifications} className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">Notification Settings</h3>
        <p className="mt-1 text-xs text-[#A3A3A3]">Control channels, quiet hours, digest behavior, and per-type delivery rules.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/5 bg-[#1B1B1B] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">Push Notifications</h4>
              <p className="mt-0.5 text-[11px] text-[#A3A3A3]">Browser push for urgent matches, messages, and release alerts.</p>
            </div>
            <Toggle checked={pushAlerts} onChange={() => setPushAlerts(!pushAlerts)} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">Email Notifications</h4>
              <p className="mt-0.5 text-[11px] text-[#A3A3A3]">Transactional email and digests for unread activity.</p>
            </div>
            <Toggle checked={emailDigest} onChange={() => setEmailDigest(!emailDigest)} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">Impact Milestones</h4>
              <p className="mt-0.5 text-[11px] text-[#A3A3A3]">Immediate milestone alerts for points, diversion goals, and impact streaks.</p>
            </div>
            <Toggle checked={ecoReports} onChange={() => setEcoReports(!ecoReports)} />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/5 bg-[#1B1B1B] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">Quiet Hours</h4>
              <p className="mt-0.5 text-[11px] text-[#A3A3A3]">Delay non-critical push notifications during your offline window.</p>
            </div>
            <Toggle checked={quietHoursEnabled} onChange={() => setQuietHoursEnabled(!quietHoursEnabled)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8F7E]">From</span>
              <input
                type="time"
                value={quietHoursStart}
                disabled={!quietHoursEnabled}
                onChange={(event) => setQuietHoursStart(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/8 bg-[#141414] px-3 text-sm text-[#FFFFFF] disabled:opacity-50"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8F7E]">To</span>
              <input
                type="time"
                value={quietHoursEnd}
                disabled={!quietHoursEnabled}
                onChange={(event) => setQuietHoursEnd(event.target.value)}
                className="h-11 w-full rounded-xl border border-white/8 bg-[#141414] px-3 text-sm text-[#FFFFFF] disabled:opacity-50"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8F7E]">Email Digest</span>
            <select
              value={emailDigestFrequency}
              disabled={!emailDigest}
              onChange={(event) => setEmailDigestFrequency(event.target.value as NotificationsProps['emailDigestFrequency'])}
              className="h-11 w-full rounded-xl border border-white/8 bg-[#141414] px-3 text-sm text-[#FFFFFF] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-200"
            >
              <option value="realtime">Realtime</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#1B1B1B] p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#FFFFFF]">Matching Radius</h4>
            <p className="mt-0.5 text-[11px] text-[#A3A3A3]">Nearby match alerts use this distance threshold.</p>
          </div>
          <span className="rounded-lg border border-[#A8D97F]/10 bg-[#2A4A10]/30 px-3 py-1 font-mono text-base font-black text-[#A8D97F]">
            {alertRadius} miles
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="50"
          value={alertRadius}
          onChange={(event) => setAlertRadius(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#141414] accent-[#A8D97F]"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-white/5 bg-[#1B1B1B] p-5">
        <div>
          <h4 className="text-sm font-bold text-[#FFFFFF]">Per-Type Delivery Rules</h4>
          <p className="mt-0.5 text-[11px] text-[#A3A3A3]">In-app delivery stays locked for core transactional and safety events.</p>
        </div>

        <div className="space-y-5">
          {Object.entries(groupedDefinitions).map(([category, definitions]) => (
            <div key={category} className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8C8F7E]">{category}</div>
              <div className="overflow-hidden rounded-xl border border-white/6">
                <div className="grid grid-cols-[minmax(0,1fr)_72px_72px_72px] bg-[#141414] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8C8F7E]">
                  <span>Notification</span>
                  <span className="text-center">In-App</span>
                  <span className="text-center">Push</span>
                  <span className="text-center">Email</span>
                </div>
                {definitions.map((definition) => {
                  const preference = typePreferences[definition.type] ?? { in_app: true, push: false, email: false };
                  return (
                    <div
                      key={definition.type}
                      className="grid grid-cols-[minmax(0,1fr)_72px_72px_72px] items-center gap-3 border-t border-white/6 px-4 py-3"
                    >
                      <div className="pr-3">
                        <div className="text-sm font-bold text-[#FFFFFF]">{definition.label}</div>
                        <div className="mt-0.5 text-[11px] leading-relaxed text-[#A3A3A3]">{definition.description}</div>
                      </div>
                      {(['in_app', 'push', 'email'] as NotificationChannel[]).map((channel) => (
                        <div key={channel} className="flex flex-col items-center gap-1">
                          <Toggle
                            checked={preference[channel]}
                            disabled={definition.locked.includes(channel)}
                            onChange={() => toggleTypePreference(definition.type, channel, definition.locked)}
                          />
                          {definition.locked.includes(channel) ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C8F7E]">Locked</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-white/6 pt-4">
        <button
          type="submit"
          disabled={savePending}
          className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-sm font-bold text-[#1A3A05] shadow-md cursor-pointer disabled:cursor-not-allowed transition hover:bg-[#B8E890] active:scale-95 disabled:opacity-70"
        >
          <Save size={16} />
          <span>{savePending ? 'Saving...' : 'Save Notification Settings'}</span>
        </button>
      </div>
    </form>
  );
}
