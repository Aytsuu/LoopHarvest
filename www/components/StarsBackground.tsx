'use client';

import * as React from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
  speedMultiplier: number;
}

const STAR_COLORS = [
  'rgba(232, 234, 216, ', // White/warm-silver
  'rgba(255, 255, 255, ', // Pure white
  'rgba(168, 217, 127, ', // Brand green (#A8D97F)
  'rgba(232, 168, 56, ',  // Warm amber (#E8A838)
];

export default function StarsBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const starsRef = React.useRef<Star[]>([]);
  const mouseRef = React.useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Generate stars
    const generateStars = (w: number, h: number) => {
      const starCount = Math.floor((w * h) / 10000); // Proportional to screen area
      const stars: Star[] = [];

      for (let i = 0; i < starCount; i++) {
        // Decide color with specified weights
        const randomVal = Math.random();
        let colorPrefix = STAR_COLORS[0];
        if (randomVal > 0.85) {
          colorPrefix = STAR_COLORS[2]; // Brand Green
        } else if (randomVal > 0.77) {
          colorPrefix = STAR_COLORS[3]; // Warm Amber
        } else if (randomVal > 0.4) {
          colorPrefix = STAR_COLORS[1]; // Pure White
        }

        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 1.5 + 0.4, // Small, crisp stars
          alpha: Math.random(),
          twinkleSpeed: 0.005 + Math.random() * 0.015,
          phase: Math.random() * Math.PI * 2,
          color: colorPrefix,
          speedMultiplier: 0.1 + Math.random() * 0.9, // Parallax depth layer
        });
      }
      starsRef.current = stars;
    };

    generateStars(width, height);

    // Event listeners
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      generateStars(width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Scale mouse coords around center of viewport
      mouseRef.current.targetX = (e.clientX - window.innerWidth / 2) * -0.08;
      mouseRef.current.targetY = (e.clientY - window.innerHeight / 2) * -0.08;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Lerp mouse positions for ultra-smooth parallax motion
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const stars = starsRef.current;
      const len = stars.length;

      for (let i = 0; i < len; i++) {
        const star = stars[i];

        // Organic twinkling via sine wave phase
        star.phase += star.twinkleSpeed;
        const currentAlpha = 0.15 + 0.85 * Math.sin(star.phase);

        // Apply slow organic linear drift (top-left to bottom-right drift)
        // Keep within bounds via modulo wrapping
        const driftSpeedX = 0.02;
        const driftSpeedY = 0.01;
        
        let displayX = (star.x + driftSpeedX * star.speedMultiplier * Date.now() * 0.1 + mouseRef.current.x * star.speedMultiplier) % width;
        let displayY = (star.y + driftSpeedY * star.speedMultiplier * Date.now() * 0.1 + mouseRef.current.y * star.speedMultiplier) % height;

        // Correct negative values from modulo
        if (displayX < 0) displayX += width;
        if (displayY < 0) displayY += height;

        // Render the star with glow if slightly larger/brighter
        ctx.beginPath();
        ctx.fillStyle = `${star.color}${currentAlpha})`;
        
        if (star.size > 1.2 && currentAlpha > 0.7) {
          // Draw subtle glowing corona around bright stars
          ctx.shadowBlur = 4;
          ctx.shadowColor = star.color === STAR_COLORS[2] ? '#A8D97F' : (star.color === STAR_COLORS[3] ? '#E8A838' : '#FFFFFF');
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.arc(displayX, displayY, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0; // Reset shadow for next frame
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full pointer-events-none select-none"
    />
  );
}
