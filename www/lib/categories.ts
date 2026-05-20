export const CATEGORIES = [
  { slug: 'vegetable-scraps', label: 'Vegetable Scraps', color: '#7FFF6A', icon: '🥬', emoji: '🥬' },
  { slug: 'coffee-grounds',   label: 'Coffee Grounds',  color: '#C8855A', icon: '☕', emoji: '☕' },
  { slug: 'fruit-waste',      label: 'Fruit Waste',     color: '#FF9F40', icon: '🍊', emoji: '🍊' },
  { slug: 'spent-grain',      label: 'Spent Grain',     color: '#E5C55A', icon: '🌾', emoji: '🌾' },
  { slug: 'bread-stale',      label: 'Stale Bread',     color: '#D4A97A', icon: '🍞', emoji: '🍞' },
  { slug: 'fish-scraps',      label: 'Fish Scraps',     color: '#5AC8E5', icon: '🐟', emoji: '🐟' },
  { slug: 'fruit-peels',      label: 'Fruit Peels',     color: '#E57A5A', icon: '🍋', emoji: '🍋' },
  { slug: 'cooking-oil',      label: 'Cooking Oil',     color: '#B5E550', icon: '🫙', emoji: '🫙' },
  { slug: 'other',            label: 'Other',           color: '#A0A090', icon: '♻',  emoji: '♻' },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];
export const catMap = Object.fromEntries(CATEGORIES.map(c => [c.slug, c]));
