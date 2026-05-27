'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Plus, BarChart2, Settings, MoreHorizontal, Bell, MessageSquare, Gift, LogOut, User } from 'lucide-react';
import { countUnreadThreads, fetchChatThreads } from '@/lib/chat';
import { useNotificationClient } from '@/components/common/NotificationClientProvider';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

interface BottomNavProps {
  onPostClick: () => void;
}

export default function BottomNav({ onPostClick }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = React.useState(() => createSupabaseClient());
  const { unreadCount } = useNotificationClient();

  const [mounted, setMounted] = React.useState(false);
  const [chatUnreadCount, setChatUnreadCount] = React.useState(0);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  const updateCount = React.useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChatUnreadCount(0);
        return;
      }

      const threads = await fetchChatThreads(supabase, user.id);
      setChatUnreadCount(countUnreadThreads(threads, user.id));
    } catch {
      setChatUnreadCount(0);
    }
  }, [supabase]);

  React.useEffect(() => {
    if (mounted) {
      const timeout = window.setTimeout(() => {
        void updateCount();
      }, 0);

      window.addEventListener('notifications-updated', updateCount);
      window.addEventListener('post-created', updateCount);
      
      return () => {
        window.clearTimeout(timeout);
        window.removeEventListener('notifications-updated', updateCount);
        window.removeEventListener('post-created', updateCount);
      };
    }
  }, [mounted, updateCount]);

  React.useEffect(() => {
    if (mounted) {
      const timeout = window.setTimeout(() => {
        void updateCount();
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [pathname, mounted, updateCount]);

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    let isActive = true;
    let cleanup = () => {};

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isActive || !user) {
        return;
      }

      const refresh = () => {
        void updateCount();
      };

      const participantAChannel = supabase
        .channel(`nav-chat-mobile-a-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'api',
            table: 'chat_threads',
            filter: `participant_a_id=eq.${user.id}`,
          },
          refresh,
        )
        .subscribe();

      const participantBChannel = supabase
        .channel(`nav-chat-mobile-b-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'api',
            table: 'chat_threads',
            filter: `participant_b_id=eq.${user.id}`,
          },
          refresh,
        )
        .subscribe();

      cleanup = () => {
        void supabase.removeChannel(participantAChannel);
        void supabase.removeChannel(participantBChannel);
      };
    });

    return () => {
      isActive = false;
      cleanup();
    };
  }, [mounted, supabase, updateCount]);

  // Click outside to close menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Close menu on navigation
  React.useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [pathname]);

  const isMoreActive = ['/profile', '/rewards', '/notifications', '/chat', '/settings'].includes(pathname);
  const hasUnreadInMore = (unreadCount > 0) || (chatUnreadCount > 0);

  const navItems = [
    { label: 'Home', icon: Home, route: '/home' },
    { label: 'Browse', icon: Search, route: '/browse' },
    { label: 'Post', icon: Plus, action: onPostClick },
    { label: 'Impact', icon: BarChart2, route: '/impact' },
    { label: 'More', icon: MoreHorizontal, action: () => setIsMoreMenuOpen(prev => !prev), isActive: isMoreActive }
  ];

  const moreMenuItems = [
    { label: 'My Profile', icon: User, route: '/profile' },
    { label: 'Messages', icon: MessageSquare, route: '/chat', badge: chatUnreadCount },
    { label: 'Notifications', icon: Bell, route: '/notifications', badge: unreadCount },
    { label: 'Rewards', icon: Gift, route: '/rewards' },
    { label: 'Settings', icon: Settings, route: '/settings' },
    { label: 'Sign out', icon: LogOut, action: () => window.dispatchEvent(new CustomEvent('trigger-signout')) }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-20 w-full items-center justify-around border-t border-white/6 bg-[#141414] px-2 pb-safe text-[#A3A3A3] md:hidden">
      {navItems.map((item, index) => {
        if (item.label === 'Post') {
          return (
            <button
              key={index}
              onClick={item.action}
              className="flex flex-col items-center justify-center w-16 cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A8D97F] text-[#1A3A05] shadow-lg transition-transform hover:scale-105 active:scale-95">
                <Plus size={24} strokeWidth={2.5} />
              </div>
            </button>
          );
        }

        const isActive = item.isActive !== undefined ? item.isActive : (item.route ? pathname === item.route : false);

        if (item.label === 'More') {
          return (
            <div key={index} ref={menuRef} className="relative flex flex-col items-center justify-center w-16">
              {/* More Menu Popover */}
              {isMoreMenuOpen && (
                <div className="absolute bottom-[76px] right-0 z-50 w-48 rounded-2xl border border-white/10 bg-[#1E1E1E]/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-lg animate-scale-in">
                  <div className="flex flex-col gap-0.5">
                    {moreMenuItems.map((menuItem, mIndex) => {
                      const isMenuOptionActive = menuItem.route ? pathname === menuItem.route : false;
                      const isSignOut = menuItem.label === 'Sign out';

                      return (
                        <button
                          key={mIndex}
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            if (menuItem.route) {
                              router.push(menuItem.route);
                            } else if (menuItem.action) {
                              menuItem.action();
                            }
                          }}
                          className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                            isSignOut
                              ? 'text-[#E05656] hover:bg-[#E05656]/10 active:bg-[#E05656]/20'
                              : isMenuOptionActive
                              ? 'bg-[#2A4A10] text-[#A8D97F]'
                              : 'text-[#A3A3A3] hover:bg-white/5 hover:text-[#FFFFFF]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <menuItem.icon size={16} className="shrink-0" />
                            <span className="tracking-wide">{menuItem.label}</span>
                          </div>
                          
                          {/* Badge Count */}
                          {menuItem.badge && menuItem.badge > 0 ? (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E05656] px-1 text-[9px] font-bold text-white">
                              {menuItem.badge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* More Button */}
              <button
                onClick={item.action}
                className={`group flex flex-col items-center justify-center gap-1 w-full transition-colors cursor-pointer ${
                  isActive ? 'text-[#A8D97F]' : 'hover:text-[#FFFFFF]'
                }`}
              >
                <div className="relative flex h-8 w-14 items-center justify-center rounded-full transition-colors">
                  {/* M3 Active Indicator Capsule */}
                  {isActive && (
                    <div className="absolute inset-0 scale-x-90 rounded-full bg-[#2A4A10]" />
                  )}
                  {/* Badge dot overlay if there are unread notifications/messages and the menu is closed */}
                  {hasUnreadInMore && !isMoreMenuOpen && (
                    <span className="absolute -right-0.5 -top-0.5 z-20 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#E05656] border border-[#141414]" />
                  )}
                  <item.icon
                    size={22}
                    className={`relative z-10 transition-transform group-active:scale-95`}
                  />
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </button>
            </div>
          );
        }

        // Standard Button (Home, Browse, Impact)
        return (
          <button
            key={index}
            onClick={() => item.route && router.push(item.route)}
            className={`group flex flex-col items-center justify-center gap-1 w-16 transition-colors cursor-pointer ${
              isActive ? 'text-[#A8D97F]' : 'hover:text-[#FFFFFF]'
            }`}
          >
            <div className="relative flex h-8 w-14 items-center justify-center rounded-full transition-colors">
              {/* M3 Active Indicator Capsule */}
              {isActive && (
                <div className="absolute inset-0 scale-x-90 rounded-full bg-[#2A4A10]" />
              )}
              <item.icon
                size={22}
                className={`relative z-10 transition-transform group-active:scale-95`}
              />
            </div>
            <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
