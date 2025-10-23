'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle } from 'lucide-react';
import { textToSpeech } from '@/ai/flows/text-to-speech';

export function TextToSpeechPlayer({ content }: { content: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAudio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Strip HTML tags for clean audio
      const plainText = content.replace(/<[^>]*>?/gm, '');
      const result = await textToSpeech({ text: plainText });
      setAudioUrl(result.audioDataUri);
    } catch (err) {
      console.error('Failed to generate audio:', err);
      setError('Could not generate audio. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      
      {audioUrl ? (
        <audio controls src={audioUrl} className="w-full">
          Your browser does not support the audio element.
        </audio>
      ) : (
        <Button onClick={handleGenerateAudio} disabled={isLoading} variant="outline">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Audio...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Listen to this Article
            </>
          )}
        </Button>
      )}
    </div>
  );
}
