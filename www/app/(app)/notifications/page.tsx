'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell, Trash2, CheckCircle2, Inbox, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { useNotificationClient } from '@/components/common/NotificationClientProvider';
import { notificationService } from '@/lib/api/notifications';
import { apiClient } from '@/lib/api/client';
import type { NotificationItem } from '@/lib/api/types';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

export default function NotificationsPage() {
  const router = useRouter();
  const { refreshUnreadCount } = useNotificationClient();
  const [supabase] = React.useState(() => createSupabaseClient());

  // Fetch current user using shared query key
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: apiClient.getCurrentUser,
  });
  const currentUserId = currentUser?.id ?? null;

  // Fetch notifications using dynamic query cache
  const { data: notifications = [], refetch: refetchNotifications, isLoading } = useQuery({
    queryKey: ['notifications', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      return notificationService.getNotifications(supabase, currentUserId);
    },
    enabled: !!currentUserId,
  });

  // Automatically mark unread alerts as read when landing on page
  React.useEffect(() => {
    if (!currentUserId || notifications.length === 0) {
      return;
    }

    const unreadItems = notifications.filter((item) => item.status === 'unread');
    if (unreadItems.length > 0) {
      void (async () => {
        await notificationService.markAllNotificationsAsRead(supabase, currentUserId);
        void refetchNotifications();
        void refreshUnreadCount();
      })();
    }
  }, [currentUserId, notifications, refetchNotifications, refreshUnreadCount, supabase]);

  // Realtime active subscription listener
  React.useEffect(() => {
    if (!currentUserId) {
      return;
    }

    return notificationService.subscribeToNotifications(supabase, currentUserId, () => {
      void (async () => {
        await refetchNotifications();
        if (document.visibilityState === 'visible') {
          await notificationService.markAllNotificationsAsRead(supabase, currentUserId);
          await refetchNotifications();
          await refreshUnreadCount();
        }
      })();
    });
  }, [currentUserId, refetchNotifications, refreshUnreadCount, supabase]);

  const handleMarkAllRead = React.useCallback(async () => {
    if (!currentUserId) {
      return;
    }

    await notificationService.markAllNotificationsAsRead(supabase, currentUserId);
    await refetchNotifications();
    await refreshUnreadCount();
    window.dispatchEvent(new CustomEvent('post-created', { detail: 'All notifications marked as read!' }));
  }, [currentUserId, refetchNotifications, refreshUnreadCount, supabase]);

  const handleDelete = React.useCallback(async (id: string) => {
    await notificationService.deleteNotification(supabase, id);
    await refetchNotifications();
    await refreshUnreadCount();
  }, [refetchNotifications, refreshUnreadCount, supabase]);

  const handleOpenNotification = React.useCallback(async (notification: NotificationItem) => {
    if (notification.status === 'unread') {
      await notificationService.markNotificationRead(supabase, notification.id);
      await refetchNotifications();
      await refreshUnreadCount();
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }, [refetchNotifications, refreshUnreadCount, router, supabase]);

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'request_matched':
        return <ArrowRight size={16} className="text-[#A8D97F]" />;
      case 'listing_claimed':
        return <CheckCircle2 size={16} className="text-[#E8A838]" />;
      case 'pickup_confirmed':
        return <Calendar size={16} className="text-[#A8D97F]" />;
      case 'match_found':
        return <Inbox size={16} className="text-[#A8D97F]" />;
      case 'review_received':
        return <MessageSquare size={16} className="text-[#A8D97F]" />;
      default:
        return <Bell size={16} className="text-[#A3A3A3]" />;
    }
  };

  const getAccentColor = (notification: NotificationItem) => {
    if (notification.type === 'listing_claimed') return '#E8A838';
    if (notification.type === 'message_received') return '#7DD3FC';
    if (notification.type === 'request_fulfilled') return '#A8D97F';
    if (notification.type === 'match_found') return '#A8D97F';
    if (notification.category === 'matching') return '#A8D97F';
    if (notification.category === 'transactional') return '#E8A838';
    return '#A3A3A3';
  };

  return (
    <main className="flex-1 bg-[#0A0A0A] text-[#FFFFFF] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#FFFFFF]">
            Notification Center
          </h1>
          {notifications.some(n => n.status === 'unread') ? (
            <button
               onClick={handleMarkAllRead}
              className="rounded-full bg-[#2A4A10] px-4 py-1.5 text-xs font-bold text-[#A8D97F] border border-[#A8D97F]/10 hover:bg-[#345A14] transition cursor-pointer"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#FFFFFF]">
            Recent Alerts
          </h2>
          <span className="text-xs font-mono text-[#A3A3A3]">
            {notifications.filter(n => n.status === 'unread').length} unread
          </span>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-white/6 bg-[#141414] p-6 text-center text-sm text-[#A3A3A3]">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, idx) => {
              const catColor = getAccentColor(notif);
              const isUnread = notif.status === 'unread';

              return (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void handleOpenNotification(notif)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void handleOpenNotification(notif);
                    }
                  }}
                  style={{ 
                    animationDelay: `${idx * 50}ms`,
                    animationFillMode: 'both'
                  }}
                  className={`group relative flex w-full items-start gap-4 rounded-xl border border-white/6 p-4 text-left transition-colors animate-fade-in-up cursor-pointer ${
                    isUnread ? 'bg-[#141414]' : 'bg-[#0E0E0E]/40 opacity-70'
                  }`}
                >
                  {/* Category-Colored/Type Indicator Icon Container */}
                  <div 
                    style={{ borderColor: isUnread ? `${catColor}3F` : 'rgba(255,255,255,0.06)', backgroundColor: '#0A0A0A' }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-inner"
                  >
                    {getIconForType(notif.type)}
                  </div>

                  {/* Copy details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-bold text-[#FFFFFF] truncate ${isUnread ? '' : 'font-semibold'}`}>
                        {notif.title}
                      </h4>
                      <span className="font-mono text-[9px] text-[#A3A3A3] shrink-0 bg-white/4 px-1.5 py-0.5 rounded">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed pr-6">
                      {notif.body}
                    </p>
                  </div>

                  {/* Action delete floating button */}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDelete(notif.id);
                    }}
                    className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition rounded p-1.5 text-[#525252] hover:text-[#E05656] hover:bg-[#E05656]/10 cursor-pointer"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>

                  {/* Unread dot indicator */}
                  {isUnread && (
                    <span 
                      style={{ backgroundColor: catColor }}
                      className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#141414] rounded-3xl border border-white/6 p-6 animate-blur-in">
            <Inbox size={44} className="text-white/10 mb-4" />
            <h4 className="font-display text-base font-bold text-[#FFFFFF]">Inbox is completely clean!</h4>
            <p className="text-xs text-[#A3A3A3] mt-1 max-w-xs leading-relaxed">
              When neighbours post compatible food waste matches, list resources, or coordinate claims near you, alerts will populate here.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
