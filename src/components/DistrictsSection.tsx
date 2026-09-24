import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Destination, Language } from '../types';
import { MapPin, ArrowRight, Building2, Sparkles, Navigation } from 'lucide-react';

interface DistrictsSectionProps {
  destinations?: Destination[];
  language: Language;
  onSelectDistrict: (districtName: string) => void;
}

// Bangladesh Divisions & their constituent Districts
const DIVISIONS_DATA: { nameEn: string; nameBn: string; districts: { en: string; bn: string }[] }[] = [
  {
    nameEn: 'Dhaka Division',
    nameBn: 'ঢাকা বিভাগ',
    districts: [
      { en: 'Dhaka', bn: 'ঢাকা' },
      { en: 'Gazipur', bn: 'গাজীপুর' },
      { en: 'Narayanganj', bn: 'নারায়ণগঞ্জ' },
      { en: 'Munshiganj', bn: 'মুন্সীগঞ্জ' },
      { en: 'Narsingdi', bn: 'নরসিংদী' },
      { en: 'Manikganj', bn: 'মানিকগঞ্জ' },
      { en: 'Tangail', bn: 'টাঙ্গাইল' },
      { en: 'Kishoreganj', bn: 'কিশোরগঞ্জ' },
      { en: 'Faridpur', bn: 'ফরিদপুর' },
      { en: 'Gopalganj', bn: 'গোপালগঞ্জ' },
      { en: 'Madaripur', bn: 'মাদারীপুর' },
      { en: 'Rajbari', bn: 'রাজবাড়ী' },
      { en: 'Shariatpur', bn: 'শরীয়তপুর' },
    ],
  },
  {
    nameEn: 'Chittagong Division',
    nameBn: 'চট্টগ্রাম বিভাগ',
    districts: [
      { en: 'Chittagong', bn: 'চট্টগ্রাম' },
      { en: "Cox's Bazar", bn: 'কক্সবাজার' },
      { en: 'Bandarban', bn: 'বান্দরবান' },
      { en: 'Rangamati', bn: 'রাঙ্গামাটি' },
      { en: 'Khagrachhari', bn: 'খাগড়াছড়ি' },
      { en: 'Cumilla', bn: 'কুমিল্লা' },
      { en: 'Brahmanbaria', bn: 'ব্রাহ্মণবাড়িয়া' },
      { en: 'Chandpur', bn: 'চাঁদপুর' },
      { en: 'Feni', bn: 'ফেনী' },
      { en: 'Noakhali', bn: 'নোয়াখালী' },
      { en: 'Lakshmipur', bn: 'লক্ষ্মীপুর' },
    ],
  },
  {
    nameEn: 'Sylhet Division',
    nameBn: 'সিলেট বিভাগ',
    districts: [
      { en: 'Sylhet', bn: 'সিলেট' },
      { en: 'Moulvibazar', bn: 'মৌলভীবাজার' },
      { en: 'Habiganj', bn: 'হবিগঞ্জ' },
      { en: 'Sunamganj', bn: 'সুনামগঞ্জ' },
    ],
  },
  {
    nameEn: 'Rajshahi Division',
    nameBn: 'রাজশাহী বিভাগ',
    districts: [
      { en: 'Rajshahi', bn: 'রাজশাহী' },
      { en: 'Naogaon', bn: 'নওগাঁ' },
      { en: 'Chapainawabganj', bn: 'চাঁপাইনবাবগঞ্জ' },
      { en: 'Natore', bn: 'নাটোর' },
      { en: 'Pabna', bn: 'পাবনা' },
      { en: 'Sirajganj', bn: 'সিরাজগঞ্জ' },
      { en: 'Bogura', bn: 'বগুড়া' },
      { en: 'Joypurhat', bn: 'জয়পুরহাট' },
    ],
  },
  {
    nameEn: 'Khulna Division',
    nameBn: 'খুলনা বিভাগ',
    districts: [
      { en: 'Khulna', bn: 'খুলনা' },
      { en: 'Bagerhat', bn: 'বাগেরহাট' },
      { en: 'Satkhira', bn: 'সাতক্ষীরা' },
      { en: 'Jashore', bn: 'যশোর' },
      { en: 'Jhenaidah', bn: 'ঝিনাইদহ' },
      { en: 'Magura', bn: 'মাগুরা' },
      { en: 'Narail', bn: 'নড়াইল' },
      { en: 'Kushtia', bn: 'কুষ্টিয়া' },
      { en: 'Chuadanga', bn: 'চুয়াডাঙ্গা' },
      { en: 'Meherpur', bn: 'মেহেরপুর' },
    ],
  },
  {
    nameEn: 'Barishal Division',
    nameBn: 'বরিশাল বিভাগ',
    districts: [
      { en: 'Barishal', bn: 'বরিশাল' },
      { en: 'Patuakhali', bn: 'পটুয়াখালী' },
      { en: 'Bhola', bn: 'ভোলা' },
      { en: 'Barguna', bn: 'বরগুনা' },
      { en: 'Jhalokathi', bn: 'ঝালকাঠি' },
      { en: 'Pirojpur', bn: 'পিরোজপুর' },
    ],
  },
  {
    nameEn: 'Rangpur Division',
    nameBn: 'রংপুর বিভাগ',
    districts: [
      { en: 'Rangpur', bn: 'রংপুর' },
      { en: 'Dinajpur', bn: 'দিনাজপুর' },
      { en: 'Thakurgaon', bn: 'ঠাকুরগাঁও' },
      { en: 'Panchagarh', bn: 'পঞ্চগড়' },
      { en: 'Nilphamari', bn: 'নীলফামারী' },
      { en: 'Lalmonirhat', bn: 'লালমনিরহাট' },
      { en: 'Kurigram', bn: 'কুড়িগ্রাম' },
      { en: 'Gaibandha', bn: 'গাইবান্ধা' },
    ],
  },
  {
    nameEn: 'Mymensingh Division',
    nameBn: 'ময়মনসিংহ বিভাগ',
    districts: [
      { en: 'Mymensingh', bn: 'ময়মনসিংহ' },
      { en: 'Jamalpur', bn: 'জামালপুর' },
      { en: 'Sherpur', bn: 'শেরপুর' },
      { en: 'Netrokona', bn: 'নেত্রকোণা' },
    ],
  },
];

export const DistrictsSection: React.FC<DistrictsSectionProps> = ({
  destinations = [],
  language,
  onSelectDistrict,
}) => {
  const [activeDivision, setActiveDivision] = useState<string>('all');

  // Count destinations per district
  const getCountForDistrict = (distEn: string, distBn: string) => {
    return (destinations || []).filter(
      (d) =>
        (d?.district && (d.district.toLowerCase() === distEn.toLowerCase() || d.district === distBn)) ||
        (d?.title && d.title.toLowerCase().includes(distEn.toLowerCase())) ||
        (d?.titleBn && d.titleBn.includes(distBn))
    ).length;
  };

  return (
    <section id="districts" className="w-full px-4 md:px-8 lg:px-12 py-16 border-t border-[#D8D0BC] bg-[#F6F3EA] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        
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
              <Building2 className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en' ? 'Administrative Directory' : 'জেলা ভিত্তিক ভ্রমণ ডিরেক্টরি'}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0A2A21] tracking-tight">
              {language === 'en' ? 'Explore Bangladesh by 64 Districts' : '৬৪ জেলার পর্যটন নির্দেশিকা'}
            </h2>
            <p className="text-[#4B554E] max-w-xl text-sm sm:text-base leading-relaxed">
              {language === 'en'
                ? 'Select any district across Bangladesh to filter catalog places, view regional maps, and discover localized heritage & wonders.'
                : 'বাংলাদেশের যেকোনো জেলা নির্বাচন করে ওই এলাকার সকল পর্যটন স্থান, ঐতিহ্য ও প্ররিবেশ দেখুন।'}
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3 px-5 py-3 bg-white rounded-full border border-[#D8D0BC] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#DE9B2E]"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A2A21]">
              64 {language === 'en' ? 'Districts Covered' : 'টি জেলা অন্তর্ভুক্ত'}
            </span>
          </div>
        </motion.div>

        {/* Division Selector Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        >
          <button
            type="button"
            onClick={() => setActiveDivision('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs ${
              activeDivision === 'all'
                ? 'bg-[#0F3B2E] text-white shadow-md'
                : 'bg-white/80 border border-[#D8D0BC] text-[#4B554E] hover:bg-[#EFEADC] hover:text-[#0A2A21]'
            }`}
          >
            {language === 'en' ? 'All Divisions' : 'সকল বিভাগ'}
          </button>

          {DIVISIONS_DATA.map((div) => {
            const isActive = activeDivision === div.nameEn;
            return (
              <button
                key={div.nameEn}
                type="button"
                onClick={() => setActiveDivision(div.nameEn)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                  isActive
                    ? 'bg-[#0F3B2E] text-white shadow-md'
                    : 'bg-white/80 border border-[#D8D0BC] text-[#4B554E] hover:bg-[#EFEADC] hover:text-[#0A2A21]'
                }`}
              >
                {language === 'en' ? div.nameEn : div.nameBn}
              </button>
            );
          })}
        </motion.div>

        {/* Division & District Grid - Side-by-Side (Left-Right) Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {DIVISIONS_DATA.filter((div) => activeDivision === 'all' || activeDivision === div.nameEn).map((division, divIdx) => (
            <motion.div
              key={division.nameEn}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (divIdx % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/80 backdrop-blur-xs rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border border-[#D8D0BC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              {/* Division Card Header */}
              <div className="flex items-center justify-between border-b border-[#D8D0BC]/80 pb-3.5 gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#8C3B2E] ring-4 ring-[#DE9B2E]/30 shrink-0"></span>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#0A2A21] leading-tight">
                    {language === 'en' ? division.nameEn : division.nameBn}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#0F3B2E] bg-[#0F3B2E]/10 px-3 py-1 rounded-full shrink-0 border border-[#0F3B2E]/15">
                  {division.districts.length} {language === 'en' ? 'Districts' : 'টি জেলা'}
                </span>
              </div>

              {/* Districts Sub-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {division.districts.map((dist, idx) => {
                  const count = getCountForDistrict(dist.en, dist.bn);
                  const distName = language === 'en' ? dist.en : dist.bn;

                  return (
                    <motion.button
                      key={dist.en}
                      type="button"
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, delay: (idx % 6) * 0.03 }}
                      whileHover={{ y: -2, scale: 1.02, transition: { duration: 0.15 } }}
                      onClick={() => onSelectDistrict(dist.en)}
                      className="group p-3 rounded-2xl bg-[#F6F3EA]/70 hover:bg-white border border-[#D8D0BC] hover:border-[#0F3B2E] hover:shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs sm:text-sm text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors truncate">
                          {distName}
                        </span>
                        <Navigation className="w-3 h-3 text-[#DE9B2E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>

                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#6B756E] pt-1 border-t border-[#D8D0BC]/50">
                        <span className="truncate">
                          {count > 0 ? `${count} ${language === 'en' ? 'places' : 'স্থান'}` : language === 'en' ? 'Explore' : 'দেখুন'}
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#0F3B2E] group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
