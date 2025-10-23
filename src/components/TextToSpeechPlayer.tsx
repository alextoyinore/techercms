'use client';

export function TextToSpeechPlayer({ audioUrl }: { audioUrl?: string }) {
  if (!audioUrl) {
    return null;
  }

  return (
    <div className="my-6">
      <audio controls src={audioUrl} className="w-full">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
