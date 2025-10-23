'use client';

import { AudioPlayer } from 'react-audio-visualize';

type CustomAudioPlayerProps = {
  audioUrl: string;
};

export function CustomAudioPlayer({ audioUrl }: CustomAudioPlayerProps) {
  return (
    <div className="w-full">
      <AudioPlayer
        src={audioUrl}
        barWidth={2}
        gap={2}
        height={48}
        width={500}
        barColor={'hsl(var(--primary))'}
        barPlayedColor={'hsl(var(--muted))'}
        showVolume={false}
        showLoop={false}
        style={{ width: '100%' }}
      />
    </div>
  );
}
