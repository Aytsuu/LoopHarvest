'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Send, Sparkles, Scale, Info } from 'lucide-react';
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
  const [selectedPhoto, setSelectedPhoto] = React.useState(() => {
    const presets = PHOTO_PRESETS['vegetable-scraps'] || PHOTO_PRESETS['other'];
    return presets[0] || '';
  });

  React.useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const categoryExists = categories.some((item) => item.slug === category);
    if (categoryExists) {
      return;
    }

    const nextCategory = categories[0].slug;
    const presets = PHOTO_PRESETS[nextCategory] || PHOTO_PRESETS.other;
    setTimeout(() => {
      setCategory(nextCategory);
      setSelectedPhoto(presets[0] || '');
    }, 0);
  }, [categories, category]);

  const activeCatPresets = PHOTO_PRESETS[category] || PHOTO_PRESETS['other'];
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
    if (step === 3 && !description.trim()) {
      alert('Please fill in a short details description.');
      return;
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
                        const presets = PHOTO_PRESETS[cat.slug] || PHOTO_PRESETS['other'];
                        setSelectedPhoto(presets[0] || '');
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
              <p className="text-xs text-[#A3A3A3]">Select preset stock images recommended for your category slug.</p>
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

              {/* Recommended Presets */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-[#A8D97F]">
                  <Sparkles size={14} />
                  <span className="text-xs font-black uppercase tracking-wider">AI Category Recommendations</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {activeCatPresets.map((preset, idx) => (
                    <div 
                      key={preset}
                      onClick={() => setSelectedPhoto(preset)}
                      className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPhoto === preset 
                          ? 'border-[#A8D97F] scale-[1.02] shadow-lg' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset} alt={`preset-${idx}`} className="h-full w-full object-cover" />
                      <div className="absolute right-2 bottom-2 rounded bg-black/60 p-1 text-[10px] text-white">
                        Option {idx+1}
                      </div>
                    </div>
                  ))}
                </div>
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
