/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BANGLADESH_DISTRICTS,
  BangladeshDistrict,
} from '../data/bangladeshDistricts';
import {
  fetchDistrictWeather,
  LiveWeatherData,
} from '../lib/weatherService';
import { Language } from '../types';
import {
  CloudSun,
  Search,
  Droplets,
  Wind,
  Compass,
  Sunrise,
  Sunset,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Eye,
  Gauge,
  Thermometer,
  RotateCw,
  MapPin,
  Calendar,
  Sparkles,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';

interface WeatherSectionProps {
  language: Language;
  preselectedDistrictId?: string | null;
  onSelectDistrictInMap?: (districtName: string) => void;
  isStandalonePage?: boolean;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({
  language,
  preselectedDistrictId,
  onSelectDistrictInMap,
  isStandalonePage = false,
}) => {
  // Selected district (default: Dhaka)
  const [selectedDistrict, setSelectedDistrict] = useState<BangladeshDistrict>(() => {
    if (preselectedDistrictId) {
      const match = BANGLADESH_DISTRICTS.find(
        (d) => d.id.toLowerCase() === preselectedDistrictId.toLowerCase() ||
               d.nameEn.toLowerCase() === preselectedDistrictId.toLowerCase()
      );
      if (match) return match;
    }
    return BANGLADESH_DISTRICTS[0]; // Dhaka
  });

  // Weather state
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Search & Dropdown State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync if preselected district prop changes
  useEffect(() => {
    if (preselectedDistrictId) {
      const match = BANGLADESH_DISTRICTS.find(
        (d) => d.id.toLowerCase() === preselectedDistrictId.toLowerCase() ||
               d.nameEn.toLowerCase() === preselectedDistrictId.toLowerCase()
      );
      if (match && match.id !== selectedDistrict.id) {
        setSelectedDistrict(match);
      }
    }
  }, [preselectedDistrictId]);

  // Load weather when selected district changes
  const loadWeather = async (district: BangladeshDistrict, force = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchDistrictWeather(district, force);
      setWeatherData(data);
    } catch (err: any) {
      console.error('Weather load error:', err);
      setError(
        language === 'en'
          ? 'Failed to fetch live weather data. Please verify your connection or try again.'
          : 'লাইভ আবহাওয়ার তথ্য আনা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedDistrict);
  }, [selectedDistrict]);

  // Filtered districts for search and dropdown
  const filteredDistricts = useMemo(() => {
    return BANGLADESH_DISTRICTS.filter((d) => {
      const matchesDivision =
        selectedDivisionFilter === 'all' ||
        d.divisionEn.toLowerCase() === selectedDivisionFilter.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesDivision;

      const matchesSearch =
        d.nameEn.toLowerCase().includes(query) ||
        d.nameBn.includes(query) ||
        d.divisionEn.toLowerCase().includes(query) ||
        d.divisionBn.includes(query);

      return matchesDivision && matchesSearch;
    });
  }, [searchQuery, selectedDivisionFilter]);

  // Division list
  const divisions = [
    { id: 'all', en: 'All Divisions', bn: 'সকল বিভাগ' },
    { id: 'dhaka', en: 'Dhaka', bn: 'ঢাকা' },
    { id: 'chittagong', en: 'Chittagong', bn: 'চট্টগ্রাম' },
    { id: 'sylhet', en: 'Sylhet', bn: 'সিলেট' },
    { id: 'rajshahi', en: 'Rajshahi', bn: 'রাজশাহী' },
    { id: 'khulna', en: 'Khulna', bn: 'খুলনা' },
    { id: 'barishal', en: 'Barishal', bn: 'বরিশাল' },
    { id: 'rangpur', en: 'Rangpur', bn: 'রংপুর' },
    { id: 'mymensingh', en: 'Mymensingh', bn: 'ময়মনসিংহ' },
  ];

  // Quick picks
  const quickPickDistrictIds = ['dhaka', 'coxs-bazar', 'sylhet', 'bandarban', 'chittagong', 'rajshahi', 'khulna', 'patuakhali'];
  const quickPicks = useMemo(() => {
    return BANGLADESH_DISTRICTS.filter((d) => quickPickDistrictIds.includes(d.id));
  }, []);

  const handleSelectDistrict = (dist: BangladeshDistrict) => {
    setSelectedDistrict(dist);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Helper for weather icon fallback
  const renderWeatherIcon = (iconName: string, sizeClass = 'w-16 h-16') => {
    const isNight = iconName.includes('night') || iconName.includes('nt_');
    const isRain = iconName.includes('rain') || iconName.includes('shower') || iconName.includes('drizzle');
    const isThunder = iconName.includes('storm') || iconName.includes('tstorm');
    const isCloudy = iconName.includes('cloud') || iconName.includes('ovc');

    if (isThunder) return <CloudLightning className={`${sizeClass} text-amber-500 animate-pulse`} />;
    if (isRain) return <CloudRain className={`${sizeClass} text-blue-500`} />;
    if (isCloudy) return <CloudSun className={`${sizeClass} text-sky-600`} />;
    return <Sun className={`${sizeClass} text-amber-500`} />;
  };

  return (
    <section
      id="weather"
      className={`relative w-full overflow-hidden transition-all duration-300 ${
        isStandalonePage ? 'min-h-[85vh] py-8 md:py-14 bg-[#F6F3EA]' : 'py-16 md:py-24 bg-[#FAF7F0] border-t border-[#D8D0BC]'
      }`}
    >
      {/* Subtle decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0F3B2E_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold tracking-widest text-[#8C3B2E] uppercase mb-2">
              <Sparkles className="w-4 h-4 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Live Meteorological Intelligence' : 'সরাসরি আবহাওয়া তথ্য সেবা'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A2A21] font-serif tracking-tight">
              {language === 'en' ? 'Bangladesh 64 Districts Live Weather' : 'বাংলাদেশের ৬৪ জেলার লাইভ আবহাওয়া'}
            </h2>
            <p className="mt-2 text-sm md:text-base text-[#4B554E] max-w-2xl">
              {language === 'en'
                ? 'Real-time temperature, atmospheric metrics, rainfall probability, and 5-day forecasts across all 64 districts powered by Xweather API.'
                : 'Xweather API-এর সহায়তায় বাংলাদেশের সকল ৬৪টি জেলার রিয়েল-টাইম তাপমাত্রা, আর্দ্রতা, বৃষ্টিপাতের সম্ভাবনা ও ৫ দিনের নির্ভুল পূর্বাভাস।'}
            </p>
          </div>

          {/* Unit Toggle & Refresh */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="inline-flex rounded-xl p-1 bg-white border border-[#D8D0BC] shadow-xs">
              <button
                type="button"
                onClick={() => setTempUnit('C')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tempUnit === 'C'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:text-[#0A2A21]'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setTempUnit('F')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tempUnit === 'F'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:text-[#0A2A21]'
                }`}
              >
                °F
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadWeather(selectedDistrict, true)}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D8D0BC] text-[#0A2A21] text-xs font-bold hover:bg-[#F6F3EA] shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              title={language === 'en' ? 'Refresh live weather' : 'আবহাওয়া তথ্য রিফ্রেশ করুন'}
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#DE9B2E] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (language === 'en' ? 'Updating...' : 'আপডেট হচ্ছে...') : (language === 'en' ? 'Refresh' : 'রিফ্রেশ')}</span>
            </button>
          </div>
        </div>

        {/* 64 Districts Search & Selector Bar */}
        <div className="mb-8 p-4 md:p-6 bg-white/95 rounded-2xl md:rounded-3xl border border-[#D8D0BC] shadow-md backdrop-blur-md">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input with Autocomplete Dropdown */}
            <div className="relative flex-1" ref={dropdownRef}>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B756E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder={
                    language === 'en'
                      ? 'Search any of 64 districts (e.g. Dhaka, Feni, Cox’s Bazar, Sylhet)...'
                      : 'যেকোনো জেলা খুঁজুন (যেমন: ঢাকা, ফেনী, কক্সবাজার, সিলেট)...'
                  }
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#FAF7F0] border border-[#D8D0BC] text-sm text-[#0A2A21] placeholder-[#6B756E] focus:outline-none focus:ring-2 focus:ring-[#DE9B2E]/50 focus:border-[#DE9B2E] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B756E] hover:text-[#0A2A21] p-1"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-[#D8D0BC] max-h-80 overflow-y-auto z-50 p-2 divide-y divide-[#E2DCce]/50"
                  >
                    <div className="p-2 text-xs font-bold uppercase tracking-wider text-[#6B756E] flex justify-between items-center">
                      <span>{language === 'en' ? '64 Bangladesh Districts' : 'বাংলাদেশের ৬৪ জেলা'}</span>
                      <span className="text-[11px] font-normal text-[#8C3B2E]">
                        {filteredDistricts.length} {language === 'en' ? 'found' : 'পাওয়া গেছে'}
                      </span>
                    </div>

                    {filteredDistricts.length === 0 ? (
                      <div className="p-4 text-center text-sm text-[#6B756E]">
                        {language === 'en' ? 'No district found matching your search.' : 'আপনার অনুসন্ধানের সাথে কোনো জেলা পাওয়া যায়নি।'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 p-1">
                        {filteredDistricts.map((dist) => {
                          const isSelected = dist.id === selectedDistrict.id;
                          return (
                            <button
                              key={dist.id}
                              type="button"
                              onClick={() => handleSelectDistrict(dist)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0F3B2E] text-white font-bold'
                                  : 'hover:bg-[#F6F3EA] text-[#0A2A21]'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">
                                  {language === 'en' ? dist.nameEn : dist.nameBn}
                                </span>
                                <span className={`text-[10px] ${isSelected ? 'text-[#DE9B2E]' : 'text-[#6B756E]'}`}>
                                  {language === 'en' ? dist.divisionEn : dist.divisionBn} {language === 'en' ? 'Div.' : 'বিভাগ'}
                                </span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#DE9B2E] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Division Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-[#4B554E] whitespace-nowrap">
                {language === 'en' ? 'Filter Division:' : 'বিভাগ ফিল্টার:'}
              </label>
              <select
                value={selectedDivisionFilter}
                onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8D0BC] text-xs font-bold text-[#0A2A21] focus:outline-none focus:ring-2 focus:ring-[#DE9B2E]/50 cursor-pointer"
              >
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {language === 'en' ? div.en : div.bn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick-Pick Popular Districts Bar */}
          <div className="mt-4 pt-4 border-t border-[#E2DCce] flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#6B756E] uppercase tracking-wider flex items-center gap-1 mr-1">
              <MapPin className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en' ? 'Popular Districts:' : 'জনপ্রিয় জেলা:'}
            </span>
            {quickPicks.map((dist) => {
              const isSelected = dist.id === selectedDistrict.id;
              return (
                <button
                  key={dist.id}
                  type="button"
                  onClick={() => handleSelectDistrict(dist)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F3B2E] text-[#DE9B2E] shadow-xs ring-1 ring-[#DE9B2E]'
                      : 'bg-[#FAF7F0] text-[#4B554E] hover:bg-[#F6F3EA] hover:text-[#0A2A21] border border-[#D8D0BC]'
                  }`}
                >
                  {language === 'en' ? dist.nameEn : dist.nameBn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadWeather(selectedDistrict, true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              {language === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}
            </button>
          </div>
        )}

        {/* Weather Content State */}
        {loading && !weatherData ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-2 h-96 bg-white/70 rounded-3xl border border-[#D8D0BC] p-8 flex flex-col justify-between" />
            <div className="h-96 bg-white/70 rounded-3xl border border-[#D8D0BC] p-8" />
          </div>
        ) : weatherData ? (
          <div className="space-y-8">
            {/* Primary Hero Card + Secondary Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Main Weather Card (7 cols) */}
              <div className="lg:col-span-7 bg-gradient-to-br from-[#0F3B2E] via-[#124838] to-[#0A2A21] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-[#DE9B2E]/30">
                {/* Background glow effects */}
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#DE9B2E]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top District Bar */}
                <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#DE9B2E] font-bold">
                      <MapPin className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{language === 'en' ? weatherData.divisionEn : weatherData.divisionBn} {language === 'en' ? 'Division' : 'বিভাগ'}</span>
                      <span>•</span>
                      <span>{weatherData.lat.toFixed(2)}°N, {weatherData.lng.toFixed(2)}°E</span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-tight mt-1 text-white">
                      {language === 'en' ? weatherData.districtNameEn : weatherData.districtNameBn}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold tracking-wider uppercase text-emerald-300 backdrop-blur-xs border border-white/15">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {language === 'en' ? 'Live Xweather' : 'লাইভ আবহাওয়া'}
                    </span>
                    <p className="text-[11px] text-white/70 mt-1">
                      {language === 'en' ? 'Updated:' : 'সর্বশেষ:'} {weatherData.lastUpdatedTime}
                    </p>
                  </div>
                </div>

                {/* Temperature & Condition Centerpiece */}
                <div className="relative z-10 my-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white font-sans">
                      {tempUnit === 'C' ? weatherData.tempC : weatherData.tempF}
                    </span>
                    <span className="text-3xl sm:text-4xl font-light text-[#DE9B2E]">
                      °{tempUnit}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Live Xweather Icon CDN image with fallback */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 flex items-center justify-center shadow-lg">
                      <img
                        src={`https://cdn.aerisapi.com/wxicons/v2/${weatherData.icon}`}
                        alt={weatherData.conditionEn}
                        className="w-full h-full object-contain filter drop-shadow-md"
                        onError={(e) => {
                          // Hide broken image and fall back to Lucide icon
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center -z-10">
                        {renderWeatherIcon(weatherData.icon)}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                        {language === 'en' ? weatherData.conditionEn : weatherData.conditionBn}
                      </h4>
                      <p className="text-sm text-white/80 mt-0.5">
                        {language === 'en' ? 'Feels like' : 'অনুভূত তাপমাত্রা'}{' '}
                        <strong className="text-[#DE9B2E] font-bold">
                          {tempUnit === 'C' ? weatherData.feelslikeC : weatherData.feelslikeF}°{tempUnit}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* High/Low & Sun summary bar */}
                <div className="relative z-10 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-white/60 block">{language === 'en' ? 'High / Low' : 'সর্বোচ্চ / সর্বনিম্ন'}</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {tempUnit === 'C' ? weatherData.highTempC : Math.round((weatherData.highTempC * 9) / 5 + 32)}° /{' '}
                      {tempUnit === 'C' ? weatherData.lowTempC : Math.round((weatherData.lowTempC * 9) / 5 + 32)}°{tempUnit}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-white/60 block">{language === 'en' ? 'Rain Chance' : 'বৃষ্টির সম্ভাবনা'}</span>
                    <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                      {weatherData.precipProbability}% ({weatherData.precipMM} mm)
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-white/60 block flex items-center gap-1">
                      <Sunrise className="w-3 h-3 text-[#DE9B2E]" />
                      {language === 'en' ? 'Sunrise' : 'সূর্যোদয়'}
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {weatherData.sunrise}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                    <span className="text-white/60 block flex items-center gap-1">
                      <Sunset className="w-3 h-3 text-amber-400" />
                      {language === 'en' ? 'Sunset' : 'সূর্যাস্ত'}
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {weatherData.sunset}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid (5 cols) */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {/* Humidity */}
                <div className="bg-white rounded-3xl p-5 border border-[#D8D0BC] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B756E]">
                      {language === 'en' ? 'Humidity' : 'আর্দ্রতা'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Droplets className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-[#0A2A21]">
                      {weatherData.humidity}%
                    </div>
                    <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${weatherData.humidity}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#6B756E] mt-1.5">
                      {weatherData.humidity > 80
                        ? (language === 'en' ? 'High humidity (Humid)' : 'অতিরিক্ত আর্দ্র পরিবেশ')
                        : (language === 'en' ? 'Comfortable humidity' : 'স্বস্তিদায়ক আর্দ্রতা')}
                    </p>
                  </div>
                </div>

                {/* Wind Speed & Direction */}
                <div className="bg-white rounded-3xl p-5 border border-[#D8D0BC] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B756E]">
                      {language === 'en' ? 'Wind' : 'বাতাসের বেগ'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Wind className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-[#0A2A21]">
                      {weatherData.windSpeedKPH}{' '}
                      <span className="text-xs font-normal text-[#6B756E]">km/h</span>
                    </div>
                    <p className="text-xs font-bold text-[#0F3B2E] mt-1 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#DE9B2E]" />
                      <span>{language === 'en' ? 'Direction:' : 'দিক:'} {weatherData.windDir} ({weatherData.windDirDEG}°)</span>
                    </p>
                  </div>
                </div>

                {/* Rain / Precipitation */}
                <div className="bg-white rounded-3xl p-5 border border-[#D8D0BC] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B756E]">
                      {language === 'en' ? 'Precipitation' : 'বৃষ্টিপাত'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                      <CloudRain className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-[#0A2A21]">
                      {weatherData.precipMM}{' '}
                      <span className="text-xs font-normal text-[#6B756E]">mm</span>
                    </div>
                    <p className="text-[11px] text-[#6B756E] mt-1">
                      {language === 'en' ? 'Probability:' : 'সম্ভাবনা:'} {weatherData.precipProbability}%
                    </p>
                  </div>
                </div>

                {/* UV Index & Atmospheric Pressure */}
                <div className="bg-white rounded-3xl p-5 border border-[#D8D0BC] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B756E]">
                      {language === 'en' ? 'UV Index / Pressure' : 'ইউভি সূচক ও চাপ'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Gauge className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-extrabold text-[#0A2A21]">
                      UV {weatherData.uvIndex}{' '}
                      <span className="text-xs font-normal text-[#6B756E]">/ {weatherData.pressureMB} mb</span>
                    </div>
                    <p className="text-[11px] text-[#6B756E] mt-1">
                      {weatherData.uvIndex > 7
                        ? (language === 'en' ? 'Very High UV (Sunscreen recommended)' : 'উচ্চ ইউভি (সানস্ক্রিন প্রযোজ্য)')
                        : (language === 'en' ? 'Moderate UV' : 'স্বাভাবিক ইউভি')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Extended Weather Forecast Strip */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#D8D0BC] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg md:text-xl font-bold text-[#0A2A21] font-serif">
                    {language === 'en' ? '5-Day District Forecast' : 'জেলার ৫ দিনের আবহাওয়া পূর্বাভাস'}
                  </h4>
                  <p className="text-xs text-[#6B756E]">
                    {language === 'en'
                      ? `Projected outlook for ${weatherData.districtNameEn}, Bangladesh`
                      : `${weatherData.districtNameBn} জেলার জন্য আগামী দিনগুলির আবহাওয়ার পূর্বাভাস`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8C3B2E] font-bold">
                  <Calendar className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Daily Outlook' : 'দৈনিক বিবরণ'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {weatherData.forecast.map((fc, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 text-center border transition-all ${
                      idx === 0
                        ? 'bg-[#0F3B2E]/5 border-[#0F3B2E]/20 shadow-xs'
                        : 'bg-[#FAF7F0] border-[#E2DCce] hover:border-[#DE9B2E]/50'
                    }`}
                  >
                    <span className="text-xs font-bold text-[#0A2A21] block">
                      {language === 'en' ? fc.dayNameEn : fc.dayNameBn}
                    </span>
                    <span className="text-[10px] text-[#6B756E] block mb-2">
                      {fc.date.slice(5)}
                    </span>

                    <div className="w-12 h-12 mx-auto my-1 flex items-center justify-center">
                      <img
                        src={`https://cdn.aerisapi.com/wxicons/v2/${fc.icon}`}
                        alt={fc.conditionEn}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <span className="text-xs font-bold text-[#0A2A21] block truncate" title={fc.conditionEn}>
                      {language === 'en' ? fc.conditionEn : fc.conditionBn}
                    </span>

                    <div className="mt-2 text-xs flex items-center justify-center gap-1.5">
                      <span className="font-extrabold text-[#0A2A21]">
                        {tempUnit === 'C' ? fc.maxTempC : Math.round((fc.maxTempC * 9) / 5 + 32)}°
                      </span>
                      <span className="text-[#6B756E]">
                        {tempUnit === 'C' ? fc.minTempC : Math.round((fc.minTempC * 9) / 5 + 32)}°
                      </span>
                    </div>

                    {fc.pop > 0 && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                        <Droplets className="w-2.5 h-2.5" />
                        <span>{fc.pop}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Tourist Spots in Selected District with Map Link */}
            {selectedDistrict.popularSpots && selectedDistrict.popularSpots.length > 0 && (
              <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#D8D0BC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C3B2E]">
                    {language === 'en' ? 'Key Tourist Attractions in this District' : 'এই জেলার প্রধান পর্যটন আকর্ষণসমূহ'}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDistrict.popularSpots.map((spot, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-[#0A2A21] border border-[#D8D0BC] shadow-xs"
                      >
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>

                {onSelectDistrictInMap && (
                  <button
                    type="button"
                    onClick={() => onSelectDistrictInMap(selectedDistrict.nameEn)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F3B2E] text-[#DE9B2E] text-xs font-bold hover:bg-[#124838] transition-colors cursor-pointer shrink-0"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{language === 'en' ? 'Explore on GIS Map' : 'GIS ম্যাপে দেখুন'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};
