import { describe, it, expect, vi } from 'vitest'
import { fetchWeather, parseWeatherResponse } from '@/lib/data/weather'
import { WEATHER_FALLBACK } from '@/lib/data/fallbacks'

const mockCurrentData = {
  temperature_2m: 72.5,
  apparent_temperature: 68.3,
  weather_code: 0,
  wind_speed_10m: 8.2,
  wind_direction_10m: 270,
  relative_humidity_2m: 65,
  uv_index: 3,
}

const mockHourlyData = {
  time: Array.from({ length: 24 }, (_, i) => `2024-01-01T${String(i).padStart(2, '0')}:00`),
  temperature_2m: Array.from({ length: 24 }, (_, i) => 70 + i * 0.5),
  weather_code: Array<number>(24).fill(0),
}

const mockOpenMeteoResponse = {
  current: mockCurrentData,
  hourly: mockHourlyData,
}

describe('fetchWeather', () => {
  it('parses Open-Meteo response into WeatherData shape', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOpenMeteoResponse,
    } as Response)

    const result = await fetchWeather(40.71, -74.01)

    expect(result.temperature).toBe(72.5)
    expect(result.feelsLike).toBe(68.3)
    expect(result.condition).toBe('Clear sky')
    expect(result.humidity).toBe(65)
    expect(result.windSpeed).toBe(8.2)
    expect(result.hourlyForecast).toHaveLength(24)
    expect(result.hourlyForecast[0]).toMatchObject({ time: '2024-01-01T00:00', condition: 'Clear sky' })
  })

  it('returns WEATHER_FALLBACK on HTTP 500 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

    const result = await fetchWeather(40.71, -74.01)
    expect(result).toEqual(WEATHER_FALLBACK)
  })

  it('returns WEATHER_FALLBACK when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network failure'))

    const result = await fetchWeather(40.71, -74.01)
    expect(result).toEqual(WEATHER_FALLBACK)
  })

  it('temperature is in Fahrenheit — value passed through unchanged', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        current: { ...mockCurrentData, temperature_2m: 98.6 },
        hourly: mockHourlyData,
      }),
    } as Response)

    const result = await fetchWeather(40.71, -74.01)
    // 98.6°F is a known value; if mistakenly converted from Celsius it would be ~209°F
    expect(result.temperature).toBe(98.6)
  })

  it('handles missing hourly data without throwing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: mockCurrentData }),
    } as Response)

    const result = await fetchWeather(40.71, -74.01)
    expect(result.hourlyForecast).toEqual([])
    expect(result.temperature).toBe(72.5)
  })
})

describe('parseWeatherResponse', () => {
  it('maps weather_code 63 to Rainy', () => {
    const result = parseWeatherResponse({
      current: { ...mockCurrentData, weather_code: 63 },
      hourly: mockHourlyData,
    })
    expect(result.condition).toBe('Rainy')
  })
})
