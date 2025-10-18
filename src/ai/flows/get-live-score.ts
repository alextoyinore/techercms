'use server';
/**
 * @fileOverview A Genkit flow to fetch live soccer scores from TheSportsDB API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetLiveScoreInputSchema = z.object({
  sport: z.string().default('Soccer').describe('The sport to fetch live scores for.'),
});
export type GetLiveScoreInput = z.infer<typeof GetLiveScoreInputSchema>;

const LiveScoreEventSchema = z.object({
    strHomeTeam: z.string(),
    strAwayTeam: z.string(),
    intHomeScore: z.string().nullable(),
    intAwayScore: z.string().nullable(),
    strProgress: z.string(),
});

const GetLiveScoreOutputSchema = z.object({
  events: z.array(LiveScoreEventSchema).describe('A list of live score events.'),
});
export type GetLiveScoreOutput = z.infer<typeof GetLiveScoreOutputSchema>;

export async function getLiveScore(input: GetLiveScoreInput): Promise<GetLiveScoreOutput> {
  return getLiveScoreFlow(input);
}

const getLiveScoreFlow = ai.defineFlow(
  {
    name: 'getLiveScoreFlow',
    inputSchema: GetLiveScoreInputSchema,
    outputSchema: GetLiveScoreOutputSchema,
  },
  async ({ sport }) => {
    const apiKey = process.env.THESPORTSDB_API_KEY;
    if (!apiKey) {
      throw new Error('TheSportsDB API key is not configured.');
    }
    
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/livescore.php?s=${encodeURIComponent(sport)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch live scores for ${sport}`);
      }
      const data = await response.json();
      
      return { events: data.events || [] };
    } catch (error: any) {
        console.error("Error fetching live scores:", error);
        return { events: [] };
    }
  }
);
