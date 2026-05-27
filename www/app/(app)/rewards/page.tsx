'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Gift, 
  Award, 
  Zap, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Copy, 
  ChevronRight, 
  QrCode, 
  Calendar, 
  Flame, 
  Scale, 
  Droplet, 
  ShoppingBag, 
  Ticket, 
  Palette, 
  X, 
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { toUserStats } from '@/lib/api/mappers';
import type { UserStats } from '@/lib/api/types';

// Types for Reward Items
interface RewardItem {
  id: string;
  title: string;
  description: string;
  category: 'eco_gear' | 'local_voucher' | 'digital_cosmetic';
  pointsCost: number;
  stockLeft: number;
  maxStock: number;
  icon: string;
  color: string;
  ecoImpact: string;
}

// Types for Claimed Vouchers
interface ClaimedReward {
  claimId: string;
  rewardId: string;
  title: string;
  category: string;
  claimedAt: string;
  couponCode: string;
  qrCodeValue: string;
  status: 'active' | 'used' | 'expired';
}

const REWARDS_DATA: RewardItem[] = [
  {
    id: 'flask_01',
    title: 'LoopHarvest Stainless Flask',
    description: 'Keep hydrated with this dual-walled insulated vacuum bottle. 100% plastic-free, powder-coated matte finish.',
    category: 'eco_gear',
    pointsCost: 450,
    stockLeft: 12,
    maxStock: 50,
    icon: '🧉',
    color: '#A8D97F', // Brand green
    ecoImpact: 'Saves ~150 single-use plastic bottles per year.'
  },
  {
    id: 'compost_01',
    title: 'Advanced Odor-Free Compost Bin',
    description: 'Carbon-filtered countertop container for stylish, odor-free collection of vegetable scraps right in your kitchen.',
    category: 'eco_gear',
    pointsCost: 1200,
    stockLeft: 5,
    maxStock: 20,
    icon: '🪵',
    color: '#E8A838', // Warm Amber
    ecoImpact: 'Makes routing kitchen scraps to community heaps seamless.'
  },
  {
    id: 'csa_box_01',
    title: 'CSA Organic Veggie Box',
    description: 'One full week of fresh, seasonal harvest sourced directly from our neighborhood organic agricultural partners.',
    category: 'local_voucher',
    pointsCost: 600,
    stockLeft: 18,
    maxStock: 40,
    icon: '🥕',
    color: '#4ECDC4', // Teal
    ecoImpact: 'Supports localized organic cycles and lowers transport emissions.'
  },
  {
    id: 'bakery_01',
    title: 'Wood-Fired Sourdough Voucher',
    description: '$10 off coupon at any participating local bakery. Handcrafted with organic flour and stone-ground grains.',
    category: 'local_voucher',
    pointsCost: 250,
    stockLeft: 24,
    maxStock: 100,
    icon: '🥖',
    color: '#E57A5A', // Rust orange
    ecoImpact: 'Drives compost-supporting bakery initiatives.'
  },
  {
    id: 'border_01',
    title: 'Forest Aura Avatar Border',
    description: 'Animate your profile avatar card with a slowly breathing evergreen aura that glows on all feeds and boards.',
    category: 'digital_cosmetic',
    pointsCost: 150,
    stockLeft: 99,
    maxStock: 99,
    icon: '💫',
    color: '#A8D97F',
    ecoImpact: 'Digital recognition for high-tier planetary stewards.'
  },
  {
    id: 'title_01',
    title: 'Shimmering "Eco-Warrior" Title',
    description: 'Unlock a shimmering golden status title next to your name on all marketplace requests, listings, and chats.',
    category: 'digital_cosmetic',
    pointsCost: 300,
    stockLeft: 99,
    maxStock: 99,
    icon: '🏆',
    color: '#E8A838',
    ecoImpact: 'Celebrate your dedication and inspire the community.'
  }
];

export default function RewardsStorePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<'store' | 'wallet'>('store');
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | 'eco_gear' | 'local_voucher' | 'digital_cosmetic'>('all');
  
  // Local state to track faucet, check-ins, and claimed vouchers
  const [bonusPoints, setBonusPoints] = React.useState<number>(0);
  const [claimedRewards, setClaimedRewards] = React.useState<ClaimedReward[]>([]);
  const [lastCheckInDate, setLastCheckInDate] = React.useState<string | null>(null);
  
  // Confetti/Animation states
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [confettiMessage, setConfettiMessage] = React.useState('');
  
  // Bottom Sheet/Confirmation Drawer State
  const [confirmingItem, setConfirmingItem] = React.useState<RewardItem | null>(null);
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = React.useState(false);
  const [generatedCoupon, setGeneratedCoupon] = React.useState<string | null>(null);

  // Fetch actual live user points
  const { data: impactSummary } = useQuery({
    queryKey: ['impact'],
    queryFn: apiClient.getImpactSummary,
  });

  const basePoints = React.useMemo(() => {
    if (!impactSummary) return 0;
    return toUserStats(impactSummary).loopPoints;
  }, [impactSummary]);

  // Combined real points + local bonus faucet points minus spent points
  const totalPoints = React.useMemo(() => {
    return basePoints + bonusPoints;
  }, [basePoints, bonusPoints]);

  // Load local state on mount
  React.useEffect(() => {
    try {
      const storedBonus = localStorage.getItem('lh_rewards_bonus_points');
      if (storedBonus !== null) {
        setBonusPoints(parseInt(storedBonus, 10));
      }

      const storedClaimed = localStorage.getItem('lh_rewards_claimed');
      if (storedClaimed !== null) {
        setClaimedRewards(JSON.parse(storedClaimed));
      }

      const storedCheckIn = localStorage.getItem('lh_rewards_last_checkin');
      if (storedCheckIn !== null) {
        setLastCheckInDate(storedCheckIn);
      }
    } catch (e) {
      console.error('Failed to load rewards storage:', e);
    }
  }, []);

  // Sync point updates helper
  const updateBonusPoints = (newBonus: number) => {
    setBonusPoints(newBonus);
    try {
      localStorage.setItem('lh_rewards_bonus_points', String(newBonus));
    } catch (e) {
      console.warn('Storage saving error:', e);
    }
  };

  // Toast notifier helper
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: { message, type }
      })
    );
  };

  // Claim Daily Check-in Bonus
  const handleDailyCheckIn = () => {
    const today = new Date().toDateString();
    if (lastCheckInDate === today) {
      triggerToast('You have already claimed today\'s bonus! Return tomorrow.', 'warning');
      return;
    }

    const rewardXP = 150;
    const nextBonus = bonusPoints + rewardXP;
    updateBonusPoints(nextBonus);
    setLastCheckInDate(today);
    try {
      localStorage.setItem('lh_rewards_last_checkin', today);
    } catch {}

    setConfettiMessage(`Daily Check-in Complete!\n+150 XP claimed! 🌿`);
    setShowConfetti(true);
    triggerToast('Streak updated! +150 XP added to your balance.', 'success');
    
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
  };

  // Claim Faucet for testing
  const handlePointsFaucet = () => {
    const nextBonus = bonusPoints + 500;
    updateBonusPoints(nextBonus);
    triggerToast('Developer Mode Faucet active! +500 XP granted.', 'success');
  };

  // Reset demo
  const handleResetDemo = () => {
    if (confirm('Are you sure you want to reset your rewards profile, point additions, and claims history for this prototype?')) {
      setBonusPoints(0);
      setClaimedRewards([]);
      setLastCheckInDate(null);
      try {
        localStorage.removeItem('lh_rewards_bonus_points');
        localStorage.removeItem('lh_rewards_claimed');
        localStorage.removeItem('lh_rewards_last_checkin');
      } catch {}
      triggerToast('Prototype data reset to initial state.', 'info');
    }
  };

  // Initiate redemption confirmation drawer
  const initiateRedeem = (item: RewardItem) => {
    if (totalPoints < item.pointsCost) {
      triggerToast(`Inadequate balance. You need ${item.pointsCost - totalPoints} more XP for this reward.`, 'error');
      return;
    }
    setConfirmingItem(item);
    setRedemptionSuccess(false);
    setGeneratedCoupon(null);
  };

  // Confirm redemption process (with simulation of sliding action / click action)
  const confirmRedemption = () => {
    if (!confirmingItem) return;
    
    setIsRedeeming(true);
    
    setTimeout(() => {
      // Create claimed item
      const code = `LH-${confirmingItem.category.toUpperCase().slice(0, 3)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const newClaim: ClaimedReward = {
        claimId: `claim_${Date.now()}`,
        rewardId: confirmingItem.id,
        title: confirmingItem.title,
        category: confirmingItem.category,
        claimedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        couponCode: code,
        qrCodeValue: `https://loopharvest.org/redeem/${code}`,
        status: 'active'
      };

      const updatedClaims = [newClaim, ...claimedRewards];
      setClaimedRewards(updatedClaims);
      try {
        localStorage.setItem('lh_rewards_claimed', JSON.stringify(updatedClaims));
      } catch {}

      // Deduct points
      const nextBonus = bonusPoints - confirmingItem.pointsCost;
      updateBonusPoints(nextBonus);

      setIsRedeeming(false);
      setRedemptionSuccess(true);
      setGeneratedCoupon(code);
      triggerToast(`Claimed! ${confirmingItem.title} added to your wallet.`, 'success');
    }, 1200);
  };

  // Copy code helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('Coupon code copied to clipboard!', 'success');
  };

  // Filter rewards
  const filteredRewards = REWARDS_DATA.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <main className="min-h-screen flex-1 bg-[#0A0A0A] text-[#FFFFFF] font-sans antialiased relative">
      
      {/* Visual Confetti / Success Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative p-8 rounded-3xl bg-[#141414] border border-[#A8D97F]/30 text-center max-w-sm mx-4 shadow-[0_0_50px_rgba(168,217,127,0.15)] animate-scale-in">
            {/* Animated particles background styling in CSS */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-2.5 h-2.5 rounded-full bg-[#A8D97F] animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.7 + 0.3,
                    animationDuration: `${Math.random() * 2 + 1}s`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2A4A10]/50 border border-[#A8D97F] text-[#A8D97F] text-4xl animate-bounce">
                🌱
              </div>
              <h3 className="font-display text-2xl font-black text-[#FFFFFF] tracking-tight">Magnificent!</h3>
              <p className="text-sm text-[#A3A3A3] whitespace-pre-line leading-relaxed font-semibold">
                {confettiMessage}
              </p>
              <button 
                onClick={() => setShowConfetti(false)}
                className="mt-2 w-full rounded-2xl bg-[#A8D97F] py-3 text-xs font-bold text-[#1A3A05] hover:bg-[#B8E890] transition cursor-pointer"
              >
                Let's Keep Planting
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 pb-24 md:pb-8">
        
        {/* Banner/Header Block */}
        <div className="relative overflow-hidden rounded-3xl border border-white/6 bg-[#141414] p-6 shadow-xl">
          <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-[#A8D97F]/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-24 w-24 translate-y-12 rounded-full bg-[#4ECDC4]/5 blur-2xl" />
          
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#A8D97F]/10 bg-[#2A4A10]/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#A8D97F]">
                <Sparkles size={11} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>Environmental Wellness Hub</span>
              </div>
              <h1 className="font-display text-3xl font-black tracking-tight leading-none">
                Circular Rewards Store
              </h1>
              <p className="max-w-md text-xs text-[#A3A3A3] leading-relaxed">
                Earn Loop Points by rescuing scraps, listings composting materials, and sharing organic value. Turn your community impact into tangible green items and local vouchers!
              </p>
            </div>

            {/* Point Balance Card */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#A8D97F]/20 bg-[#1A2C0A]/40 px-6 py-5 md:w-64 shadow-[0_8px_24px_rgba(42,74,16,0.2)]">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#A8D97F]/10 blur-xl" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A8D97F]">Available Balance</span>
                <span className="rounded-full bg-[#2A4A10] px-2 py-0.5 text-[8px] font-bold uppercase text-[#C4F09A]">
                  LVL {Math.floor(totalPoints / 100) + 1}
                </span>
              </div>
              
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-black tracking-tight text-[#FFFFFF] animate-pulse">
                  {totalPoints}
                </span>
                <span className="font-display text-sm font-extrabold text-[#A8D97F] uppercase tracking-wider">XP</span>
              </div>

              {/* Progress to next level */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-semibold text-[#A3A3A3] font-mono">
                  <span>Progress to Level {Math.floor(totalPoints / 100) + 2}</span>
                  <span>{totalPoints % 100}/100 XP</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#A8D97F] to-[#4ECDC4] transition-all duration-500 ease-out"
                    style={{ width: `${totalPoints % 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Action Controls (Daily Bonus & Faucet) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Daily Streak Check-in */}
          <div className="group relative flex items-center justify-between rounded-2xl border border-white/6 bg-[#141414] p-4 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A4A10]/30 text-[#A8D97F] group-hover:scale-110 transition-transform">
                <Calendar size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FFFFFF]">Daily Streak Reward</h4>
                <p className="text-[10px] text-[#A3A3A3]">Claim your +150 XP check-in bonus</p>
              </div>
            </div>
            
            <button
              onClick={handleDailyCheckIn}
              disabled={lastCheckInDate === new Date().toDateString()}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                lastCheckInDate === new Date().toDateString()
                  ? 'bg-white/5 text-[#525252] border border-white/5 cursor-not-allowed'
                  : 'bg-[#A8D97F] text-[#1A3A05] hover:bg-[#B8E890] shadow-md hover:shadow-[#A8D97F]/10 shadow-black/25 active:scale-95'
              }`}
            >
              {lastCheckInDate === new Date().toDateString() ? 'Claimed' : 'Check In'}
            </button>
          </div>

          {/* Prototype Controller (Faucet & Reset) */}
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#141414] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/4 text-[#A3A3A3]">
                <Zap size={20} className="text-[#E8A838]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#FFFFFF]">Sandbox Controller</h4>
                <p className="text-[10px] text-[#A3A3A3]">Add demo points or reset state</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handlePointsFaucet}
                className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 text-xs font-bold text-[#FFFFFF] px-3 py-2 cursor-pointer transition active:scale-95"
                title="Grant +500 XP"
              >
                <span>Faucet (+500)</span>
              </button>
              <button
                onClick={handleResetDemo}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/8 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs text-[#A3A3A3] cursor-pointer transition active:scale-95"
                title="Reset Prototype Data"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab System */}
        <div className="border-b border-white/6 flex items-center justify-between pb-0.5">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('store')}
              className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer relative ${
                activeTab === 'store'
                  ? 'border-[#A8D97F] text-[#A8D97F]'
                  : 'border-transparent text-[#A3A3A3] hover:text-[#FFFFFF]'
              }`}
            >
              Rewards Store
              {activeTab === 'store' && (
                <span className="absolute -top-1 -right-2 flex h-2 w-2 rounded-full bg-[#4ECDC4]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer relative flex items-center gap-1.5 ${
                activeTab === 'wallet'
                  ? 'border-[#A8D97F] text-[#A8D97F]'
                  : 'border-transparent text-[#A3A3A3] hover:text-[#FFFFFF]'
              }`}
            >
              <span>My Wallet</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold font-mono text-[#FFFFFF]">
                {claimedRewards.length}
              </span>
            </button>
          </div>

          <div className="text-[10px] text-[#A3A3A3] font-bold flex items-center gap-1">
            <Info size={12} className="text-[#4ECDC4]" />
            <span>Prototype Mode active</span>
          </div>
        </div>

        {/* STOREFRONT VIEW */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Rewards', icon: <Gift size={12} /> },
                { id: 'eco_gear', label: 'Eco-Gear', icon: <ShoppingBag size={12} /> },
                { id: 'local_voucher', label: 'Local Vouchers', icon: <Ticket size={12} /> },
                { id: 'digital_cosmetic', label: 'Digital Cosmetics', icon: <Palette size={12} /> }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-[#2A4A10] text-[#A8D97F] border-[#A8D97F]/30'
                      : 'bg-[#141414] text-[#A3A3A3] border-white/6 hover:text-[#FFFFFF] hover:bg-white/4'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredRewards.map(item => {
                const isAffordable = totalPoints >= item.pointsCost;
                const stockPercent = (item.stockLeft / item.maxStock) * 100;
                
                return (
                  <div 
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-white/6 bg-[#141414] p-5 hover:border-white/10 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Corner gradient glow */}
                    <div 
                      className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-xl"
                      style={{ backgroundColor: item.color }}
                    />

                    <div className="space-y-3">
                      {/* Badge / Category Header */}
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white/5 border border-white/8 px-2.5 py-0.5 text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-xs font-black text-[#A3A3A3]">
                          {item.stockLeft} in stock
                        </span>
                      </div>

                      {/* Header Title with Custom Icon */}
                      <div className="flex items-start gap-3">
                        <span className="text-3xl p-2.5 bg-white/4 rounded-2xl border border-white/6 group-hover:scale-110 transition-transform duration-300 select-none">
                          {item.icon}
                        </span>
                        <div>
                          <h3 className="font-display text-sm font-extrabold text-[#FFFFFF] leading-tight tracking-tight">
                            {item.title}
                          </h3>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span 
                              className="font-mono text-base font-black tracking-tight"
                              style={{ color: isAffordable ? '#A8D97F' : '#E8A838' }}
                            >
                              {item.pointsCost}
                            </span>
                            <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">XP</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      {/* Eco Impact Indicator */}
                      <div className="flex items-center gap-1.5 rounded-xl bg-white/4 p-2 text-[10px] font-semibold text-[#FFFFFF] border border-white/4">
                        <Sparkles size={11} className="text-[#A8D97F] shrink-0" />
                        <span className="line-clamp-1">{item.ecoImpact}</span>
                      </div>
                    </div>

                    {/* Stock Bar & Button */}
                    <div className="mt-5 space-y-3 pt-3 border-t border-white/4">
                      {/* Custom Stock progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-[#A3A3A3] uppercase font-mono">
                          <span>Stock Integrity</span>
                          <span>{item.stockLeft}/{item.maxStock} Left</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-white/5">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${stockPercent}%`,
                              backgroundColor: stockPercent < 30 ? '#E05656' : '#A8D97F'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => initiateRedeem(item)}
                        className={`w-full flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black transition-all cursor-pointer ${
                          isAffordable
                            ? 'bg-[#A8D97F] text-[#1A3A05] hover:bg-[#B8E890] shadow-md shadow-black/20 active:scale-[0.98]'
                            : 'bg-white/5 border border-white/5 text-[#525252] cursor-not-allowed hover:bg-white/5'
                        }`}
                      >
                        {isAffordable ? (
                          <>
                            <span>Redeem Reward</span>
                            <ArrowRight size={13} strokeWidth={2.5} />
                          </>
                        ) : (
                          <span>Needs {item.pointsCost - totalPoints} XP More</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MY WALLET VIEW */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {claimedRewards.length === 0 ? (
              <div className="text-center rounded-3xl border border-dashed border-white/6 bg-[#141414]/40 p-12 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/4 text-white/20">
                  <Ticket size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-[#FFFFFF]">Your Wallet is Empty</h3>
                  <p className="max-w-xs mx-auto text-xs text-[#A3A3A3] leading-relaxed">
                    Divert materials and contribute to the community to earn points, then redeem them for vouchers here!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('store')}
                  className="rounded-2xl border border-[#A8D97F]/10 bg-[#2A4A10]/30 px-5 py-2.5 text-xs font-bold text-[#A8D97F] hover:bg-[#A8D97F] hover:text-[#1A3A05] transition cursor-pointer"
                >
                  Browse Rewards
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#A3A3A3] uppercase tracking-widest pl-1">
                  Active Claims & Vouchers ({claimedRewards.length})
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {claimedRewards.map(claim => {
                    const originalReward = REWARDS_DATA.find(r => r.id === claim.rewardId);
                    
                    return (
                      <div 
                        key={claim.claimId}
                        className="relative overflow-hidden rounded-3xl border border-white/6 bg-[#141414] p-5 hover:border-white/10 transition-all duration-300"
                      >
                        {/* Decorative Ticket Dot notches on left and right */}
                        <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0A0A0A] border-r border-white/6" />
                        <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0A0A0A] border-l border-white/6" />

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between px-2">
                          <div className="flex items-start gap-4">
                            <span className="text-4xl p-3 bg-white/4 rounded-2xl border border-white/6 select-none shrink-0">
                              {originalReward?.icon || '🎫'}
                            </span>
                            <div className="space-y-1">
                              <span className="rounded-full bg-[#2A4A10]/30 px-2 py-0.5 text-[8px] font-black uppercase text-[#A8D97F]">
                                {claim.category.replace('_', ' ')}
                              </span>
                              <h3 className="font-display text-sm font-extrabold text-[#FFFFFF] tracking-tight">
                                {claim.title}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3]">
                                <Clock size={11} className="text-[#4ECDC4]" />
                                <span>Claimed on {claim.claimedAt}</span>
                              </div>
                            </div>
                          </div>

                          {/* Code Display & QR visualizer */}
                          <div className="flex flex-wrap items-center gap-4 sm:border-l border-white/5 sm:pl-6">
                            <div className="space-y-1.5">
                              <span className="block text-[8px] font-bold uppercase tracking-widest text-[#A3A3A3]">Redemption Code</span>
                              
                              <div className="flex items-center gap-1 bg-[#0A0A0A]/50 border border-white/6 rounded-xl px-3 py-2 font-mono text-xs font-black">
                                <span className="text-[#A8D97F] select-all">{claim.couponCode}</span>
                                <button
                                  onClick={() => copyToClipboard(claim.couponCode)}
                                  className="text-[#A3A3A3] hover:text-[#FFFFFF] p-1 rounded transition cursor-pointer"
                                  title="Copy Code"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Custom mockup QR code */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 text-black border border-white/10" title="Scan QR Code">
                              <QrCode size={40} strokeWidth={1.5} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* M3 STYLE CONFIRMATION BOTTOM SHEET SLIDE-UP */}
      {confirmingItem && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={() => {
            if (!isRedeeming) setConfirmingItem(null);
          }}
        >
          <div 
            className="relative w-full max-w-lg rounded-t-[2.5rem] bg-[#141414] p-6 pb-12 border-t border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] cursor-default animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-white/20" />

            {/* Header / Dismiss */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Gift className="text-[#A8D97F]" size={20} />
                <h3 className="font-display text-xl font-bold text-[#FFFFFF]">Redemption Invoice</h3>
              </div>
              {!isRedeeming && (
                <button
                  onClick={() => setConfirmingItem(null)}
                  className="rounded-full p-2 text-[#A3A3A3] hover:bg-white/5 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* SUCCESS STATE */}
            {redemptionSuccess ? (
              <div className="space-y-6 text-center py-6 animate-scale-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2A4A10]/50 border border-[#A8D97F]/40 text-[#A8D97F] animate-bounce">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-lg font-black text-[#FFFFFF]">Transaction Authorized!</h4>
                  <p className="max-w-xs mx-auto text-xs text-[#A3A3A3] leading-relaxed">
                    Successfully acquired <strong>{confirmingItem.title}</strong>. Your coupon has been compiled and saved to your wallet.
                  </p>
                </div>

                {/* Voucher display */}
                <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 p-4 max-w-sm mx-auto flex items-center justify-between gap-4">
                  <div className="text-left font-mono">
                    <span className="block text-[8px] font-bold text-[#A3A3A3] uppercase tracking-widest">Your Code</span>
                    <span className="text-sm font-black text-[#A8D97F] tracking-wide">{generatedCoupon}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(generatedCoupon || '')}
                      className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-white/10 transition cursor-pointer"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setConfirmingItem(null);
                        setActiveTab('wallet');
                      }}
                      className="rounded-xl bg-[#A8D97F] px-4 py-2 text-xs font-black text-[#1A3A05] hover:bg-[#B8E890] transition cursor-pointer"
                    >
                      Wallet
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE REDEMPTION FORM */
              <div className="space-y-6">
                
                {/* Item Summary Details */}
                <div className="flex items-start gap-4 rounded-2xl bg-[#0A0A0A]/50 border border-white/5 p-4">
                  <span className="text-4xl p-2.5 bg-white/4 rounded-xl border border-white/6 select-none shrink-0">
                    {confirmingItem.icon}
                  </span>
                  <div className="space-y-1">
                    <span className="rounded-full bg-white/5 border border-white/6 px-2 py-0.5 text-[8px] font-black uppercase text-[#A3A3A3] tracking-widest">
                      {confirmingItem.category.replace('_', ' ')}
                    </span>
                    <h4 className="font-display text-sm font-extrabold text-[#FFFFFF] tracking-tight">
                      {confirmingItem.title}
                    </h4>
                    <p className="text-[11px] text-[#A3A3A3] leading-normal">
                      {confirmingItem.description}
                    </p>
                  </div>
                </div>

                {/* Ledger Comparison */}
                <div className="space-y-2 rounded-2xl bg-white/4 p-4 border border-white/4 text-xs font-mono">
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Available Balance</span>
                    <span>{totalPoints} XP</span>
                  </div>
                  <div className="flex justify-between text-[#E05656]">
                    <span>Voucher Cost</span>
                    <span>-{confirmingItem.pointsCost} XP</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between font-black text-[#A8D97F] text-sm">
                    <span>Remaining Balance</span>
                    <span>{totalPoints - confirmingItem.pointsCost} XP</span>
                  </div>
                </div>

                {/* Ecological footnote */}
                <div className="flex items-center gap-2 rounded-xl bg-[#2A4A10]/20 p-3 text-[10px] font-semibold text-[#A8D97F] border border-[#2A4A10]/20 leading-relaxed">
                  <Sparkles size={14} className="shrink-0 text-[#A8D97F]" />
                  <span><strong>Ecological Handprint:</strong> {confirmingItem.ecoImpact}</span>
                </div>

                {/* Action button (slide mockup / loading) */}
                <button
                  onClick={confirmRedemption}
                  disabled={isRedeeming}
                  className="w-full relative overflow-hidden flex items-center justify-center gap-2 rounded-2xl bg-[#A8D97F] py-4 text-xs font-black text-[#1A3A05] hover:bg-[#B8E890] transition-all cursor-pointer shadow-lg shadow-[#A8D97F]/10 active:scale-[0.99]"
                >
                  {isRedeeming ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Validating Security Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize XP Handoff</span>
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </>
                  )}
                  {/* Subtle sweep transition background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '1.5s' }} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
