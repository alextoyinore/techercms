"use server";

import {
  generateSEOSuggestions,
  type GenerateSEOSuggestionsOutput,
} from "@/ai/flows/generate-seo-suggestions";
import { z } from "zod";

const formSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters."),
});

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
  data?: GenerateSEOSuggestionsOutput;
};

export async function analyzeSeo(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return {
      message: "Invalid form data",
      issues,
    };
  }

  try {
    const result = await generateSEOSuggestions({
      content: parsed.data.content,
    });
    return {
      message: "Analysis successful!",
      data: result,
    };
  } catch (error) {
    return {
      message: "An error occurred during analysis. Please try again.",
      issues: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}
