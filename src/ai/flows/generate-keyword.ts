
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a focus keyword for content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateKeywordInputSchema = z.object({
  title: z.string().describe('The title of the content.'),
  content: z.string().describe('The main content to analyze.'),
});
export type GenerateKeywordInput = z.infer<
  typeof GenerateKeywordInputSchema
>;

const GenerateKeywordOutputSchema = z.object({
  focusKeyword: z
    .string()
    .describe('A single, primary keyword or short keyphrase (2-3 words) that best represents the main topic of the content.'),
});
export type GenerateKeywordOutput = z.infer<
  typeof GenerateKeywordOutputSchema
>;

/**
 * Main function to trigger the focus keyword generation flow.
 * @param input The input data for generating the keyword.
 * @returns A promise that resolves to the generated keyword.
 */
export async function generateKeyword(
  input: GenerateKeywordInput
): Promise<GenerateKeywordOutput> {
  return generateKeywordFlow(input);
}

const generateKeywordPrompt = ai.definePrompt({
  name: 'generateKeywordPrompt',
  input: {schema: GenerateKeywordInputSchema},
  output: {schema: GenerateKeywordOutputSchema},
  prompt: `You are an SEO expert. Analyze the following content and title, then generate a single, primary keyword or short keyphrase (2-3 words) that best represents the main topic. This keyword should be what someone would type into Google to find this content.

Title:
{{{title}}}

Content:
{{{content}}}

Format your response as a JSON object with a "focusKeyword" property.`,
});

const generateKeywordFlow = ai.defineFlow(
  {
    name: 'generateKeywordFlow',
    inputSchema: GenerateKeywordInputSchema,
    outputSchema: GenerateKeywordOutputSchema,
  },
  async input => {
    const {output} = await generateKeywordPrompt(input);
    return output!;
  }
);

    