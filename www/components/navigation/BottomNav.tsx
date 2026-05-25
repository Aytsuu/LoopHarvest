'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Plus, BarChart2, Settings } from 'lucide-react';

interface BottomNavProps {
  onPostClick: () => void;
}

export default function BottomNav({ onPostClick }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, route: '/home' },
    { label: 'Browse', icon: Search, route: '/browse' },
    { label: 'Post', icon: Plus, action: onPostClick },
    { label: 'Impact', icon: BarChart2, route: '/impact' },
    { label: 'Settings', icon: Settings, route: '/settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-20 w-full items-center justify-around border-t border-white/6 bg-[#141414] px-2 pb-safe text-[#A3A3A3] md:hidden">
      {navItems.map((item, index) => {
        const isActive = item.route ? pathname === item.route : false;
        
        if (item.action) {
          return (
            <button
              key={index}
              onClick={item.action}
              className="flex flex-col items-center justify-center gap-1 w-16 cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A8D97F] text-[#1A3A05] shadow-lg transition-transform hover:scale-105 active:scale-95">
                <Plus size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">Post</span>
            </button>
          );
        }

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
