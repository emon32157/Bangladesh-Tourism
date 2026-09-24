/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BangladeshDistrict } from '../data/bangladeshDistricts';

// Direct Xweather API credentials provided by user
export const XWEATHER_CLIENT_ID = 'W92eStiZMEShcS0oeYzAZ';
export const XWEATHER_CLIENT_SECRET = 'zJRoPl1cjszZyzpa5ADfng3q9YsxSbCqiChR16H1';

export interface DailyForecast {
  date: string;
  dayNameEn: string;
  dayNameBn: string;
  maxTempC: number;
  minTempC: number;
  conditionEn: string;
  conditionBn: string;
  icon: string;
  precipMM: number;
  pop: number; // Probability of precipitation %
  humidity: number;
  windSpeedKPH: number;
}

export interface LiveWeatherData {
  districtId: string;
  districtNameEn: string;
  districtNameBn: string;
  divisionEn: string;
  divisionBn: string;
  lat: number;
  lng: number;
  tempC: number;
  tempF: number;
  feelslikeC: number;
  feelslikeF: number;
  conditionEn: string;
  conditionBn: string;
  icon: string;
  humidity: number;
  windSpeedKPH: number;
  windSpeedMPH: number;
  windDir: string;
  windDirDEG: number;
  precipMM: number;
  precipProbability: number;
  highTempC: number;
  lowTempC: number;
  sunrise: string; // Formatted time e.g. "5:48 AM"
  sunset: string;  // Formatted time e.g. "5:52 PM"
  sunriseISO: string;
  sunsetISO: string;
  uvIndex: number;
  pressureMB: number;
  visibilityKM: number;
  lastUpdatedISO: string;
  lastUpdatedTime: string;
  forecast: DailyForecast[];
  isDay: boolean;
}

// Map common English weather conditions to Bengali
const CONDITION_TRANSLATIONS: Record<string, string> = {
  'Clear': 'পরিষ্কার আকাশ',
  'Sunny': 'রৌদ্রোজ্জ্বল',
  'Mostly Sunny': 'বেশিরভাগ সময় রৌদ্রোজ্জ্বল',
  'Partly Cloudy': 'আংশিক মেঘলা',
  'Mostly Cloudy': 'বেশিরভাগ সময় মেঘলা',
  'Cloudy': 'মেঘলা আকাশ',
  'Overcast': 'মেঘলা আবহাওয়া',
  'Rain': 'বৃষ্টি',
  'Light Rain': 'হালকা বৃষ্টি',
  'Heavy Rain': 'ভারী বৃষ্টি',
  'Showers': 'বৃষ্টির ধারা',
  'Scattered Showers': 'বিক্ষিপ্ত বৃষ্টি',
  'Rain Showers': 'বৃষ্টির ফোয়ারা',
  'Partly Cloudy with Showers': 'মেঘলা সহ বৃষ্টিপাত',
  'Thunderstorm': 'বজ্রবৃষ্টি',
  'Isolated Thunderstorms': 'বিক্ষিপ্ত বজ্রবৃষ্টি',
  'Scattered Thunderstorms': 'বজ্রসহ বৃষ্টিপাত',
  'Drizzle': 'গুড়ি গুড়ি বৃষ্টি',
  'Fog': 'কুয়াশা',
  'Mist': 'হালকা কুয়াশা',
  'Haze': 'ধোঁয়াশা',
  'Windy': 'দমকা বাতাস',
  'Breezy': 'মৃদু বাতাস',
};

export function translateConditionToBn(condition: string): string {
  if (!condition) return 'স্বাভাবিক আবহাওয়া';
  if (CONDITION_TRANSLATIONS[condition]) {
    return CONDITION_TRANSLATIONS[condition];
  }
  for (const [key, val] of Object.entries(CONDITION_TRANSLATIONS)) {
    if (condition.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return condition;
}

const DAY_NAMES_BN: Record<string, string> = {
  Sunday: 'রবিবার',
  Monday: 'সোমবার',
  Tuesday: 'মঙ্গলবার',
  Wednesday: 'বুধবার',
  Thursday: 'বৃহস্পতিবার',
  Friday: 'শুক্রবার',
  Saturday: 'শনিবার',
};

// Formats an ISO string to a friendly time "h:mm A" in Asia/Dhaka
export function formatToDhakaTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '--:--';
  }
}

// In-Memory cache with 15 minute TTL
interface CacheEntry {
  timestamp: number;
  data: LiveWeatherData;
}

const WEATHER_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetches real-time weather and 5-day forecast for a Bangladesh district from Xweather API
 */
export async function fetchDistrictWeather(
  district: BangladeshDistrict,
  forceRefresh = false
): Promise<LiveWeatherData> {
  const cacheKey = district.id;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = WEATHER_CACHE.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    // Also check sessionStorage
    try {
      const stored = sessionStorage.getItem(`xwx_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheEntry;
        if (now - parsed.timestamp < CACHE_TTL_MS) {
          WEATHER_CACHE.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    } catch {}
  }

  const lat = district.lat.toFixed(4);
  const lng = district.lng.toFixed(4);

  // Parallel fetch: current conditions + daily forecast
  const conditionsUrl = `https://data.api.xweather.com/conditions/${lat},${lng}?client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;
  const forecastUrl = `https://data.api.xweather.com/forecasts/${lat},${lng}?filter=day&limit=6&client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;

  const [condRes, fcRes] = await Promise.all([
    fetch(conditionsUrl).then((r) => {
      if (!r.ok) throw new Error(`Conditions request failed: ${r.status}`);
      return r.json();
    }),
    fetch(forecastUrl).then((r) => {
      if (!r.ok) throw new Error(`Forecast request failed: ${r.status}`);
      return r.json();
    }),
  ]);

  if (!condRes.success || !condRes.response || condRes.response.length === 0) {
    throw new Error(condRes.error?.description || 'Could not retrieve conditions for district');
  }

  const condPeriod = condRes.response[0]?.periods?.[0] || {};
  const fcPeriods: any[] = fcRes?.success && fcRes?.response?.[0]?.periods ? fcRes.response[0].periods : [];
  const todayFc = fcPeriods[0] || {};

  const tempC = Math.round(condPeriod.tempC ?? todayFc.tempC ?? 28);
  const tempF = Math.round(condPeriod.tempF ?? (tempC * 9) / 5 + 32);
  const feelslikeC = Math.round(condPeriod.feelslikeC ?? tempC);
  const feelslikeF = Math.round(condPeriod.feelslikeF ?? tempF);

  const rawCondition = condPeriod.weather || condPeriod.weatherPrimary || todayFc.weather || 'Clear';
  const rawIcon = condPeriod.icon || todayFc.icon || 'clear.png';

  const humidity = condPeriod.humidity ?? todayFc.humidity ?? 75;
  const windSpeedKPH = Math.round(condPeriod.windSpeedKPH ?? todayFc.windSpeedKPH ?? 10);
  const windSpeedMPH = Math.round(condPeriod.windSpeedMPH ?? (windSpeedKPH * 0.621371));
  const windDir = condPeriod.windDir || todayFc.windDir || 'SE';
  const windDirDEG = condPeriod.windDirDEG ?? todayFc.windDirDEG ?? 135;
  const precipMM = +(condPeriod.precipMM ?? todayFc.precipMM ?? 0).toFixed(1);
  const precipProbability = condPeriod.pop ?? todayFc.pop ?? 0;

  const highTempC = Math.round(todayFc.maxTempC ?? tempC + 3);
  const lowTempC = Math.round(todayFc.minTempC ?? tempC - 4);

  const sunriseISO = todayFc.sunriseISO || condPeriod.dateTimeISO;
  const sunsetISO = todayFc.sunsetISO || condPeriod.dateTimeISO;
  const sunrise = formatToDhakaTime(sunriseISO);
  const sunset = formatToDhakaTime(sunsetISO);

  const uvIndex = condPeriod.uvi ?? todayFc.uvi ?? 6;
  const pressureMB = condPeriod.pressureMB ?? 1008;
  const visibilityKM = +(condPeriod.visibilityKM ?? 8).toFixed(1);
  const isDay = condPeriod.isDay ?? true;

  const lastUpdatedISO = condPeriod.dateTimeISO || new Date().toISOString();
  const lastUpdatedTime = formatToDhakaTime(lastUpdatedISO);

  // Map 5-day forecast
  const forecast: DailyForecast[] = fcPeriods.slice(0, 6).map((period: any, idx: number) => {
    const d = new Date(period.dateTimeISO);
    const dayNameEn = idx === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Dhaka' });
    const fullDayEn = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Dhaka' });
    const dayNameBn = idx === 0 ? 'আজ' : (DAY_NAMES_BN[fullDayEn] || dayNameEn);
    const cond = period.weatherPrimary || period.weather || 'Partly Cloudy';

    return {
      date: period.dateTimeISO?.split('T')?.[0] || '',
      dayNameEn,
      dayNameBn,
      maxTempC: Math.round(period.maxTempC ?? 30),
      minTempC: Math.round(period.minTempC ?? 24),
      conditionEn: cond,
      conditionBn: translateConditionToBn(cond),
      icon: period.icon || 'pcloudy.png',
      precipMM: +(period.precipMM || 0).toFixed(1),
      pop: period.pop || 0,
      humidity: period.humidity || 70,
      windSpeedKPH: Math.round(period.windSpeedKPH || 10),
    };
  });

  const weatherData: LiveWeatherData = {
    districtId: district.id,
    districtNameEn: district.nameEn,
    districtNameBn: district.nameBn,
    divisionEn: district.divisionEn,
    divisionBn: district.divisionBn,
    lat: district.lat,
    lng: district.lng,
    tempC,
    tempF,
    feelslikeC,
    feelslikeF,
    conditionEn: rawCondition,
    conditionBn: translateConditionToBn(rawCondition),
    icon: rawIcon,
    humidity,
    windSpeedKPH,
    windSpeedMPH,
    windDir,
    windDirDEG,
    precipMM,
    precipProbability,
    highTempC,
    lowTempC,
    sunrise,
    sunset,
    sunriseISO,
    sunsetISO,
    uvIndex,
    pressureMB,
    visibilityKM,
    lastUpdatedISO,
    lastUpdatedTime,
    forecast,
    isDay,
  };

  // Store in cache
  const entry: CacheEntry = { timestamp: now, data: weatherData };
  WEATHER_CACHE.set(cacheKey, entry);
  try {
    sessionStorage.setItem(`xwx_${cacheKey}`, JSON.stringify(entry));
  } catch {}

  return weatherData;
}
