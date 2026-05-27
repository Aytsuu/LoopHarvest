'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Plus, BarChart2, Bell, LogOut, Settings, ChevronLeft, ChevronRight, MessageSquare, Gift, User } from 'lucide-react';
import { countUnreadThreads, fetchChatThreads } from '@/lib/chat';
import { useNotificationClient } from '@/components/common/NotificationClientProvider';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

interface NavigationRailProps {
  onPostClick: () => void;
  onSignOutClick: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function NavigationRail({ onPostClick, onSignOutClick, isCollapsed = false, onToggleCollapse }: NavigationRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = React.useState(() => createSupabaseClient());
  const { unreadCount } = useNotificationClient();

  const [mounted, setMounted] = React.useState(false);
  const [chatUnreadCount, setChatUnreadCount] = React.useState(0);

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
        .channel(`nav-chat-a-${user.id}`)
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
        .channel(`nav-chat-b-${user.id}`)
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

  const items = [
    { label: 'Home Feed', icon: Home, route: '/home' },
    { label: 'Browse', icon: Search, route: '/browse' },
    { label: 'My Profile', icon: User, route: '/profile' },
    { label: 'Impact Dashboard', icon: BarChart2, route: '/impact' },
    { label: 'Rewards Store', icon: Gift, route: '/rewards' },
    { label: 'Notifications', icon: Bell, route: '/notifications', badge: unreadCount },
    { label: 'Messages', icon: MessageSquare, route: '/chat', badge: chatUnreadCount },
    { label: 'Settings', icon: Settings, route: '/settings' }
  ];

  return (
    <aside 
      className={`fixed bottom-0 left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/6 bg-[#141414] p-4 text-[#A3A3A3] md:flex transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div 
        className={`group relative mb-8 flex items-center cursor-pointer py-2 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
        onClick={() => router.push('/home')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="LoopHarvest" className="h-8 w-8 shrink-0 object-contain" />
        <span 
          className={`font-display text-2xl font-extrabold tracking-tight text-[#A8D97F] select-none transition-all duration-300 origin-left overflow-hidden ${
            isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'
          } whitespace-nowrap`}
        >
          LoopHarvest
        </span>

        {isCollapsed && (
          <div className="pointer-events-none absolute left-full ml-4 z-50 rounded-lg bg-[#222222] border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] opacity-0 scale-95 translate-x-[-4px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl whitespace-nowrap">
            LoopHarvest
            {/* Subtle indicator triangle arrow */}
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2 w-2 rotate-45 bg-[#222222] border-l border-b border-white/10" />
          </div>
        )}
      </div>

      {/* Primary Action FAB */}
      <button
        onClick={onPostClick}
        className={`group relative mb-8 flex h-12 items-center justify-center bg-[#A8D97F] font-bold text-[#1A3A05] shadow-lg transition-all duration-300 hover:bg-[#B8E890] active:scale-95 cursor-pointer ${
          isCollapsed 
            ? 'w-12 rounded-full px-0 mx-auto' 
            : 'w-full rounded-2xl px-4 gap-2'
        }`}
      >
        <Plus size={20} strokeWidth={2.5} className="shrink-0" />
        <span 
          className={`transition-all duration-300 overflow-hidden whitespace-nowrap origin-left ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}
        >
          Create Post
        </span>

        {isCollapsed && (
          <div className="pointer-events-none absolute left-full ml-4 z-50 rounded-lg bg-[#222222] border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] opacity-0 scale-95 translate-x-[-4px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl whitespace-nowrap">
            Create Post
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2 w-2 rotate-45 bg-[#222222] border-l border-b border-white/10" />
          </div>
        )}
      </button>

      {/* Navigation Options */}
      <nav className="flex-1 space-y-1">
        {items.map((item, index) => {
          const isActive = pathname === item.route;
          return (
            <button
              key={index}
              onClick={() => router.push(item.route)}
              className={`group relative flex items-center rounded-xl py-3 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-[#2A4A10] text-[#A8D97F]'
                  : 'hover:bg-white/4 hover:text-[#FFFFFF]'
              } ${
                isCollapsed 
                  ? 'w-12 justify-center px-0 mx-auto' 
                  : 'w-full px-4 gap-4'
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <item.icon size={20} />
                {item.badge && item.badge > 0 ? (
                  <span 
                    className={`absolute flex h-4 w-4 items-center justify-center rounded-full bg-[#E05656] text-[9px] font-bold text-white transition-all ${
                      isCollapsed ? '-right-2 -top-2 scale-90' : '-right-1.5 -top-1.5'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span 
                className={`tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap origin-left ${
                  isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
              >
                {item.label}
              </span>

              {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-4 z-50 rounded-lg bg-[#222222] border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] opacity-0 scale-95 translate-x-[-4px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl whitespace-nowrap">
                  {item.label}
                  <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2 w-2 rotate-45 bg-[#222222] border-l border-b border-white/10" />
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign Out & Toggle Section */}
      <div className="border-t border-white/6 pt-4 space-y-2">
        <button
          type="button"
          onClick={onSignOutClick}
          className={`group relative flex items-center rounded-xl py-3 text-sm font-semibold hover:bg-[#E05656]/10 hover:text-[#E05656] transition-all duration-300 cursor-pointer ${
            isCollapsed 
              ? 'w-12 justify-center px-0 mx-auto' 
              : 'w-full px-4 gap-4'
          }`}
        >
          <LogOut size={20} className="shrink-0" />
          <span 
            className={`transition-all duration-300 overflow-hidden whitespace-nowrap origin-left ${
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            Sign out
          </span>

          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-4 z-50 rounded-lg bg-[#222222] border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] opacity-0 scale-95 translate-x-[-4px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl whitespace-nowrap">
              Sign out
              <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2 w-2 rotate-45 bg-[#222222] border-l border-b border-white/10" />
            </div>
          )}
        </button>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`group relative flex items-center rounded-xl hover:bg-white/4 hover:text-[#FFFFFF] transition-all duration-300 cursor-pointer ${
              isCollapsed 
                ? 'h-11 w-12 justify-center px-0 mx-auto' 
                : 'h-11 w-full px-4 gap-4'
            }`}
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={20} className="shrink-0" />
                <span className="text-sm font-semibold tracking-wide">Collapse</span>
              </>
            )}

            {isCollapsed && (
              <div className="pointer-events-none absolute left-full ml-4 z-50 rounded-lg bg-[#222222] border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] opacity-0 scale-95 translate-x-[-4px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl whitespace-nowrap">
                Expand sidebar
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2 w-2 rotate-45 bg-[#222222] border-l border-b border-white/10" />
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
