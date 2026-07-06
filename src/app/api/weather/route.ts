import { NextRequest, NextResponse } from 'next/server';
import { offlineWeatherData } from '@/lib/offlineData';

export async function GET(req: NextRequest) {
  try {
    if (process.env.OFFLINE_MODE === 'true') {
      console.log('OFFLINE_MODE is active. Returning offline weather data.');
      return NextResponse.json(offlineWeatherData);
    }
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') || '28.6139'; // Default New Delhi
    const lon = searchParams.get('lon') || '77.2090';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();

    const currentTemp = data.current?.temperature_2m;
    const currentWind = data.current?.wind_speed_10m;
    const currentHumidity = data.current?.relative_humidity_2m;
    
    // Analyze forecasts and trigger warnings
    const warnings: string[] = [];

    if (currentTemp !== undefined) {
      if (currentTemp < 10) {
        warnings.push('Frost Warning: Extreme cold detected. Keep crops covered where possible and irrigate slightly to elevate ground temperature.');
      } else if (currentTemp > 38) {
        warnings.push('Heat Wave Alert: Extreme heat detected. Increase watering frequency and apply organic mulch to conserve soil moisture.');
      }
    }

    if (currentWind !== undefined && currentWind > 20) {
      warnings.push('Strong Winds: Wind speed exceeds 20 km/h. Postpone spraying of pesticides and provide support to tall crops like banana or sugarcane.');
    }

    if (currentHumidity !== undefined && currentHumidity > 80 && currentTemp !== undefined && currentTemp >= 20 && currentTemp <= 30) {
      warnings.push('High Fungal Infection Risk: Warm and humid air increases the spread of fungal diseases like downy mildew and blights. Monitor plant leaves closely.');
    }

    // Check next 3 days of rain forecast
    const dailyProb = data.daily?.precipitation_probability_max || [];
    const dailyRain = data.daily?.precipitation_sum || [];
    const dates = data.daily?.time || [];
    
    let rainExpectedSoon = false;
    for (let i = 0; i < 3; i++) {
      if (dailyProb[i] > 60 && dailyRain[i] > 5) {
        rainExpectedSoon = true;
        warnings.push(`Heavy Rain Expected (${dates[i]}): Forecast predicts a ${dailyProb[i]}% chance of rain (${dailyRain[i]}mm). Ensure field drainage is clear and postpone nitrogen/urea applications.`);
        break; // Show only one warning for rain to avoid clutter
      }
    }

    // Map weather codes to farmer-friendly status text
    // Ref: WMO Weather interpretation codes
    const wmoCodes: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy conditions', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
      80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };

    const currentWeatherCode = data.current?.weather_code ?? 0;
    const conditionText = wmoCodes[currentWeatherCode] || 'Showers';

    return NextResponse.json({
      current: {
        temp: currentTemp,
        humidity: currentHumidity,
        windSpeed: currentWind,
        precipitation: data.current?.precipitation,
        condition: conditionText,
        weatherCode: currentWeatherCode
      },
      daily: {
        dates: dates.slice(0, 5),
        tempMax: data.daily?.temperature_2m_max?.slice(0, 5) || [],
        tempMin: data.daily?.temperature_2m_min?.slice(0, 5) || [],
        rainProb: dailyProb.slice(0, 5),
        rainSum: dailyRain.slice(0, 5),
        weatherCodes: data.daily?.weather_code?.slice(0, 5) || []
      },
      warnings
    });

  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(offlineWeatherData);
  }
}
