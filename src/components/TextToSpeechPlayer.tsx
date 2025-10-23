
'use client';
import { CustomAudioPlayer } from './CustomAudioPlayer';


export function TextToSpeechPlayer({ audioUrl }: { audioUrl?: string }) {
  if (!audioUrl) {
    return null;
  }

  return (
    <div className="my-6">
      <CustomAudioPlayer audioUrl={audioUrl} />
    </div>
  );
}

