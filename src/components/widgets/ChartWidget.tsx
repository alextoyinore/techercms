
'use client';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type ChartData = {
    id: string;
    name: string;
    type: 'bar' | 'line' | 'pie';
    data: any[];
};

type ChartWidgetProps = {
    title?: string;
    chartId?: string;
};

export function ChartWidget({ title, chartId }: ChartWidgetProps) {
    const firestore = useFirestore();

    const chartRef = useMemoFirebase(() => {
        if (!firestore || !chartId) return null;
        return doc(firestore, 'charts', chartId);
    }, [firestore, chartId]);

    const { data: chartData, isLoading } = useDoc<ChartData>(chartRef);

    const renderChart = () => {
        if (!chartData) return null;

        const dataKeys = chartData.data.length > 0 ? Object.keys(chartData.data[0]).filter(key => key !== 'name') : [];

        switch (chartData.type) {
            case 'bar':
                return (
                    <BarChart data={chartData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {dataKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={chartData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {dataKeys.map((key, index) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                    </LineChart>
                );
            case 'pie':
                 return (
                    <PieChart>
                        <Tooltip />
                        <Legend />
                        <Pie
                            data={chartData.data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                            label
                        />
                    </PieChart>
                );
            default:
                return <p>Unknown chart type.</p>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title || chartData?.name}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {!isLoading && chartData ? (
                    <ResponsiveContainer width="100%" height={300}>
                        {renderChart()}
                    </ResponsiveContainer>
                ) : !isLoading && (
                    <p className="text-muted-foreground">Chart data not found or not configured.</p>
                )}
            </CardContent>
        </Card>
    );
}
