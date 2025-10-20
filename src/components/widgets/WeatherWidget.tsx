'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Haze, Wind, Loader2 } from 'lucide-react';
import { getWeather, type GetWeatherOutput } from '@/ai/flows/get-weather';
import { getCityFromCoords } from '@/ai/flows/get-city-from-coords';

const iconMap: Record<string, React.FC<any>> = {
  '01d': Sun, '01n': Sun,
  '02d': Cloud, '02n': Cloud,
  '03d': Cloud, '03n': Cloud,
  '04d': Cloud, '04n': Cloud,
  '09d': CloudRain, '09n': CloudRain,
  '10d': CloudRain, '10n': CloudRain,
  '11d': CloudLightning, '11n': CloudLightning,
  '13d': CloudSnow, '13n': CloudSnow,
  '50d': Haze, '50n': Haze,
  default: Sun,
};


type WeatherWidgetProps = {
    title?: string;
    location?: string;
}

export function WeatherWidget({ title = 'Weather', location: defaultLocation = "New York, NY" }: WeatherWidgetProps) {
    const [weatherData, setWeatherData] = useState<GetWeatherOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [location, setLocation] = useState(defaultLocation);

    useEffect(() => {
        const fetchWeatherForLocation = async (loc: string) => {
            setIsLoading(true);
            try {
                const data = await getWeather({ location: loc });
                 if (data.condition === "Error fetching data") {
                    throw new Error(`Could not fetch weather for ${loc}`);
                }
                setWeatherData(data);
                setLocation(loc);
            } catch (error) {
                console.error(error);
                setWeatherData(null);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchDynamicLocation = () => {
             if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    try {
                        const { city } = await getCityFromCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
                        fetchWeatherForLocation(city);
                    } catch (error) {
                         console.error("Could not get city from coords, falling back to default.", error);
                         fetchWeatherForLocation(defaultLocation);
                    }
                }, (error) => {
                    console.error("Geolocation error, falling back to default.", error);
                    fetchWeatherForLocation(defaultLocation);
                });
            } else {
                 console.log("Geolocation is not supported by this browser, falling back to default.");
                 fetchWeatherForLocation(defaultLocation);
            }
        }
        
        fetchDynamicLocation();
        
    }, [defaultLocation]);

    const Icon = weatherData ? (iconMap[weatherData.icon] || iconMap.default) : Loader2;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
                 <p className="text-sm text-muted-foreground">{location}</p>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : weatherData ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Icon className="h-12 w-12 text-primary" />
                            <div>
                                <div className="text-4xl font-bold">{weatherData.temp}°C</div>
                                <div className="text-sm text-muted-foreground capitalize">{weatherData.condition}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm">H: {weatherData.high}°</div>
                            <div className="text-sm text-muted-foreground">L: {weatherData.low}°</div>
                        </div>
                    </div>
                ) : (
                     <p className="text-sm text-destructive">Could not load weather data.</p>
                )}
            </CardContent>
        </Card>
    );
}
