'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const mockNewsData = [
    { id: 1, headline: 'Global Tech Summit Begins, Showcasing Future Innovations', time: '5m ago' },
    { id: 2, headline: 'Market Hits Record Highs Amidst Economic Optimism', time: '12m ago' },
    { id: 3, headline: 'New Space Mission Successfully Launches to Explore Jupiter', time: '25m ago' },
    { id: 4, headline: 'Breakthrough in Renewable Energy Could Power Entire Cities', time: '45m ago' },
];

type BreakingNewsWidgetProps = {
    title?: string;
}

export function BreakingNewsWidget({ title = 'Breaking News' }: BreakingNewsWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {mockNewsData.map(item => (
                        <li key={item.id} className="text-sm border-b border-border/50 pb-2 last:border-b-0">
                            <Link href="#" className="font-medium hover:underline block">
                                {item.headline}
                            </Link>
                            <span className="text-xs text-muted-foreground">{item.time}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
