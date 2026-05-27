'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Send, Scale, Info } from 'lucide-react';
import { useCategories } from '@/components/common/CategoriesProvider';
import { apiClient } from '@/lib/api/client';
import type { CategorySlug } from '@/lib/categories';
import CategoryIcon from '@/components/common/CategoryIcon';

export default function PostRequestPage() {
  const { categories } = useCategories();
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  // Form Fields State
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<CategorySlug>('vegetable-scraps');
  const [minQuantity, setMinQuantity] = React.useState<number>(5);
  const [maxQuantity, setMaxQuantity] = React.useState<number>(20);
  const [unit, setUnit] = React.useState('kg');
  const [frequency, setFrequency] = React.useState<'one-time' | 'weekly' | 'monthly'>('weekly');
  const [preferredMaxDistanceKm, setPreferredMaxDistanceKm] = React.useState<number>(15);
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const categoryExists = categories.some((item) => item.slug === category);
    if (!categoryExists) {
      setTimeout(() => {
        setCategory(categories[0].slug);
      }, 0);
    }
  }, [categories, category]);

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      alert('Please fill in a descriptive title for your appeal.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handlePublish = async () => {
    if (!description.trim()) {
      alert('Please describe your needs so donors understand how materials will be utilized.');
      return;
    }
    if (minQuantity <= 0 || maxQuantity < minQuantity) {
      alert('Ensure maximum quantity is greater than or equal to minimum quantity.');
      return;
    }
    if (preferredMaxDistanceKm <= 0) {
      alert('Please set a preferred maximum distance greater than 0 km.');
      return;
    }

    try {
      await apiClient.createRequest({
        title,
        category_slug: category,
        quantity_kg_min: minQuantity,
        quantity_kg_max: maxQuantity,
        frequency,
        description,
        city: 'San Francisco',
        country: 'United States',
        max_distance_km: preferredMaxDistanceKm,
      });

      window.dispatchEvent(new CustomEvent('post-created', {
        detail: `Urgent appeal published! "${title}" is now active.`
      }));
      router.push('/home');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to publish this request.');
    }
  };

  return (
    <main className="flex h-full flex-col bg-[#0A0A0A] text-[#FFFFFF] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md shrink-0">
        <button
          onClick={() => {
            if (step > 1) handlePrev();
            else router.push('/home');
          }}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] hover:bg-white/8 transition cursor-pointer"
        >
          Back
        </button>
        <span className="font-display text-lg font-bold tracking-tight">Post Appeal Request</span>
        <span className="w-[52px]" />
      </div>

      {/* Progress Stepper Bar */}
      <div className="w-full bg-[#141414] py-3.5 border-b border-white/6 px-4 shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {[1, 2].map((num) => (
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
              {num < 2 && (
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

      {/* Scrollable Form content container */}
      <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto px-6 py-6 scrollbar-none">
        
        {/* STEP 1: TITLE, CATEGORY & FREQUENCY */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">What materials do you need?</h2>
              <p className="text-xs text-[#A3A3A3]">Create an appeal request so local food businesses can route scraps directly to you.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#A3A3A3]">Appeal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sourdough discards for poultry feed..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-white/10 bg-[#141414] text-sm focus:border-[#A8D97F] focus:outline-none transition-all"
                />
              </div>

              {/* Cadence frequency selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A3A3A3]">Supply Cadence</label>
                <div className="flex rounded-xl bg-[#141414] p-1 border border-white/6">
                  {(['one-time', 'weekly', 'monthly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFrequency(freq)}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all capitalize cursor-pointer ${
                        frequency === freq
                          ? 'bg-[#2A4A10] text-[#A8D97F]'
                          : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material categories grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#A3A3A3]">Select Desired Category</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setCategory(cat.slug)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        category === cat.slug
                          ? 'bg-[#2A4A10] border-[#A8D97F] text-[#A8D97F]'
                          : 'bg-[#141414] border-white/6 text-[#FFFFFF] hover:border-white/12'
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 shadow-inner">
                        <CategoryIcon slug={cat.slug} size={11} style={{ color: cat.color }} />
                      </span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: QUANTITY RANGES & DETAILS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Specify capacity & describe need</h2>
              <p className="text-xs text-[#A3A3A3]">Configure weight ranges and explain what the material will be used for.</p>
            </div>

            <div className="space-y-4">
              
              {/* Range block */}
              <div className="bg-[#141414] p-5 rounded-2xl border border-white/6 space-y-4">
                <div className="flex justify-center items-center gap-2">
                  <Scale size={20} className="text-[#A8D97F]" />
                  <span className="font-display text-base font-bold text-[#A8D97F]">Target Range Needed</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase block text-center">Min</label>
                    <input
                      type="number"
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full h-11 px-2 rounded-xl border border-white/10 bg-[#0A0A0A] text-center font-mono font-bold text-[#FFFFFF] focus:border-[#A8D97F] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase block text-center">Max</label>
                    <input
                      type="number"
                      value={maxQuantity}
                      onChange={(e) => setMaxQuantity(Math.max(minQuantity, parseInt(e.target.value) || minQuantity))}
                      className="w-full h-11 px-2 rounded-xl border border-white/10 bg-[#0A0A0A] text-center font-mono font-bold text-[#FFFFFF] focus:border-[#A8D97F] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#A3A3A3] uppercase block text-center">Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full h-11 px-2 rounded-xl border border-white/10 bg-[#0A0A0A] text-center font-bold text-xs text-[#FFFFFF] focus:border-[#A8D97F] focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="pieces">pcs</option>
                      <option value="liters">liters</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#A3A3A3]">Preferred max distance (km)</label>
                <input
                  type="number"
                  min={1}
                  value={preferredMaxDistanceKm}
                  onChange={(e) => setPreferredMaxDistanceKm(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full h-12 px-4 rounded-xl border border-white/10 bg-[#141414] text-sm font-mono font-bold text-[#FFFFFF] focus:border-[#A8D97F] focus:outline-none transition-all"
                />
                <p className="text-[11px] text-[#8C8F7E] leading-relaxed">
                  This is how far you are willing to source material from. It will be used for future matching and donor discovery.
                </p>
              </div>

              {/* Description Details */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#A3A3A3]">How will you use this waste?</label>
                <textarea
                  placeholder="e.g. Supplement feed for organic poultry. Looking for consistent spent grain shipments. Can handle pickup directly."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-xl border border-white/10 bg-[#141414] text-sm focus:border-[#A8D97F] focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="flex gap-2 text-[10px] text-[#A3A3A3] leading-relaxed px-1 bg-[#141414]/40 p-3.5 rounded-xl border border-white/6">
                <Info size={14} className="text-[#A8D97F] shrink-0 mt-0.5" />
                <span>You will earn +10 XP immediately upon posting, and an additional +30 XP once a compatible donor coordinates with you.</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Action Buttons Bar */}
      <div className="sticky bottom-0 z-40 border-t border-white/6 bg-[#141414]/90 backdrop-blur-md px-6 py-4 pb-safe shrink-0">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#141414] px-4 py-3.5 text-xs font-bold text-[#FFFFFF] hover:bg-[#1B1B1B] transition flex-1 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {step < 2 ? (
            <button
              onClick={handleNext}
              className="flex items-center justify-center gap-1 rounded-xl bg-[#A8D97F] px-4 py-3.5 text-xs font-black text-[#1A3A05] transition hover:brightness-105 active:scale-98 flex-1 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#A8D97F] px-4 py-3.5 text-xs font-black text-[#1A3A05] transition hover:brightness-105 active:scale-98 flex-1 shadow-lg cursor-pointer"
            >
              <span>Publish Appeal</span>
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
