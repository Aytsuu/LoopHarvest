'use client';

import * as React from 'react';
import { useCategories } from '@/components/common/CategoriesProvider';
import type { CategorySlug } from '@/lib/categories';

interface CategoryChipProps {
  categorySlug: CategorySlug;
  selected?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

export default function CategoryChip({
  categorySlug,
  selected = false,
  onClick,
  interactive = true
}: CategoryChipProps) {
  const { getCategory } = useCategories();
  const cat = getCategory(categorySlug);

  const hex = cat.color;

  // Selected state: Translucent category color background with vibrant colored border & text
  const selectedStyle = {
    borderColor: hex,
    backgroundColor: `${hex}1A`, // 10% opacity
    color: hex,
    boxShadow: `0 0 10px ${hex}15`
  };

  // Badge state (non-interactive, on cards): Solid background with category color border and text
  const badgeStyle = {
    borderColor: `${hex}40`,
    backgroundColor: '#141414',
    color: hex
  };

  // Unselected/inactive filter chips: Clean, subtle glassmorphic backdrop
  const unselectedStyle = {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#141414',
    color: '#A3A3A3'
  };

  const currentStyle = selected 
    ? selectedStyle 
    : (interactive ? unselectedStyle : badgeStyle);

  const Tag = interactive ? 'button' : 'div';

  return (
    <Tag
      onClick={interactive ? onClick : undefined}
      style={currentStyle}
      className={`inline-flex items-center gap-2 h-8 px-2.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-200 select-none border ${
        interactive 
          ? 'cursor-pointer hover:text-[#FFFFFF] hover:border-white/20 hover:bg-white/5 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A8D97F]' 
          : ''
      }`}
    >
      {/* Circle emoji container to keep it structured and visually consistent */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs shadow-inner">
        {cat.emoji}
      </span>
      <span className="truncate pr-0.5">{cat.label}</span>
    </Tag>
  );
}
