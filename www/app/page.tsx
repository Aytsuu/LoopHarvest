'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Activity, TrendingUp, Users, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Globe from "@/components/Globe";
import { useCategories } from '@/components/common/CategoriesProvider';

export default function LandingPage() {
  const { categories } = useCategories();
  const router = useRouter();
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categoriesRef = React.useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = categoriesRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  const setCategoriesRef = React.useCallback((node: HTMLDivElement | null) => {
    categoriesRef.current = node;
    if (node) {
      setTimeout(() => {
        const { scrollLeft, scrollWidth, clientWidth } = node;
        setShowLeftArrow(scrollLeft > 2);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 2);
      }, 100);
    }
  }, []);

  const scroll = React.useCallback((direction: "left" | "right") => {
    const el = categoriesRef.current;
    if (!el) return;
    const scrollAmount = 200;
    const target =
      el.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);
    el.scrollTo({
      left: target,
      behavior: "smooth",
    });
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      checkScroll();
    };
    handleResize();
    const timer = setTimeout(() => {
      handleResize();
    }, 100);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [checkScroll, categories]);

  const recentActivities = [
    { text: 'Hannelore S. donated 1.5kg of Daucus Scraps', time: '2m ago', emoji: '🥕' },
    { text: 'Feather & Comb claimed 10kg Brewery Spent Grain', time: '12m ago', emoji: '🐔' },
    { text: 'EcoSanctuary posted request: Citrus Peels (3kg)', time: '24m ago', emoji: '🍊' },
    { text: 'Tartine Bakery donated 4 loaves of stale sourdough', time: '45m ago', emoji: '🥖' },
    { text: "Alice G. fulfilled Bob's Coffee Ground request", time: '1h ago', emoji: '☕' },
    { text: 'Bi-Rite Market saved 3.5kg of Citrus fruit waste', time: '2h ago', emoji: '🍊' },
  ];

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#0A0A0A] text-[#FFFFFF] lg:h-screen lg:flex-row lg:overflow-hidden">
      <section className="flex w-full shrink-0 flex-col border-r border-white/6 bg-[#0A0A0A] lg:h-full lg:w-120 lg:overflow-y-auto xl:w-140 scrollbar-none">
        <div className="flex-1 space-y-12 p-6 sm:p-10 lg:p-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="LoopHarvest" className="h-8 w-8 object-contain" />
              <span className="font-display text-xl font-extrabold tracking-tight text-[#A8D97F] select-none">LoopHarvest</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-[#FFFFFF] md:text-5xl">
              Divert Food Waste.<br />
              <span className="text-[#A8D97F]">Loop the Harvest.</span>
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-[#A3A3A3]">
              LoopHarvest connects local kitchens, cafes, and bakeries with composting programs, farms, and bio-designers. Turn organic scraps into clean compost, animal feed, and renewable resources.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => router.push('/home')}
                className="group flex items-center gap-2 rounded-xl bg-[#A8D97F] px-6 py-3.5 text-sm font-black text-[#1A3A05] shadow-lg transition-transform hover:brightness-105 active:scale-98"
              >
                <span>Launch App</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-6 py-3.5 text-sm font-bold text-[#FFFFFF] transition-all hover:border-white/20 hover:bg-[#1B1B1B] active:scale-98"
              >
                Join Marketplace
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/6 bg-[#141414] p-4">
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#A8D97F] md:text-2xl">17.4k</div>
              <div className="mt-0.5 text-[10px] font-bold text-[#A3A3A3]">kg Diverted</div>
            </div>
            <div className="border-x border-white/6 text-center">
              <div className="font-mono text-xl font-black text-[#E8A838] md:text-2xl">8.7t</div>
              <div className="mt-0.5 text-[10px] font-bold text-[#A3A3A3]">CO2 Saved</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#4ECDC4] md:text-2xl">240+</div>
              <div className="mt-0.5 text-[10px] font-bold text-[#A3A3A3]">Loop Nodes</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-[#FFFFFF]">How LoopHarvest Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2A4A10] font-mono text-sm font-black text-[#A8D97F]">1</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">Post Organic Scraps</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">Donors list vegetable pulp, spent sourdough, or coffee grounds with weight metrics and photo tags.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#004D48] font-mono text-sm font-black text-[#4ECDC4]">2</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">Claim and Coordinate</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">Growers, composters, and animal farms browse items on our real-time map and claim compatible feeds.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4A3200] font-mono text-sm font-black text-[#E8A838]">3</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">Harvest Impact Points</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">Verify handoffs to unlock stats, rank on leaderboard scores, and earn validated carbon mitigation points.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">Tracked Materials</h3>
            <div className="relative group/categories">
              {/* Left Fading Edge & Chevron */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 flex items-center pl-1 transition-opacity duration-300 pointer-events-none ${
                  showLeftArrow ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={() => scroll("left")}
                  className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#2A4A10]/95 hover:border-[#A8D97F]/40 shadow-md backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#A8D97F] cursor-pointer"
                  aria-label="Previous Materials"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>

              {/* Scrolling Categories List */}
              <div
                ref={setCategoriesRef}
                onScroll={checkScroll}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
              >
                {categories.map((cat) => (
                  <div
                    key={cat.slug}
                    style={{ borderColor: `${cat.color}2F`, backgroundColor: `${cat.color}0D`, color: cat.color }}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold"
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </div>
                ))}
              </div>

              {/* Right Fading Edge & Chevron */}
              <div
                className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 flex items-center justify-end pr-1 transition-opacity duration-300 pointer-events-none ${
                  showRightArrow ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={() => scroll("right")}
                  className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#141414]/90 text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#2A4A10]/95 hover:border-[#A8D97F]/40 shadow-md backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#A8D97F] cursor-pointer"
                  aria-label="Next Materials"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#A8D97F]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">Live Activity Feed</h3>
            </div>

            <div className="relative h-36 overflow-hidden rounded-xl border border-white/6 bg-[#141414]/50 p-4">
              <div className="animate-ticker space-y-2.5">
                {recentActivities.concat(recentActivities).map((act, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-sm">{act.emoji}</span>
                    <span className="flex-1 truncate font-medium text-[#FFFFFF]">{act.text}</span>
                    <span className="shrink-0 rounded bg-white/4 px-1.5 py-0.5 font-mono text-[10px] text-[#A3A3A3]">{act.time}</span>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-linear-to-b from-[#141414]/90 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-linear-to-t from-[#141414]/90 to-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/6 pb-4 pt-8 text-xs text-[#A3A3A3]">
            <div className="flex items-start gap-2">
              <ShieldCheck size={16} className="mt-0.5 text-[#A8D97F]" />
              <div>
                <span className="block font-bold text-[#FFFFFF]">Verified Traceability</span>
                Handoff logging preserves full accountability.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp size={16} className="mt-0.5 text-[#E8A838]" />
              <div>
                <span className="block font-bold text-[#FFFFFF]">Regenerative Analytics</span>
                Measure CO2, water, and diversion stats in real time.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative hidden flex-1 bg-black lg:block lg:h-full lg:overflow-hidden">
        {isLargeScreen && <Globe />}
        <div className="absolute bottom-8 left-8 z-10 max-w-sm rounded-2xl border border-white/10 bg-[#0A0A0A]/80 p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#A8D97F]">
            <Users size={14} />
            <span>Interactive 3D Network Map</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold text-[#FFFFFF]">Connecting global communities</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">
            Click on the floating avatars above to view real-time organic listings, compost needs, and active loop trades happening in SF, London, Tokyo, and Sydney.
          </p>
        </div>
      </section>
    </main>
  );
}
