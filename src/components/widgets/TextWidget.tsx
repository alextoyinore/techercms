'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type TextWidgetProps = {
    title?: string;
    text?: string;
}

export function TextWidget({ title, text }: TextWidgetProps) {
    return (
        <Card>
            {title && (
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className={!title ? 'pt-6' : ''}>
                {text ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{text}</p>
                ) : (
                    <p className="text-sm text-muted-foreground">This text widget is empty. Add some content in the dashboard.</p>
                )}
            </CardContent>
        </Card>
    );
}
