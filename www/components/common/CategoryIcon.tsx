'use client';

import * as React from 'react';
import { 
  RefreshCw, 
  Sprout, 
  Coffee, 
  Apple, 
  Wheat, 
  Utensils, 
  HelpCircle 
} from 'lucide-react';

interface CategoryIconProps {
  slug: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CategoryIcon({ 
  slug, 
  size = 14, 
  className = '', 
  style 
}: CategoryIconProps) {
  switch (slug) {
    case 'food-scraps':
      return <RefreshCw size={size} className={className} style={style} />;
    case 'vegetable-scraps':
      return <Sprout size={size} className={className} style={style} />;
    case 'coffee-grounds':
      return <Coffee size={size} className={className} style={style} />;
    case 'fruit-waste':
      return <Apple size={size} className={className} style={style} />;
    case 'spent-grain':
      return <Wheat size={size} className={className} style={style} />;
    case 'surplus-meals':
      return <Utensils size={size} className={className} style={style} />;
    default:
      return <HelpCircle size={size} className={className} style={style} />;
  }
}
