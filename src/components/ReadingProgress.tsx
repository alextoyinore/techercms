'use client';

import { useState, useEffect, type RefObject } from 'react';
import { Progress } from '@/components/ui/progress';

type ReadingProgressProps = {
  targetRef: RefObject<HTMLElement>;
};

export function ReadingProgress({ targetRef }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const element = targetRef.current;
      if (element) {
        const { top, height } = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Calculate how much of the article is above the bottom of the viewport
        const scrolled = viewportHeight - top;

        // Calculate progress as a percentage of the article's total height
        const totalHeight = height;
        const scrollProgress = Math.min(Math.max((scrolled / totalHeight) * 100, 0), 100);

        setProgress(scrollProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [targetRef]);

  return (
    <Progress value={progress} className="fixed top-0 left-0 right-0 h-1 rounded-none z-50 bg-transparent" />
  );
}
