'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWavesurfer, WaveSurfer } from 'wavesurfer-react';
import type WaveSurferInstance from 'wavesurfer.js';

const PlayerControls = ({ audioUrl }: { audioUrl: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const { wavesurfer, isReady, duration } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: 'hsl(var(--muted))',
    progressColor: 'hsl(var(--primary))',
    height: 48,
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    cursorWidth: 0,
  });

  useEffect(() => {
    if (!wavesurfer) return;

    const onTimeUpdate = (time: number) => {
      setCurrentTime(time);
    };
    
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFinish = () => setIsPlaying(false);

    wavesurfer.on('timeupdate', onTimeUpdate);
    wavesurfer.on('play', onPlay);
    wavesurfer.on('pause', onPause);
    wavesurfer.on('finish', onFinish);

    return () => {
      wavesurfer.un('timeupdate', onTimeUpdate);
      wavesurfer.un('play', onPlay);
      wavesurfer.un('pause', onPause);
      wavesurfer.un('finish', onFinish);
    };
  }, [wavesurfer]);

  const togglePlayPause = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  }, [wavesurfer]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="rounded-full"
        disabled={!isReady}
      >
        {!isReady ? (
            <Loader2 className="h-6 w-6 animate-spin" />
        ) : isPlaying ? (
            <Pause className="h-6 w-6" />
        ) : (
            <Play className="h-6 w-6" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-3">
        <div ref={containerRef} className="w-full" />
        <div className="text-xs font-mono text-muted-foreground w-20 text-right">
          <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};


type CustomAudioPlayerProps = {
  audioUrl: string;
};

export function CustomAudioPlayer({ audioUrl }: CustomAudioPlayerProps) {
  return (
    <WaveSurfer>
      <PlayerControls audioUrl={audioUrl} />
    </WaveSurfer>
  );
}
