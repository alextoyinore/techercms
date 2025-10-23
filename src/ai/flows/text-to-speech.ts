'use server';
/**
 * @fileOverview A Genkit flow to convert long text into speech by chunking and stitching audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a WAV data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

// Helper to convert raw PCM buffer to a WAV base64 string
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text }) => {
    // Split text into chunks of about 4500 characters, respecting sentence boundaries.
    const chunks = text.match(/[\s\S]{1,4500}(?=\s|$)/g) || [];
    
    // Generate audio for each chunk in parallel.
    const audioGenerationPromises = chunks.map(async (chunk) => {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
        },
        prompt: chunk,
      });
      if (!media?.url) {
        throw new Error('TTS media generation failed for a chunk.');
      }
      // Extract raw Base64 data from the data URI
      return Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    });
    
    const pcmBuffers = await Promise.all(audioGenerationPromises);
    const combinedPcmBuffer = Buffer.concat(pcmBuffers);
    
    // Convert the combined PCM buffer to a single WAV file
    const wavBase64 = await toWav(combinedPcmBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
