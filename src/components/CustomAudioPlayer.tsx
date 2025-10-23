
'use client';

import { useState, useRef, useEffect, type MouseEvent } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CustomAudioPlayerProps = {
  audioUrl: string;
};

// Static data for a more "realistic" looking waveform visualization
const waveformData = [
    0.1, 0.3, 0.5, 0.4, 0.6, 0.7, 0.5, 0.4, 0.3, 0.5, 0.6, 0.8, 0.7, 0.6, 0.5, 0.4,
    0.6, 0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.7, 0.5, 0.4, 0.3, 0.5, 0.6, 0.7, 0.8, 0.7,
    0.6, 0.5, 0.4, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9,
    0.8, 0.7, 0.6, 0.7, 0.5, 0.4, 0.3, 0.5, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.4, 0.6,
    0.7, 0.8, 0.9, 0.8, 0.7, 0.6, 0.7, 0.5, 0.4, 0.3, 0.5, 0.6, 0.7, 0.8, 0.7, 0.6,
    0.5, 0.4, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 0.8,
];

export function CustomAudioPlayer({ audioUrl }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const duration = audio.duration;

    audio.currentTime = (clickX / width) * duration;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const WaveformBars = ({ className }: { className: string }) => (
    <svg width="100%" height="32" className={cn("absolute inset-0", className)}>
        {waveformData.map((h, i) => (
            <rect 
                key={i}
                x={`${(i / waveformData.length) * 100}%`}
                y={`${(1 - h) * 50}%`}
                width="0.8%"
                height={`${h * 100}%`}
                rx="1"
                fill="currentColor"
            />
        ))}
    </svg>
  );

  return (
    <div className="flex items-center gap-4 w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="rounded-full"
      >
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </Button>

      <div className="flex-1 flex items-center gap-3">
        <div ref={progressRef} className="relative w-full h-8 cursor-pointer" onClick={handleProgressClick}>
          <WaveformBars className="text-muted/30" />
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${progressPercentage}%` }}
          >
            <WaveformBars className="text-primary" />
          </div>
        </div>

        <div className="text-xs font-mono text-muted-foreground w-20 text-right">
          <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
