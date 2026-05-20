'use client';

import * as React from 'react';

export default function ThemeSync() {
  React.useEffect(() => {
    const applyTheme = () => {
      try {
        const theme = localStorage.getItem('fl_appearance_theme') || 'Forest HSL';
        const density = localStorage.getItem('fl_appearance_density') || 'Comfortable';
        const highContrast = localStorage.getItem('fl_high_contrast') === 'true';
        const reduceMotion = localStorage.getItem('fl_reduce_motion') === 'true';

        const root = document.documentElement;

        // Apply theme class
        if (theme === 'Classic Dark') {
          root.classList.add('theme-classic-dark');
        } else {
          root.classList.remove('theme-classic-dark');
        }

        // Apply density class
        root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
        if (density === 'Compact') {
          root.classList.add('density-compact');
        } else if (density === 'Spacious') {
          root.classList.add('density-spacious');
        } else {
          root.classList.add('density-comfortable');
        }

        // Apply accessibility toggles
        if (highContrast) {
          root.classList.add('high-contrast');
        } else {
          root.classList.remove('high-contrast');
        }

        if (reduceMotion) {
          root.classList.add('reduce-motion');
        } else {
          root.classList.remove('reduce-motion');
        }
      } catch (e) {
        console.warn("Theme synchronization failed:", e);
      }
    };

    // Run on initial mount
    applyTheme();

    // Listen to theme-change events
    window.addEventListener('theme-change', applyTheme);
    return () => {
      window.removeEventListener('theme-change', applyTheme);
    };
  }, []);

  return null;
}
