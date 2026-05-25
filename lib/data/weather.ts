import type { WeatherData, HourlyForecast } from '@/lib/types'
import { WEATHER_FALLBACK } from '@/lib/data/fallbacks'

const WEATHER_CODE_MAP: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rainy',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snowy',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Heavy showers',
  95: 'Thunderstorm',
  99: 'Severe thunderstorm',
}

function weatherCodeToCondition(code: number): string {
  return WEATHER_CODE_MAP[code] ?? 'Unknown'
}

type OpenMeteoResponse = {
  current: {
    temperature_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
    wind_direction_10m: number
    relative_humidity_2m: number
    uv_index: number
  }
  hourly?: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
  }
}

export function parseWeatherResponse(json: unknown): WeatherData {
  const data = json as OpenMeteoResponse
  const current = data.current

  const hourlyForecast: HourlyForecast[] = []
  if (data.hourly?.time?.length) {
    const count = Math.min(24, data.hourly.time.length)
    for (let i = 0; i < count; i++) {
      hourlyForecast.push({
        time: data.hourly.time[i],
        temperature: data.hourly.temperature_2m[i],
        condition: weatherCodeToCondition(data.hourly.weather_code[i]),
      })
    }
  }

  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    condition: weatherCodeToCondition(current.weather_code),
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    hourlyForecast,
  }
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,` +
      `wind_direction_10m,relative_humidity_2m,uv_index` +
      `&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&forecast_days=1&timezone=auto`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return parseWeatherResponse(await res.json())
  } catch (err) {
    console.error('Weather fetch failed:', err)
    return WEATHER_FALLBACK
  }
}
