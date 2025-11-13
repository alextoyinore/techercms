'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a post excerpt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExcerptInputSchema = z.object({
  title: z.string().describe('The title of the content.'),
  content: z.string().describe('The main content to summarize.'),
});
export type GenerateExcerptInput = z.infer<
  typeof GenerateExcerptInputSchema
>;

const GenerateExcerptOutputSchema = z.object({
  excerpt: z
    .string()
    .describe('A concise summary of the post, about 2-3 sentences long.'),
});
export type GenerateExcerptOutput = z.infer<
  typeof GenerateExcerptOutputSchema
>;

/**
 * Main function to trigger the excerpt generation flow.
 * @param input The input data for generating the excerpt.
 * @returns A promise that resolves to the generated excerpt.
 */
export async function generateExcerpt(
  input: GenerateExcerptInput
): Promise<GenerateExcerptOutput> {
  return generateExcerptFlow(input);
}

const generateExcerptPrompt = ai.definePrompt({
  name: 'generateExcerptPrompt',
  input: {schema: GenerateExcerptInputSchema},
  output: {schema: GenerateExcerptOutputSchema},
  prompt: `You are an expert copywriter. Analyze the following content and title, then generate a concise and compelling summary of about 2-3 sentences to be used as a post excerpt.

Title:
{{{title}}}

Content:
{{{content}}}

Format your response as a JSON object with an "excerpt" property.`,
});

const generateExcerptFlow = ai.defineFlow(
  {
    name: 'generateExcerptFlow',
    inputSchema: GenerateExcerptInputSchema,
    outputSchema: GenerateExcerptOutputSchema,
  },
  async input => {
    const {output} = await generateExcerptPrompt(input);
    return output!;
  }
);
