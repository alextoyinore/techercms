'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating content tags.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTagsInputSchema = z.object({
  title: z.string().describe('The title of the content.'),
  content: z.string().describe('The main content to analyze.'),
});
export type GenerateTagsInput = z.infer<
  typeof GenerateTagsInputSchema
>;

const GenerateTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('A list of 5-7 relevant keywords or short phrases to be used as tags.'),
});
export type GenerateTagsOutput = z.infer<
  typeof GenerateTagsOutputSchema
>;

/**
 * Main function to trigger the tag generation flow.
 * @param input The input data for generating tags.
 * @returns A promise that resolves to the generated tags.
 */
export async function generateTags(
  input: GenerateTagsInput
): Promise<GenerateTagsOutput> {
  return generateTagsFlow(input);
}

const generateTagsPrompt = ai.definePrompt({
  name: 'generateTagsPrompt',
  input: {schema: GenerateTagsInputSchema},
  output: {schema: GenerateTagsOutputSchema},
  prompt: `You are an SEO and content expert. Analyze the following content and title, then generate a list of 5-7 relevant keywords or short keyphrases that would be suitable as content tags. Each tag should be concise.

Title:
{{{title}}}

Content:
{{{content}}}

Format your response as a JSON object with a "tags" property containing an array of strings.`,
});

const generateTagsFlow = ai.defineFlow(
  {
    name: 'generateTagsFlow',
    inputSchema: GenerateTagsInputSchema,
    outputSchema: GenerateTagsOutputSchema,
  },
  async input => {
    const {output} = await generateTagsPrompt(input);
    return output!;
  }
);
