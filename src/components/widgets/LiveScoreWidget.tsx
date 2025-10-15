'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LiveScoreWidgetProps = {
    title?: string;
}

export function LiveScoreWidget({ title = 'Live Match' }: LiveScoreWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <div className="flex justify-around items-center mb-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg">T1</div>
                        <span className="font-semibold text-sm">Team Alpha</span>
                    </div>
                    <div className="font-bold text-4xl">
                        <span>2 - 1</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg">T2</div>
                        <span className="font-semibold text-sm">Team Beta</span>
                    </div>
                </div>
                <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                <p className="text-xs text-muted-foreground mt-2">78' minute</p>
            </CardContent>
        </Card>
    );
}
