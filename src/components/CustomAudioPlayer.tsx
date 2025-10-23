'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const AudioVisualizer = dynamic(
  () => import('react-audio-visualize').then(mod => mod.AudioVisualizer),
  {
    loading: () => <Skeleton className="w-full h-12" />,
    ssr: false
  }
);

type CustomAudioPlayerProps = {
  audioUrl: string;
};

export function CustomAudioPlayer({ audioUrl }: CustomAudioPlayerProps) {
  return (
    <div className="w-full">
      <AudioVisualizer
        src={audioUrl}
        barWidth={2}
        gap={2}
        height={48}
        width={500}
        barColor={'hsl(var(--muted))'}
        barPlayedColor={'hsl(var(--primary))'}
        showVolume={false}
        showLoop={false}
        style={{ width: '100%' }}
      />
    </div>
  );
}
