'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockStandings = [
    { rank: 1, team: 'FC Pioneers', p: 10, w: 8, d: 1, l: 1, pts: 25 },
    { rank: 2, team: 'United Strikers', p: 10, w: 7, d: 2, l: 1, pts: 23 },
    { rank: 3, team: 'City Rovers', p: 10, w: 6, d: 2, l: 2, pts: 20 },
    { rank: 4, team: 'Mountain FC', p: 10, w: 5, d: 3, l: 2, pts: 18 },
];

type SportingTablesWidgetProps = {
    title?: string;
}

export function SportingTablesWidget({ title = 'League Standings' }: SportingTablesWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">#</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead className="text-right">Pts</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockStandings.map((row) => (
                            <TableRow key={row.rank}>
                                <TableCell className="font-medium">{row.rank}</TableCell>
                                <TableCell>{row.team}</TableCell>
                                <TableCell className="text-right">{row.pts}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
