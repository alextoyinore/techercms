'use client';

import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" strokeWidth={1} />
    </div>
  );
}
