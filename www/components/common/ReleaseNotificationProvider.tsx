'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, X } from 'lucide-react';

import type { ReleaseNotificationItem } from '@/lib/api/types';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

function formatReleaseBadge(type: ReleaseNotificationItem['type']) {
  switch (type) {
    case 'breaking':
      return 'Critical Update';
    case 'major':
      return 'Major Release';
    case 'patch':
      return 'Patch';
    default:
      return 'New Release';
  }
}

export function ReleaseNotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [supabase] = React.useState(() => createSupabaseClient());
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [releases, setReleases] = React.useState<ReleaseNotificationItem[]>([]);
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    let isActive = true;

    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!isActive) {
        return;
      }

      if (!user) {
        setCurrentUserId(null);
        setReleases([]);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('release_notifications')
        .select('id, version, type, title, body, changelog_url, action_required, action_label, action_type, action_url, published_at, expires_at')
        .order('published_at', { ascending: false })
        .limit(5);

      if (!isActive || error) {
        return;
      }

      setReleases((data ?? []) as ReleaseNotificationItem[]);

      await Promise.all(
        ((data ?? []) as ReleaseNotificationItem[]).map((release) =>
          supabase.from('release_acknowledgments').upsert(
            {
              user_id: user.id,
              release_id: release.id,
              seen_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,release_id' },
          ),
        ),
      );
    });

    return () => {
      isActive = false;
    };
  }, [supabase]);

  const activeRelease = releases.find((release) => !dismissedIds.includes(release.id)) ?? null;
  const isBlocking = activeRelease?.type === 'breaking';

  const acknowledgeRelease = React.useCallback(async (release: ReleaseNotificationItem, actionTaken?: string) => {
    if (!currentUserId) {
      return;
    }

    await supabase.from('release_acknowledgments').upsert(
      {
        user_id: currentUserId,
        release_id: release.id,
        seen_at: new Date().toISOString(),
        acknowledged_at: new Date().toISOString(),
        action_taken: actionTaken ?? null,
      },
      { onConflict: 'user_id,release_id' },
    );
  }, [currentUserId, supabase]);

  const handleAction = React.useCallback(async (release: ReleaseNotificationItem) => {
    if (release.action_type === 'reload') {
      await acknowledgeRelease(release, 'reload');
      window.location.reload();
      return;
    }

    if (release.action_type === 'navigate' && release.action_url) {
      await acknowledgeRelease(release, 'navigate');
      router.push(release.action_url);
      return;
    }

    await acknowledgeRelease(release, 'acknowledged');
    setDismissedIds((current) => [...current, release.id]);
  }, [acknowledgeRelease, router]);

  const dismissRelease = React.useCallback(async (release: ReleaseNotificationItem) => {
    await acknowledgeRelease(release, 'dismissed');
    setDismissedIds((current) => [...current, release.id]);
  }, [acknowledgeRelease]);

  return (
    <>
      {children}

      {activeRelease && !isBlocking ? (
        <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
          <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 rounded-2xl border border-[#A8D97F]/10 bg-[#1B1B1B]/95 px-5 py-4 shadow-2xl backdrop-blur">
            <div className="min-w-0">
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#A8D97F]">
                {formatReleaseBadge(activeRelease.type)} · v{activeRelease.version}
              </div>
              <div className="text-sm font-bold text-[#FFFFFF]">{activeRelease.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">{activeRelease.body}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(activeRelease.action_required || activeRelease.action_type !== 'none') ? (
                <button
                  type="button"
                  onClick={() => void handleAction(activeRelease)}
                  className="rounded-xl bg-[#A8D97F] px-4 py-2 text-xs font-bold text-[#1A3A05]"
                >
                  {activeRelease.action_label ?? 'Open'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void dismissRelease(activeRelease)}
                className="rounded-full p-2 text-[#A3A3A3] transition hover:bg-white/5 hover:text-[#FFFFFF]"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeRelease && isBlocking ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-[#E05656]/25 bg-[#141414] p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3 text-[#E05656]">
              <RefreshCw size={20} />
              <span className="text-[11px] font-black uppercase tracking-[0.24em]">
                {formatReleaseBadge(activeRelease.type)} · v{activeRelease.version}
              </span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#FFFFFF]">{activeRelease.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#D4D4D4]">{activeRelease.body}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void handleAction(activeRelease)}
                className="rounded-xl bg-[#E05656] px-5 py-3 text-sm font-black text-white"
              >
                {activeRelease.action_label ?? 'Reload now'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
