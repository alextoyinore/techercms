'use server';
/**
 * @fileOverview A Genkit flow to get a city name from latitude and longitude coordinates.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetCityFromCoordsInputSchema = z.object({
  lat: z.number().describe('The latitude.'),
  lon: z.number().describe('The longitude.'),
});
export type GetCityFromCoordsInput = z.infer<typeof GetCityFromCoordsInputSchema>;

const GetCityFromCoordsOutputSchema = z.object({
  city: z.string().describe('The name of the city.'),
});
export type GetCityFromCoordsOutput = z.infer<typeof GetCityFromCoordsOutputSchema>;

export async function getCityFromCoords(input: GetCityFromCoordsInput): Promise<GetCityFromCoordsOutput> {
  return getCityFromCoordsFlow(input);
}

const getCityFromCoordsFlow = ai.defineFlow(
  {
    name: 'getCityFromCoordsFlow',
    inputSchema: GetCityFromCoordsInputSchema,
    outputSchema: GetCityFromCoordsOutputSchema,
  },
  async ({ lat, lon }) => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key is not configured.');
    }
    
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to reverse geocode for lat: ${lat}, lon: ${lon}`);
      }
      const data = await response.json();

      if (data.length > 0) {
        return { city: data[0].name };
      } else {
        throw new Error('No city found for the given coordinates.');
      }
    } catch (error: any) {
        console.error("Error reverse geocoding:", error);
        return { city: 'Unknown' };
    }
  }
);
