'use server';
/**
 * @fileOverview A Genkit flow to fetch league table/standings from TheSportsDB API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetSportingTablesInputSchema = z.object({
  leagueId: z.string().default('4328').describe('The ID of the league to fetch the table for. Defaults to English Premier League.'),
});
export type GetSportingTablesInput = z.infer<typeof GetSportingTablesInputSchema>;

const TeamStandingSchema = z.object({
    intRank: z.string(),
    strTeam: z.string(),
    intPoints: z.string(),
});

const GetSportingTablesOutputSchema = z.object({
  table: z.array(TeamStandingSchema).describe('The league table standings.'),
});
export type GetSportingTablesOutput = z.infer<typeof GetSportingTablesOutputSchema>;

export async function getSportingTables(input: GetSportingTablesInput): Promise<GetSportingTablesOutput> {
  return getSportingTablesFlow(input);
}

const getSportingTablesFlow = ai.defineFlow(
  {
    name: 'getSportingTablesFlow',
    inputSchema: GetSportingTablesInputSchema,
    outputSchema: GetSportingTablesOutputSchema,
  },
  async ({ leagueId }) => {
    const apiKey = process.env.THESPORTSDB_API_KEY;
    if (!apiKey) {
      throw new Error('TheSportsDB API key is not configured.');
    }
    
    const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/lookuptable.php?l=${leagueId}&s=2025-2026`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch league table for ID ${leagueId}`);
      }
      const data = await response.json();

      return { table: data.table || [] };
    } catch (error: any) {
        console.error("Error fetching league table:", error);
        return { table: [] };
    }
  }
);
