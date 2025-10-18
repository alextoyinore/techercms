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
import { getSportingTables, type GetSportingTablesOutput } from '@/ai/flows/get-sporting-tables';
import { Loader2 } from 'lucide-react';

type SportingTablesWidgetProps = {
    title?: string;
    leagueId?: string;
}

export function SportingTablesWidget({ title = 'League Standings', leagueId = '4328' }: SportingTablesWidgetProps) {
    const [standings, setStandings] = useState<GetSportingTablesOutput['table']>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTable = async () => {
            setIsLoading(true);
            try {
                const result = await getSportingTables({ leagueId });
                // Show top 5 for widget brevity
                setStandings(result.table.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch league table:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTable();
    }, [leagueId]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                     <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : standings.length > 0 ? (
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
                                <TableRow key={row.intRank}>
                                    <TableCell className="font-medium">{row.intRank}</TableCell>
                                    <TableCell>{row.strTeam}</TableCell>
                                    <TableCell className="text-right">{row.intPoints}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Standings not available.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
