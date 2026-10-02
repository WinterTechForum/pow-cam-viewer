const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const CM_PER_INCH = 2.54;

export function past24HourSnowfallInches(hourly) {
  if (!Array.isArray(hourly?.snowfall) || hourly.snowfall.length < 24) return null;
  const recentValues = hourly.snowfall.slice(-24);
  if (recentValues.some((value) => typeof value !== 'number' || !Number.isFinite(value))) return null;
  return recentValues.reduce((sum, value) => sum + value, 0) / CM_PER_INCH;
}

export async function loadSnowfallEstimates(resorts) {
  if (resorts.length === 0) return new Map();

  const params = new URLSearchParams({
    latitude: resorts.map((resort) => resort.latitude).join(','),
    longitude: resorts.map((resort) => resort.longitude).join(','),
    hourly: 'snowfall',
    past_hours: '24',
    forecast_hours: '1',
    timezone: 'UTC',
    timeformat: 'unixtime'
  });
  const response = await fetch(`${OPEN_METEO_ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`Snow data request failed (${response.status}).`);

  const payload = await response.json();
  const locations = Array.isArray(payload) ? payload : [payload];
  return new Map(resorts.map((resort, index) => [
    resort.id,
    past24HourSnowfallInches(locations[index]?.hourly)
  ]));
}
