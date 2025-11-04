'use client';

import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

export function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // This creates a simple, non-linear animation for the progress bar.
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setProgress(20), 100));
    timers.push(setTimeout(() => setProgress(65), 500));
    timers.push(setTimeout(() => setProgress(90), 1500));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 w-full">
        <Progress value={progress} className="w-full h-full rounded-none bg-transparent" />
    </div>
  );
}
