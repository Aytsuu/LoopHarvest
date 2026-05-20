'use client';

import * as React from 'react';
import { Bell, Trash2, CheckCircle2, Inbox, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { mockStore, NotificationItem } from '@/lib/mockStore';
import { catMap } from '@/lib/categories';

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(() => mockStore.getNotifications());

  const refreshData = React.useCallback(() => {
    setNotifications(mockStore.getNotifications());
  }, []);

  const handleMarkAllRead = () => {
    mockStore.markAllNotificationsAsRead();
    refreshData();
    // Dispatch refresh event
    window.dispatchEvent(new CustomEvent('post-created', { detail: 'All notifications marked as read!' }));
  };

  const handleDelete = (id: string) => {
    mockStore.deleteNotification(id);
    refreshData();
  };

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'request_matched':
        return <ArrowRight size={16} className="text-[#A8D97F]" />;
      case 'listing_claimed':
        return <CheckCircle2 size={16} className="text-[#E8A838]" />;
      case 'pickup_confirmed':
        return <Calendar size={16} className="text-[#4ECDC4]" />;
      case 'match_found':
        return <Inbox size={16} className="text-[#A8D97F]" />;
      case 'review_received':
        return <MessageSquare size={16} className="text-[#7EF8EF]" />;
      default:
        return <Bell size={16} className="text-[#A8AA98]" />;
    }
  };

  return (
    <main className="flex-1 bg-[#0A0A0A] text-[#E8EAD8] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#E8EAD8]">
            Notification Center
          </h1>
          {notifications.some(n => n.status === 'unread') ? (
            <button
              onClick={handleMarkAllRead}
              className="rounded-full bg-[#2A4A10] px-4 py-1.5 text-xs font-bold text-[#A8D97F] border border-[#A8D97F]/10 hover:bg-[#345A14] transition"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#E8EAD8]">
            Recent Alerts
          </h2>
          <span className="text-xs font-mono text-[#A8AA98]">
            {notifications.filter(n => n.status === 'unread').length} unread
          </span>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, idx) => {
              const catColor = notif.category ? (catMap[notif.category]?.color || '#A8D97F') : '#A8AA98';
              const isUnread = notif.status === 'unread';

              return (
                <div
                  key={notif.id}
                  style={{ 
                    borderLeftColor: isUnread ? catColor : 'rgba(255,255,255,0.06)',
                    animationDelay: `${idx * 50}ms`,
                    animationFillMode: 'both'
                  }}
                  className={`group relative flex items-start gap-4 rounded-xl border border-white/6 p-4 border-l-4 transition-colors animate-fade-in-up ${
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
                      <h4 className={`text-sm font-bold text-[#E8EAD8] truncate ${isUnread ? '' : 'font-semibold'}`}>
                        {notif.title}
                      </h4>
                      <span className="font-mono text-[9px] text-[#A8AA98] shrink-0 bg-white/4 px-1.5 py-0.5 rounded">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#A8AA98] leading-relaxed pr-6">
                      {notif.body}
                    </p>
                  </div>

                  {/* Action delete floating button */}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition rounded p-1.5 text-[#5A5C50] hover:text-[#E05656] hover:bg-[#E05656]/10"
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
            <h4 className="font-display text-base font-bold text-[#E8EAD8]">Inbox is completely clean!</h4>
            <p className="text-xs text-[#A8AA98] mt-1 max-w-xs leading-relaxed">
              When neighbours post compatible food waste matches, list resources, or coordinate claims near you, alerts will populate here.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
