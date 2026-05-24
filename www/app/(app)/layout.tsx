'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { X, Apple, MessageSquare, Check, LogOut, AlertCircle, Info } from 'lucide-react';
import BottomNav from '@/components/navigation/BottomNav';
import NavigationRail from '@/components/navigation/NavigationRail';
import { logout } from '@/app/login/actions';
import { NotificationClientProvider } from '@/components/common/NotificationClientProvider';
import { ReleaseNotificationProvider } from '@/components/common/ReleaseNotificationProvider';
import type { NotificationItem } from '@/lib/api/types';

type ToastState = {
  key?: string;
  message: string;
  show: boolean;
  type?: 'success' | 'error' | 'info' | 'warning';
  actionUrl?: string | null;
  actionLabel?: string | null;
  actionEvent?: string | null;
  persistent?: boolean;
  dismissible?: boolean;
  dismissEvent?: string | null;
};

type ToastEventDetail = {
  key?: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  actionUrl?: string | null;
  actionLabel?: string | null;
  actionEvent?: string | null;
  persistent?: boolean;
  dismissible?: boolean;
  dismissEvent?: string | null;
  dismissKey?: string;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [isPostSheetOpen, setIsPostSheetOpen] = React.useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState>({ message: '', show: false });
  const toastTimerRef = React.useRef<number | null>(null);

  const triggerPostSheet = () => {
    setIsPostSheetOpen(prev => !prev);
  };

  const navigateTo = (path: string) => {
    setIsPostSheetOpen(false);
    router.push(path);
  };

  const clearToastTimer = React.useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const showToastNotification = React.useCallback((
    msg: string,
    options?: {
      type?: 'success' | 'error' | 'info' | 'warning';
      actionUrl?: string | null;
      actionLabel?: string | null;
      actionEvent?: string | null;
      persistent?: boolean;
      dismissible?: boolean;
      key?: string;
      dismissEvent?: string | null;
    },
  ) => {
    clearToastTimer();

    // Auto-detect error or warning state based on message keywords
    let detectedType = options?.type;
    if (!detectedType) {
      const lower = msg.toLowerCase();
      if (lower.includes('error') || lower.includes('fail') || lower.includes('unable') || lower.includes('cannot') || lower.includes('invalid') || lower.includes('reject')) {
        detectedType = 'error';
      } else if (lower.includes('warn') || lower.includes('alert') || lower.includes('attention')) {
        detectedType = 'warning';
      } else {
        detectedType = 'success';
      }
    }

    setToast({
      key: options?.key,
      message: msg,
      show: true,
      type: detectedType,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      actionEvent: options?.actionEvent,
      persistent: options?.persistent ?? false,
      dismissible: options?.dismissible ?? true, // Default to true so close buttons show by default
      dismissEvent: options?.dismissEvent,
    });

    if (!options?.persistent) {
      toastTimerRef.current = window.setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  }, [clearToastTimer]);

  const dismissToast = React.useCallback(() => {
    clearToastTimer();
    if (toast.dismissEvent) {
      window.dispatchEvent(new CustomEvent(toast.dismissEvent));
    }
    setToast(prev => ({ ...prev, show: false }));
  }, [clearToastTimer, toast.dismissEvent]);

  React.useEffect(() => {
    return () => clearToastTimer();
  }, [clearToastTimer]);

  const triggerToastAction = React.useCallback(() => {
    if (toast.actionEvent) {
      dismissToast();
      window.dispatchEvent(new CustomEvent(toast.actionEvent));
      return;
    }

    if (toast.actionUrl) {
      dismissToast();
      router.push(toast.actionUrl);
    }
  }, [dismissToast, router, toast.actionEvent, toast.actionUrl]);

  React.useEffect(() => {
    const handleAppToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      const detail = customEvent.detail;
      if (!detail) {
        return;
      }

      if (detail.dismissKey) {
        setToast(prev => prev.key === detail.dismissKey ? { ...prev, show: false } : prev);
        return;
      }

      if (!detail.message) {
        return;
      }

      showToastNotification(detail.message, {
        key: detail.key,
        type: detail.type,
        actionUrl: detail.actionUrl,
        actionLabel: detail.actionLabel,
        actionEvent: detail.actionEvent,
        persistent: detail.persistent,
        dismissible: detail.dismissible,
        dismissEvent: detail.dismissEvent,
      });
    };

    window.addEventListener('app-toast', handleAppToast);
    return () => window.removeEventListener('app-toast', handleAppToast);
  }, [showToastNotification]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
    try {
      const stored = localStorage.getItem('fl_sidebar_collapsed');
      if (stored !== null) {
        setTimeout(() => {
          setIsSidebarCollapsed(stored === 'true');
        }, 0);
      }
    } catch (e) {
      console.warn("Storage access failed (private browsing):", e);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fl_sidebar_collapsed', String(next));
        window.dispatchEvent(new CustomEvent('sidebar-collapsed-change', { detail: next }));
      } catch (e) {
        console.warn("Writing to storage failed:", e);
      }
      return next;
    });
  };

  // Listen to custom posting events for feedback
  React.useEffect(() => {
    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      showToastNotification(customEvent.detail || 'Post created successfully!');
    };
    window.addEventListener('post-created', handlePostCreated);
    return () => window.removeEventListener('post-created', handlePostCreated);
  }, [showToastNotification]);

  React.useEffect(() => {
    const handleNotificationToast = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      const notification = customEvent.detail;
      if (!notification) {
        return;
      }

      showToastNotification(notification.title, { actionUrl: notification.actionUrl, actionLabel: 'View' });
    };

    window.addEventListener('notification-toast', handleNotificationToast);
    return () => window.removeEventListener('notification-toast', handleNotificationToast);
  }, [showToastNotification]);

  // Listen to custom signout events (for mobile settings triggers)
  React.useEffect(() => {
    const handleTriggerSignOut = () => {
      setIsSignOutConfirmOpen(true);
    };
    window.addEventListener('trigger-signout', handleTriggerSignOut);
    return () => window.removeEventListener('trigger-signout', handleTriggerSignOut);
  }, []);

  return (
    <NotificationClientProvider>
      <ReleaseNotificationProvider>
      <div className="relative min-h-screen bg-[#0A0A0A] text-[#FFFFFF]">
      {/* Navigation Rails & Drawers */}
      <NavigationRail
        onPostClick={triggerPostSheet}
        onSignOutClick={() => setIsSignOutConfirmOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      {/* padding bottom is 80px on mobile to prevent navbar covering content, padding left adjusts dynamically with transition */}
      <div className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}>
        {mounted ? children : (
          <div className="flex h-[calc(100vh-80px)] md:h-screen w-full items-center justify-center bg-[#0A0A0A]">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#A8D97F]/10" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-[#A8D97F] border-r-transparent border-b-transparent border-l-transparent" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="LoopHarvest" className="h-10 w-10 object-contain" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h3 className="font-display text-sm font-black tracking-wider text-[#FFFFFF] uppercase">LoopHarvest</h3>
                <p className="text-[10px] font-bold text-[#A3A3A3] tracking-widest uppercase animate-pulse">Syncing Organic Cycles...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav (Mobile only) */}
      <BottomNav onPostClick={triggerPostSheet} />

      {/* Post Bottom Sheet (M3 Modal overlay) */}
      {isPostSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center animate-fade-in"
          onClick={() => setIsPostSheetOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-t-[2rem] bg-[#1B1B1B] p-6 pb-12 text-[#FFFFFF] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] border-t border-white/10 md:rounded-[2rem] md:pb-6 md:border animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="mx-auto mb-6 h-1 w-8 rounded-full bg-white/20 md:hidden" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold tracking-tight text-[#FFFFFF]">
                What do you want to post?
              </h3>
              <button
                onClick={() => setIsPostSheetOpen(false)}
                className="rounded-full p-1.5 text-[#A3A3A3] hover:bg-white/8 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigateTo('/post/listing')}
                className="flex w-full items-center gap-4 rounded-2xl bg-[#A8D97F] p-4 text-left font-bold text-[#1A3A05] transition hover:brightness-105 active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A3A05]/10">
                  <Apple size={22} />
                </div>
                <div>
                  <div className="text-sm">Donate Food Waste</div>
                  <div className="text-[10px] font-medium text-[#1A3A05]/70 mt-0.5">Share excess food scraps with neighbors</div>
                </div>
              </button>

              <button
                onClick={() => navigateTo('/post/request')}
                className="flex w-full items-center gap-4 rounded-2xl bg-[#2A4A10] p-4 text-left font-bold text-[#C4F09A] transition hover:brightness-110 active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C4F09A]/10">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <div className="text-sm">Request Food Waste</div>
                  <div className="text-[10px] font-medium text-[#C4F09A]/70 mt-0.5">Post an appeal for compost, feed, or bio-materials</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal (Premium Glassmorphic Dialog) */}
      {isSignOutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsSignOutConfirmOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[2rem] bg-[#1B1B1B] p-6 text-[#FFFFFF] shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/10 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon Badge */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E05656]/10 text-[#E05656] border border-[#E05656]/20">
              <LogOut size={22} />
            </div>

            <div className="text-center space-y-2 mb-6">
              <h3 className="font-display text-lg font-bold tracking-tight text-[#FFFFFF]">
                Sign Out?
              </h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed px-1 font-medium">
                Are you sure you want to sign out? You will need to log back in to manage your posts and active claims.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsSignOutConfirmOpen(false)}
                className="flex-1 h-11 rounded-xl border border-white/8 bg-white/4 text-xs font-bold text-[#FFFFFF] hover:bg-white/8 hover:text-white transition duration-200 active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSignOutConfirmOpen(false);
                  await logout();
                }}
                className="flex-1 h-11 rounded-xl bg-[#E05656] text-xs font-black text-white hover:brightness-105 shadow-md shadow-[#E05656]/15 transition duration-200 active:scale-[0.98] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar / Toast Notifications */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4 transition-all duration-300 md:bottom-6">
          <div className="flex items-start justify-between gap-4 rounded-xl bg-[#141414]/95 backdrop-blur-md border border-white/10 px-4 py-3.5 text-[#FFFFFF] shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-fade-in">
            <div className="flex min-w-0 items-start gap-3 flex-1">
              {toast.type === 'error' ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E05656]/15 text-[#E05656]">
                  <AlertCircle size={14} strokeWidth={2.5} />
                </div>
              ) : toast.type === 'warning' ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8A838]/15 text-[#E8A838]">
                  <AlertCircle size={14} strokeWidth={2.5} />
                </div>
              ) : toast.type === 'info' ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/15 text-[#3B82F6]">
                  <Info size={14} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A8D97F]/15 text-[#A8D97F]">
                  <Check size={14} strokeWidth={2.5} />
                </div>
              )}
              <div className="flex-1 min-w-0 py-1">
                <p className="text-xs font-semibold text-[#FFFFFF] leading-normal break-words whitespace-normal">
                  {toast.message}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 pl-1 self-start py-1">
              {toast.actionUrl || toast.actionEvent ? (
                <button
                  type="button"
                  onClick={triggerToastAction}
                  className="shrink-0 text-xs font-bold text-[#A8D97F] hover:text-[#C4F09A] transition duration-150 cursor-pointer active:scale-95"
                >
                  {toast.actionLabel ?? 'View'}
                </button>
              ) : null}
              {toast.dismissible ? (
                <button
                  type="button"
                  onClick={dismissToast}
                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[#A3A3A3] hover:bg-white/8 hover:text-[#FFFFFF] transition duration-150 cursor-pointer active:scale-95"
                  aria-label="Dismiss toast"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
      </div>
      </ReleaseNotificationProvider>
    </NotificationClientProvider>
  );
}
