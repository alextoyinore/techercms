"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { analyzeSeo, type FormState } from "./actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Terminal, Bot } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Analyzing..." : "Analyze Content"}
      <Sparkles className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function SeoAnalyzerPage() {
  const initialState: FormState = {
    message: "",
  };
  const [state, formAction] = useActionState(analyzeSeo, initialState);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="SEO Analyzer"
        description="Let our AI analyze your content and provide SEO suggestions."
      />
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <Card>
            <form action={formAction}>
              <CardHeader>
                <CardTitle className="font-headline">Content to Analyze</CardTitle>
                <CardDescription>
                  Paste your article, blog post, or page content below.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Textarea
                  name="content"
                  placeholder="Start writing or paste your content here..."
                  className="min-h-[400px]"
                  required
                />
                <SubmitButton />
              </CardContent>
            </form>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Bot /> AI Suggestions
              </CardTitle>
              <CardDescription>
                Results from the AI analysis will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.issues && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {state.issues.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
              {state.data ? (
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Title Suggestions</AccordionTrigger>
                    <AccordionContent>{state.data.title}</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Meta Description</AccordionTrigger>
                    <AccordionContent>{state.data.metaDescription}</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Headings</AccordionTrigger>
                    <AccordionContent>{state.data.headings}</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Keyword Density</AccordionTrigger>
                    <AccordionContent>{state.data.keywordDensity}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Ready to boost your SEO!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
