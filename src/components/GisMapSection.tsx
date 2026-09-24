import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Destination, Language } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Compass, ExternalLink, Navigation, Layers, Sparkles, Filter, RotateCcw } from 'lucide-react';
import { getCanonicalDistrict, isDestinationInDistrict } from '../lib/districtMatcher';

interface GisMapSectionProps {
  destinations: Destination[];
  language: Language;
  onSelectDestination: (dest: Destination) => void;
  selectedDistrictFilter?: string | null;
  onClearDistrictFilter?: () => void;
}

// Default district center coordinates for fallback when lat/lng are not explicitly set
const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'Cox\'s Bazar': [21.4272, 92.0058],
  'কক্সবাজার': [21.4272, 92.0058],
  'Sylhet': [24.8949, 91.8687],
  'সিলেট': [24.8949, 91.8687],
  'Moulvibazar': [24.4829, 91.7774],
  'মৌলভীবাজার': [24.4829, 91.7774],
  'Sreemangal': [24.3065, 91.7296],
  'শ্রীমঙ্গল': [24.3065, 91.7296],
  'Naogaon': [24.7936, 88.9318],
  'নওগাঁ': [24.7936, 88.9318],
  'Khulna': [22.8456, 89.5403],
  'খুলনা': [22.8456, 89.5403],
  'Bagerhat': [22.6516, 89.7859],
  'বাগেরহাট': [22.6516, 89.7859],
  'Rangamati': [22.7324, 92.2985],
  'রাঙ্গামাটি': [22.7324, 92.2985],
  'Bandarban': [22.1953, 92.2184],
  'বান্দরবান': [22.1953, 92.2184],
  'Dhaka': [23.8103, 90.4125],
  'ঢাকা': [23.8103, 90.4125],
  'Chittagong': [22.3569, 91.7832],
  'চট্টগ্রাম': [22.3569, 91.7832],
  'Gazipur': [24.0023, 90.4264],
  'গাজীপুর': [24.0023, 90.4264],
  'Narayanganj': [23.6238, 90.5000],
  'নারায়ণগঞ্জ': [23.6238, 90.5000],
  'Barishal': [22.7010, 90.3535],
  'বরিশাল': [22.7010, 90.3535],
  'Patuakhali': [22.3596, 90.3299],
  'পটুয়াখালী': [22.3596, 90.3299],
  'Kishoreganj': [24.4449, 90.7766],
  'কিশোরগঞ্জ': [24.4449, 90.7766],
  'Rajshahi': [24.3745, 88.6042],
  'রাজশাহী': [24.3745, 88.6042],
  'Bogura': [24.8481, 89.3730],
  'বগুড়া': [24.8481, 89.3730],
  'Dinajpur': [25.6279, 88.6332],
  'দিনাজপুর': [25.6279, 88.6332],
  'Rangpur': [25.7439, 89.2752],
  'রংপুর': [25.7439, 89.2752],
  'Sunamganj': [25.0658, 91.3950],
  'সুনামগঞ্জ': [25.0658, 91.3950],
  'Habiganj': [24.3745, 91.4155],
  'হবিগঞ্জ': [24.3745, 91.4155],
  'Panchagarh': [26.3411, 88.5577],
  'পঞ্চগড়': [26.3411, 88.5577],
  'Tangail': [24.2513, 89.9167],
  'টাঙ্গাইল': [24.2513, 89.9167],
  'Faridpur': [23.6070, 89.8429],
  'ফরিদপুর': [23.6070, 89.8429],
  'Cumilla': [23.4607, 91.1809],
  'কুমিল্লা': [23.4607, 91.1809],
};

export const GisMapSection: React.FC<GisMapSectionProps> = ({
  destinations,
  language,
  onSelectDestination,
  selectedDistrictFilter,
  onClearDistrictFilter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedMapDest, setSelectedMapDest] = useState<Destination | null>(null);

  // Sync external district filter prop
  useEffect(() => {
    if (selectedDistrictFilter) {
      setDistrictFilter(selectedDistrictFilter);
    } else {
      setDistrictFilter('all');
    }
  }, [selectedDistrictFilter]);

  // Unique divisions & districts
  const safeDestinations = destinations || [];
  const divisions = useMemo(() => {
    const list = Array.from(new Set(safeDestinations.map((d) => d?.division).filter(Boolean)));
    return list.sort();
  }, [safeDestinations]);

  const districts = useMemo(() => {
    const list = Array.from(
      new Set(
        safeDestinations
          .map((d) => d?.district || (d?.title ? (language === 'en' ? d.title.split(' ')[0] : d.titleBn?.split(' ')[0] || d.title.split(' ')[0]) : ''))
          .filter(Boolean)
      )
    );
    return list.sort();
  }, [safeDestinations, language]);

  // Filtered destinations
  const filteredDestinations = useMemo(() => {
    const canonical = districtFilter !== 'all' ? getCanonicalDistrict(districtFilter) : null;
    const targetEn = canonical ? canonical.nameEn : districtFilter;
    const targetBn = canonical ? canonical.nameBn : districtFilter;

    return safeDestinations.filter((dest) => {
      if (!dest) return false;
      const matchSearch =
        !searchQuery ||
        (dest.title && dest.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dest.titleBn && dest.titleBn.includes(searchQuery)) ||
        (dest.district && dest.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dest.address && dest.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDivision = divisionFilter === 'all' || dest.division === divisionFilter;

      const matchDistrict =
        districtFilter === 'all' ||
        isDestinationInDistrict(dest, targetEn, targetBn);

      const matchCategory = categoryFilter === 'all' || dest.category === categoryFilter;

      return matchSearch && matchDivision && matchDistrict && matchCategory;
    });
  }, [safeDestinations, searchQuery, divisionFilter, districtFilter, categoryFilter]);

  // Calculate coordinates for destination
  const getDestinationCoords = (dest: Destination): [number, number] => {
    if (dest.lat && dest.lng) {
      return [dest.lat, dest.lng];
    }
    if (dest.district && DISTRICT_COORDINATES[dest.district]) {
      // Add slight jitter so multiple places in same district don't stack exactly on top
      const base = DISTRICT_COORDINATES[dest.district];
      const hash = dest.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const jitterLat = ((hash % 100) - 50) * 0.003;
      const jitterLng = (((hash * 3) % 100) - 50) * 0.003;
      return [base[0] + jitterLat, base[1] + jitterLng];
    }
    // Default Bangladesh center
    const hash = dest.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lat = 23.685 + ((hash % 100) - 50) * 0.02;
    const lng = 90.3563 + (((hash * 7) % 100) - 50) * 0.02;
    return [lat, lng];
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.685, 90.3563],
        zoom: 7,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on Map when filteredDestinations changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const bounds: [number, number][] = [];

    // Custom Icon Generator
    const createCustomIcon = (isHero: boolean) => {
      return L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="
          background-color: ${isHero ? '#DE9B2E' : '#0F3B2E'};
          color: white;
          width: ${isHero ? '32px' : '26px'};
          height: ${isHero ? '32px' : '26px'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-weight: bold;
          font-size: 14px;
        ">🇧🇩</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });
    };

    filteredDestinations.forEach((dest) => {
      const coords = getDestinationCoords(dest);
      bounds.push(coords);

      const marker = L.marker(coords, {
        icon: createCustomIcon(!!dest.heroFeatured),
      }).addTo(markersLayer);

      const titleText = language === 'en' ? dest.title : dest.titleBn;
      const divisionText = dest.division;
      const mapsUrl =
        dest.googleMapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          dest.title + ' ' + (dest.district || '') + ' Bangladesh'
        )}`;

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 2px;">
          <img src="${dest.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=80'}" alt="${titleText}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 12px; margin-bottom: 8px;" />
          <h4 style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold; color: #0A2A21;">${titleText}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #4B554E;">📍 ${divisionText} ${dest.district ? '• ' + dest.district : ''}</p>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; background: #0F3B2E; color: white; text-align: center; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; text-decoration: none;">Google Maps ↗</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedMapDest(dest);
      });
    });

    if (bounds.length > 0 && map) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 11);
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [filteredDestinations, language]);

  // Fit Map to entire Bangladesh
  const handleFitBangladesh = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(
        [
          [20.5, 88.0],
          [26.7, 92.8],
        ],
        { padding: [20, 20] }
      );
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDivisionFilter('all');
    setDistrictFilter('all');
    setCategoryFilter('all');
    if (onClearDistrictFilter) onClearDistrictFilter();
    handleFitBangladesh();
  };

  return (
    <section id="gis-map" className="w-full px-4 md:px-8 lg:px-12 py-16 border-t border-[#D8D0BC] bg-[#EFEADC]/50 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0F3B2E]/10 text-[#0F3B2E] rounded-full text-[11px] font-extrabold uppercase tracking-widest border border-[#0F3B2E]/20">
              <Compass className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en' ? 'Geographic Information System' : 'ইন্টারঅ্যাক্টিভ GIS ম্যাপ'}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0A2A21] tracking-tight">
              {language === 'en' ? 'Interactive Bangladesh Tourist GIS Map' : 'বাংলাদেশ পর্যটন GIS ম্যাপ ও স্থানসমূহ'}
            </h2>
            <p className="text-[#4B554E] max-w-2xl text-sm sm:text-base leading-relaxed">
              {language === 'en'
                ? 'Explore all historical sites, beaches, eco-parks, and tea gardens across 64 districts with real-time location mapping and Google Maps integration.'
                : 'বাংলাদেশের সকল ঐতিহাসিক স্থান, সমুদ্র সৈকত, বন্যপ্রাণী অভয়ারণ্য ও পাহাড়ি এলাকা সরাসরি ইন্টারঅ্যাক্টিভ GIS ম্যাপে অনুসন্ধান করুন।'}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-full border border-[#D8D0BC] shadow-xs shrink-0">
            <MapPin className="w-4 h-4 text-[#DE9B2E]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A2A21]">
              {filteredDestinations.length} {language === 'en' ? 'Mapped Sites' : 'টি ম্যাপ করা স্থান'}
            </span>
          </div>
        </motion.div>

        {/* Filter & Control Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white p-4 rounded-3xl border border-[#D8D0BC] shadow-xs space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B756E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search place, district, or address...' : 'স্থান, জেলা বা ঠিকানা খুঁজুন...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]"
              />
            </div>

            {/* Division Filter */}
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] text-xs font-bold text-[#0A2A21] focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]"
            >
              <option value="all">{language === 'en' ? 'All Divisions (সব বিভাগ)' : 'সকল বিভাগ'}</option>
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>

            {/* District Filter */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] text-xs font-bold text-[#0A2A21] focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]"
            >
              <option value="all">{language === 'en' ? 'All Districts (সব জেলা)' : 'সকল জেলা'}</option>
              {districts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] text-xs font-bold text-[#0A2A21] focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]"
            >
              <option value="all">{language === 'en' ? 'All Categories' : 'সকল ক্যাটাগরি'}</option>
              <option value="coastal">{language === 'en' ? 'Coastal & Beaches' : 'উপকূল ও সমুদ্র সৈকত'}</option>
              <option value="hills_tea">{language === 'en' ? 'Hills & Tea Estates' : 'পাহাড় ও চা বাগান'}</option>
              <option value="heritage">{language === 'en' ? 'Ancient Heritage' : 'প্রাচীন ঐতিহ্য'}</option>
              <option value="wildlife">{language === 'en' ? 'Mangroves & Wildlife' : 'ম্যানগ্রোভ ও বন্যপ্রাণী'}</option>
              <option value="river">{language === 'en' ? 'River Journeys' : 'নদীমাতৃক স্থান'}</option>
            </select>
          </div>

          {/* Action Control Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D8D0BC]/60">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4B554E]">
              <Filter className="w-3.5 h-3.5 text-[#DE9B2E]" />
              <span>
                {filteredDestinations.length} {language === 'en' ? 'places shown on GIS map' : 'টি স্থান ম্যাপে প্রদর্শিত'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFitBangladesh}
                className="px-3 py-1.5 rounded-full bg-[#0F3B2E] text-white text-[11px] font-bold hover:bg-[#0A2A21] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="w-3 h-3 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'Fit Bangladesh' : 'সম্পূর্ণ বাংলাদেশ'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-full bg-white border border-[#D8D0BC] text-[#4B554E] text-[11px] font-bold hover:bg-[#EFEADC] transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'en' ? 'Reset Filters' : 'রিসেট'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Map Container & Side Selected Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Leaflet GIS Map Canvas */}
          <div className="lg:col-span-2 relative h-[520px] rounded-3xl overflow-hidden border-2 border-[#D8D0BC] shadow-md z-10 bg-white">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Floating Banner */}
            <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D8D0BC] shadow-sm text-[11px] font-bold text-[#0A2A21] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{language === 'en' ? 'GIS Interactive Map Live' : 'লাইভ ইন্টারঅ্যাক্টিভ ম্যাপ'}</span>
            </div>
          </div>

          {/* Side Place Detail Card / List */}
          <div className="space-y-4 flex flex-col h-[520px]">
            {selectedMapDest ? (
              <div className="bg-white rounded-3xl border border-[#D8D0BC] p-5 shadow-md flex-1 flex flex-col justify-between space-y-4 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-neutral-100">
                    <img
                      src={selectedMapDest.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80'}
                      alt={selectedMapDest.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#0F3B2E]/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {selectedMapDest.category}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-serif text-[#0A2A21]">
                      {language === 'en' ? selectedMapDest.title : selectedMapDest.titleBn}
                    </h3>
                    <p className="text-xs text-[#6B756E] font-medium mt-0.5">
                      📍 {selectedMapDest.division} {selectedMapDest.district ? `• ${selectedMapDest.district}` : ''}
                    </p>
                  </div>

                  <p className="text-xs text-[#4B554E] line-clamp-3 leading-relaxed">
                    {language === 'en' ? selectedMapDest.summary : selectedMapDest.summaryBn}
                  </p>

                  {selectedMapDest.address && (
                    <div className="p-2.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC] text-[11px] text-[#0A2A21]">
                      <span className="font-bold">Address: </span>
                      <span>{selectedMapDest.address}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-[#D8D0BC]">
                  <a
                    href={
                      selectedMapDest.googleMapsUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        selectedMapDest.title + ' ' + (selectedMapDest.district || '') + ' Bangladesh'
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4 text-[#DE9B2E]" />
                    <span>{language === 'en' ? 'Open in Google Maps' : 'গুগল ম্যাপসে খুলুন'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onSelectDestination(selectedMapDest)}
                    className="w-full py-2.5 bg-white border border-[#D8D0BC] text-[#0A2A21] rounded-xl text-xs font-bold hover:bg-[#EFEADC] transition-all cursor-pointer"
                  >
                    {language === 'en' ? 'View Complete Details' : 'বিস্তারিত বিবরণ দেখুন'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#D8D0BC] p-6 text-center flex flex-col items-center justify-center h-full space-y-3 text-[#6B756E]">
                <div className="w-12 h-12 rounded-full bg-[#0F3B2E]/10 text-[#0F3B2E] flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#DE9B2E]" />
                </div>
                <h4 className="text-base font-bold font-serif text-[#0A2A21]">
                  {language === 'en' ? 'Click Any Marker on the GIS Map' : 'ম্যাপের যেকোনো পিনে ক্লিক করুন'}
                </h4>
                <p className="text-xs max-w-xs leading-relaxed">
                  {language === 'en'
                    ? 'Select a location on the interactive map to preview image, division, address, and Google Maps directions.'
                    : 'ইন্টারঅ্যাক্টিভ ম্যাপ থেকে পিন নির্বাচন করে ওই স্থানের ছবি, ঠিকানা ও নেভিগেশন দেখুন।'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  );
};
