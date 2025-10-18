'use server';
/**
 * @fileOverview A Genkit flow to fetch weather data from the OpenWeatherMap API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetWeatherInputSchema = z.object({
  location: z.string().describe('The city name for which to fetch weather data, e.g., "New York, NY".'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const GetWeatherOutputSchema = z.object({
  temp: z.number().describe('The current temperature in Celsius.'),
  condition: z.string().describe('A brief description of the weather condition.'),
  icon: z.string().describe('The OpenWeatherMap icon code.'),
  high: z.number().describe('The maximum temperature for the day in Celsius.'),
  low: z.number().describe('The minimum temperature for the day in Celsius.'),
});
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
  return getWeatherFlow(input);
}

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: GetWeatherInputSchema,
    outputSchema: GetWeatherOutputSchema,
  },
  async ({ location }) => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key is not configured.');
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch weather data for ${location}`);
      }
      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        condition: data.weather[0]?.description || 'N/A',
        icon: data.weather[0]?.icon || '01d',
        high: Math.round(data.main.temp_max),
        low: Math.round(data.main.temp_min),
      };
    } catch (error: any) {
        console.error("Error fetching weather:", error);
        // Return a default or error state that matches the schema
        return {
            temp: 0,
            condition: "Error fetching data",
            icon: "01d",
            high: 0,
            low: 0,
        };
    }
  }
);
