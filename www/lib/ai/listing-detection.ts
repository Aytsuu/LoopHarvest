import type { CategorySlug } from "@/lib/categories";

export type ListingDetectionResult = {
  categorySlug: CategorySlug;
  title: string;
  description: string;
};

type DetectionPayload = {
  category_slug?: string;
  category?: string;
  title?: string;
  short_title?: string;
  description?: string;
  short_description?: string;
};

const CATEGORY_SYNONYMS: Record<string, CategorySlug> = {
  "food scraps": "food-scraps",
  "food-scraps": "food-scraps",
  "spent grain": "spent-grain",
  "spent-grain": "spent-grain",
  "coffee grounds": "coffee-grounds",
  "coffee ground": "coffee-grounds",
  "coffee-grounds": "coffee-grounds",
  "vegetable scraps": "vegetable-scraps",
  "vegetable scrap": "vegetable-scraps",
  "vegetable-scraps": "vegetable-scraps",
  "fruit waste": "fruit-waste",
  "fruit wastes": "fruit-waste",
  "fruit-waste": "fruit-waste",
  "surplus meals": "surplus-meals",
  "surplus meal": "surplus-meals",
  "surplus-meals": "surplus-meals",
};

const CATEGORY_TITLES: Record<CategorySlug, string> = {
  "food-scraps": "Food Scraps Batch",
  "spent-grain": "Spent Grain Batch",
  "coffee-grounds": "Coffee Grounds Batch",
  "vegetable-scraps": "Vegetable Scraps Batch",
  "fruit-waste": "Fruit Waste Batch",
  "surplus-meals": "Surplus Meals Batch",
};

function stripCodeFence(value: string) {
  const fencedMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedMatch ? fencedMatch[1].trim() : value.trim();
}

function extractJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return value;
  }

  return value.slice(start, end + 1);
}

function normalizeCategory(value: string | null | undefined): CategorySlug | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.!,]/g, "");

  return CATEGORY_SYNONYMS[normalized] ?? null;
}

function sanitizeTitle(value: string | null | undefined, fallbackCategory: CategorySlug) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return CATEGORY_TITLES[fallbackCategory];
  }

  return trimmed.slice(0, 80);
}

function sanitizeDescription(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/\s+/g, " ").slice(0, 240);
}

function extractCategoryFromText(value: string): CategorySlug | null {
  const lowered = value.toLowerCase();
  for (const [candidate, slug] of Object.entries(CATEGORY_SYNONYMS)) {
    if (lowered.includes(candidate)) {
      return slug;
    }
  }

  return null;
}

export function buildListingDetectionPrompt() {
  return [
    "Classify the waste shown in this image for a donor listing form.",
    "Return valid JSON only with this exact shape:",
    '{"category_slug":"food-scraps|spent-grain|coffee-grounds|vegetable-scraps|fruit-waste|surplus-meals|unknown","title":"short title","description":"short factual description"}',
    "Rules:",
    "- Use only one category_slug from the allowed list.",
    "- If the image is too unclear to classify confidently, return category_slug as unknown.",
    "- Base the answer only on visible content in the image.",
    "- Keep title between 2 and 6 words.",
    "- Keep description to one short sentence under 20 words.",
    "- Do not wrap the JSON in markdown.",
  ].join("\n");
}

export function parseListingDetectionContent(content: string): ListingDetectionResult | null {
  const normalized = stripCodeFence(content);
  const extractedObject = extractJsonObject(normalized);

  let payload: DetectionPayload;

  try {
    payload = JSON.parse(extractedObject) as DetectionPayload;
  } catch {
    const categorySlug = extractCategoryFromText(normalized);
    if (!categorySlug) {
      return null;
    }

    const description = sanitizeDescription(normalized);
    if (!description) {
      return null;
    }

    return {
      categorySlug,
      title: CATEGORY_TITLES[categorySlug],
      description,
    };
  }

  const categorySlug = normalizeCategory(payload.category_slug ?? payload.category);
  if (!categorySlug) {
    return null;
  }

  const description = sanitizeDescription(payload.description ?? payload.short_description);
  if (!description) {
    return null;
  }

  return {
    categorySlug,
    title: sanitizeTitle(payload.title ?? payload.short_title, categorySlug),
    description,
  };
}
