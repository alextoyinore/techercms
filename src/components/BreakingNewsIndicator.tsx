
'use client';

import { cn } from "@/lib/utils";

export function BreakingNewsIndicator({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-3 w-3", className)}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
    </span>
  );
}
