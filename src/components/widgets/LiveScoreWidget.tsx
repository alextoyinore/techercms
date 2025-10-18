'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { getLiveScore, type GetLiveScoreOutput } from '@/ai/flows/get-live-score';
import { Loader2 } from 'lucide-react';

type LiveScoreWidgetProps = {
    title?: string;
}

export function LiveScoreWidget({ title = 'Live Matches' }: LiveScoreWidgetProps) {
    const [liveData, setLiveData] = useState<GetLiveScoreOutput['events']>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLiveScores = async () => {
            setIsLoading(true);
            try {
                // Input is now an empty object
                const result = await getLiveScore({});
                if (result.events) {
                    setLiveData(result.events);
                }
            } catch (error) {
                console.error("Failed to fetch live scores:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiveScores();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : liveData.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Home</TableHead>
                                <TableHead className="text-center">Score</TableHead>
                                <TableHead className="text-right">Away</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {liveData.map((match) => (
                                <TableRow key={match.idEvent}>
                                    <TableCell className="font-medium text-left truncate">{match.strHomeTeam}</TableCell>
                                    <TableCell className="font-bold text-center whitespace-nowrap">
                                        {match.intHomeScore ?? '-'} : {match.intAwayScore ?? '-'}
                                        <Badge variant="destructive" className="ml-2 animate-pulse text-xs">
                                          {match.strProgress}'
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-right truncate">{match.strAwayTeam}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No live matches currently.</p>
                )}
            </CardContent>
        </Card>
    );
}
