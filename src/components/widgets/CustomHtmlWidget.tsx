'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type CustomHtmlWidgetProps = {
    title?: string;
    html?: string;
}

export function CustomHtmlWidget({ title, html }: CustomHtmlWidgetProps) {
    return (
        <Card>
            {title && (
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                {html ? (
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                ) : (
                    <p className="text-sm text-muted-foreground">This custom HTML widget is empty. Add some content in the dashboard.</p>
                )}
            </CardContent>
        </Card>
    );
}
