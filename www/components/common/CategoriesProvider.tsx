"use client";

import * as React from "react";

import { apiClient } from "@/lib/api/client";
import { FALLBACK_CATEGORIES, getCategoryBySlug, mergeCategories } from "@/lib/categories";
import type { AppCategory, CategorySlug } from "@/lib/categories";

interface CategoriesContextValue {
  categories: readonly AppCategory[];
  getCategory: (slug: CategorySlug) => AppCategory;
  loading: boolean;
}

const CategoriesContext = React.createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = React.useState<readonly AppCategory[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const rows = await apiClient.getCategories();
        if (!cancelled && rows.length > 0) {
          setCategories(mergeCategories(rows));
        }
      } catch {
        if (!cancelled) {
          setCategories(FALLBACK_CATEGORIES);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = React.useMemo<CategoriesContextValue>(
    () => ({
      categories,
      getCategory: (slug) => getCategoryBySlug(slug, categories),
      loading,
    }),
    [categories, loading],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = React.useContext(CategoriesContext);

  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider.");
  }

  return context;
}
