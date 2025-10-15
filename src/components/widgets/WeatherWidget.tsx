'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';

const mockWeatherData: Record<string, any> = {
    sunny: { temp: 75, condition: 'Sunny', icon: Sun, high: 80, low: 65 },
    cloudy: { temp: 68, condition: 'Cloudy', icon: Cloud, high: 72, low: 62 },
    rainy: { temp: 62, condition: 'Rainy', icon: CloudRain, high: 65, low: 58 },
    snowy: { temp: 30, condition: 'Snowy', icon: CloudSnow, high: 32, low: 25 },
};

// Function to get a pseudo-random weather type based on location string
const getWeatherType = (location: string) => {
    const charCodeSum = location.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const types = Object.keys(mockWeatherData);
    return types[charCodeSum % types.length];
};

type WeatherWidgetProps = {
    title?: string;
    location?: string;
}

export function WeatherWidget({ title = 'Weather', location = "New York, NY" }: WeatherWidgetProps) {
    const weatherType = getWeatherType(location);
    const weatherData = mockWeatherData[weatherType];
    const Icon = weatherData.icon;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
                 <p className="text-sm text-muted-foreground">{location}</p>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Icon className="h-12 w-12 text-primary" />
                        <div>
                            <div className="text-4xl font-bold">{weatherData.temp}°</div>
                            <div className="text-sm text-muted-foreground">{weatherData.condition}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm">H: {weatherData.high}°</div>
                        <div className="text-sm text-muted-foreground">L: {weatherData.low}°</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
