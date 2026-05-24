'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, ShieldCheck, Recycle, Sprout, Coffee, Apple, Wheat, Utensils, Leaf, Play, Video } from 'lucide-react';
import { useCategories } from '@/components/common/CategoriesProvider';

function getCategoryIcon(slug: string) {
  switch (slug) {
    case 'food-scraps':
      return <Recycle size={32} strokeWidth={1.5} />;
    case 'vegetable-scraps':
      return <Sprout size={32} strokeWidth={1.5} />;
    case 'coffee-grounds':
      return <Coffee size={32} strokeWidth={1.5} />;
    case 'fruit-waste':
      return <Apple size={32} strokeWidth={1.5} />;
    case 'spent-grain':
      return <Wheat size={32} strokeWidth={1.5} />;
    case 'surplus-meals':
      return <Utensils size={32} strokeWidth={1.5} />;
    default:
      return <Leaf size={32} strokeWidth={1.5} />;
  }
}

export default function LandingPage() {
  const { categories } = useCategories();
  const router = useRouter();
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0A0A0A] text-[#FFFFFF] relative overflow-hidden">
      {/* Decorative premium radial glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#A8D97F]/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#E8A838]/5 blur-[120px] pointer-events-none" />

      {/* SECTION 1: Brand to Stats */}
      <section className="relative w-full flex flex-col items-center py-12 sm:py-16 md:py-20 z-10 border-b border-white/5">
        <div className="absolute inset-0 bg-radial-gradient from-[#A8D97F]/2 to-transparent pointer-events-none" />
        <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl px-6 space-y-12">
          {/* Brand & Hero Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="LoopHarvest" className="h-8 w-8 object-contain" />
              <span className="font-display text-xl font-extrabold tracking-tight text-[#A8D97F] select-none">LoopHarvest</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-[#FFFFFF] md:text-5xl lg:text-6xl">
              Divert Food Waste.<br />
              <span className="text-[#A8D97F]">Loop the Harvest.</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#A3A3A3] md:text-base">
              LoopHarvest connects local kitchens, cafes, and bakeries with composting programs, farms, and bio-designers. Turn organic scraps into clean compost, animal feed, and renewable resources.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => router.push('/home')}
                className="group flex items-center gap-2 rounded-xl bg-[#A8D97F] px-6 py-3.5 text-sm font-black text-[#1A3A05] shadow-lg transition-transform hover:brightness-105 active:scale-98 cursor-pointer"
              >
                <span>Launch App</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-6 py-3.5 text-sm font-bold text-[#FFFFFF] transition-all hover:border-white/20 hover:bg-[#1B1B1B] active:scale-98 cursor-pointer"
              >
                Join Marketplace
              </button>
            </div>
          </div>

          {/* Realtime Stats Container */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/6 bg-[#141414]/90 p-5 shadow-lg backdrop-blur-md">
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#A8D97F] md:text-2xl lg:text-3xl">17.4k</div>
              <div className="mt-0.5 text-[10px] font-bold text-[#A3A3A3]">kg Diverted</div>
            </div>
            <div className="border-x border-white/6 text-center">
              <div className="font-mono text-xl font-black text-[#E8A838] md:text-2xl lg:text-3xl">8.7t</div>
              <div className="mt-0.5 text-[10px] font-bold text-[#A3A3A3]">CO2 Saved</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#4ECDC4] md:text-2xl lg:text-3xl">240+</div>
              <div className="mt-0.5 text-[10px] font-bold text-[#A3A3A3]">Loop Nodes</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: How It Works to Trust Indicators */}
      <section className="relative w-full flex flex-col items-center py-16 sm:py-20 md:py-24 bg-[#0E0E0E]/40 border-b border-white/5 z-10">
        <div className="absolute inset-0 bg-radial-gradient from-[#E8A838]/2 to-transparent pointer-events-none" />
        <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl px-6 space-y-16">
          {/* How LoopHarvest Works */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-[#FFFFFF] md:text-2xl">How LoopHarvest Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-[#141414]/30 p-5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2A4A10] font-mono text-sm font-black text-[#A8D97F]">1</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">Post Organic Scraps</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">Donors list vegetable pulp, spent sourdough, or coffee grounds with weight metrics and photo tags.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-[#141414]/30 p-5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#004D48] font-mono text-sm font-black text-[#4ECDC4]">2</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">Claim and Coordinate</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">Growers, composters, and animal farms browse items on our real-time map and claim compatible feeds.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-[#141414]/30 p-5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4A3200] font-mono text-sm font-black text-[#E8A838]">3</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">Harvest Impact Points</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">Verify handoffs to unlock stats, rank on leaderboard scores, and earn validated carbon mitigation points.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracked Materials Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">Tracked Materials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  style={{
                    background: 'radial-gradient(130% 130% at 50% 0%, rgba(255, 255, 255, 0.02) 0%, rgba(14, 14, 14, 0.4) 100%)',
                    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
                  }}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#141414]/30 p-6 aspect-square transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-white/15 cursor-pointer overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                >
                  {/* Subtle neutral hover background glow */}
                  <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Low opacity material icon */}
                  <div className="text-white/15 group-hover:text-white/40 transition-all duration-300 mb-4 group-hover:scale-110">
                    {getCategoryIcon(cat.slug)}
                  </div>

                  {/* Text labels & Compact ecological metrics centered */}
                  <div className="w-full text-center space-y-3 z-10">
                    <span className="block text-sm font-extrabold tracking-tight text-white group-hover:text-white transition-colors duration-200">
                      {cat.label}
                    </span>
                    
                    <div className="flex flex-col items-center justify-center gap-1 transition-opacity duration-200 border-t border-white/10 pt-3 max-w-[150px] mx-auto">
                      {cat.co2FactorPerKg !== null && (
                        <span className="text-xs font-mono font-medium text-[#D4D4D4] tracking-tight">
                          {cat.co2FactorPerKg} kg CO₂ / kg
                        </span>
                      )}
                      {cat.waterSavedLitersPerKg !== null && (
                        <span className="text-xs font-mono font-medium text-[#D4D4D4] tracking-tight">
                          {cat.waterSavedLitersPerKg}L H₂O / kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Tour Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-[#A8D97F]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A3A3A3]">Platform Tour</h3>
            </div>

            <div
              style={{
                background: 'radial-gradient(110% 110% at 50% 50%, rgba(255, 255, 255, 0.01) 0%, rgba(10, 10, 10, 0.6) 100%)',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
              }}
              className="group/video relative w-full aspect-video rounded-2xl border border-white/5 bg-[#141414]/30 overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center"
            >
              {/* Animated abstract grid pattern backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40 group-hover/video:opacity-60 transition-opacity duration-300" />

              {/* Decorative radial glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-[#A8D97F]/5 blur-[60px] pointer-events-none group-hover/video:bg-[#A8D97F]/8 transition-colors duration-300" />

              {/* Large premium glassmorphic play button */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-all duration-300 group-hover/video:scale-110 group-hover/video:bg-white/10 group-hover/video:border-white/25 group-hover/video:shadow-[0_0_30px_rgba(168,217,127,0.15)] z-10">
                <Play size={20} className="fill-white translate-x-[1px]" />
              </div>

              {/* Tour metadata overlay */}
              <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-0.5 pointer-events-none">
                <span className="text-xs font-bold text-white/60 group-hover/video:text-white/90 transition-colors duration-200">
                  LoopHarvest: Bridging the Food Scraps Loop
                </span>
                <span className="text-[10px] font-medium text-[#A3A3A3] group-hover/video:text-[#D4D4D4] transition-colors duration-200">
                  Watch a 2-minute walkthrough of our decentralized marketplace
                </span>
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-4 right-4 z-10 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-mono font-bold text-[#D4D4D4] tracking-wider border border-white/5">
                2:14
              </div>

              {/* Top gradient shadow */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover/video:opacity-80 transition-opacity duration-300" />
            </div>
          </div>

          {/* Trust and traceability (Site Reliability) Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#A3A3A3]">
            <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-[#141414]/20 p-5 shadow-sm">
              <ShieldCheck size={18} className="mt-0.5 text-[#A8D97F] shrink-0" />
              <div>
                <span className="block font-bold text-[#FFFFFF] mb-1">Verified Traceability</span>
                Handoff logging preserves full accountability. Fully encrypted cryptographic validation checks ensure supply chain transparency.
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-[#141414]/20 p-5 shadow-sm">
              <TrendingUp size={18} className="mt-0.5 text-[#E8A838] shrink-0" />
              <div>
                <span className="block font-bold text-[#FFFFFF] mb-1">Regenerative Analytics</span>
                Measure CO2, water, and diversion stats in real time. Dynamic calculations updated transparently on local networks.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Branded Footer */}
      <footer className="w-full flex flex-col items-center py-12 md:py-16 bg-[#070707] z-10 text-xs text-[#A3A3A3]">
        <div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl px-6 flex flex-col space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-8">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="LoopHarvest" className="h-6 w-6 object-contain" />
              <span className="font-display text-sm font-extrabold tracking-tight text-[#A8D97F] select-none">LoopHarvest</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <a href="/about" className="hover:text-[#FFFFFF] transition-colors">About</a>
              <a href="/community" className="hover:text-[#FFFFFF] transition-colors">Community</a>
              <a href="/terms" className="hover:text-[#FFFFFF] transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-[#FFFFFF] transition-colors">Privacy Policy</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
            <span>&copy; {new Date().getFullYear()} LoopHarvest. All rights reserved.</span>
            <span className="text-[#525252]">Empowering circular food systems locally.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
