'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Check, ShieldAlert, Sparkles, Calendar, Link2, Bell, AlertTriangle } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import type { ReleaseNotificationItem } from '@/lib/api/types';

type EditableRelease = {
  version: string;
  type: ReleaseNotificationItem['type'];
  title: string;
  body: string;
  changelog_url: string;
  action_required: boolean;
  action_label: string;
  action_type: ReleaseNotificationItem['action_type'];
  action_url: string;
  published_at: string;
  expires_at: string;
};

const EMPTY_FORM: EditableRelease = {
  version: '',
  type: 'minor',
  title: '',
  body: '',
  changelog_url: '',
  action_required: false,
  action_label: '',
  action_type: 'none',
  action_url: '',
  published_at: '',
  expires_at: '',
};

export default function AdminReleases() {
  const [supabase] = React.useState(() => createSupabaseClient());
  const [form, setForm] = React.useState<EditableRelease>(EMPTY_FORM);
  const [status, setStatus] = React.useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [isSaving, setIsSaving] = React.useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: apiClient.getCurrentUser,
  });

  const { data: releases = [], refetch } = useQuery({
    queryKey: ['admin-release-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('release_notifications')
        .select('id, version, type, title, body, changelog_url, action_required, action_label, action_type, action_url, published_at, expires_at')
        .order('published_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as ReleaseNotificationItem[];
    },
    enabled: currentUser?.role === 'admin',
  });

  // Keep strict role validation boundary
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="rounded-3xl border border-[#E05656]/20 bg-[#E05656]/5 p-8 text-center backdrop-blur-md animate-fade-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E05656]/10 text-[#E05656] mb-4">
          <ShieldAlert size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-[#FFFFFF]">Admin Access Required</h3>
        <p className="mt-2 text-xs text-[#A3A3A3] max-w-sm mx-auto leading-relaxed">
          Your current account role is not authorized to draft, schedule, or publish application update notifications.
        </p>
      </div>
    );
  }

  const handleStatus = (message: string, type: 'success' | 'error') => {
    setStatus({ message, type });
    window.setTimeout(() => {
      setStatus({ message: '', type: null });
    }, 5000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('release_notifications').insert({
      version: form.version,
      type: form.type,
      title: form.title,
      body: form.body,
      changelog_url: form.changelog_url || null,
      action_required: form.action_required,
      action_label: form.action_label || null,
      action_type: form.action_type,
      action_url: form.action_url || null,
      published_at: form.published_at || new Date().toISOString(),
      expires_at: form.expires_at || null,
      created_by: user?.id ?? null,
    });

    if (error) {
      handleStatus(error.message, 'error');
      setIsSaving(false);
      return;
    }

    handleStatus('Release notification published successfully!', 'success');
    setForm(EMPTY_FORM);
    setIsSaving(false);
    void refetch();
  };

  // Helper helper to get type badge style
  const getReleaseTypeStyles = (type: ReleaseNotificationItem['type']) => {
    switch (type) {
      case 'breaking':
        return {
          wrapper: 'bg-[#E05656]/10 text-[#E05656] border-[#E05656]/20 shadow-[#E05656]/5',
          dot: 'bg-[#E05656] animate-pulse',
        };
      case 'major':
        return {
          wrapper: 'bg-[#A855F7]/10 text-[#C084FC] border-[#A855F7]/20 shadow-[#A855F7]/5',
          dot: 'bg-[#C084FC]',
        };
      case 'patch':
        return {
          wrapper: 'bg-[#F97316]/10 text-[#FDBA74] border-[#F97316]/20 shadow-[#F97316]/5',
          dot: 'bg-[#FDBA74]',
        };
      case 'minor':
      default:
        return {
          wrapper: 'bg-[#2E5E16]/15 text-[#A8D97F] border-[#A8D97F]/15 shadow-[#A8D97F]/5',
          dot: 'bg-[#A8D97F]',
        };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">App Releases & Banners</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">
          Announce new ecosystem features, hotfixes, major updates, or prompt critical reloads.
        </p>
      </div>

      {status.type && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 ${
            status.type === 'success'
              ? 'border-[#A8D97F]/20 bg-[#2A4A10]/10 text-[#A8D97F]'
              : 'border-[#E05656]/20 bg-[#E05656]/10 text-[#E05656]'
          }`}
        >
          <Check size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold block">{status.type === 'success' ? 'Publication Success' : 'Publishing Error'}</span>
            <p className="text-[11px] opacity-90 mt-0.5 font-medium">{status.message}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Compose Form */}
        <section className="bg-[#1B1B1B] p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg h-full">
          <div className="pb-1 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">Draft Notification</h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid gap-3 grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Semver Version</span>
                <input
                  value={form.version}
                  onChange={(e) => setForm((c) => ({ ...c, version: e.target.value }))}
                  placeholder="e.g., 2.1.0"
                  className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Release Scope</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((c) => ({ ...c, type: e.target.value as EditableRelease['type'] }))}
                  className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] cursor-pointer transition-colors duration-200"
                >
                  <option value="minor" className="bg-[#141414] text-white">Minor (Feature Update)</option>
                  <option value="patch" className="bg-[#141414] text-white">Patch (Bug Fix / Optim)</option>
                  <option value="major" className="bg-[#141414] text-white">Major (Ecosystem Change)</option>
                  <option value="breaking" className="bg-[#141414] text-white">Breaking (Requires Reload)</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Banner Headline Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                placeholder="e.g., Introducing Live Bio-char Tracker"
                className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Short Description / Summary</span>
              <textarea
                value={form.body}
                onChange={(e) => setForm((c) => ({ ...c, body: e.target.value }))}
                placeholder="Brief summary of modifications, upgrades, or fixes..."
                className="min-h-[100px] w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                required
              />
            </label>

            <div className="grid gap-3 grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">User Action Trigger</span>
                <select
                  value={form.action_type}
                  onChange={(e) => setForm((c) => ({ ...c, action_type: e.target.value as EditableRelease['action_type'] }))}
                  className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] cursor-pointer transition-colors duration-200"
                >
                  <option value="none" className="bg-[#141414] text-white">None (Read Only)</option>
                  <option value="reload" className="bg-[#141414] text-white">Reload (Force Client Refetch)</option>
                  <option value="navigate" className="bg-[#141414] text-white">Navigate (Route Redirect)</option>
                  <option value="accept_terms" className="bg-[#141414] text-white">Accept Terms Modal</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Action Button Label</span>
                <input
                  value={form.action_label}
                  onChange={(e) => setForm((c) => ({ ...c, action_label: e.target.value }))}
                  placeholder="e.g., Update App / Go to Dashboard"
                  className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                />
              </label>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Trigger Target URL</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8C8F7E]">
                    <Link2 size={12} />
                  </div>
                  <input
                    value={form.action_url}
                    onChange={(e) => setForm((c) => ({ ...c, action_url: e.target.value }))}
                    placeholder="/explore"
                    className="h-10 w-full rounded-xl border border-white/8 bg-white/4 pl-8 pr-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Changelog Markdown Link</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8C8F7E]">
                    <Link2 size={12} />
                  </div>
                  <input
                    value={form.changelog_url}
                    onChange={(e) => setForm((c) => ({ ...c, changelog_url: e.target.value }))}
                    placeholder="/changelog/v2.1.0"
                    className="h-10 w-full rounded-xl border border-white/8 bg-white/4 pl-8 pr-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                  />
                </div>
              </label>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Schedule Publish Date</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8C8F7E]">
                    <Calendar size={12} />
                  </div>
                  <input
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(e) => setForm((c) => ({ ...c, published_at: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-white/8 bg-white/4 pl-8 pr-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] cursor-pointer transition-colors duration-200"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Optional Expiry Date</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8C8F7E]">
                    <Calendar size={12} />
                  </div>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm((c) => ({ ...c, expires_at: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-white/8 bg-white/4 pl-8 pr-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] cursor-pointer transition-colors duration-200"
                  />
                </div>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setForm((c) => ({ ...c, action_required: !c.action_required }))}
              className={`flex items-center justify-between w-full rounded-xl border p-4.5 transition-all duration-200 cursor-pointer ${
                form.action_required
                  ? 'bg-[#E05656]/5 border-[#E05656]/20 text-[#E05656]'
                  : 'bg-white/4 border-white/6 text-[#A3A3A3] hover:bg-white/6'
              }`}
            >
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle size={13} className={form.action_required ? 'text-[#E05656]' : 'text-[#8C8F7E]'} />
                  <span>Require Explicit Action</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed font-semibold">
                  Checking this forces a blocking screen modal dialog until the user completes the action.
                </p>
              </div>
              <div className={`h-5 w-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                form.action_required ? 'bg-[#E05656] border-transparent text-white' : 'border-white/20'
              }`}>
                {form.action_required && <Check size={12} strokeWidth={4} />}
              </div>
            </button>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-5 py-2.5 text-xs font-bold text-[#1A3A05] transition-all duration-200 hover:bg-[#B8E890] active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md"
              >
                <Plus size={14} />
                <span>{isSaving ? 'Publishing...' : 'Publish Release'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right: Published Feed Timeline */}
        <aside className="bg-[#1B1B1B] p-5 rounded-2xl border border-white/5 space-y-4 shadow-lg overflow-y-auto max-h-[640px] scrollbar-none h-full">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">Published Logs</h4>
            <span className="font-mono text-[10px] font-bold text-[#A8D97F] bg-[#2A4A10]/30 px-2 py-0.5 rounded border border-[#A8D97F]/10">
              {releases.length} total
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {releases.map((release) => {
              const styles = getReleaseTypeStyles(release.type);
              return (
                <div key={release.id} className="group rounded-xl border border-white/6 bg-white/[0.02] p-4 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border shrink-0 shadow-sm ${styles.wrapper}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                      <span>{release.type}</span>
                    </div>
                    <span className="font-mono text-[10px] font-black text-[#A8D97F] bg-[#141414] px-2 py-0.5 rounded-md border border-white/5">
                      v{release.version}
                    </span>
                  </div>

                  <h5 className="mt-2.5 text-xs font-black text-white group-hover:text-[#A8D97F] transition-colors duration-200">
                    {release.title}
                  </h5>

                  <p className="mt-1 text-[11px] leading-relaxed text-[#A3A3A3] font-medium font-sans">
                    {release.body}
                  </p>

                  {(release.action_type !== 'none' || release.changelog_url) && (
                    <div className="mt-3.5 pt-2.5 border-t border-white/4 flex flex-wrap gap-2">
                      {release.action_type !== 'none' && (
                        <div className="flex items-center gap-1 text-[9px] font-black text-[#8C8F7E] uppercase tracking-wider">
                          <Bell size={10} />
                          <span>Action: {release.action_type}</span>
                        </div>
                      )}
                      {release.changelog_url && (
                        <a
                          href={release.changelog_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[9px] font-black text-[#A8D97F] hover:underline uppercase tracking-wider ml-auto"
                        >
                          <Link2 size={10} />
                          <span>Changelog</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {releases.length === 0 && (
              <div className="py-12 text-center text-[#8C8F7E]">
                <Sparkles size={24} className="mx-auto text-white/10 mb-2 animate-pulse" />
                <p className="text-xs font-bold">No Release Records Found</p>
                <p className="text-[10px] text-[#A3A3A3] max-w-[160px] mx-auto mt-0.5 leading-relaxed font-semibold">
                  Ecosystem release notices will stack in a visual feed here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
