'use server';
/**
 * @fileOverview A Genkit flow to fetch live soccer scores from TheSportsDB API for multiple top leagues.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetLiveScoreInputSchema = z.object({
  // No input needed, we'll check a predefined list of leagues.
});
export type GetLiveScoreInput = z.infer<typeof GetLiveScoreInputSchema>;

const LiveScoreEventSchema = z.object({
    idEvent: z.string(),
    strHomeTeam: z.string(),
    strAwayTeam: z.string(),
    intHomeScore: z.string().nullable(),
    intAwayScore: z.string().nullable(),
    strProgress: z.string(),
    strLeague: z.string(),
});

const GetLiveScoreOutputSchema = z.object({
  events: z.array(LiveScoreEventSchema).describe('A list of live score events.'),
});
export type GetLiveScoreOutput = z.infer<typeof GetLiveScoreOutputSchema>;

export async function getLiveScore(input: GetLiveScoreInput): Promise<GetLiveScoreOutput> {
  return getLiveScoreFlow(input);
}

const topLeagues = [
    '4328', // English Premier League
    '4335', // Spanish La Liga
    '4332', // Italian Serie A
    '4331', // German Bundesliga
    '4334', // French Ligue 1
];

const getLiveScoreFlow = ai.defineFlow(
  {
    name: 'getLiveScoreFlow',
    inputSchema: GetLiveScoreInputSchema,
    outputSchema: GetLiveScoreOutputSchema,
  },
  async () => {
    const apiKey = process.env.THESPORTSDB_API_KEY;
    if (!apiKey) {
      throw new Error('TheSportsDB API key is not configured.');
    }
    
    let allLiveEvents: z.infer<typeof LiveScoreEventSchema>[] = [];

    for (const leagueId of topLeagues) {
        const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/livescore.php?l=${leagueId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch live scores for league ${leagueId}`);
                continue; // Skip to next league on error
            }
            const data = await response.json();
            if (data.events) {
                allLiveEvents.push(...data.events);
            }
        } catch (error: any) {
            console.error(`Error fetching live scores for league ${leagueId}:`, error);
        }
    }

    return { events: allLiveEvents };
  }
);
