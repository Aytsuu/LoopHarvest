import type { ApiCategory } from "@/lib/api/types";

export type CategorySlug = string;

export interface CategoryPresentation {
  color: string;
  icon: string;
  emoji: string;
}

export interface AppCategory extends CategoryPresentation {
  slug: string;
  label: string;
  parentSlug: string | null;
  co2FactorPerKg: number | null;
  waterSavedLitersPerKg: number | null;
}

const DEFAULT_PRESENTATION: CategoryPresentation = {
  color: "#A0A090",
  icon: "other",
  emoji: "🌱",
};

const CATEGORY_PRESENTATIONS: Record<string, CategoryPresentation> = {
  "food-scraps": { color: "#A8D97F", icon: "scraps", emoji: "♻️" },
  "vegetable-scraps": { color: "#7FFF6A", icon: "scraps", emoji: "🥦" },
  "coffee-grounds": { color: "#C8855A", icon: "coffee", emoji: "☕" },
  "fruit-waste": { color: "#FF9F40", icon: "fruit", emoji: "🍎" },
  "spent-grain": { color: "#E5C55A", icon: "grain", emoji: "🌾" },
  "surplus-meals": { color: "#4ECDC4", icon: "meal", emoji: "🍱" },
};

const DEFAULT_CATEGORY_ROWS: ApiCategory[] = [
  { slug: "food-scraps", label: "Food Scraps", parent_slug: null, co2_factor_per_kg: "0.5", water_saved_liters_per_kg: "50" },
  { slug: "spent-grain", label: "Spent Grain", parent_slug: null, co2_factor_per_kg: "1.2", water_saved_liters_per_kg: "120" },
  { slug: "coffee-grounds", label: "Coffee Grounds", parent_slug: null, co2_factor_per_kg: "0.8", water_saved_liters_per_kg: "80" },
  { slug: "vegetable-scraps", label: "Vegetable Scraps", parent_slug: null, co2_factor_per_kg: "0.4", water_saved_liters_per_kg: "40" },
  { slug: "fruit-waste", label: "Fruit Waste", parent_slug: null, co2_factor_per_kg: "0.6", water_saved_liters_per_kg: "65" },
  { slug: "surplus-meals", label: "Surplus Meals", parent_slug: null, co2_factor_per_kg: "2.5", water_saved_liters_per_kg: "250" },
];

function toCategory(row: ApiCategory): AppCategory {
  const presentation = CATEGORY_PRESENTATIONS[row.slug] ?? DEFAULT_PRESENTATION;
  const parsedFactor = Number(row.co2_factor_per_kg);
  const parsedWater = Number(row.water_saved_liters_per_kg);

  return {
    slug: row.slug,
    label: row.label,
    parentSlug: row.parent_slug,
    co2FactorPerKg: Number.isFinite(parsedFactor) ? parsedFactor : null,
    waterSavedLitersPerKg: Number.isFinite(parsedWater) ? parsedWater : null,
    ...presentation,
  };
}

export function mergeCategories(rows: ApiCategory[]): AppCategory[] {
  return rows.map(toCategory);
}

export const FALLBACK_CATEGORIES = mergeCategories(DEFAULT_CATEGORY_ROWS);

export function getCategoryBySlug(
  slug: CategorySlug,
  categories: readonly AppCategory[] = FALLBACK_CATEGORIES,
): AppCategory {
  return categories.find((category) => category.slug === slug) ?? {
    slug,
    label: slug
      .split("-")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" "),
    parentSlug: null,
    co2FactorPerKg: null,
    waterSavedLitersPerKg: null,
    ...(CATEGORY_PRESENTATIONS[slug] ?? DEFAULT_PRESENTATION),
  };
}
