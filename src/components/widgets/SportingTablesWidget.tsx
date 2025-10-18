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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSportingTables, type GetSportingTablesOutput } from '@/ai/flows/get-sporting-tables';
import { Loader2 } from 'lucide-react';

type SportingTablesWidgetProps = {
    title?: string;
    season?: string;
}

const leagues = [
    { name: 'Premier League', id: '4328' },
    { name: 'La Liga', id: '4335' },
    { name: 'Serie A', id: '4332' },
    { name: 'Bundesliga', id: '4331' },
    { name: 'Ligue 1', id: '4334' },
];

function LeagueTable({ leagueId, season }: { leagueId: string, season: string }) {
    const [standings, setStandings] = useState<GetSportingTablesOutput['table']>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTable = async () => {
            setIsLoading(true);
            try {
                const result = await getSportingTables({ leagueId, season });
                setStandings(result.table);
            } catch (error) {
                console.error(`Failed to fetch league table for ${leagueId}:`, error);
                setStandings([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTable();
    }, [leagueId, season]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (standings.length === 0) {
        return <p className="text-sm text-muted-foreground text-center p-4">Standings not available.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Pts</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {standings.map((row) => (
                    <TableRow key={row.strTeam}>
                        <TableCell className="font-medium">{row.intRank}</TableCell>
                        <TableCell>{row.strTeam}</TableCell>
                        <TableCell className="text-right">{row.intPoints}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export function SportingTablesWidget({ title = 'League Standings', season = '2025-2026' }: SportingTablesWidgetProps) {
    const defaultLeague = leagues[0].id;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                    <span className="text-xs font-semibold text-muted-foreground">{season}</span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue={defaultLeague}>
                    <TabsList className="w-full justify-start rounded-none bg-transparent border-b px-4">
                        {leagues.map(league => (
                             <TabsTrigger key={league.id} value={league.id} className="text-xs px-2 sm:px-3">
                                {league.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {leagues.map(league => (
                        <TabsContent key={league.id} value={league.id} className="m-0">
                           <LeagueTable leagueId={league.id} season={season} />
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
