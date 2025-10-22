'use server';
/**
 * @fileOverview A Genkit flow to fetch ticker data from Polygon.io API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetTickerDataInputSchema = z.object({
  market: z.enum(['stocks', 'crypto', 'fx', 'indices']).default('fx').describe('The market to fetch tickers for.'),
});
export type GetTickerDataInput = z.infer<typeof GetTickerDataInputSchema>;

const TickerInfoSchema = z.object({
    symbol: z.string(),
    price: z.number(),
    change: z.number(),
    isUp: z.boolean().nullable(),
});

const GetTickerDataOutputSchema = z.object({
  tickers: z.array(TickerInfoSchema).describe('A list of ticker information.'),
});
export type GetTickerDataOutput = z.infer<typeof GetTickerDataOutputSchema>;

export async function getTickerData(input: GetTickerDataInput): Promise<GetTickerDataOutput> {
  return getTickerDataFlow(input);
}

const getTickerDataFlow = ai.defineFlow(
  {
    name: 'getTickerDataFlow',
    inputSchema: GetTickerDataInputSchema,
    outputSchema: GetTickerDataOutputSchema,
  },
  async ({ market }) => {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      throw new Error('Polygon.io API key is not configured.');
    }
    
    // 1. Fetch a list of tickers for the market
    const tickersUrl = `https://api.polygon.io/v3/reference/tickers?market=${market}&active=true&limit=20&apiKey=${apiKey}`;
    let tickers: { ticker: string }[] = [];

    try {
        const tickersResponse = await fetch(tickersUrl);
        if (!tickersResponse.ok) {
            throw new Error(`Failed to fetch tickers for market ${market}`);
        }
        const tickersData = await tickersResponse.json();
        tickers = tickersData.results || [];
    } catch (error) {
        console.error("Error fetching ticker list:", error);
        return { tickers: [] };
    }

    // 2. For each ticker, fetch its previous day's close
    const tickerPromises = tickers.map(async (t) => {
        const prevDayUrl = `https://api.polygon.io/v2/aggs/ticker/${t.ticker}/prev?adjusted=true&apiKey=${apiKey}`;
        try {
            const prevDayResponse = await fetch(prevDayUrl);
            if (!prevDayResponse.ok) return null;
            const prevDayData = await prevDayResponse.json();

            if (prevDayData.resultsCount > 0) {
                const result = prevDayData.results[0];
                const close = result.c;
                const open = result.o;
                const change = close - open;
                const isUp = change > 0 ? true : change < 0 ? false : null;
                
                return {
                    symbol: t.ticker,
                    price: close,
                    change,
                    isUp,
                };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching previous day close for ${t.ticker}:`, error);
            return null;
        }
    });

    const results = await Promise.all(tickerPromises);
    const validResults = results.filter((r): r is z.infer<typeof TickerInfoSchema> => r !== null);
    
    return { tickers: validResults };
  }
);
