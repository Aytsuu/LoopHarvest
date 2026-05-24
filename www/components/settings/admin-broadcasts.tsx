'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Save, ShieldAlert, Info, CheckCircle2, AlertCircle } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

type SystemConfigRow = {
  key: string;
  value: string;
  description: string | null;
};

type BroadcastForm = {
  type: 'maintenance_scheduled' | 'maintenance_starting' | 'policy_update' | 'account_security';
  title: string;
  body: string;
  action_url: string;
  targetRole: 'all' | 'donor' | 'recipient' | 'both' | 'org' | 'admin';
};

const EMPTY_BROADCAST: BroadcastForm = {
  type: 'maintenance_scheduled',
  title: '',
  body: '',
  action_url: '/notifications',
  targetRole: 'all',
};

export default function AdminBroadcasts() {
  const [supabase] = React.useState(() => createSupabaseClient());
  const [configValues, setConfigValues] = React.useState<Record<string, string>>({});
  const [broadcast, setBroadcast] = React.useState<BroadcastForm>(EMPTY_BROADCAST);
  
  // Status and notification states
  const [status, setStatus] = React.useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: apiClient.getCurrentUser,
  });

  const { data: configRows = [], refetch: refetchConfig } = useQuery({
    queryKey: ['admin-system-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value, description')
        .order('key', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as SystemConfigRow[];
    },
    enabled: currentUser?.role === 'admin',
  });

  React.useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of configRows) {
      next[row.key] = row.value;
    }

    const timeoutId = window.setTimeout(() => {
      setConfigValues(next);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [configRows]);

  // Keep strict role validation boundary
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="rounded-3xl border border-[#E05656]/20 bg-[#E05656]/5 p-8 text-center backdrop-blur-md animate-fade-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E05656]/10 text-[#E05656] mb-4">
          <ShieldAlert size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-[#FFFFFF]">Admin Access Required</h3>
        <p className="mt-2 text-xs text-[#A3A3A3] max-w-sm mx-auto leading-relaxed">
          Your current account role is not authorized to manage core infrastructure configurations or dispatch system broadcasts.
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

  const saveConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingConfig(true);

    const payload = Object.entries(configValues).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('system_config').upsert(payload, { onConflict: 'key' });

    if (error) {
      handleStatus(error.message, 'error');
      setIsSavingConfig(false);
      return;
    }

    handleStatus('System edge configurations synchronized successfully.', 'success');
    setIsSavingConfig(false);
    void refetchConfig();
  };

  const sendBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSending(true);

    let usersQuery = supabase.from('users').select('id');
    if (broadcast.targetRole !== 'all') {
      usersQuery = usersQuery.eq('role', broadcast.targetRole);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      handleStatus(usersError.message, 'error');
      setIsSending(false);
      return;
    }

    const notifications =
      (users ?? []).map((user) => ({
        user_id: user.id,
        type: broadcast.type,
        title: broadcast.title,
        body: broadcast.body,
        category: 'system',
        priority: broadcast.type === 'maintenance_starting' || broadcast.type === 'account_security' ? 'high' : 'medium',
        action_url: broadcast.action_url || '/notifications',
        reference_id: `${broadcast.type}:${Date.now()}`,
        reference_type: 'system',
      }));

    if (notifications.length === 0) {
      handleStatus('No user accounts matched the chosen target role filters.', 'error');
      setIsSending(false);
      return;
    }

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) {
      handleStatus(error.message, 'error');
      setIsSending(false);
      return;
    }

    setBroadcast(EMPTY_BROADCAST);
    handleStatus(`System broadcast successfully dispatched to ${notifications.length} matching user accounts.`, 'success');
    setIsSending(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[#FFFFFF] font-display">System Broadcasts & Configs</h3>
        <p className="text-xs text-[#A3A3A3] mt-1">
          Adjust background worker timings, control push systems, or dispatch mass critical notices.
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
          {status.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          <div>
            <span className="text-xs font-bold block">{status.type === 'success' ? 'Operation Success' : 'Transaction Interrupted'}</span>
            <p className="text-[11px] opacity-90 mt-0.5 font-medium">{status.message}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Left: Notification Infrastructure */}
        <section className="bg-[#1B1B1B] p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-4">
            <div className="pb-1 border-b border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">Edge Infrastructure</h4>
            </div>
            <p className="text-[11px] text-[#A3A3A3] leading-relaxed font-semibold">
              Update direct environment constants controlling async dispatch intervals, retry limits, and regional notification workers.
            </p>

            <form onSubmit={saveConfig} className="space-y-4 pt-2">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {configRows.map((row) => (
                  <label key={row.key} className="block space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">{row.key}</span>
                    <input
                      value={configValues[row.key] ?? ''}
                      onChange={(event) =>
                        setConfigValues((current) => ({
                          ...current,
                          [row.key]: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                    />
                    {row.description && (
                      <div className="flex items-start gap-1.5 text-[10px] text-[#A3A3A3] mt-1 px-1 font-medium">
                        <Info size={11} className="mt-0.5 shrink-0 text-[#8C8F7E]" />
                        <span>{row.description}</span>
                      </div>
                    )}
                  </label>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="flex items-center gap-2 rounded-xl bg-[#A8D97F] px-4 py-2.5 text-xs font-bold text-[#1A3A05] transition-all duration-200 hover:bg-[#B8E890] active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md"
                >
                  <Save size={14} />
                  <span>{isSavingConfig ? 'Synchronizing...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Right: System Broadcasts */}
        <section className="space-y-4 py-2">
          <div className="pb-1 border-b border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">Dispatch Broadcast</h4>
          </div>
          <p className="text-[11px] text-[#A3A3A3] leading-relaxed font-semibold">
            Draft and transmit immediate service-wide, maintenance, security or policy alert banners to custom target groups.
          </p>

          <form onSubmit={sendBroadcast} className="space-y-4 pt-2">
            <div className="grid gap-3 grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Category Type</span>
                <select
                  value={broadcast.type}
                  onChange={(event) => setBroadcast((current) => ({ ...current, type: event.target.value as BroadcastForm['type'] }))}
                  className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] cursor-pointer transition-colors duration-200"
                >
                  <option value="maintenance_scheduled" className="bg-[#141414] text-white">Scheduled Maintenance</option>
                  <option value="maintenance_starting" className="bg-[#141414] text-white">Maintenance Live</option>
                  <option value="policy_update" className="bg-[#141414] text-white">Policy Revision</option>
                  <option value="account_security" className="bg-[#141414] text-white">Security Advisory</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Target Role</span>
                <select
                  value={broadcast.targetRole}
                  onChange={(event) => setBroadcast((current) => ({ ...current, targetRole: event.target.value as BroadcastForm['targetRole'] }))}
                  className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] cursor-pointer transition-colors duration-200"
                >
                  <option value="all" className="bg-[#141414] text-white">All accounts</option>
                  <option value="donor" className="bg-[#141414] text-white">Donors only</option>
                  <option value="recipient" className="bg-[#141414] text-white">Recipients only</option>
                  <option value="both" className="bg-[#141414] text-white">Donors & Recipients</option>
                  <option value="org" className="bg-[#141414] text-white">Organizations</option>
                  <option value="admin" className="bg-[#141414] text-white">Administrators</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Message Title</span>
              <input
                value={broadcast.title}
                onChange={(event) => setBroadcast((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g., Scheduled Core Maintenance Window"
                className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Message Content (Markdown / Text)</span>
              <textarea
                value={broadcast.body}
                onChange={(event) => setBroadcast((current) => ({ ...current, body: event.target.value }))}
                placeholder="Provide detailed description of update, scheduled times, or security procedures..."
                className="min-h-[100px] w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C8F7E] font-mono">Redirect Action URL (Optional)</span>
              <input
                value={broadcast.action_url}
                onChange={(event) => setBroadcast((current) => ({ ...current, action_url: event.target.value }))}
                placeholder="e.g., /notifications or /settings"
                className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white focus:outline-none focus:border-[#A8D97F] focus:ring-1 focus:ring-[#A8D97F]/30 transition-all duration-200"
              />
            </label>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 rounded-xl bg-[#E8A838] px-4 py-2.5 text-xs font-bold text-[#1A1A1A] transition-all duration-200 hover:bg-[#F2B955] active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md"
              >
                <Send size={14} />
                <span>{isSending ? 'Broadcasting...' : 'Dispatch Broadcast'}</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
