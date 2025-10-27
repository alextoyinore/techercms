
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SubscriptionForm } from '../SubscriptionForm';

type SubscriptionWidgetProps = {
    title?: string;
    description?: string;
    buttonText?: string;
}

export function SubscriptionWidget({ title, description, buttonText }: SubscriptionWidgetProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <SubscriptionForm title={title} description={description} buttonText={buttonText} />
            </CardContent>
        </Card>
    );
}
