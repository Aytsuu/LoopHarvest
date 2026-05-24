"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Bell,
  Mail,
  Smartphone,
  Info,
} from "lucide-react";
import StarsBackground from "@/components/StarsBackground";
import { apiClient } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { notificationService } from "@/lib/api/notifications";
import type { ApiSurveyPayload } from "@/lib/api/types";

interface SurveyOption {
  value: string;
  icon: string;
  label: string;
  desc: string;
}

interface StepMarker {
  value: number;
  label: string;
}

interface SurveyStep {
  id: string;
  label: string;
  headline: string;
  subtext: string;
  type: "single-select" | "multi-select" | "slider" | "toggle-list" | "notification-prefs";
  required: boolean;
  options?: SurveyOption[];
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  unit?: string;
  markers?: StepMarker[];
  maxSelect?: number;
  items?: Array<{
    id: string;
    default: boolean;
    locked: boolean;
    label: string;
    desc: string;
  }>;
  channels?: Array<{
    id: string;
    icon: string;
    label: string;
    desc: string;
    default: boolean;
  }>;
  frequency_options?: Array<{
    value: string;
    label: string;
    desc: string;
  }>;
}

const STEPS: SurveyStep[] = [
  {
    id: "purpose",
    label: "Your Purpose",
    headline: "Why are you joining LoopHarvest?",
    subtext: "This helps us tailor your feed and recommendations.",
    type: "multi-select",
    required: true,
    options: [
      { value: "personal",     icon: "🏠", label: "Personal Use",       desc: "Reduce household food waste" },
      { value: "business",     icon: "🍽️", label: "Business",           desc: "Restaurant, café, or food vendor" },
      { value: "organization", icon: "🏛️", label: "Organization / NGO", desc: "Community program or non-profit" },
      { value: "research",     icon: "🔬", label: "Research",            desc: "Academic or policy research" },
      { value: "farming",      icon: "🌾", label: "Urban Farming",       desc: "Composting, growing, or livestock" },
      { value: "education",    icon: "📚", label: "Education",           desc: "Teaching sustainability practices" },
      { value: "government",   icon: "🏗️", label: "Government / LGU",   desc: "Municipal waste programs" },
      { value: "other",        icon: "✦",  label: "Something else",      desc: "Tell us more below" },
    ],
  },
  {
    id: "role",
    label: "Your Role",
    headline: "How do you see yourself on the platform?",
    subtext: "You can do both — we just want to understand your primary intent.",
    type: "single-select",
    required: true,
    options: [
      { value: "donor",     icon: "📤", label: "Mostly a Donor",     desc: "I have food waste to give away" },
      { value: "recipient", icon: "📥", label: "Mostly a Recipient", desc: "I'm looking for specific waste inputs" },
      { value: "both",      icon: "🔄", label: "Both equally",       desc: "I give and receive depending on the season" },
      { value: "observer",  icon: "👀", label: "Just Exploring",     desc: "Browsing for now, no commitments" },
    ],
  },
  {
    id: "waste_types",
    label: "Waste Interests",
    headline: "Which waste types matter to you?",
    subtext: "We'll prioritize these in your feed and match alerts.",
    type: "multi-select",
    required: true,
    options: [
      { value: "vegetable",  icon: "🥬", label: "Vegetable Scraps",  desc: "Peels, tops, trimmings" },
      { value: "coffee",     icon: "☕", label: "Coffee Grounds",    desc: "Spent espresso, filter grounds" },
      { value: "fruit",      icon: "🍊", label: "Fruit Waste",       desc: "Skins, pulp, cores" },
      { value: "grain",      icon: "🌾", label: "Spent Grain",       desc: "Brewery mash, bran" },
      { value: "bread",      icon: "🍞", label: "Stale Bread",       desc: "Day-old loaves, bakery ends" },
      { value: "fish",       icon: "🐟", label: "Fish Scraps",       desc: "Bones, heads, shells" },
      { value: "oil",        icon: "🫙", label: "Cooking Oil",       desc: "Used frying or wok oil" },
      { value: "dairy",      icon: "🥛", label: "Dairy By-products", desc: "Whey, buttermilk, rinds" },
      { value: "compost",    icon: "🪱", label: "Mixed Compost",     desc: "Any organic matter for soil" },
      { value: "surplus",    icon: "🥡", label: "Surplus Meals",     desc: "Cooked food, catering leftovers" },
    ],
  },
  {
    id: "frequency",
    label: "Frequency",
    headline: "How often do you expect to use LoopHarvest?",
    subtext: "We'll adjust notification frequency and digest timing to match.",
    type: "single-select",
    required: true,
    options: [
      { value: "daily",    icon: "📆", label: "Daily",             desc: "I generate or need waste every day" },
      { value: "weekly",   icon: "🗓️", label: "A few times a week", desc: "Regular but not constant" },
      { value: "monthly",  icon: "📅", label: "Monthly",           desc: "Occasional, project-based use" },
      { value: "seasonal", icon: "🍂", label: "Seasonal",          desc: "Harvest seasons, event-driven" },
    ],
  },
  {
    id: "location_radius",
    label: "Your Reach",
    headline: "How far will you travel for an exchange?",
    subtext: "We use this to set your default search radius on the map.",
    type: "slider",
    required: true,
    min: 1,
    max: 50,
    step: 1,
    default: 5,
    unit: "km",
    markers: [
      { value: 1,  label: "1km\nMy block" },
      { value: 5,  label: "5km\nNeighborhood" },
      { value: 15, label: "15km\nCity" },
      { value: 30, label: "30km\nRegion" },
      { value: 50, label: "50km\nAnywhere" },
    ],
  },
  {
    id: "goals",
    label: "Your Goals",
    headline: "What do you most want from LoopHarvest?",
    subtext: "Pick up to 3. This shapes your dashboard and AI suggestions.",
    type: "multi-select",
    maxSelect: 3,
    required: true,
    options: [
      { value: "reduce_waste",    icon: "♻️", label: "Reduce my waste",       desc: "Stop sending organics to landfill" },
      { value: "save_money",      icon: "💰", label: "Save money",            desc: "Get free inputs instead of buying" },
      { value: "earn_points",     icon: "🏆", label: "Earn Loop Points",      desc: "Climb the leaderboard" },
      { value: "track_impact",    icon: "📊", label: "Track my impact",       desc: "See CO₂ and water saved" },
      { value: "find_inputs",     icon: "🌱", label: "Find specific inputs",  desc: "Coffee grounds, grain, compost" },
      { value: "build_community", icon: "🤝", label: "Build community",       desc: "Connect with local eco-minded people" },
      { value: "meet_compliance", icon: "📋", label: "Meet sustainability goals", desc: "ESG reporting, zero-waste targets" },
      { value: "experiment",      icon: "🧪", label: "Experiment & learn",    desc: "Try fermentation, composting, etc." },
    ],
  },
  {
    id: "ai_consent",
    label: "Personalization",
    headline: "Help us personalize your experience",
    subtext: "LoopHarvest's AI learns from your activity to surface better matches.",
    type: "toggle-list",
    required: false,
    items: [
      {
        id: "ai_recommendations",
        default: true,
        locked: false,
        label: "Smart recommendations",
        desc: "Surface listings and requests that match your patterns — category, distance, timing.",
      },
      {
        id: "ai_auto_tag",
        default: true,
        locked: false,
        label: "AI photo tagging",
        desc: "When you post a listing, automatically identify the waste category from your photo.",
      },
      {
        id: "ai_impact_insights",
        default: true,
        locked: false,
        label: "Impact insights",
        desc: "Weekly AI-generated summaries of your environmental impact and how to improve it.",
      },
      {
        id: "ai_match_alerts",
        default: true,
        locked: false,
        label: "Predictive match alerts",
        desc: "Notify you before a match disappears — based on how fast similar listings get claimed.",
      },
      {
        id: "data_improvement",
        default: false,
        locked: false,
        label: "Contribute to platform improvement",
        desc: "Allow anonymized activity data to improve matching for the whole community.",
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    headline: "How do you want to hear from us?",
    subtext: "You can fine-tune this anytime in Settings.",
    type: "notification-prefs",
    required: false,
    channels: [
      { id: "push",  icon: "🔔", label: "Push notifications", desc: "Real-time alerts on this device", default: false },
      { id: "email", icon: "📧", label: "Email",              desc: "Daily digest or instant for urgent", default: true  },
    ],
    frequency_options: [
      { value: "instant", label: "Instant",     desc: "Every event immediately" },
      { value: "daily",   label: "Daily digest", desc: "One email at 8am" },
      { value: "weekly",  label: "Weekly",       desc: "Monday morning summary" },
    ],
  },
];

type OnboardingAnswers = Omit<ApiSurveyPayload, "role" | "frequency"> & {
  role: ApiSurveyPayload["role"] | "";
  frequency: ApiSurveyPayload["frequency"] | "";
};

const DEFAULT_SURVEY_ANSWERS: OnboardingAnswers = {
  purpose: [],
  role: "",
  waste_types: [],
  frequency: "",
  location_radius: 5,
  goals: [],
  ai_consent: {
    ai_recommendations: true,
    ai_auto_tag: true,
    ai_impact_insights: true,
    ai_match_alerts: true,
    data_improvement: false,
  },
  notifications: {
    channels: { push: false, email: true },
    frequency: "daily",
  },
};

function buildNotificationTypePreferences(answers: OnboardingAnswers) {
  return {
    listing_claimed: { in_app: true, push: answers.notifications.channels.push, email: answers.notifications.channels.email },
    listing_completed: { in_app: true, push: false, email: false },
    request_fulfilled: { in_app: true, push: answers.notifications.channels.push, email: answers.notifications.channels.email },
    message_received: { in_app: true, push: answers.notifications.channels.push, email: false },
    match_found: { in_app: true, push: answers.notifications.channels.push, email: answers.notifications.channels.email },
    request_nearby: { in_app: true, push: answers.notifications.channels.push, email: false },
    review_received: { in_app: true, push: false, email: false },
    loop_points_milestone: { in_app: true, push: false, email: false },
    maintenance_scheduled: { in_app: true, push: false, email: false },
    account_security: { in_app: true, push: answers.notifications.channels.push, email: true },
    release_minor: { in_app: true, push: false, email: false },
    release_breaking: { in_app: true, push: true, email: true },
  };
}

function toSurveyPayload(answers: OnboardingAnswers): ApiSurveyPayload {
  return {
    ...answers,
    role: answers.role || "both",
    frequency: answers.frequency || "weekly",
  };
}

export default function UserSurveyPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  const [answers, setAnswers] = React.useState<OnboardingAnswers>(DEFAULT_SURVEY_ANSWERS);

  const [validationError, setValidationError] = React.useState("");
  const [isFinishing, setIsFinishing] = React.useState(false);
  const [finishingStep, setFinishingStep] = React.useState(0);

  const completeSurveyRedirect = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login?next=/survey");
          return;
        }

        const existingSurvey = await apiClient.getCurrentUserSurvey();
        if (existingSurvey) {
          router.replace("/home");
          return;
        }
      } catch (err) {
        console.error("Auth session error:", err);
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    };
    checkSession();
    return () => {
      isMounted = false;
      if (completeSurveyRedirect.current) {
        clearTimeout(completeSurveyRedirect.current);
      }
    };
  }, [router]);

  const activeStep = STEPS[currentStepIndex];

  // Helper to validate current step constraints before proceeding
  const isStepValid = React.useCallback(() => {
    if (!activeStep.required) return true;

    switch (activeStep.id) {
      case "purpose":
        return answers.purpose.length > 0;
      case "role":
        return answers.role !== "";
      case "waste_types":
        return answers.waste_types.length > 0;
      case "frequency":
        return answers.frequency !== "";
      case "location_radius":
        return answers.location_radius > 0;
      case "goals":
        return answers.goals.length > 0;
      default:
        return true;
    }
  }, [activeStep, answers]);

  const handleNext = () => {
    if (!isStepValid()) {
      setValidationError("Please select an option to proceed.");
      return;
    }
    setValidationError("");

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    setValidationError("");
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    setIsFinishing(true);
    setFinishingStep(0);

    const interval = setInterval(() => {
      setFinishingStep((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          return 3;
        }
        return prev + 1;
      });
    }, 900);

    try {
      const supabase = createClient();
      const surveyPayload = toSurveyPayload(answers);
      await apiClient.saveCurrentUserSurvey(surveyPayload);

      setFinishingStep(3);

      const saveSettingsPromise = notificationService.saveSettings(supabase, {
        alertRadius: answers.location_radius,
        pushAlerts: answers.notifications.channels.push,
        emailDigest: answers.notifications.channels.email,
        emailDigestFrequency: answers.notifications.channels.email
          ? (answers.notifications.frequency === "instant" ? "realtime" : answers.notifications.frequency)
          : "never",
        ecoReports: answers.ai_consent.ai_impact_insights,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        typePreferences: buildNotificationTypePreferences(answers),
      });

      void Promise.race([
        saveSettingsPromise,
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]).catch((error) => {
        console.error("Failed to persist onboarding notification settings:", error);
      });

      clearInterval(interval);
      completeSurveyRedirect.current = setTimeout(() => {
        router.replace("/home");
        router.refresh();
      }, 900);
    } catch (err) {
      console.error("Failed to persist onboarding preferences:", err);
      clearInterval(interval);
      setIsFinishing(false);
      setValidationError(err instanceof Error ? err.message : "We couldn't save your survey yet.");
      return;
    } finally {
      clearInterval(interval);
    }
  };



  const handleToggleMultiSelect = (stepId: "purpose" | "waste_types" | "goals", value: string, maxSelect?: number) => {
    setValidationError("");
    setAnswers((prev) => {
      const currentSelection = [...prev[stepId]];
      const index = currentSelection.indexOf(value);

      if (index > -1) {
        currentSelection.splice(index, 1);
      } else {
        if (maxSelect && currentSelection.length >= maxSelect) {
          setValidationError(`You can select at most ${maxSelect} goals. Uncheck one to choose another.`);
          return prev;
        }
        currentSelection.push(value);
      }

      return {
        ...prev,
        [stepId]: currentSelection,
      };
    });
  };

  const handleSingleSelect = (stepId: "role" | "frequency", value: string) => {
    setValidationError("");
    setAnswers((prev) => ({
      ...prev,
      [stepId]: value,
    }));
  };

  const handleSliderChange = (value: number) => {
    setAnswers((prev) => ({
      ...prev,
      location_radius: value,
    }));
  };

  const handleToggleAiConsent = (itemId: string) => {
    setAnswers((prev) => ({
      ...prev,
      ai_consent: {
        ...prev.ai_consent,
        [itemId]: !prev.ai_consent[itemId],
      },
    }));
  };

  const handleToggleNotificationChannel = (channelId: "push" | "email") => {
    setAnswers((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        channels: {
          ...prev.notifications.channels,
          [channelId]: !prev.notifications.channels[channelId],
        },
      },
    }));
  };

  const handleNotificationFrequencyChange = (freqValue: "instant" | "daily" | "weekly") => {
    setAnswers((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        frequency: freqValue,
      },
    }));
  };

  if (loadingUser) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-[#0A0A0A] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-[#A8D97F]" />
          <p className="text-xs font-bold text-[#A3A3A3] tracking-widest uppercase animate-pulse">
            Verifying secure session...
          </p>
        </div>
      </main>
    );
  }

  if (isFinishing) {
    return (
      <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4">
        <div className="absolute inset-0 z-0 select-none opacity-40 pointer-events-none">
          <StarsBackground />
        </div>
        <div className="relative z-10 w-full max-w-md rounded-[2.5rem] border border-white/8 bg-[#141414]/90 p-10 text-center shadow-[0_16px_48px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-scale-in">
          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#1A3A05]/40 border border-[#A8D97F]/30 shadow-[0_0_30px_rgba(168,217,127,0.15)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LoopHarvest" className="h-12 w-12 object-contain animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#A8D97F] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>

          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#FFFFFF]">
            Configuring Your Ecosystem
          </h2>
          <p className="mt-2 text-sm text-[#A3A3A3]">
            LoopHarvest is crafting your hyperlocal feed...
          </p>

          <div className="mt-10 space-y-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A8D97F]/10 border border-[#A8D97F]/30 text-[#A8D97F]">
                {finishingStep >= 0 ? <Check size={12} strokeWidth={3} className="animate-scale-in" /> : <Loader2 size={12} className="animate-spin" />}
              </div>
              <span className={`text-sm font-bold transition-all ${finishingStep >= 0 ? 'text-white' : 'text-[#525252]'}`}>
                Synchronizing user profile metadata
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A8D97F]/10 border border-[#A8D97F]/30 text-[#A8D97F]">
                {finishingStep >= 1 ? (
                  <Check size={12} strokeWidth={3} className="animate-scale-in" />
                ) : finishingStep === 0 ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                )}
              </div>
              <span className={`text-sm font-bold transition-all ${finishingStep >= 1 ? 'text-white' : 'text-[#525252]'}`}>
                Setting alert radius to {answers.location_radius}km
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A8D97F]/10 border border-[#A8D97F]/30 text-[#A8D97F]">
                {finishingStep >= 2 ? (
                  <Check size={12} strokeWidth={3} className="animate-scale-in" />
                ) : finishingStep === 1 ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                )}
              </div>
              <span className={`text-sm font-bold transition-all ${finishingStep >= 2 ? 'text-white' : 'text-[#525252]'}`}>
                Calibrating smart digest buffers
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#A8D97F]/10 border border-[#A8D97F]/30 text-[#A8D97F]">
                {finishingStep >= 3 ? (
                  <Check size={12} strokeWidth={3} className="animate-scale-in" />
                ) : finishingStep === 2 ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                )}
              </div>
              <span className={`text-sm font-bold transition-all ${finishingStep >= 3 ? 'text-white' : 'text-[#525252]'}`}>
                Perfecting circular economy parameters
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex h-screen w-screen flex-col bg-[#0A0A0A] overflow-hidden select-none">
      {/* Premium ambient glows */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#A8D97F]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#E8A838]/3 blur-[120px] pointer-events-none" />

      {/* Star Field background */}
      <div className="absolute inset-0 z-0 select-none opacity-30 pointer-events-none">
        <StarsBackground />
      </div>

      {/* Header with branding and progress */}
      <header className="relative z-10 w-full shrink-0 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="LoopHarvest" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-black tracking-tight text-[#A8D97F]">
              LoopHarvest
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider">
              Onboarding
            </span>
          </div>

          {/* Step Indicator Bullets with Connected Line Tracks */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <div
                      className={`h-[2px] w-2 sm:w-4 transition-all duration-300 ${
                        index <= currentStepIndex ? "bg-[#A8D97F]" : "bg-white/10"
                      }`}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (index < currentStepIndex || isStepValid()) {
                        setCurrentStepIndex(index);
                      }
                    }}
                    disabled={index > currentStepIndex && !isStepValid()}
                    className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
                      isCompleted
                        ? "bg-[#A8D97F] text-[#1A3A05] hover:brightness-115"
                        : isActive
                        ? "bg-[#141414] text-[#A8D97F] border-2 border-[#A8D97F] shadow-[0_0_12px_rgba(168,217,127,0.3)]"
                        : "bg-[#141414] text-[#525252] border border-white/10"
                    }`}
                    title={step.label}
                  >
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : index + 1}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Body - Scrollable Container */}
      <div className="relative z-10 flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <section className="max-w-3xl mx-auto px-6 py-8 sm:py-12 md:py-16 flex flex-col justify-center min-h-full">
          <div key={currentStepIndex} className="animate-fade-in-up space-y-8">
            {/* Step header details */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#A8D97F] tracking-widest uppercase">
                Step {currentStepIndex + 1} of {STEPS.length} • {activeStep.label}
              </span>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {activeStep.headline}
              </h1>
              <p className="text-sm sm:text-base text-[#A3A3A3] max-w-xl">
                {activeStep.subtext}
              </p>
            </div>

            {/* Validation display */}
            {validationError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-xs font-bold text-[#FFB4AB] flex items-center gap-2.5 animate-scale-in">
                <Info size={14} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* STEP CONTROLS SWITCH */}
            <div className="min-h-[250px]">
              {/* 1. SINGLE-SELECT / MULTI-SELECT OPTION CARDS */}
              {(activeStep.type === "single-select" || activeStep.type === "multi-select") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeStep.options?.map((opt) => {
                    const isSelected =
                      activeStep.type === "multi-select"
                        ? (answers[activeStep.id as "purpose" | "waste_types" | "goals"] as string[]).includes(opt.value)
                        : (answers[activeStep.id as "role" | "frequency"] as string) === opt.value;

                    const isDisabled =
                      activeStep.type === "multi-select" &&
                      activeStep.maxSelect !== undefined &&
                      !isSelected &&
                      (answers[activeStep.id as "purpose" | "waste_types" | "goals"] as string[]).length >= activeStep.maxSelect;

                    return (
                      <button
                        key={opt.value}
                        disabled={isDisabled}
                        onClick={() => {
                          if (activeStep.type === "multi-select") {
                            handleToggleMultiSelect(
                              activeStep.id as "purpose" | "waste_types" | "goals",
                              opt.value,
                              activeStep.maxSelect
                            );
                          } else {
                            handleSingleSelect(activeStep.id as "role" | "frequency", opt.value);
                          }
                        }}
                        className={`group flex items-start text-left gap-4 rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${
                          isSelected
                            ? "border-[#A8D97F] bg-[#A8D97F]/10 shadow-[0_4px_20px_rgba(168,217,127,0.15)] active:scale-[0.98]"
                            : isDisabled
                            ? "border-white/4 bg-[#141414]/20 opacity-30 cursor-not-allowed"
                            : "border-white/8 bg-[#141414]/40 hover:border-white/18 hover:bg-[#141414]/80 hover:shadow-lg active:scale-[0.98]"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold transition-all ${
                            isSelected
                              ? "bg-[#A8D97F] text-[#1A3A05]"
                              : "bg-[#1B1B1B] text-white border border-white/6 group-hover:bg-[#2A2A2A]"
                          }`}
                        >
                          {opt.icon}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="font-bold text-sm text-white flex items-center justify-between">
                            <span>{opt.label}</span>
                            {isSelected && (
                              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#A8D97F] text-[#1A3A05] animate-scale-in">
                                <Check size={10} strokeWidth={4} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-[#A3A3A3] leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. CUSTOM RANGE SLIDER */}
              {activeStep.type === "slider" && (
                <div className="py-8 space-y-10">
                  <div className="relative flex flex-col items-center">
                    <div className="rounded-full bg-[#1A3A05]/30 border border-[#A8D97F]/20 px-6 py-2.5 text-center shadow-md">
                      <span className="font-mono text-3xl font-black text-[#A8D97F]">
                        {answers.location_radius}
                      </span>
                      <span className="ml-1 text-xs font-bold text-[#A3A3A3] tracking-wider uppercase">
                        {activeStep.unit}
                      </span>
                    </div>
                  </div>

                  <div className="relative px-2">
                    <input
                      type="range"
                      min={activeStep.min}
                      max={activeStep.max}
                      step={activeStep.step}
                      value={answers.location_radius}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      className="h-2 w-full appearance-none rounded-full bg-[#141414] border border-white/10 outline-none accent-[#A8D97F] cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #A8D97F 0%, #A8D97F ${
                          ((answers.location_radius - (activeStep.min || 1)) /
                            ((activeStep.max || 50) - (activeStep.min || 1))) *
                          100
                        }%, #141414 ${
                          ((answers.location_radius - (activeStep.min || 1)) /
                            ((activeStep.max || 50) - (activeStep.min || 1))) *
                          100
                        }%, #141414 100%)`,
                      }}
                    />
                  </div>

                  {/* Snappable Markers */}
                  <div className="grid grid-cols-5 gap-2 px-1">
                    {activeStep.markers?.map((marker) => {
                      const isSelected = answers.location_radius === marker.value;
                      return (
                        <button
                          key={marker.value}
                          onClick={() => handleSliderChange(marker.value)}
                          className="flex flex-col items-center text-center gap-1.5 focus:outline-none group"
                        >
                          <div
                            className={`h-2.5 w-1 rounded-full transition-all duration-300 ${
                              isSelected
                                ? "h-4 bg-[#A8D97F]"
                                : "bg-white/25 group-hover:bg-white/40"
                            }`}
                          />
                          <span
                            className={`whitespace-pre-line text-[10px] leading-tight font-bold tracking-tight transition-all ${
                              isSelected ? "text-[#A8D97F] scale-105" : "text-[#525252] group-hover:text-[#A3A3A3]"
                            }`}
                          >
                            {marker.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. AI PERSONALIZATION TOGGLE LIST */}
              {activeStep.type === "toggle-list" && (
                <div className="space-y-4">
                  {activeStep.items?.map((item) => {
                    const isChecked = answers.ai_consent[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleToggleAiConsent(item.id)}
                        className={`group w-full flex items-center justify-between text-left gap-6 rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${
                          isChecked
                            ? "border-[#A8D97F]/30 bg-[#A8D97F]/4"
                            : "border-white/8 bg-[#141414]/40 hover:border-white/18"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 pr-4">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{item.label}</span>
                            {!item.locked && (
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-bold text-[#A3A3A3] border border-white/6 uppercase">
                                AI Powered
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-[#A3A3A3] leading-relaxed">
                            {item.desc}
                          </p>
                        </div>

                        {/* Sliding Toggle Pill Switch */}
                        <div
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
                            isChecked ? "bg-[#A8D97F]" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                              isChecked ? "translate-x-5" : ""
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. NOTIFICATION PREFERENCES PANEL */}
              {activeStep.type === "notification-prefs" && (
                <div className="space-y-8">
                  {/* Channels Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeStep.channels?.map((channel) => {
                      const isChecked = answers.notifications.channels[channel.id as "push" | "email"];
                      const Icon = channel.id === "push" ? Smartphone : Mail;

                      return (
                        <button
                          key={channel.id}
                          onClick={() => handleToggleNotificationChannel(channel.id as "push" | "email")}
                          className={`group flex items-center text-left gap-4 rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md ${
                            isChecked
                              ? "border-[#A8D97F] bg-[#A8D97F]/10 shadow-[0_4px_20px_rgba(168,217,127,0.1)]"
                              : "border-white/8 bg-[#141414]/40 hover:border-white/18 hover:bg-[#141414]/80"
                          }`}
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg transition-all ${
                              isChecked ? "bg-[#A8D97F] text-[#1A3A05]" : "bg-[#1B1B1B] text-white border border-white/6"
                            }`}
                          >
                            <Icon size={18} />
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <h4 className="font-bold text-sm text-white">
                              {channel.label}
                            </h4>
                            <p className="text-[11px] text-[#A3A3A3] leading-tight">
                              {channel.desc}
                            </p>
                          </div>

                          <div
                            className={`relative h-5 w-9 shrink-0 rounded-full transition-all duration-300 ${
                              isChecked ? "bg-[#A8D97F]" : "bg-white/10"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                                isChecked ? "translate-x-4" : ""
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Frequency options (Only displayed if email channel is checked) */}
                  {answers.notifications.channels.email && (
                    <div className="rounded-2xl border border-white/6 bg-[#141414]/20 p-6 space-y-4 animate-scale-in">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <Bell size={14} className="text-[#A8D97F]" />
                          <span>Email Digest Frequency</span>
                        </h4>
                        <p className="text-xs text-[#A3A3A3]">
                          How often would you like digest emails of nearby organic exchanges?
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {activeStep.frequency_options?.map((freq) => {
                          const isSelected = answers.notifications.frequency === freq.value;

                          return (
                            <button
                              key={freq.value}
                              onClick={() => handleNotificationFrequencyChange(freq.value as "instant" | "daily" | "weekly")}
                              className={`group rounded-xl border p-4 text-center transition-all duration-300 active:scale-[0.98] ${
                                isSelected
                                  ? "border-[#A8D97F] bg-[#A8D97F]/10 text-white"
                                  : "border-white/6 bg-[#141414]/50 text-[#A3A3A3] hover:border-white/15 hover:text-white"
                              }`}
                            >
                              <span className="font-bold text-xs block">
                                {freq.label}
                              </span>
                              <span className="text-[10px] text-[#525252] group-hover:text-[#A3A3A3] block mt-0.5">
                                {freq.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Action Footer Navigation Panel */}
      <div className="relative z-10 shrink-0 border-t border-white/5 bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 rounded-full border border-white/6 bg-[#141414]/60 px-5 py-2.5 text-xs font-bold text-[#A3A3A3] backdrop-blur-md transition-all hover:bg-white/4 hover:text-white active:scale-95 disabled:opacity-0 disabled:pointer-events-none group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>

          </div>

          <button
            onClick={handleNext}
            className="group flex items-center gap-2 rounded-full bg-[#A8D97F] px-6 py-2.5 text-xs font-black text-[#1A3A05] shadow-lg shadow-[#A8D97F]/10 transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <span>
              {currentStepIndex === STEPS.length - 1 ? "Complete Onboarding" : "Next Step"}
            </span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

    </main>
  );
}
