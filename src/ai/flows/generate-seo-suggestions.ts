'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating SEO suggestions for content.
 *
 * The flow takes content text as input and returns suggestions for SEO improvements,
 * such as keyword density and meta descriptions.
 *
 * @Exported Members:
 *   - `generateSEOSuggestions`: The main function to trigger the SEO suggestions flow.
 *   - `GenerateSEOSuggestionsInput`: The TypeScript type for the input to the flow.
 *   - `GenerateSEOSuggestionsOutput`: The TypeScript type for the output of the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the flow.
const GenerateSEOSuggestionsInputSchema = z.object({
  content: z.string().describe('The content to analyze for SEO suggestions.'),
});
export type GenerateSEOSuggestionsInput = z.infer<
  typeof GenerateSEOSuggestionsInputSchema
>;

// Define the output schema for the flow.
const GenerateSEOSuggestionsOutputSchema = z.object({
  keywordDensity: z
    .string()
    .describe('Suggestions for improving keyword density.'),
  metaDescription: z
    .string()
    .describe('Suggestions for improving the meta description.'),
  title: z.string().describe('Suggestions for improving the title.'),
  headings: z.string().describe('Suggestions for improving the headings.'),
});
export type GenerateSEOSuggestionsOutput = z.infer<
  typeof GenerateSEOSuggestionsOutputSchema
>;

/**
 * Main function to trigger the SEO suggestions flow.
 * @param input The input data for generating SEO suggestions.
 * @returns A promise that resolves to the SEO suggestions.
 */
export async function generateSEOSuggestions(
  input: GenerateSEOSuggestionsInput
): Promise<GenerateSEOSuggestionsOutput> {
  return generateSEOSuggestionsFlow(input);
}

// Define the prompt for generating SEO suggestions.
const generateSEOSuggestionsPrompt = ai.definePrompt({
  name: 'generateSEOSuggestionsPrompt',
  input: {schema: GenerateSEOSuggestionsInputSchema},
  output: {schema: GenerateSEOSuggestionsOutputSchema},
  prompt: `You are an SEO expert. Analyze the following content and provide suggestions for improvement.

Content:
{{{content}}}

Provide suggestions for the following:
- Keyword density
- Meta description
- Title
- Headings

Format your response as a JSON object.`,
});

// Define the Genkit flow for generating SEO suggestions.
const generateSEOSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSEOSuggestionsFlow',
    inputSchema: GenerateSEOSuggestionsInputSchema,
    outputSchema: GenerateSEOSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await generateSEOSuggestionsPrompt(input);
    return output!;
  }
);
