import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudRain } from "lucide-react";

export type WeatherData = {
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  localTime?: string;
};

export default function WeatherCard({
  t,
  weatherData,
}: {
  t: { weather: string };
  weatherData: WeatherData | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudRain className="h-5 w-5" />
          {t.weather}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weatherData ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Temperature:</span>
              <span>{weatherData.temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span>Humidity:</span>
              <span>{weatherData.humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span>Rainfall:</span>
              <span>{weatherData.rainfall}mm</span>
            </div>
            {weatherData.localTime && (
              <div className="flex justify-between">
                <span>Local Time:</span>
                <span>{weatherData.localTime}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{weatherData.forecast}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">Enter location to get weather data</p>
        )}
      </CardContent>
    </Card>
  );
}
