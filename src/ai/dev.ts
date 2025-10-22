import { config } from 'dotenv';
config();

import '@/ai/flows/generate-seo-suggestions.ts';
import '@/ai/flows/generate-meta-description.ts';
import '@/ai/flows/get-weather.ts';
import '@/ai/flows/get-city-from-coords.ts';
import '@/ai/flows/get-live-score.ts';
import '@/ai/flows/get-sporting-tables.ts';
import '@/ai/flows/get-ticker-data.ts';
