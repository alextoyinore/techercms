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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocationAndWeather = async () => {
            setIsLoading(true);
            setError(null);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const cityData = await getCityFromCoords({ lat: latitude, lon: longitude });
                        const detectedCity = cityData.city;
                        setLocation(detectedCity);
                        const data = await getWeather({ location: detectedCity });
                        if (data.condition === "Error fetching data") {
                             throw new Error("Failed to fetch weather for auto-detected location.");
                        }
                        setWeatherData(data);
                    } catch (e: any) {
                        setError("Could not determine local weather. Using default.");
                        console.error(e);
                        // Fallback to default location if auto-detection fails
                        const data = await getWeather({ location: defaultLocation });
                        setWeatherData(data);
                    } finally {
                        setIsLoading(false);
                    }
                }, async (error) => {
                    // Geolocation failed or was denied
                    console.warn(`Geolocation error: ${error.message}. Using default location.`);
                    setError("Location access denied. Showing default weather.");
                    setLocation(defaultLocation);
                    const data = await getWeather({ location: defaultLocation });
                    setWeatherData(data);
                    setIsLoading(false);
                });
            } else {
                 // Geolocation not supported
                 console.warn("Geolocation not supported. Using default location.");
                 setError("Geolocation not supported. Showing default weather.");
                 setLocation(defaultLocation);
                 const data = await getWeather({ location: defaultLocation });
                 setWeatherData(data);
                 setIsLoading(false);
            }
        };
        fetchLocationAndWeather();
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
                ) : weatherData && weatherData.condition !== "Error fetching data" ? (
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
                     <p className="text-sm text-destructive">{error || "Could not load weather data."}</p>
                )}
            </CardContent>
        </Card>
    );
}
