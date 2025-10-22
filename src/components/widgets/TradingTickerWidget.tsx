'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { getTickerData, type GetTickerDataOutput } from '@/ai/flows/get-ticker-data';

type TradingTickerWidgetProps = {
    title?: string;
    market?: 'stocks' | 'crypto' | 'fx' | 'indices';
}

export function TradingTickerWidget({ title = 'Market Watch', market = 'fx' }: TradingTickerWidgetProps) {
    const [tickerData, setTickerData] = useState<GetTickerDataOutput['tickers']>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchTickerData = async () => {
            setIsLoading(true);
            try {
                const result = await getTickerData({ market });
                setTickerData(result.tickers);
            } catch (error) {
                console.error("Failed to fetch ticker data:", error);
                setTickerData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTickerData();
    }, [market]);


    return (
        <div className="bg-black text-white h-10 flex items-center overflow-hidden">
            <div className="bg-primary h-full flex items-center px-4 font-bold text-sm text-primary-foreground z-10">
                {title}
            </div>
            <div className="relative flex-1 h-full flex items-center overflow-hidden">
                {isLoading ? (
                    <div className="w-full flex justify-center items-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : tickerData.length > 0 ? (
                    <div className="absolute top-0 left-0 flex items-center h-full animate-marquee whitespace-nowrap">
                        {tickerData.concat(tickerData).map((stock, index) => (
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
                ) : (
                    <p className="text-sm text-gray-400 px-4">Market data is currently unavailable.</p>
                )}
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
