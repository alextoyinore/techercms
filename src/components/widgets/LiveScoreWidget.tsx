'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLiveScore, type GetLiveScoreOutput } from '@/ai/flows/get-live-score';
import { Loader2 } from 'lucide-react';

type LiveScoreWidgetProps = {
    title?: string;
    sport?: string;
}

export function LiveScoreWidget({ title = 'Live Match', sport = 'Soccer' }: LiveScoreWidgetProps) {
    const [liveData, setLiveData] = useState<GetLiveScoreOutput['events'][0] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLiveScores = async () => {
            setIsLoading(true);
            try {
                const result = await getLiveScore({ sport });
                // Display the first live event found
                if (result.events && result.events.length > 0) {
                    setLiveData(result.events[0]);
                }
            } catch (error) {
                console.error("Failed to fetch live scores:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiveScores();
    }, [sport]);

    const homeScore = liveData?.intHomeScore ?? '-';
    const awayScore = liveData?.intAwayScore ?? '-';
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : liveData ? (
                    <>
                        <div className="flex justify-around items-center mb-4">
                            <div className="flex flex-col items-center gap-2 w-1/3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-center truncate p-1">{liveData.strHomeTeam.substring(0,3).toUpperCase()}</div>
                                <span className="font-semibold text-sm truncate">{liveData.strHomeTeam}</span>
                            </div>
                            <div className="font-bold text-4xl">
                                <span>{homeScore} - {awayScore}</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-1/3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg text-center truncate p-1">{liveData.strAwayTeam.substring(0,3).toUpperCase()}</div>
                                <span className="font-semibold text-sm truncate">{liveData.strAwayTeam}</span>
                            </div>
                        </div>
                        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                        <p className="text-xs text-muted-foreground mt-2">{liveData.strProgress}</p>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">No live matches currently.</p>
                )}
            </CardContent>
        </Card>
    );
}
