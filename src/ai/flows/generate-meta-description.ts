'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a meta description for content.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMetaDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the content.'),
  content: z.string().describe('The main content to summarize.'),
});
export type GenerateMetaDescriptionInput = z.infer<
  typeof GenerateMetaDescriptionInputSchema
>;

const GenerateMetaDescriptionOutputSchema = z.object({
  metaDescription: z
    .string()
    .describe('A concise, SEO-friendly meta description, between 120 and 155 characters.'),
});
export type GenerateMetaDescriptionOutput = z.infer<
  typeof GenerateMetaDescriptionOutputSchema
>;

/**
 * Main function to trigger the meta description generation flow.
 * @param input The input data for generating the meta description.
 * @returns A promise that resolves to the generated meta description.
 */
export async function generateMetaDescription(
  input: GenerateMetaDescriptionInput
): Promise<GenerateMetaDescriptionOutput> {
  return generateMetaDescriptionFlow(input);
}

const generateMetaDescriptionPrompt = ai.definePrompt({
  name: 'generateMetaDescriptionPrompt',
  input: {schema: GenerateMetaDescriptionInputSchema},
  output: {schema: GenerateMetaDescriptionOutputSchema},
  prompt: `You are an SEO expert. Analyze the following content and title, then generate a concise, compelling, SEO-friendly meta description. The description should be between 120 and 155 characters long and encourage users to click.

Title:
{{{title}}}

Content:
{{{content}}}

Format your response as a JSON object.`,
});

const generateMetaDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMetaDescriptionFlow',
    inputSchema: GenerateMetaDescriptionInputSchema,
    outputSchema: GenerateMetaDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateMetaDescriptionPrompt(input);
    return output!;
  }
);

    