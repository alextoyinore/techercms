'use client';
import { Card, CardContent } from '@/components/ui/card';

export function TextToSpeechPlayer({ audioUrl }: { audioUrl?: string }) {
  if (!audioUrl) {
    return null;
  }

  return (
    <Card className="my-6">
      <CardContent className="p-4">
         <audio controls src={audioUrl} className="w-full">
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  );
}

    