'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const mockTickerData = [
    { symbol: 'AAPL', price: 172.50, change: 1.25, isUp: true },
    { symbol: 'GOOGL', price: 135.80, change: -0.75, isUp: false },
    { symbol: 'MSFT', price: 340.10, change: 2.50, isUp: true },
    { symbol: 'AMZN', price: 138.20, change: 0.00, isUp: null },
    { symbol: 'TSLA', price: 250.60, change: -5.40, isUp: false },
];

type TradingTickerWidgetProps = {
    title?: string;
}

export function TradingTickerWidget({ title = 'Market Watch' }: TradingTickerWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-hidden relative h-10">
                    <div className="absolute top-0 flex animate-marquee whitespace-nowrap">
                        {mockTickerData.concat(mockTickerData).map((stock, index) => (
                            <div key={index} className="mx-4 flex items-center gap-2">
                                <span className="font-bold text-sm">{stock.symbol}</span>
                                <span className="text-sm">{stock.price.toFixed(2)}</span>
                                <div className={`flex items-center text-xs ${stock.isUp === true ? 'text-green-600' : stock.isUp === false ? 'text-red-600' : 'text-muted-foreground'}`}>
                                    {stock.isUp === true ? <TrendingUp className="h-3 w-3 mr-1" /> : stock.isUp === false ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                                    {stock.change.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <style jsx>{`
                    @keyframes marquee {
                        0% { transform: translateX(0%); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        animation: marquee 30s linear infinite;
                    }
                `}</style>
            </CardContent>
        </Card>
    );
}
