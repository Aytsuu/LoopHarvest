'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { notificationService } from '@/lib/api/notifications';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

type NotificationContextValue = {
  unreadCount: number;
  currentUserId: string | null;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

const BROADCAST_CHANNEL_NAME = 'loopharvest_notifications';

function getPageTitle(pathname: string) {
  if (pathname === '/home') return 'LoopHarvest';
  if (pathname === '/browse') return 'Browse - LoopHarvest';
  if (pathname === '/notifications') return 'Notifications - LoopHarvest';
  if (pathname === '/impact') return 'Your Impact - LoopHarvest';
  if (pathname === '/settings') return 'Settings - LoopHarvest';
  if (pathname === '/chat') return 'Messages - LoopHarvest';
  if (pathname.startsWith('/listings/')) return 'Listing - LoopHarvest';
  if (pathname.startsWith('/requests/')) return 'Request - LoopHarvest';
  if (pathname.startsWith('/users/')) return 'Profile - LoopHarvest';
  if (pathname.startsWith('/post/listing')) return 'Post Listing - LoopHarvest';
  if (pathname.startsWith('/post/request')) return 'Post Request - LoopHarvest';
  return 'LoopHarvest';
}

function formatTitle(unreadCount: number, pathname: string) {
  const pageTitle = getPageTitle(pathname);
  const shouldPrefix = pathname !== '/notifications' && unreadCount > 0;

  if (!shouldPrefix) {
    return pageTitle;
  }

  if (unreadCount >= 100) {
    return `(99+) ${pageTitle}`;
  }

  if (unreadCount >= 10) {
    return `(9+) ${pageTitle}`;
  }

  return `(${unreadCount}) ${pageTitle}`;
}

function updateFaviconBadge(count: number) {
  if (typeof document === 'undefined') {
    return;
  }

  const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") ?? document.createElement('link');
  link.rel = 'icon';

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const image = new Image();
  image.src = '/logo.png';
  image.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, 64, 64);

    if (count > 0) {
      ctx.beginPath();
      ctx.arc(48, 16, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#E05656';
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count > 99 ? '99+' : count > 9 ? '9+' : String(count), 48, 16);
    }

    link.href = canvas.toDataURL('image/png');
    if (!link.parentNode) {
      document.head.appendChild(link);
    }
  };
}

export function NotificationClientProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [supabase] = React.useState(() => createSupabaseClient());
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const broadcastChannelRef = React.useRef<BroadcastChannel | null>(null);
  const blinkIntervalRef = React.useRef<number | null>(null);

  const stopBlink = React.useCallback(() => {
    if (blinkIntervalRef.current !== null) {
      window.clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
      document.title = formatTitle(unreadCount, pathname);
    }
  }, [pathname, unreadCount]);

  const broadcastUnreadCount = React.useCallback((count: number) => {
    broadcastChannelRef.current?.postMessage({
      type: 'UNREAD_COUNT_SYNC',
      count,
    });
  }, []);

  const refreshUnreadCount = React.useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCurrentUserId(null);
      setUnreadCount(0);
      broadcastUnreadCount(0);
      return;
    }

    setCurrentUserId(user.id);
    const nextCount = await notificationService.countUnreadNotifications(supabase, user.id);
    setUnreadCount(nextCount);
    broadcastUnreadCount(nextCount);
  }, [broadcastUnreadCount, supabase]);

  React.useEffect(() => {
    broadcastChannelRef.current =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(BROADCAST_CHANNEL_NAME) : null;

    const channel = broadcastChannelRef.current;
    if (!channel) {
      return;
    }

    channel.onmessage = (event: MessageEvent<{ type?: string; count?: number }>) => {
      if (event.data.type !== 'UNREAD_COUNT_SYNC' || typeof event.data.count !== 'number') {
        return;
      }

      setUnreadCount(event.data.count);
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshUnreadCount();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshUnreadCount]);

  React.useEffect(() => {
    const handleNotificationUpdate = () => {
      void refreshUnreadCount();
    };

    window.addEventListener('notifications-updated', handleNotificationUpdate);
    return () => window.removeEventListener('notifications-updated', handleNotificationUpdate);
  }, [refreshUnreadCount]);

  React.useEffect(() => {
    if (!currentUserId) {
      return;
    }

    return notificationService.subscribeToNotifications(supabase, currentUserId, (notification) => {
      void refreshUnreadCount();

      if (!notification) {
        return;
      }

      if (document.visibilityState === 'visible' && pathname !== '/notifications') {
        window.dispatchEvent(new CustomEvent('notification-toast', { detail: notification }));
      }

      if (
        document.visibilityState === 'hidden' &&
        (notification.priority === 'high' || notification.priority === 'critical')
      ) {
        stopBlink();

        const titles = [formatTitle(unreadCount + 1, pathname), `● ${notification.title}`];
        let index = 0;
        blinkIntervalRef.current = window.setInterval(() => {
          document.title = titles[index % titles.length];
          index += 1;
        }, 1200);
      }
    });
  }, [currentUserId, pathname, refreshUnreadCount, stopBlink, supabase, unreadCount]);

  React.useEffect(() => {
    document.title = formatTitle(unreadCount, pathname);
    updateFaviconBadge(pathname === '/notifications' ? 0 : unreadCount);
  }, [pathname, unreadCount]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        stopBlink();
        void refreshUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshUnreadCount, stopBlink]);

  const value = React.useMemo<NotificationContextValue>(
    () => ({
      unreadCount,
      currentUserId,
      refreshUnreadCount,
    }),
    [currentUserId, refreshUnreadCount, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationClient() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationClient must be used inside NotificationClientProvider.');
  }

  return context;
}
