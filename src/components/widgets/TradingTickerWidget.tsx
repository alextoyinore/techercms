'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const mockTickerData = [
    { symbol: 'AAPL', price: 172.50, change: 1.25, isUp: true },
    { symbol: 'GOOGL', price: 135.80, change: -0.75, isUp: false },
    { symbol: 'MSFT', price: 340.10, change: 2.50, isUp: true },
    { symbol: 'AMZN', price: 138.20, change: 0.00, isUp: null },
    { symbol: 'TSLA', price: 250.60, change: -5.40, isUp: false },
    { symbol: 'NVDA', price: 120.75, change: 3.10, isUp: true },
    { symbol: 'META', price: 495.30, change: -1.80, isUp: false },
];

type TradingTickerWidgetProps = {
    title?: string;
}

export function TradingTickerWidget({ title = 'Market Watch' }: TradingTickerWidgetProps) {
    return (
        <div className="bg-black text-white h-12 flex items-center rounded-md overflow-hidden">
            <div className="bg-primary h-full flex items-center px-4">
                <h3 className="font-headline font-bold text-sm whitespace-nowrap text-primary-foreground">{title}</h3>
            </div>
            <div className="relative flex-1 h-full flex items-center overflow-hidden">
                <div className="absolute top-0 left-0 flex items-center h-full animate-marquee whitespace-nowrap">
                    {mockTickerData.concat(mockTickerData).map((stock, index) => (
                        <div key={index} className="mx-6 flex items-center gap-3">
                            <span className="font-bold text-sm">{stock.symbol}</span>
                            <span className="text-sm">{stock.price.toFixed(2)}</span>
                            <div className={`flex items-center text-xs ${stock.isUp === true ? 'text-green-400' : stock.isUp === false ? 'text-red-400' : 'text-gray-400'}`}>
                                {stock.isUp === true ? <TrendingUp className="h-3 w-3 mr-1" /> : stock.isUp === false ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
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
                    animation: marquee 40s linear infinite;
                }
            `}</style>
        </div>
    );
}
