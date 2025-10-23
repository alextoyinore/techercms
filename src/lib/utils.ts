import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateReadTime(content: string): string {
  if (!content) {
    return '1 min read';
  }

  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '');
  
  // Split by whitespace and filter out empty strings
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  // Average reading speed is ~200 WPM
  const readTimeMinutes = Math.ceil(wordCount / 200);

  return `${readTimeMinutes} min read`;
}
