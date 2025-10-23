'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CustomAudioPlayerProps = {
  audioUrl: string;
};

// Generate a static, random-looking array of bar heights
const generateBarHeights = (count: number) => {
    let heights = [];
    let lastHeight = 50;
    for (let i = 0; i < count; i++) {
        const nextHeight = lastHeight + (Math.random() - 0.5) * 40;
        lastHeight = Math.max(10, Math.min(90, nextHeight));
        heights.push(lastHeight);
    }
    return heights;
}

export function CustomAudioPlayer({ audioUrl }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const barCount = 60;

  useEffect(() => {
    setBarHeights(generateBarHeights(barCount));
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickPositionX = event.clientX - rect.left;
    const clickRatio = clickPositionX / rect.width;
    audioRef.current.currentTime = clickRatio * duration;
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      <Button onClick={handlePlayPause} variant="ghost" size="icon" className="shrink-0 rounded-full">
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </Button>
      <div 
        className="relative flex-grow h-12 flex items-center gap-px cursor-pointer"
        onClick={handleWaveformClick}
      >
        {barHeights.map((height, index) => {
          const barProgress = (index / barCount) * 100;
          const isActive = barProgress < progressPercentage;
          return (
            <div
              key={index}
              className={cn(
                "w-1 rounded-full transition-colors duration-75",
                isActive ? 'bg-primary' : 'bg-muted'
              )}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>
       <div className="text-sm font-mono text-muted-foreground tabular-nums w-24 text-right">
        <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
