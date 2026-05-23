'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Send, Scale, Info, Camera, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { useCategories } from '@/components/common/CategoriesProvider';
import { apiClient } from '@/lib/api/client';
import type { CategorySlug } from '@/lib/categories';

const PHOTO_PRESETS: Record<string, string[]> = {
  'vegetable-scraps': [
    'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1557844352-761f2565b576?q=80&w=600&auto=format&fit=crop'
  ],
  'coffee-grounds': [
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop'
  ],
  'fruit-waste': [
    'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=600&auto=format&fit=crop'
  ],
  'spent-grain': [
    'https://images.unsplash.com/photo-1574316071802-0d68497b05f5?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?q=80&w=600&auto=format&fit=crop'
  ],
  'bread-stale': [
    'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop'
  ],
  'fish-bones-shells': [
    'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?q=80&w=600&auto=format&fit=crop'
  ],
  'tea-leaves': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop'
  ],
  'cooking-oil-used': [
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop'
  ],
  'other': [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop'
  ]
};

export default function PostListingPage() {
  const { categories, getCategory } = useCategories();
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  // Form Fields State
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<CategorySlug>('vegetable-scraps');
  const [quantity, setQuantity] = React.useState<number>(1.0);
  const [unit, setUnit] = React.useState('kg');
  const [description, setDescription] = React.useState('');
  const [selectedPhoto, setSelectedPhoto] = React.useState('');
  const [verificationState, setVerificationState] = React.useState<'idle' | 'connecting' | 'capturing' | 'auditing' | 'verified'>('idle');

  React.useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const categoryExists = categories.some((item) => item.slug === category);
    if (categoryExists) {
      return;
    }

    const nextCategory = categories[0].slug;
    setTimeout(() => {
      setCategory(nextCategory);
    }, 0);
  }, [categories, category]);

  const handleSimulateVerification = () => {
    setVerificationState('connecting');
    
    setTimeout(() => {
      setVerificationState('capturing');
      
      setTimeout(() => {
        setVerificationState('auditing');
        
        setTimeout(() => {
          const presets = PHOTO_PRESETS[category] || PHOTO_PRESETS['other'];
          const randomPreset = presets[Math.floor(Math.random() * presets.length)] || presets[0] || '';
          setSelectedPhoto(randomPreset);
          setVerificationState('verified');
        }, 1500);
      }, 1200);
    }, 1000);
  };

  const activeCategory = getCategory(category);

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      alert('Please fill in a descriptive title.');
      return;
    }
    if (step === 2 && quantity <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }
    if (step === 3) {
      if (!description.trim()) {
        alert('Please fill in a short details description.');
        return;
      }
      if (!selectedPhoto) {
        alert('Visual verification is required. Please scan the QR code to capture and verify your waste photo first.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handlePublish = async () => {
    try {
      await apiClient.createListing({
        title,
        category_slug: category,
        quantity_kg: quantity,
        description,
        photo_url: selectedPhoto,
        pickup_address: 'Pickup details shared after claim',
        city: 'San Francisco',
        country: 'United States',
      });

      window.dispatchEvent(new CustomEvent('post-created', {
        detail: `Donation posted! "${title}" is now listed near you.`
      }));
      router.push('/home');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to publish this listing.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#FFFFFF]">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => {
            if (step > 1) handlePrev();
            else router.push('/home');
          }}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] hover:bg-white/8 transition"
        >
          Back
        </button>
        <span className="font-display text-lg font-bold tracking-tight">Post Food Waste</span>
        <span className="w-[52px]" />
      </div>

      {/* Progress Stepper Bar */}
      <div className="w-full bg-[#141414] py-3.5 border-b border-white/6 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div 
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === num 
                    ? 'bg-[#A8D97F] text-[#1A3A05] scale-110 shadow-lg' 
                    : step > num 
                      ? 'bg-[#2A4A10] text-[#A8D97F]' 
                      : 'bg-[#1B1B1B] text-[#525252] border border-white/6'
                }`}
              >
                {num}
              </div>
              {num < 4 && (
                <div 
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    step > num ? 'bg-[#2A4A10]' : 'bg-[#1B1B1B]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Inner Form content container */}
      <div className="flex-1 max-w-md w-full mx-auto p-6 flex flex-col justify-between pb-24 md:pb-6">
        
        {/* STEP 1: TITLE & CATEGORY */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Describe your organic material</h2>
              <p className="text-xs text-[#A3A3A3]">Choose a precise title so composters can identify quality.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#A3A3A3]">Title of Waste Post</label>
                <input
                  type="text"
                  placeholder="e.g. Sourdough discards, veggie stems..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-white/10 bg-[#141414] text-sm focus:border-[#A8D97F] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A3A3A3]">Select Material Category</label>
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        setCategory(cat.slug);
                        setSelectedPhoto('');
                        setVerificationState('idle');
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        category === cat.slug
                          ? 'bg-[#2A4A10] border-[#A8D97F] text-[#A8D97F]'
                          : 'bg-[#141414] border-white/6 text-[#FFFFFF] hover:border-white/12'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: QUANTITY & WEIGHT */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">How much are you donating?</h2>
              <p className="text-xs text-[#A3A3A3]">Accurate metrics enable carbon reduction claims validation.</p>
            </div>

            <div className="space-y-4 bg-[#141414] p-6 rounded-2xl border border-white/6">
              <div className="flex justify-center items-center gap-2 mb-4">
                <Scale size={24} className="text-[#A8D97F]" />
                <span className="font-display text-lg font-black text-[#A8D97F]">Handoff Weight</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full h-12 px-4 rounded-xl border border-white/10 bg-[#0A0A0A] text-center font-mono font-bold text-base text-[#FFFFFF] focus:border-[#A8D97F] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A3A3A3] uppercase">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-12 px-2 rounded-xl border border-white/10 bg-[#0A0A0A] text-center font-bold text-sm text-[#FFFFFF] focus:border-[#A8D97F] focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="pieces">pcs</option>
                    <option value="liters">liters</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTO & DETAILS */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Add Details & Visual Verification</h2>
              <p className="text-xs text-[#A3A3A3]">Describe your organic material and complete mobile visual verification.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#A3A3A3]">Short Description</label>
                <textarea
                  placeholder="e.g. Clean espresso grinds from espresso machine. Stored in dry buckets, perfect for composting or oyster mushroom substrate."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-xl border border-white/10 bg-[#141414] text-sm focus:border-[#A8D97F] focus:outline-none leading-relaxed resize-none"
                />
              </div>

              {/* Premium Visual Verification Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#A8D97F]">
                    <Camera size={14} className={verificationState === 'verified' ? '' : 'animate-pulse'} />
                    <span className="text-xs font-black uppercase tracking-wider">Visual Verification</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    verificationState === 'verified'
                      ? 'bg-[#2A4A10] text-[#A8D97F]'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${verificationState === 'verified' ? 'bg-[#A8D97F] animate-pulse' : 'bg-amber-400'}`} />
                    {verificationState === 'verified' ? 'Verified Batch' : 'Required'}
                  </span>
                </div>

                {verificationState !== 'verified' ? (
                  <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-[#141414] p-5 flex flex-col md:flex-row gap-5 items-center">
                    
                    {/* Simulated Scanner / SVG QR Code Container */}
                    <div className="relative w-32 h-32 bg-white p-2.5 rounded-xl shrink-0 flex items-center justify-center overflow-hidden shadow-inner select-none">
                      {/* Laser scanner overlay line */}
                      {verificationState === 'idle' && (
                        <div className="absolute left-0 right-0 h-0.5 bg-[#A8D97F] opacity-80 shadow-[0_0_8px_#A8D97F] animate-bounce" style={{ animationDuration: '2.5s' }} />
                      )}

                      {verificationState !== 'idle' && (
                        <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                          <Loader2 size={20} className="text-[#A8D97F] animate-spin" />
                          <span className="text-[9px] text-[#A3A3A3] font-bold uppercase tracking-wider animate-pulse">
                            {verificationState === 'connecting' && 'Connecting...'}
                            {verificationState === 'capturing' && 'Capturing Live...'}
                            {verificationState === 'auditing' && 'Auditing Image...'}
                          </span>
                        </div>
                      )}

                      {/* Premium High-Fidelity SVG QR Code */}
                      <svg className="w-full h-full text-[#141414]" viewBox="0 0 100 100" fill="currentColor">
                        {/* Position Markers (Corners) */}
                        <path d="M 5,5 h 25 v 5 h -20 v 20 h -5 z M 70,5 h 25 v 25 h -5 v -20 h -20 z M 5,70 h 5 v 20 h 20 v 5 h -25 z" />
                        <path d="M 10,10 h 15 v 15 h -15 z M 13,13 h 9 v 9 h -9 z" />
                        <path d="M 75,10 h 15 v 15 h -15 z M 78,13 h 9 v 9 h -9 z" />
                        <path d="M 10,75 h 15 v 15 h -15 z M 13,78 h 9 v 9 h -9 z" />
                        {/* Alignment pattern (bottom right-ish) */}
                        <path d="M 68,68 h 10 v 10 h -10 z M 71,71 h 4 v 4 h -4 z" />
                        {/* Fake bits/dots spread across QR area */}
                        <rect x="35" y="5" width="5" height="5" />
                        <rect x="45" y="12" width="10" height="5" />
                        <rect x="60" y="5" width="5" height="15" />
                        <rect x="35" y="20" width="15" height="5" />
                        <rect x="55" y="25" width="5" height="5" />
                        
                        <rect x="5" y="35" width="5" height="15" />
                        <rect x="15" y="45" width="15" height="5" />
                        <rect x="25" y="35" width="5" height="10" />
                        
                        <rect x="35" y="35" width="10" height="10" />
                        <rect x="50" y="40" width="5" height="5" />
                        <rect x="40" y="55" width="15" height="5" />
                        <rect x="5" y="60" width="15" height="5" />
                        <rect x="25" y="55" width="5" height="10" />
                        
                        <rect x="80" y="35" width="15" height="5" />
                        <rect x="70" y="45" width="5" height="15" />
                        <rect x="85" y="50" width="10" height="10" />
                        
                        <rect x="35" y="70" width="10" height="5" />
                        <rect x="50" y="65" width="5" height="15" />
                        <rect x="35" y="85" width="20" height="5" />
                        
                        <rect x="65" y="85" width="10" height="10" />
                        <rect x="80" y="80" width="15" height="5" />
                        <rect x="85" y="90" width="5" height="5" />
                      </svg>
                    </div>

                    {/* Step-by-Step Instructions Panel */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#FFFFFF]">Verified Mobile Capture Steps</h4>
                        <p className="text-[11px] text-[#A3A3A3] leading-relaxed">Point your mobile device camera to snap and verify raw organic content quality instantly.</p>
                      </div>

                      <div className="space-y-2 text-[10px] text-[#A3A3A3]">
                        <div className="flex gap-2">
                          <span className="font-mono text-xs font-black text-[#A8D97F] bg-[#2A4A10]/50 h-5 w-5 rounded-full flex items-center justify-center shrink-0">1</span>
                          <span>Scan QR Code with your smartphone camera to connect session.</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-mono text-xs font-black text-[#A8D97F] bg-[#2A4A10]/50 h-5 w-5 rounded-full flex items-center justify-center shrink-0">2</span>
                          <span>Position your camera over the batch and capture a live image.</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-mono text-xs font-black text-[#A8D97F] bg-[#2A4A10]/50 h-5 w-5 rounded-full flex items-center justify-center shrink-0">3</span>
                          <span>Live quality audits will automatically sync and approve this post.</span>
                        </div>
                      </div>

                      {/* Interactive Simulator Trigger */}
                      <button
                        type="button"
                        onClick={handleSimulateVerification}
                        disabled={verificationState !== 'idle'}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#2A4A10]/80 border border-[#A8D97F]/20 text-xs font-bold text-[#A8D97F] hover:bg-[#2A4A10] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={verificationState !== 'idle' ? 'animate-spin' : ''} />
                        <span>
                          {verificationState === 'idle' && 'Simulate Mobile Capture'}
                          {verificationState === 'connecting' && 'Connecting to mobile camera...'}
                          {verificationState === 'capturing' && 'Snapping Live Photo...'}
                          {verificationState === 'auditing' && 'Analyzing image quality...'}
                        </span>
                      </button>
                    </div>

                  </div>
                ) : (
                  /* Verified Preview State */
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-4 space-y-4 shadow-xl">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-stone-900 border border-white/6 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedPhoto} alt="Live captured organic batch" className="h-full w-full object-cover" />
                      
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[#1A3A05] px-2.5 py-0.5 text-[9px] font-black text-[#A8D97F] border border-[#A8D97F]/20 shadow flex items-center gap-1">
                          <CheckCircle2 size={10} className="animate-pulse" />
                          <span>LIVE VERIFIED</span>
                        </span>
                        <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
                          Source: Mobile Shutter
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white backdrop-blur-md">
                        Confidence: 99.1%
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-[#A8D97F]">Verification Approved</span>
                        <span className="block text-[9px] text-[#A3A3A3]">Metadata: iOS Mobile Camera (iPhone 15 Pro, Live Capture Audit passed)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhoto('');
                          setVerificationState('idle');
                        }}
                        className="rounded-lg border border-white/6 bg-white/4 hover:bg-white/8 px-3 py-1.5 text-[10px] font-bold text-[#FFFFFF] transition-colors shrink-0"
                      >
                        Retake Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & PUBLISH */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Confirm details & publish</h2>
              <p className="text-xs text-[#A3A3A3]">Double-check metrics before adding to the circular feed.</p>
            </div>

            {/* Summary Block */}
            <div className="rounded-2xl border border-white/6 bg-[#141414] overflow-hidden shadow-xl">
              <div className="relative aspect-video w-full bg-stone-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPhoto} alt="Review Post" className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <span className="rounded-full bg-[#141414] px-3 py-1 text-xs font-bold text-[#FFFFFF] border border-white/10">
                    {activeCategory.emoji} {activeCategory.label}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-display text-lg font-bold text-[#FFFFFF]">{title}</h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-2">{description}</p>
                
                <div className="flex items-center gap-1.5 text-xs text-[#A8D97F] bg-[#2A4A10]/40 px-3 py-1.5 rounded-lg border border-[#A8D97F]/10 font-bold self-start inline-flex">
                  <Scale size={14} />
                  <span>Handoff weight: {quantity} {unit}</span>
                </div>
              </div>
            </div>

            {/* Verification Note */}
            <div className="flex gap-2 text-[10px] text-[#A3A3A3] leading-relaxed px-1">
              <Info size={14} className="text-[#A8D97F] shrink-0" />
              <span>By publishing, you agree to store this batch safely and coordinate pickup details promptly. You will unlock +25 XP upon completion.</span>
            </div>
          </div>
        )}

        {/* STEPS CONTROL NAVIGATION */}
        <div className="mt-8 flex gap-3 pt-4 border-t border-white/6">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#141414] px-4 py-3.5 text-xs font-bold text-[#FFFFFF] hover:bg-[#1B1B1B] transition flex-1"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center justify-center gap-1 rounded-xl bg-[#A8D97F] px-4 py-3.5 text-xs font-black text-[#1A3A05] transition hover:brightness-105 active:scale-98 flex-1"
            >
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#A8D97F] px-4 py-3.5 text-xs font-black text-[#1A3A05] transition hover:brightness-105 active:scale-98 flex-1 shadow-lg"
            >
              <span>Publish Listing</span>
              <Send size={14} />
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
