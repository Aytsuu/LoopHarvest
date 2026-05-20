'use client';

import * as React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, BarChart2, TrendingUp, Sparkles, Droplet, CloudLightning, Utensils, Building2, Recycle, Globe, type LucideIcon } from 'lucide-react';
import { mockStore } from '@/lib/mockStore';

// Mock charts dataset representing daily carbon offset
const WEEKLY_DATA = [
  { day: 'Mon', kg: 4.2, co2: 2.1, water: 210 },
  { day: 'Tue', kg: 5.8, co2: 2.9, water: 290 },
  { day: 'Wed', kg: 8.5, co2: 4.2, water: 425 },
  { day: 'Thu', kg: 10.1, co2: 5.0, water: 505 },
  { day: 'Fri', kg: 12.4, co2: 6.2, water: 620 },
  { day: 'Sat', kg: 15.0, co2: 7.5, water: 750 },
  { day: 'Sun', kg: 17.4, co2: 8.7, water: 870 },
];

interface SDGCard {
  number: number;
  title: string;
  emoji: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const SDG_GOALS: SDGCard[] = [
  {
    number: 2,
    title: "Zero Hunger",
    emoji: "🍲",
    icon: Utensils,
    color: "#E5A823",
    description: "Routing surplus bakery items and fresh crops to community larders, preventing nutrition loss."
  },
  {
    number: 11,
    title: "Sustainable Cities",
    emoji: "🏙️",
    icon: Building2,
    color: "#F26E22",
    description: "Forming localized organic recycling loops to reduce solid municipal waste entering city landfills."
  },
  {
    number: 12,
    title: "Responsible Consumption",
    emoji: "🔄",
    icon: Recycle,
    color: "#C98F1D",
    description: "Fostering standard circular systems that prioritize material re-utilization over waste generation."
  },
  {
    number: 13,
    title: "Climate Action",
    emoji: "🍀",
    icon: Globe,
    color: "#3F7E44",
    description: "Halting methane emissions by keeping organic matter out of anaerobic, compressed landfill zones."
  }
];

export default function ImpactAnalyticsPage() {
  const [stats] = React.useState(() => mockStore.getUserStats());
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);

  return (
    <main className="flex-1 bg-[#0A0A0A] text-[#E8EAD8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-24 md:pb-8">
        
        {/* Analytics Summary Banner */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-24 w-24 rounded-full bg-[#4ECDC4]/10 blur-2xl pointer-events-none select-none" />

          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1 bg-[#004D48] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-[#4ECDC4] border border-[#4ECDC4]/10">
              <TrendingUp size={11} />
              <span>ESG Validation Verified</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Your Cumulative Offset</h2>
            <p className="text-xs text-[#A8AA98] leading-relaxed max-w-sm">
              Your circular resource contributions save equivalent atmospheric carbon release and virtual water overheads.
            </p>
          </div>

          <div className="text-center bg-[#0A0A0A]/60 px-6 py-4 rounded-2xl border border-white/6 shrink-0">
            <span className="text-[10px] font-bold text-[#A8AA98] uppercase tracking-wider block">Loop Level Score</span>
            <span className="font-mono text-3xl font-black text-[#A8D97F]">{stats.loopPoints} XP</span>
          </div>
        </div>

        {/* 3 Columns Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Scraps Card */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-white/6 flex items-center gap-4 relative overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2A4A10] text-[#A8D97F]">
              <Leaf size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#A8AA98] block uppercase tracking-wider">Scraps Diverted</span>
              <span className="font-mono text-xl font-black text-[#E8EAD8]">{stats.kgDiverted} kg</span>
            </div>
          </div>

          {/* Water Saved Card */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-white/6 flex items-center gap-4 relative overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#004D48] text-[#4ECDC4]">
              <Droplet size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#A8AA98] block uppercase tracking-wider">Water Conserved</span>
              <span className="font-mono text-xl font-black text-[#E8EAD8]">{stats.waterSaved} L</span>
            </div>
          </div>

          {/* CO2 Mitigated Card */}
          <div className="bg-[#141414] p-5 rounded-2xl border border-white/6 flex items-center gap-4 relative overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4A3200] text-[#E8A838]">
              <CloudLightning size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#A8AA98] block uppercase tracking-wider">CO2 Prevented</span>
              <span className="font-mono text-xl font-black text-[#E8EAD8]">{stats.co2Saved} kg</span>
            </div>
          </div>

        </div>

        {/* Recharts Graphical Line Area Chart */}
        <div className="bg-[#141414] p-5 rounded-2xl border border-white/6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-[#A8D97F]" />
              <h3 className="font-display text-base font-bold text-[#E8EAD8]">Resource Routing Progress</h3>
            </div>
            <span className="text-[10px] font-bold text-[#A8AA98] uppercase bg-white/4 px-2 py-1 rounded">Past 7 Days</span>
          </div>

          {/* Recharts wrapper */}
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={WEEKLY_DATA}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A8D97F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A8D97F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" stroke="#5A5C50" tickLine={false} />
                <YAxis stroke="#5A5C50" tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1B1B1B', 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '8px',
                    color: '#E8EAD8',
                    fontFamily: 'DM Mono, monospace'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="kg" 
                  stroke="#A8D97F" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorKg)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* UN SDG Goals Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#A8D97F]" />
              <h3 className="font-display text-base font-bold text-[#E8EAD8]">
                UN Sustainable Development Goals (SDG) Mapping
              </h3>
            </div>
            <p className="text-[11px] text-[#A8AA98] pl-6 sm:pl-0">
              Connecting localized actions to global sustainability standards
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SDG_GOALS.map((sdg) => {
              const isHovered = hoveredCard === sdg.number;
              return (
                <div 
                  key={sdg.number}
                  onMouseEnter={() => setHoveredCard(sdg.number)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ 
                    borderColor: isHovered ? sdg.color : `${sdg.color}25`,
                    backgroundColor: isHovered ? '#1B1B1B' : '#141414',
                    boxShadow: isHovered 
                      ? `0 10px 25px -5px ${sdg.color}1A, 0 8px 10px -6px ${sdg.color}12`
                      : '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
                    transform: isHovered ? 'translateY(-4px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  className="group rounded-2xl border p-5 flex flex-col justify-between min-h-[11rem] cursor-default"
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300"
                      style={{ 
                        color: sdg.color,
                        borderColor: isHovered ? `${sdg.color}50` : `${sdg.color}20`, 
                        backgroundColor: isHovered ? `${sdg.color}20` : `${sdg.color}0D`,
                        boxShadow: isHovered ? `0 0 12px ${sdg.color}30` : 'none'
                      }}
                    >
                      <sdg.icon 
                        size={18} 
                        className="transition-transform duration-500 group-hover:scale-110" 
                        strokeWidth={2.2}
                      />
                    </div>
                    <span 
                      style={{ 
                        color: sdg.color, 
                        borderColor: `${sdg.color}30`, 
                        backgroundColor: `${sdg.color}12` 
                      }}
                      className="font-mono text-[10px] font-bold tracking-wider px-2 py-0.5 border rounded-md uppercase"
                    >
                      Goal {sdg.number}
                    </span>
                  </div>

                  <div className="space-y-1 mt-4">
                    <h4 
                      className="font-display text-sm font-bold transition-colors duration-300"
                      style={{ color: isHovered ? sdg.color : '#E8EAD8' }}
                    >
                      {sdg.title}
                    </h4>
                    <p className="text-[11px] text-[#A8AA98] leading-relaxed line-clamp-3">
                      {sdg.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}
