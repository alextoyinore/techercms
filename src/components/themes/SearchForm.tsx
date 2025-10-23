'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchForm({ startExpanded = false }: { startExpanded?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      if (!startExpanded) {
        setIsExpanded(false);
      }
      setQuery('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!startExpanded && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [startExpanded]);

  return (
    <div
      ref={searchContainerRef}
      className={cn(
        "relative flex items-center justify-end transition-all duration-300 ease-in-out",
        isExpanded ? "w-full" : "w-10"
      )}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          name="q"
          className={cn(
            "h-9 rounded-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 ease-in-out",
            isExpanded ? "w-full pl-4 pr-10 border" : "w-0 p-0 border-none"
          )}
        />
      </form>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full",
          startExpanded && "hidden"
        )}
        aria-label="Toggle search"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}
