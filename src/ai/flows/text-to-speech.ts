'use server';
/**
 * @fileOverview A Genkit flow to convert text into speech, upload it to Cloudinary, and return the URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  filename: z.string().optional().describe('An optional filename for the uploaded audio.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioUrl: z.string().describe('The public URL of the generated audio file on Cloudinary.'),
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

// Helper to upload a base64 asset to Cloudinary
async function uploadToCloudinary(base64Data: string, filename?: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are not configured.');
  }

  const dataUri = `data:audio/wav;base64,${base64Data}`;
  
  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', uploadPreset);
  if (filename) {
    formData.append('public_id', filename);
  }
  formData.append('resource_type', 'video'); // Cloudinary treats audio as video

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Cloudinary upload failed:', errorData);
    throw new Error(errorData.error.message || 'Failed to upload audio to Cloudinary.');
  }

  const result = await response.json();
  return result.secure_url;
}


const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text, filename }) => {
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
    
    // Convert the combined PCM buffer to a single WAV file (as a base64 string)
    const wavBase64 = await toWav(combinedPcmBuffer);

    // Upload the WAV file to Cloudinary
    const audioUrl = await uploadToCloudinary(wavBase64, filename);

    return {
      audioUrl,
    };
  }
);

    