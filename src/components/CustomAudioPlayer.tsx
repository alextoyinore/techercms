
'use client';

import { useState, useRef, useEffect, type MouseEvent } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CustomAudioPlayerProps = {
  audioUrl: string;
};

// A simple, repeating SVG path for the waveform
const wavePath = "M0 16 C 4 8, 8 24, 12 16 S 20 8, 24 16 S 32 24, 36 16 S 44 8, 48 16";
const waveWidth = 48;

export function CustomAudioPlayer({ audioUrl }: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [numWaves, setNumWaves] = useState(0);

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

    // Set initial number of waves based on container width
    const resizeObserver = new ResizeObserver(() => {
        if(progressRef.current) {
            setNumWaves(Math.floor(progressRef.current.offsetWidth / waveWidth));
        }
    });

    if(progressRef.current) {
        resizeObserver.observe(progressRef.current);
    }

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      if (progressRef.current) {
        resizeObserver.unobserve(progressRef.current);
      }
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
  
  const waves = Array.from({ length: numWaves || 10 }).map((_, i) => (
      <path key={i} d={wavePath} transform={`translate(${i * waveWidth}, 0)`} />
  ));

  return (
    <div className="flex items-center gap-4 w-full p-3 rounded-lg border bg-card text-card-foreground">
      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} preload="metadata" />
      
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
          <svg width="100%" height="32" className="absolute top-0 left-0">
            <g className="text-muted/40" fill="currentColor">
              {waves}
            </g>
          </svg>
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${progressPercentage}%` }}
          >
             <svg width={progressRef.current?.offsetWidth} height="32">
                <g className="text-primary" fill="currentColor">
                    {waves}
                </g>
            </svg>
          </div>
        </div>

        <div className="text-xs font-mono text-muted-foreground w-20 text-right">
          <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
