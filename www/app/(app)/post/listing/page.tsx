'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  MessageSquare,
  Scale,
  Send,
  Smartphone,
  Upload,
  UserRoundPen,
  Zap,
} from 'lucide-react';

import CategoryIcon from '@/components/common/CategoryIcon';
import { useCategories } from '@/components/common/CategoriesProvider';
import { apiClient } from '@/lib/api/client';
import type { CategorySlug } from '@/lib/categories';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { getListingPhotosBucket } from '@/lib/supabase/storage';

type PostingMethod = 'auto' | 'manual' | null;
type VerificationState = 'idle' | 'uploading' | 'verified';
type AutoDetectState = 'idle' | 'running' | 'completed' | 'failed';
type StepId = 'method' | 'detect' | 'details' | 'quantity' | 'photo' | 'review';

const AUTO_STEPS: StepId[] = ['method', 'detect', 'details', 'quantity', 'photo', 'review'];
const MANUAL_STEPS: StepId[] = ['method', 'details', 'quantity', 'photo', 'review'];

type DetectionApiResponse = {
  success: boolean;
  data?: {
    categorySlug: CategorySlug;
    title: string;
    description: string;
  };
  error?: {
    message?: string;
  };
};

export default function PostListingPage() {
  const { categories, getCategory } = useCategories();
  const router = useRouter();
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);
  const publishInFlightRef = React.useRef(false);
  const listingPhotosBucket = getListingPhotosBucket();

  const [postingMethod, setPostingMethod] = React.useState<PostingMethod>(null);
  const [stepIndex, setStepIndex] = React.useState(0);

  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<CategorySlug>('vegetable-scraps');
  const [quantity, setQuantity] = React.useState<number>(1.0);
  const [unit, setUnit] = React.useState('kg');
  const [description, setDescription] = React.useState('');
  const [pickupAddress, setPickupAddress] = React.useState('');
  const [selectedPhoto, setSelectedPhoto] = React.useState('');
  const [verificationState, setVerificationState] = React.useState<VerificationState>('idle');
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [claimType, setClaimType] = React.useState<'direct' | 'message'>('direct');
  const [autoDetectState, setAutoDetectState] = React.useState<AutoDetectState>('idle');
  const [autoDetectMessage, setAutoDetectMessage] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);

  const activeSteps = React.useMemo<StepId[]>(() => {
    if (postingMethod === 'auto') {
      return AUTO_STEPS;
    }

    if (postingMethod === 'manual') {
      return MANUAL_STEPS;
    }

    return ['method'];
  }, [postingMethod]);

  const currentStep = activeSteps[stepIndex] ?? 'method';
  const resolvedCategory = categories.some((item) => item.slug === category)
    ? category
    : (categories[0]?.slug ?? category);
  const activeCategory = getCategory(resolvedCategory);

  const updateMethod = React.useCallback((nextMethod: Exclude<PostingMethod, null>) => {
    setPostingMethod(nextMethod);
    setStepIndex(0);
    setAutoDetectState('idle');
    setAutoDetectMessage(null);
  }, []);

  const handleAutoDetect = React.useCallback(async (photoUrl: string) => {
    setAutoDetectState('running');
    setAutoDetectMessage('Analyzing the photo and inferring common listing details...');

    try {
      const response = await fetch('/api/ai/listing-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrl,
        }),
      });

      const payload = (await response.json()) as DetectionApiResponse;
      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message ??
            'Auto-detect could not classify this photo. Continue with manual details.',
        );
      }

      setCategory(payload.data.categorySlug);
      setTitle(payload.data.title);
      setDescription(payload.data.description);
      setAutoDetectState('completed');
      setAutoDetectMessage('Category and short description were inferred from the uploaded photo.');
      setStepIndex(2);
    } catch (err) {
      const fallbackMessage =
        err instanceof Error
          ? err.message
          : 'Auto-detect could not classify this photo. Continue with manual details.';

      setAutoDetectState('failed');
      setAutoDetectMessage(`${fallbackMessage} The form switched to manual input and kept your uploaded photo.`);
      setPostingMethod('manual');
      setStepIndex(1);
    }
  }, []);

  const handlePhotoUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith('image/')) {
        setUploadError('Please choose an image file.');
        event.target.value = '';
        return;
      }

      const maxFileSizeBytes = 6 * 1024 * 1024;
      if (file.size > maxFileSizeBytes) {
        setUploadError('Please upload an image smaller than 6 MB.');
        event.target.value = '';
        return;
      }

      setUploadError(null);
      setVerificationState('uploading');

      try {
        const supabase = createSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error('You need to be signed in to upload a photo.');
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadFailure } = await supabase.storage.from(listingPhotosBucket).upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

        if (uploadFailure) {
          throw uploadFailure;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(listingPhotosBucket).getPublicUrl(filePath);

        if (!publicUrl) {
          throw new Error('Photo upload succeeded, but no public URL was returned.');
        }

        setSelectedPhoto(publicUrl);
        setVerificationState('verified');

        if (postingMethod === 'auto') {
          await handleAutoDetect(publicUrl);
        } else {
          setAutoDetectState('idle');
          setAutoDetectMessage(null);
        }
      } catch (err) {
        setSelectedPhoto('');
        setVerificationState('idle');
        setAutoDetectState('idle');

        const message = err instanceof Error ? err.message : 'Unable to upload the photo.';
        setUploadError(
          `${message} Make sure the Supabase bucket exists, is public, and allows authenticated uploads.`,
        );
      } finally {
        event.target.value = '';
      }
    },
    [handleAutoDetect, listingPhotosBucket, postingMethod],
  );

  const resetPhoto = React.useCallback(() => {
    setSelectedPhoto('');
    setVerificationState('idle');
    setUploadError(null);
    setAutoDetectState(postingMethod === 'auto' ? 'idle' : autoDetectState);
    if (postingMethod === 'auto') {
      setAutoDetectMessage('Upload a fresh photo to infer the category and short description again.');
    }
  }, [autoDetectState, postingMethod]);

  const handleNext = React.useCallback(() => {
    if (currentStep === 'method') {
      if (!postingMethod) {
        alert('Choose whether you want photo auto-detect or manual entry first.');
        return;
      }

      setStepIndex(1);
      return;
    }

    if (currentStep === 'detect') {
      if (!selectedPhoto || verificationState !== 'verified') {
        alert('Please take or upload a photo before continuing.');
        return;
      }

      if (autoDetectState === 'running') {
        alert('Auto-detect is still analyzing the uploaded photo.');
        return;
      }

      if (autoDetectState !== 'completed') {
        alert('Auto-detect did not finish successfully. The form will continue with manual details.');
        setPostingMethod('manual');
        setStepIndex(1);
        return;
      }
    }

    if (currentStep === 'details' && !title.trim()) {
      alert('Please fill in a descriptive title.');
      return;
    }

    if (currentStep === 'quantity' && quantity <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    if (currentStep === 'photo') {
      if (!description.trim()) {
        alert('Please fill in a short details description.');
        return;
      }
      if (!pickupAddress.trim()) {
        alert('Please add handoff pickup details so recipients know how to coordinate.');
        return;
      }
      if (!selectedPhoto) {
        alert('A real waste photo is required. Please take or upload one before continuing.');
        return;
      }
    }

    setStepIndex((prev) => Math.min(prev + 1, activeSteps.length - 1));
  }, [
    activeSteps.length,
    autoDetectState,
    currentStep,
    description,
    pickupAddress,
    postingMethod,
    quantity,
    selectedPhoto,
    title,
    verificationState,
  ]);

  const handlePrev = React.useCallback(() => {
    if (isPublishing) {
      return;
    }

    if (stepIndex === 0) {
      router.push('/home');
      return;
    }

    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, [isPublishing, router, stepIndex]);

  const handlePublish = React.useCallback(async () => {
    if (publishInFlightRef.current) {
      return;
    }

    publishInFlightRef.current = true;

    try {
      setIsPublishing(true);
      await apiClient.createListing({
        title,
        category_slug: resolvedCategory,
        quantity_kg: quantity,
        description,
        claim_type: claimType,
        photo_url: selectedPhoto,
        pickup_address: pickupAddress.trim(),
        city: 'San Francisco',
        country: 'United States',
      });

      window.dispatchEvent(new CustomEvent('post-created', {
        detail: `Donation posted! "${title}" is now listed near you.`,
      }));
      router.push('/home');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to publish this listing.');
    } finally {
      publishInFlightRef.current = false;
      setIsPublishing(false);
    }
  }, [claimType, description, pickupAddress, quantity, resolvedCategory, router, selectedPhoto, title]);

  const renderPhotoCard = (isAutoDetectStep: boolean) => {
    const autoDetectRunning = postingMethod === 'auto' && autoDetectState === 'running';
    const isBusy = verificationState === 'uploading' || autoDetectRunning;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#A8D97F]">
            <Camera size={14} className={verificationState === 'verified' ? '' : 'animate-pulse'} />
            <span className="text-xs font-black uppercase tracking-wider">
              {isAutoDetectStep ? 'Photo Analysis' : 'Visual Verification'}
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
            verificationState === 'verified'
              ? 'bg-[#2A4A10] text-[#A8D97F]'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              verificationState === 'verified' ? 'bg-[#A8D97F] animate-pulse' : 'bg-amber-400'
            }`} />
            {verificationState === 'verified' ? 'Photo Ready' : 'Required'}
          </span>
        </div>

        {verificationState !== 'verified' ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-[#141414] p-5 flex flex-col md:flex-row gap-5 items-center">
            <div className="relative w-32 h-32 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border border-dashed border-[#A8D97F]/30 bg-[#0A0A0A] shadow-inner select-none">
              {isBusy ? (
                <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center gap-2 p-2 text-center">
                  <Loader2 size={20} className="text-[#A8D97F] animate-spin" />
                  <span className="text-[9px] text-[#A3A3A3] font-bold uppercase tracking-wider animate-pulse">
                    {verificationState === 'uploading' ? 'Uploading photo...' : 'Inferring details...'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-3">
                  <div className="rounded-full border border-[#A8D97F]/20 bg-[#2A4A10]/40 p-3">
                    <Smartphone size={24} className="text-[#A8D97F]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8D97F]">
                    Camera Upload
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#FFFFFF]">
                  {isAutoDetectStep ? 'Take or upload a waste photo for AI analysis' : 'Capture or upload a real waste photo'}
                </h4>
                <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                  {isAutoDetectStep
                    ? 'The uploaded photo is sent through the AI vision flow to infer the category and a short listing description.'
                    : 'Use your device camera or photo library. The image is uploaded to Supabase Storage and attached to this listing.'}
                </p>
              </div>

              <div className="space-y-2 text-[10px] text-[#A3A3A3]">
                <div className="flex gap-2">
                  <span className="font-mono text-xs font-black text-[#A8D97F] bg-[#2A4A10]/50 h-5 w-5 rounded-full flex items-center justify-center shrink-0">1</span>
                  <span>Tap the upload button on this device.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-xs font-black text-[#A8D97F] bg-[#2A4A10]/50 h-5 w-5 rounded-full flex items-center justify-center shrink-0">2</span>
                  <span>Take a photo of the batch or choose one from your library.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-xs font-black text-[#A8D97F] bg-[#2A4A10]/50 h-5 w-5 rounded-full flex items-center justify-center shrink-0">3</span>
                  <span>
                    {isAutoDetectStep
                      ? 'Wait for auto-detect to finish before reviewing the inferred fields.'
                      : 'Continue once the upload finishes and the preview appears.'}
                  </span>
                </div>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isBusy}
                className="mt-2 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#2A4A10]/80 border border-[#A8D97F]/20 text-xs font-bold text-[#A8D97F] hover:bg-[#2A4A10] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                <span>
                  {verificationState === 'uploading'
                    ? 'Uploading photo...'
                    : autoDetectRunning
                      ? 'Inferring details...'
                      : 'Take or Upload Photo'}
                </span>
              </button>

              {uploadError ? (
                <p className="text-[10px] text-amber-400 leading-relaxed">{uploadError}</p>
              ) : (
                <p className="text-[10px] text-[#6F6F6F] leading-relaxed">
                  Recommended: public bucket <span className="font-mono text-[#A3A3A3]">{listingPhotosBucket}</span>, image files under 6 MB.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-4 space-y-4 shadow-xl">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-stone-900 border border-white/6 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedPhoto} alt="Attached organic batch" className="h-full w-full object-cover" />

              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#1A3A05] px-2.5 py-0.5 text-[9px] font-black text-[#A8D97F] border border-[#A8D97F]/20 shadow flex items-center gap-1">
                  <CheckCircle2 size={10} className="animate-pulse" />
                  <span>PHOTO ATTACHED</span>
                </span>
                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
                  Source: Supabase Storage
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#A8D97F]">
                  {isAutoDetectStep ? 'Photo ready for inference' : 'Upload complete'}
                </span>
                <span className="block text-[9px] text-[#A3A3A3]">
                  {isAutoDetectStep
                    ? 'This image will be used to infer the waste category and short description.'
                    : 'Your actual waste photo will be published with this listing.'}
                </span>
              </div>
              <button
                type="button"
                onClick={resetPhoto}
                className="rounded-lg border border-white/6 bg-white/4 hover:bg-white/8 px-3 py-1.5 text-[10px] font-bold text-[#FFFFFF] transition-colors shrink-0 cursor-pointer"
              >
                Replace Photo
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="flex h-full flex-col bg-[#0A0A0A] text-[#FFFFFF] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/6 bg-[#141414]/90 px-4 py-4 backdrop-blur-md shrink-0">
        <button
          onClick={handlePrev}
          disabled={isPublishing}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-[#FFFFFF] hover:bg-white/8 transition cursor-pointer"
        >
          Back
        </button>
        <span className="font-display text-lg font-bold tracking-tight">Post Food Waste</span>
        <span className="w-[52px]" />
      </div>

      <div className="w-full bg-[#141414] py-3.5 border-b border-white/6 px-4 shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {activeSteps.map((step, index) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  stepIndex === index
                    ? 'bg-[#A8D97F] text-[#1A3A05] scale-110 shadow-lg'
                    : stepIndex > index
                      ? 'bg-[#2A4A10] text-[#A8D97F]'
                      : 'bg-[#1B1B1B] text-[#525252] border border-white/6'
                }`}
              >
                {index + 1}
              </div>
              {index < activeSteps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    stepIndex > index ? 'bg-[#2A4A10]' : 'bg-[#1B1B1B]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto px-6 py-6 scrollbar-none">
        {autoDetectMessage && currentStep !== 'detect' ? (
          <div className={`mb-5 rounded-2xl border px-4 py-3 text-[11px] leading-relaxed ${
            autoDetectState === 'failed'
              ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
              : 'border-[#A8D97F]/20 bg-[#2A4A10]/20 text-[#D6F1BB]'
          }`}>
            {autoDetectMessage}
          </div>
        ) : null}

        {currentStep === 'method' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">How do you want to post this listing?</h2>
              <p className="text-xs text-[#A3A3A3]">
                Start with AI photo detection or continue with the existing manual listing flow.
              </p>
            </div>

            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => updateMethod('auto')}
                className={`rounded-3xl border p-5 text-left transition-all cursor-pointer ${
                  postingMethod === 'auto'
                    ? 'border-[#A8D97F] bg-[#2A4A10]/35 shadow-lg shadow-[#A8D97F]/5'
                    : 'border-white/8 bg-[#141414] hover:border-white/14'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="inline-flex rounded-2xl border border-[#A8D97F]/20 bg-[#2A4A10]/50 p-2 text-[#A8D97F]">
                      <Bot size={18} />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-sm font-black text-[#FFFFFF]">Auto detect from photo</span>
                      <span className="block text-[11px] leading-relaxed text-[#A3A3A3]">
                        Take or upload a waste photo and infer the waste category plus a short description automatically.
                      </span>
                    </div>
                  </div>
                  {postingMethod === 'auto' ? (
                    <span className="rounded-full bg-[#A8D97F] px-2 py-1 text-[9px] font-black text-[#1A3A05]">
                      PRIMARY
                    </span>
                  ) : null}
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateMethod('manual')}
                className={`rounded-3xl border p-5 text-left transition-all cursor-pointer ${
                  postingMethod === 'manual'
                    ? 'border-[#A8D97F] bg-[#2A4A10]/20 shadow-lg shadow-[#A8D97F]/5'
                    : 'border-white/8 bg-[#141414] hover:border-white/14'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-2 text-[#FFFFFF]">
                      <UserRoundPen size={18} />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-sm font-black text-[#FFFFFF]">Enter details manually</span>
                      <span className="block text-[11px] leading-relaxed text-[#A3A3A3]">
                        Use the current posting flow and fill in the category, description, handoff, and photo yourself.
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'detect' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Auto detect common details</h2>
              <p className="text-xs text-[#A3A3A3]">
                Upload a waste photo first. AI will infer the category and a short description, then you can review the result.
              </p>
            </div>

            {renderPhotoCard(true)}

            {autoDetectMessage ? (
              <div className={`rounded-2xl border px-4 py-3 text-[11px] leading-relaxed ${
                autoDetectState === 'failed'
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                  : 'border-[#A8D97F]/20 bg-[#2A4A10]/20 text-[#D6F1BB]'
              }`}>
                {autoDetectMessage}
              </div>
            ) : null}
          </div>
        )}

        {currentStep === 'details' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Describe your organic material</h2>
              <p className="text-xs text-[#A3A3A3]">
                {postingMethod === 'auto'
                  ? 'Review the inferred fields and adjust anything that looks off before publishing.'
                  : 'Choose a precise title so composters can identify quality.'}
              </p>
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
                      onClick={() => setCategory(cat.slug)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        resolvedCategory === cat.slug
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

        {currentStep === 'quantity' && (
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

        {currentStep === 'photo' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Add details and handoff instructions</h2>
              <p className="text-xs text-[#A3A3A3]">
                {postingMethod === 'auto'
                  ? 'The short description was inferred from the uploaded photo. Edit it if you need to add factual context.'
                  : 'Describe your organic material and attach a real photo from your device.'}
              </p>
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

              {postingMethod !== 'auto' && renderPhotoCard(false)}

              <div className="space-y-3 pt-4 border-t border-white/6">
                <div className="flex items-center gap-1.5 text-[#A8D97F]">
                  <MessageSquare size={14} />
                  <span className="text-xs font-black uppercase tracking-wider">Handoff Coordination</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setClaimType('direct')}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      claimType === 'direct'
                        ? 'bg-[#2A4A10]/40 border-[#A8D97F] text-[#FFFFFF] shadow-lg shadow-[#A8D97F]/5'
                        : 'bg-[#141414] border-white/6 text-[#A3A3A3] hover:border-white/12'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-1.5 rounded-lg ${claimType === 'direct' ? 'bg-[#A8D97F] text-[#1A3A05]' : 'bg-white/5 text-[#A3A3A3]'}`}>
                        <Zap size={16} />
                      </div>
                      {claimType === 'direct' ? (
                        <span className="h-2 w-2 rounded-full bg-[#A8D97F] animate-pulse" />
                      ) : null}
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-[#FFFFFF]">Direct Claim</span>
                      <span className="block text-[10px] leading-relaxed text-[#A3A3A3]">
                        Anyone can claim instantly without approval. Good for fast loops.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClaimType('message')}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      claimType === 'message'
                        ? 'bg-[#2A4A10]/40 border-[#A8D97F] text-[#FFFFFF] shadow-lg shadow-[#A8D97F]/5'
                        : 'bg-[#141414] border-white/6 text-[#A3A3A3] hover:border-white/12'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-1.5 rounded-lg ${claimType === 'message' ? 'bg-[#A8D97F] text-[#1A3A05]' : 'bg-white/5 text-[#A3A3A3]'}`}>
                        <MessageSquare size={16} />
                      </div>
                      {claimType === 'message' ? (
                        <span className="h-2 w-2 rounded-full bg-[#A8D97F] animate-pulse" />
                      ) : null}
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-[#FFFFFF]">Message Me First</span>
                      <span className="block text-[10px] leading-relaxed text-[#A3A3A3]">
                        Requires other users to message you first. Best for coordination.
                      </span>
                    </div>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#A3A3A3]">Pickup details saved to listing</label>
                  <textarea
                    placeholder="e.g. Pickup at rear service gate, weekdays 2-5 PM. Message on arrival for bin handoff."
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-4 text-sm text-[#FFFFFF] focus:border-[#A8D97F] focus:outline-none resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-[#6F6F6F] leading-relaxed">
                    This is stored in the real <span className="font-mono text-[#A3A3A3]">pickup_address</span> field. Share a meetup spot or handoff instructions, not private sensitive details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Confirm details & publish</h2>
              <p className="text-xs text-[#A3A3A3]">Double-check metrics before adding to the circular feed.</p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-[#141414] overflow-hidden shadow-xl">
              <div className="relative aspect-video w-full bg-stone-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPhoto} alt="Review Post" className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141414] px-3 py-1 text-xs font-bold text-[#FFFFFF] border border-white/10">
                    <CategoryIcon slug={resolvedCategory} size={11} style={{ color: activeCategory.color }} />
                    <span>{activeCategory.label}</span>
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold text-[#FFFFFF]">{title}</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#A3A3A3]">
                    {postingMethod === 'auto' ? 'Auto Detect' : 'Manual'}
                  </span>
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-2">{description}</p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#A8D97F] bg-[#2A4A10]/40 px-3 py-1.5 rounded-lg border border-[#A8D97F]/10 font-bold">
                    <Scale size={14} />
                    <span>Handoff weight: {quantity} {unit}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#A8D97F] bg-[#2A4A10]/40 px-3 py-1.5 rounded-lg border border-[#A8D97F]/10 font-bold">
                    {claimType === 'direct' ? <Zap size={14} /> : <MessageSquare size={14} />}
                    <span>Claim Type: {claimType === 'direct' ? 'Direct Claim' : 'Message First'}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/6 bg-[#0A0A0A] px-3 py-3">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#A8D97F]">Pickup Details</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#A3A3A3]">{pickupAddress}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 text-[10px] text-[#A3A3A3] leading-relaxed px-1">
              <Info size={14} className="text-[#A8D97F] shrink-0" />
              <span>By publishing, you agree to store this batch safely and coordinate pickup details promptly. You will unlock +25 XP upon completion.</span>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-40 border-t border-white/6 bg-[#141414]/90 backdrop-blur-md px-6 py-4 pb-safe shrink-0">
        <div className="max-w-md mx-auto flex gap-3">
          {stepIndex > 0 ? (
            <button
              onClick={handlePrev}
              disabled={isPublishing}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#141414] px-4 py-3.5 text-xs font-bold text-[#FFFFFF] hover:bg-[#1B1B1B] transition flex-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : null}

          {currentStep !== 'review' ? (
            <button
              onClick={handleNext}
              disabled={autoDetectState === 'running'}
              className="flex items-center justify-center gap-1 rounded-xl bg-[#A8D97F] px-4 py-3.5 text-xs font-black text-[#1A3A05] transition hover:brightness-105 active:scale-98 flex-1 cursor-pointer disabled:opacity-60"
            >
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#A8D97F] px-4 py-3.5 text-xs font-black text-[#1A3A05] transition hover:brightness-105 active:scale-98 flex-1 shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{isPublishing ? 'Publishing...' : 'Publish Listing'}</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
